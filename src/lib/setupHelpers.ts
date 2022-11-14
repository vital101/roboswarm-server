import { asyncSleep } from "../lib/lib";
import * as Machine from "../models/Machine";
import * as SSHKey from "../models/SSHKey";
import * as Swarm from "../models/Swarm";
import * as SwarmMachine from "../models/SwarmMachine";
import {
    SwarmProvisionEvent,
    MachineProvisionEvent,
    MachineSetupStep,
    SwarmSetupStep,
    WorkerEventType,
    DeprovisionEvent,
    DeprovisionEventType,
    DataCaptureEvent } from "../interfaces/provisioning.interface";
import { enqueue } from "./events";
import { Status } from "../interfaces/shared.interface";
import * as swarmProvisionEvents from "./swarmProvisionEvents";
import e from "express";

export async function nextStep(event: MachineProvisionEvent|SwarmProvisionEvent) {
    if (event.steps.length > 0) {
        const nextStep = event.steps.shift();
        event.stepToExecute = nextStep;
        event.currentTry = 0;
        return enqueue(event);
    }
}

export async function processDataCaptureEvent(event: DataCaptureEvent): Promise<void> {
    if (event.currentTry < event.maxRetries) {
        try {
            let reEnqueue = true;
            const swarm = await Swarm.getById(event.swarm.id);
            if (swarm.status === Status.destroyed) {
                console.log("Swarm destroyed. Not re-enqueuing fetchLoadTestMetrics() and fetchErrorMetrics()");
                reEnqueue = false;
            } else {
                if (!event.delayUntil) {
                    const delayTime = new Date();
                    delayTime.setSeconds(delayTime.getSeconds() + 5);
                    event.delayUntil = delayTime;
                    reEnqueue = true;
                    console.log("No delay set. Re-enqueuing fetchLoadTestMetrics() and fetchErrorMetrics()");
                } else {
                    const now = new Date();
                    const delayTime = new Date(event.delayUntil);
                    reEnqueue = true;
                    if (now.getTime() >= delayTime.getTime()) {
                        await Promise.all([
                            Swarm.fetchLoadTestMetrics(event.swarm),
                            Swarm.fetchErrorMetrics(event.swarm)
                        ]);
                        const delayTime = new Date();
                        delayTime.setSeconds(delayTime.getSeconds() + 5);
                        event.delayUntil = delayTime;
                        console.log("Load test metrics fetched. Re-enqueuing fetchLoadTestMetrics() and fetchErrorMetrics()");
                    }
                }
            }
            if (reEnqueue === true) {
                await enqueue(event);
            }
        } catch (err) {
            console.log("There was an error. Retrying.:", err);
            await asyncSleep(1);
            await enqueue(event);
        }
    }
}

export async function processDeprovisionEvent(event: DeprovisionEvent): Promise<void> {
    if (event.currentTry < event.maxRetries) {
        try {
            const swarmId = await SwarmMachine.getSwarmIdByMachineId(event.id);
            const swarm = await Swarm.getById(swarmId);

            // Tell master to send the final data.
            if (!swarm.should_send_final_data) {
                console.log("Needs to send final data. Informing...");
                await Swarm.update(swarmId, { should_send_final_data: true });
                event.currentTry = 0;
                event.maxRetries = 3;
                await asyncSleep(3);
                await enqueue(event);
                return;
            // Master has not yet sent the final data.
            } else if (swarm.should_send_final_data && !swarm.final_data_sent) {
                console.log("Final data still not sent, trying again...");
                await asyncSleep(3);
                event.currentTry += 1;
                await enqueue(event);
                return;
            }

            // Final data sent. Continue with deprovision actions.
            switch (event.deprovisionType) {
                case DeprovisionEventType.MACHINE: {
                    console.log(`Deprovisioning machine: ${event.id}`);
                    await Machine.destroy(event.id);
                    break;
                }
                case DeprovisionEventType.SSH_KEY: {
                    console.log(`Destroying SSH key: ${event.id}`);
                    await SSHKey.destroy(event.id);
                    break;
                }
            }
        } catch (err) {
            console.log("There was an error. Retrying.:", err);
            await asyncSleep(3);
            event.currentTry += 1;
            await enqueue(event);
        }
    }
}

