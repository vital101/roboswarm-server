import { db } from "../lib/db";
import { Status } from "../interfaces/shared.interface";
import { DropletListResponse } from "../interfaces/digitalOcean.interface";
import * as Machine from "./Machine";
import { getSwarmMachineIds, getSwarmMachines } from "./SwarmMachine";
import * as SSHKey from "./SSHKey";
import {
    installPackagesOnMachine,
    openPorts,
    startMaster,
    startSlave,
    transferFileToMachine,
    unzipPackageAndPipInstall } from "../lib/setupHelpers";
import * as request from "request-promise";
import { RequestPromiseOptions } from "request-promise";
import * as events from "../lib/events";
import { WorkerEventType, SwarmProvisionEvent, SwarmSetupStep, DeprovisionEvent, DeprovisionEventType } from "../interfaces/provisioning.interface";

export interface Swarm {
    id: number;
    name: string;
    status: Status;
    group_id: number;
    user_id: number;
    simulated_users: number;
    ssh_key_id: number;
    file_path: string;
    host_url: string;
    spawn_rate: number;
    created_at: Date;
    ready_at: Date;
    destroyed_at: Date;
    region: string;
    duration: number;
    setup_complete: boolean;
    file_transfer_complete: boolean;
    swarm_ui_type: string;
    master_ip?: string;
}

export interface NewSwarm {
    name: string;
    duration: number;
    simulated_users: number;
    file_path: string;
    host_url: string;
    spawn_rate: number;
    machines: Array<Machine.NewMachine>;
    region: string;
    swarm_ui_type: string;
}

function getStatus(created_at: Date, ready_at: Date, destroyed_at: Date): Status {
    if (destroyed_at) {
        return Status.destroyed;
    } else if (ready_at) {
        return Status.ready;
    } else {
        return Status.new;
    }
}

export async function create(swarm: NewSwarm, userId: number, groupId: number): Promise<Swarm> {
    // Create the SSH keys that this swarm will use.
    const key = await SSHKey.create();

    // Create the container swarm.
    const newSwarmResult: Array<Swarm> = await db("swarm")
        .insert({
            name: swarm.name,
            group_id: groupId,
            user_id: userId,
            simulated_users: swarm.simulated_users,
            file_path: swarm.file_path,
            host_url: swarm.host_url,
            spawn_rate: swarm.spawn_rate,
            ssh_key_id: key.id,
            region: swarm.region,
            duration: swarm.duration,
            swarm_ui_type: swarm.swarm_ui_type
        })
        .returning("*");

    const newSwarm = newSwarmResult[0];
    newSwarm.status = getStatus(newSwarm.created_at, newSwarm.ready_at, newSwarm.destroyed_at);

    const startProvisionEvent: SwarmProvisionEvent = {
        eventType: WorkerEventType.SWARM_PROVISION,
        createdSwarm: newSwarm,
        swarm,
        sshKey: key,
        maxRetries: 3,
        currentTry: 0,
        lastActionTime: new Date(),
        errors: [],
        stepToExecute: SwarmSetupStep.CREATE,
        steps: [
            SwarmSetupStep.READY,
            SwarmSetupStep.START_MASTER
        ]
    };

    await events.enqueue(startProvisionEvent);

    return newSwarm;
}

export function provision(event: SwarmProvisionEvent): Promise<Machine.Machine[]> {
    const promises = event.swarm.machines.map(machine => {
        return Machine.create(machine, event.createdSwarm, event.sshKey);
    });
    return Promise.all(promises);
}

export async function destroyById(id: number, group_id: number): Promise<Swarm> {
    const destroyedSwarm: Array<Swarm> = await db("swarm")
        .update({ destroyed_at: db.fn.now() })
        .where({
            id,
            group_id
        })
        .returning("*");

    // Fetch all of the machines and enqueue for deletion.
    const machines = await getSwarmMachines(id);
    for (let i = 0; i < machines.length; i++) {
        const machineDestroyEvent: DeprovisionEvent = {
            id: machines[i].id,
            eventType: WorkerEventType.DEPROVISION,
            deprovisionType: DeprovisionEventType.MACHINE,
            maxRetries: 10,
            currentTry: 0,
            lastActionTime: new Date(),
            errors: []
        };
        await events.enqueue(machineDestroyEvent);
    }

    // Destroy SSH Key
    const sshKeyDestroyEvent: DeprovisionEvent = {
        id: destroyedSwarm[0].ssh_key_id,
        eventType: WorkerEventType.DEPROVISION,
        deprovisionType: DeprovisionEventType.SSH_KEY,
        maxRetries: 10,
        currentTry: 0,
        lastActionTime: new Date(),
        errors: []
    };
    await events.enqueue(sshKeyDestroyEvent);

    return destroyedSwarm[0];
}

