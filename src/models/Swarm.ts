import { db } from "../lib/db";
import { Status } from "../interfaces/shared.interface";
import { DropletResponse, Droplet, DropletListResponse } from "../interfaces/digitalOcean.interface";
import * as Machine from "./Machine";
import { getSwarmMachineIds, getSwarmMachines } from "./SwarmMachine";
import * as SSHKey from "./SSHKey";
import { User } from "./User";
import {
    installPackagesOnMachine,
    openPorts,
    startMaster,
    startSlave,
    transferFileToMachine,
    unzipPackageAndPipInstall } from "../lib/setupHelpers";
import * as request from "request-promise";
import { RequestPromiseOptions } from "request-promise";
import { asyncSleep } from "../lib/lib";

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
            duration: swarm.duration
        })
        .returning("*");
    const newSwarm = newSwarmResult[0];
    newSwarm.status = getStatus(newSwarm.created_at, newSwarm.ready_at, newSwarm.destroyed_at);

    // Create the swarm machines.
    const promises = [];
    for (let i = 0; i < swarm.machines.length; i++) {
        const machine = swarm.machines[i];
        promises.push(Machine.create(machine, newSwarm, key));
    }
    await Promise.all(promises);

    // Worker to check the swarm status.
    setTimeout(() => { checkAndUpdateSwarmStatus(newSwarm); }, 5000);

    return newSwarm;
}

export async function destroyById(id: number, group_id: number): Promise<Swarm> {
    const destroyedSwarm: Array<Swarm> = await db("swarm")
        .update({ destroyed_at: db.fn.now() })
        .where({
            id,
            group_id
        })
        .returning("*");

    // Fetch all of the machines, run Machine.delete() on each of them.
    const machines = await getSwarmMachines(id);
    for (let i = 0; i < machines.length; i++) {
        try {
            console.log("Destroying ", machines[i]);
            await Machine.destroy(machines[i]);
        } catch (err) {
            console.log(err);
            console.log("Error destroying machine...");
        }
    }

    // Delete the SSH keys.
    await SSHKey.destroy(destroyedSwarm[0].ssh_key_id);

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

async function checkAndUpdateSwarmStatus(swarm: Swarm): Promise<void> {
    console.log("Starting swarm status check...");
    // Get all the droplets in the swarm. If they are ready,
    // set their status. If all are ready, set the swarm status.
    let swarmReady = true;
    const machineIds = await getSwarmMachineIds(swarm.id);
    for (let i = 0; i < machineIds.length; i++) {
        const m = await Machine.findById(machineIds[i]);
        if (m.ready_at === null) {
            const response = await Machine.checkStatus(m);
            if (response.droplet.status === "active") {
                let ip_address = "test";
                try {
                    ip_address = response.droplet.networks.v4[0].ip_address;
                    console.log("Machine IP info: ", response.droplet.networks);
                } catch (err) {
                    console.log("SOME SORT OF ERR with ip: ", err);
                }
                await Machine.setReadyAtAndIp(m, ip_address);
            } else {
                swarmReady = false;
            }
        }
    }

    // If all droplets are active and ready, set swarm status and return.
    if (swarmReady) {
        const readySwarm = await setReadyAt(swarm);
        console.log("Swarm is ready: ", readySwarm);

        console.log("Starting swarm initialization tasks");
        await startSwarmInitializationTasks(swarm);
        console.log("Swarm initialization tasks complete");
    } else {
        // If not, setTimeout(5000) and do it again.
        console.log("Swarm is not ready. Waiting 5 seconds...");
        setTimeout(() => {
            checkAndUpdateSwarmStatus(swarm);
        }, 5000);
    }
}

async function startSwarmInitializationTasks(swarm: Swarm): Promise<any> {
    console.log("Starting to transfer files to machines...");
    const sshKeys: SSHKey.SSHKey = await SSHKey.getById(swarm.ssh_key_id);
    const machines = await getSwarmMachines(swarm.id);

    try {
        // Start file transfer && package installation
        const machineActions: Array<Promise<any>> = [];
        for (const machine of machines) {
            await asyncSleep(1);
            machineActions.push(transferFileToMachine(machine.ip_address, swarm.file_path, sshKeys.private));
            await asyncSleep(1);
            machineActions.push(installPackagesOnMachine(machine.ip_address, sshKeys.private));
        }
        await Promise.all(machineActions);

        // When transfers and updates complete, mark as ready.
        for (const machine of machines) {
            await Promise.all([
                Machine.updateFileTransferStatus(machine.id, true),
                Machine.updateSetupCompleteStatus(machine.id, true)
            ]);
        }

        // Now mark first machine as master.
        machines[0].is_master = true;
        await Machine.updateIsMaster(machines[0].id, true);

        // Now unzip files and pip install.
        const unzipAndInstallPromises = [];
        for (const machine of machines) {
            unzipAndInstallPromises.push(unzipPackageAndPipInstall(machine.id, machine.ip_address, sshKeys.private));
        }
        await Promise.all(unzipAndInstallPromises);

        // Open ports for Locust
        const portOpenPromises = [];
        for (const machine of machines) {
            portOpenPromises.push(openPorts(machine.id, machine.ip_address, sshKeys.private));
        }
        await Promise.all(portOpenPromises);

        // Start the test on master.
        const master = machines.find(machine => machine.is_master);
        const slaves = machines.filter(machine => !machine.is_master);
        await startMaster(swarm, master, slaves.length, sshKeys.private);

        // To Do:
        // - Try connecting slaves in web mode to see if it works. If it does, change code to not require it.
        const slaveMachinePromises = [];
        for (const machine of slaves) {
            slaveMachinePromises.push(startSlave(swarm, master, machine, sshKeys.private));
        }
        await Promise.all(slaveMachinePromises);
    } catch (err) {
        console.log("Error from swarm initialize: ", err);
    }
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