export async function processSwarmProvisionEvent(event: SwarmProvisionEvent): Promise<void> {
    if (event.currentTry < event.maxRetries) {
        try {
            switch (event.stepToExecute) {
                case SwarmSetupStep.CREATE: {
                    await Swarm.provision(event);
                    break;
                }
                case SwarmSetupStep.READY: {
                    // Has it been destroyed?
                    const swarm: Swarm.Swarm = await Swarm.getById(event.createdSwarm.id);
                    if (swarm.destroyed_at) {
                        console.log(`Swarm ${swarm.id} is destroyed. Stopping.`);
                        return;
                    } else {
                        const isSwarmReady: boolean = await Swarm.swarmReady(event.createdSwarm.id);
                        if (!isSwarmReady) {
                            console.log(`Swarm ${event.createdSwarm.id} not ready. Waiting 5 seconds`);
                            const delayTime = new Date();
                            delayTime.setSeconds(delayTime.getSeconds() + 5);
                            event.delayUntil = delayTime;
                            event.steps.unshift(SwarmSetupStep.READY);
                            event.steps.unshift(SwarmSetupStep.DELAY);
                        } else {
                            console.log(`Swarm ${event.createdSwarm.id} ready.`);
                            await Swarm.setReadyAt(event.createdSwarm);
                        }
                    }
                    break;
                }
                case SwarmSetupStep.DELAY: {
                    const now = new Date();
                    const delayTime = new Date(event.delayUntil);
                    if (now.getTime() < delayTime.getTime()) {
                        event.steps.unshift(SwarmSetupStep.DELAY);
                    } else {
                        event.delayUntil = undefined;
                    }
                    break;
                }
                case SwarmSetupStep.START_MASTER: {
                    const machineIds: number[] = await SwarmMachine.getSwarmMachineIds(event.createdSwarm.id);
                    await Machine.updateIsMaster(machineIds[0], true);
                    const masterMachine = await Machine.findById(machineIds[0]);
                    const masterStartEvent: MachineProvisionEvent = {
                        sshKey: event.sshKey,
                        eventType: WorkerEventType.MACHINE_PROVISION,
                        maxRetries: 10,
                        currentTry: 0,
                        lastActionTime: new Date(),
                        errors: [],
                        swarm: event.createdSwarm,
                        machine: masterMachine,
                        region: event.swarm.region[0], // Just use the first one for master.
                        slaveCount: machineIds.length - 1,
                        slaveIds: machineIds.filter(id => id !== machineIds[0]),
                        stepToExecute: MachineSetupStep.START_MASTER,
                        steps: []
                    };
                    // Do we need this? Should be replace event with masterStartEvent
                    // and let it fall through to the bottom?
                    await enqueue(masterStartEvent);
                    break;
                }
                case SwarmSetupStep.STOP_SWARM: {
                    const swarm: Swarm.Swarm = await Swarm.getById(event.createdSwarm.id);
                    if (swarm.status === Status.destroyed) {
                        console.log("Swarm already destroy. Dropping STOP SWARM event.");
                        return;
                    }
                    const shouldStopSwarm: boolean = await Swarm.shouldStop(swarm);
                    if (shouldStopSwarm) {
                        console.log("Stopping swarm: ", event.createdSwarm.name);
                        await Swarm.destroyById(event.createdSwarm.id, event.createdSwarm.group_id);
                    } else {
                        console.log("Not stopping swarm. Trying again in 10 seconds.");
                        // Delay for 10 seconds, try again.
                        const delayTime = new Date();
                        delayTime.setSeconds(delayTime.getSeconds() + 10);
                        event.delayUntil = delayTime;
                        event.steps.unshift(SwarmSetupStep.STOP_SWARM);
                        event.steps.unshift(SwarmSetupStep.DELAY);
                        break;
                    }
                    break;
                }
            }
            await nextStep(event);
        } catch (err) {
            console.log("There was an error. Retrying.:", err);
            await asyncSleep(3);
            event.currentTry += 1;
            await enqueue(event);
        }
    } else {
        console.log(`Dropping SwarmProvisionEvent after ${event.maxRetries}. Executing cleanup.`);
        await swarmProvisionEvents.cleanUpSwarmProvisionEvent(event);
    }
}