export async function getById(id: number, groupId: number): Promise<Swarm> {
    const data: Swarm = await db("swarm")
                                .where("id", id)
                                .where("group_id", groupId)
                                .first();
    data.status = getStatus(
        data.created_at,
        data.ready_at,
        data.destroyed_at
    );

    // Fetch machines and return the file transfer status and setup_complete.
    const machines = await getSwarmMachines(id);
    let file_transfer_complete = true;
    let setup_complete = true;
    machines.forEach(machine => {
        if (machine.is_master) { data.master_ip = machine.ip_address; }
        if (!machine.file_transfer_complete) { file_transfer_complete = false; }
        if (!machine.setup_complete) { setup_complete = false; }
    });
    data.file_transfer_complete = file_transfer_complete;
    data.setup_complete = setup_complete;

    return data;
}

export async function getByGroupId(groupId: number, limit?: number): Promise<Array<Swarm>> {
    let swarmQuery = db("swarm").where("group_id", groupId).orderBy("created_at", "DESC");
    if (limit) {
        swarmQuery = swarmQuery.limit(limit);
    }
    const swarms: Array<Swarm> = await swarmQuery;
    const swarmSizes: any = {};
    const swarmStatus: any = {};
    for (let swarm of swarms) {
        // Get swarm size.
        swarm = swarm as Swarm;
        const swarmSize = await getSwarmSizeById(swarm.id);
        swarmSizes[swarm.id] = swarmSize;

        // Get swarm status.
        swarmStatus[swarm.id] = getStatus(swarm.created_at, swarm.ready_at, swarm.destroyed_at);

        // Fetch machines and return the file transfer status and setup_complete.
        const machines = await getSwarmMachines(swarm.id);
        let file_transfer_complete = true;
        let setup_complete = true;
        machines.forEach(machine => {
            if (!machine.file_transfer_complete) { file_transfer_complete = false; }
            if (!machine.setup_complete) { setup_complete = false; }
        });
        swarm.file_transfer_complete = file_transfer_complete;
        swarm.setup_complete = setup_complete;
    }
    const temp = swarms.map(swarm => {
        const size = swarmSizes[swarm.id];
        const status = swarmStatus[swarm.id];
        return {
            ...swarm,
            size,
            status
        };
    });
    return temp;
}

export async function getSwarmSizeById(swarmId: number): Promise<number> {
    const row = await db("swarm_machine")
                        .where("swarm_id", swarmId)
                        .count();

    return row[0].count;
}

export async function swarmReady(swarmId: number): Promise<boolean> {
    let swarmReady = true;
    const machineIds = await getSwarmMachineIds(swarmId);
    for (let i = 0; i < machineIds.length; i++) {
        const m = await Machine.findById(machineIds[i]);
        if (!m.dependency_install_complete) {
            swarmReady = false;
        }
    }
    return swarmReady;
}

export async function setReadyAt(swarm: Swarm): Promise<Swarm> {
    const updatedSwarmList: Array<Swarm> = await db("swarm")
        .update({ ready_at: db.fn.now() })
        .where("id", swarm.id)
        .returning("*");
    return updatedSwarmList[0];
}
export async function willExceedDropletPoolAvailability(newSwarmSize: number): Promise<boolean> {
    const headers = {
        Authorization: `Bearer ${process.env.DIGITAL_OCEAN_TOKEN}`,
        "Content-Type": "application/json"
    };
    const url = `https://api.digitalocean.com/v2/droplets`;
    const options: RequestPromiseOptions = {
        headers,
        json: true
    };
    const result: DropletListResponse = await request.get(url, options);
    const availableDroplets = parseInt(process.env.DROPLET_POOL_SIZE, 10) - result.meta.total;
    console.log("Available Droplets: ", availableDroplets);
    console.log("availableDroplets - newSwarmSize < 0", `${availableDroplets} - ${newSwarmSize} < 0 === ${availableDroplets - newSwarmSize < 0}`);
    return availableDroplets - newSwarmSize < 0;
}