export async function processMachineProvisionEvent(event: MachineProvisionEvent): Promise<void> {
    if (event.currentTry < event.maxRetries) {
        try {
            switch (event.stepToExecute) {
                case MachineSetupStep.CREATE: {
                    const success = await Machine.createExternalMachine(event.machine.id, event.region, event.sshKey.external_id);
                    // If creation fails for some reason, drop this event
                    // and update the swarm size.
                    if (!success) {
                        console.log("Machine provision failed. Dropping machine from swarm.");
                        if (event.swarm.size > 0) {
                            await Swarm.update(event.swarm.id, {
                                size: event.swarm.size - 1
                            });
                        }
                        return;
                    }
                    break;
                }
                case MachineSetupStep.DELAY: {
                    if (event.delayUntil === undefined) {
                        const delayTime = new Date();
                        delayTime.setSeconds(delayTime.getSeconds() + 60);
                        event.delayUntil = delayTime;
                    }

                    const now = new Date();
                    const delayTime = new Date(event.delayUntil);
                    if (now.getTime() < delayTime.getTime()) {
                        event.steps.unshift(MachineSetupStep.DELAY);
                    } else {
                        event.delayUntil = undefined;
                    }
                    break;
                }
                case MachineSetupStep.MACHINE_READY: {
                    const ready = await Machine.isReady(event.machine.id);
                    if (ready) {
                        event.machine = await Machine.findById(event.machine.id);
                    } else {
                        const shouldDeprovision = await Machine.shouldDeprovision(event.machine.id);
                        if (shouldDeprovision) {
                            while (event.steps.length > 0) {
                                event.steps.pop();
                            }
                            await SwarmMachine.removeMachineFromSwarm(event.machine.id, event.swarm.id);
                            const updatedSwarm: Swarm.Swarm = await Swarm.decrementSwarmSize(event.swarm.id);
                            if (updatedSwarm.size <= 1) {
                                await Swarm.destroyById(event.swarm.id, event.swarm.group_id);
                            } else {
                                const machineDestroyEvent: DeprovisionEvent = {
                                    id: event.machine.id,
                                    eventType: WorkerEventType.DEPROVISION,
                                    deprovisionType: DeprovisionEventType.MACHINE,
                                    maxRetries: 10,
                                    currentTry: 0,
                                    lastActionTime: new Date(),
                                    errors: []
                                };
                                await enqueue(machineDestroyEvent);
                            }
                        } else {
                            await asyncSleep(20);
                            event.steps.unshift(MachineSetupStep.MACHINE_READY);
                        }
                    }
                    break;
                }
                case MachineSetupStep.START_MASTER: {
                    await startDataCollection(event.swarm, event.machine, event.slaveCount, event.slaveIds, event.sshKey.private);
                    break;
                }
            }
            await nextStep(event);
        } catch (err) {
            console.log("There was an error. Retrying.:", err);
            await asyncSleep(3);
            event.currentTry += 1;
            await enqueue(event);
        }
    } else {
        console.log(`Dropping event after ${event.maxRetries} retries.`);
    }
}

export async function startDataCollection(swarm: Swarm.Swarm, machine: Machine.Machine, slaveCount: number, slaveIds: number[], privateKey: string): Promise<void> {
    // Queue up periodic metrics capturing
    const fetchMetricsEvent: DataCaptureEvent = {
        sshKey: { public: "", private: privateKey, created_at: new Date() },
        eventType: WorkerEventType.DATA_CAPTURE,
        maxRetries: 3,
        currentTry: 0,
        lastActionTime: new Date(),
        errors: [],
        swarm
    };
    console.log("Enqueuing metrics start events");
    await enqueue(fetchMetricsEvent);

}

export async function cleanUpMachineProvisionEvent(event: MachineProvisionEvent): Promise<void> {
    switch (event.stepToExecute) {
        case MachineSetupStep.START_MASTER: {
            // De-provision swarm.
            await Swarm.destroyById(event.swarm.id, event.swarm.group_id);
            break;
        }
        default: {
            // De-provision machine.
            const machineDestroyEvent: DeprovisionEvent = {
                id: event.machine.id,
                eventType: WorkerEventType.DEPROVISION,
                deprovisionType: DeprovisionEventType.MACHINE,
                maxRetries: 10,
                currentTry: 0,
                lastActionTime: new Date(),
                errors: []
            };
            await enqueue(machineDestroyEvent);
        }
    }
}