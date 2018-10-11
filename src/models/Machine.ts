import * as request from "request-promise";
import { RequestPromise, RequestPromiseOptions } from "request-promise";
import { DropletResponse, Droplet } from "../interfaces/digitalOcean.interface";
import { db } from "../lib/db";
import { Swarm } from "./Swarm";
import * as SwarmMachine from "./SwarmMachine";
import { SSHKey } from "./SSHKey";
import { enqueue } from "../lib/events";
import { MachineProvisionEvent, ProvisionEventType, MachineSetupStep } from "../interfaces/provisioning.interface";

export interface Machine {
    id: number;
    external_id?: number;
    ip_address?: string;
    created_at: Date;
    ready_at?: Date;
    destroyed_at?: Date;
    setup_complete: boolean;
    file_transfer_complete: boolean;
    is_master: boolean;
    dependency_install_complete: boolean;
    port_open_complete: boolean;
}

export interface NewMachine {
    region: string;
}

export async function findById(machineId: number): Promise<Machine> {
    const machineList: Array<Machine> = await db("machine").where("id", "=", machineId);
    return machineList[0];
}

export async function create(machine: NewMachine, swarm: Swarm, key: SSHKey): Promise<Machine> {
    const newMachineList: Array<Machine> = await db("machine")
        .insert({ created_at: db.fn.now() })
        .returning("*");
    const newMachine = newMachineList[0];

    // Create the machine-swarm join entry
    const join: SwarmMachine.SwarmMachine = {
        machine_id: newMachine.id,
        swarm_id: swarm.id
    };
    await SwarmMachine.create(join);

    // Create provision event push into work queue.
    const machineProvisionEvent: MachineProvisionEvent = {
        swarm,
        stepToExecute: MachineSetupStep.CREATE,
        steps: [
            // MachineSetupStep.OPEN_PORTS,
            // MachineSetupStep.PACKAGE_INSTALL,
            // MachineSetupStep.TRANSFER_FILE,
            // MachineSetupStep.UNZIP_AND_PIP_INSTALL
        ],
        sshKey: key,
        machine: newMachine,
        region: machine.region,
        eventType: ProvisionEventType.MACHINE_PROVISION,
        maxRetries: 3,
        currentTry: 0,
        lastActionTime: new Date(),
        errors: []
    };
    await enqueue(machineProvisionEvent);

    return newMachine;
}

export async function createExternalMachine(id: number, region: string, externalSshKeyId: number): Promise<void> {
    // Fire off an api request.
   const DOMachine: DropletResponse = await createDigitalOceanMachine(id, region, externalSshKeyId);

    // Store the external id.
    await db("machine")
        .update({ external_id: DOMachine.droplet.id })
        .where("id", id)
        .returning("*");
}

export async function checkStatus(machine: Machine): Promise<DropletResponse> {
    const headers = {
        Authorization: `Bearer ${process.env.DIGITAL_OCEAN_TOKEN}`,
        "Content-Type": "application/json"
    };
    const url = `https://api.digitalocean.com/v2/droplets/${machine.external_id}`;
    const options: RequestPromiseOptions = {
        headers,
        json: true
    };
    return request.get(url, options);
}

// Starts the creation of machine on Digital Ocean. Should only ever be used
// in conjunction with creating a machine on RoboSwarm.
async function createDigitalOceanMachine(machineId: number, region: string, digitalOceanSSHKeyId: number): Promise<RequestPromise> {
    const headers = {
        Authorization: `Bearer ${process.env.DIGITAL_OCEAN_TOKEN}`,
        "Content-Type": "application/json"
    };
    const data = {
        name: `${machineId}`,
        region: region,
        size: "s-1vcpu-1gb",
        image: "ubuntu-16-04-x64",
        backups: false,
        ipv6: true,
        tags: [ "roboswarm" ],
        ssh_keys: [ digitalOceanSSHKeyId, 129160 ] // Extra is for jack's testing.
    };
    const url = "https://api.digitalocean.com/v2/droplets";
    const options: RequestPromiseOptions = {
        body: data,
        headers,
        json: true
    };
    try {
        return request.post(url, options);
    } catch (err) {
        console.log(err);
        return undefined;
    }
}

export async function destroy(machine: Machine): Promise<Machine> {
    const headers = {
        Authorization: `Bearer ${process.env.DIGITAL_OCEAN_TOKEN}`,
        "Content-Type": "application/json"
    };
    const url = `https://api.digitalocean.com/v2/droplets/${machine.external_id}`;
    const options: RequestPromiseOptions = {
        headers
    };
    const result = await request.delete(url, options);
    const updatedMachineList: Array<Machine> = await db("machine")
        .update({ destroyed_at: db.fn.now() })
        .where("id", machine.id)
        .returning("*");
    return updatedMachineList[0];
}

export async function setReadyAtAndIp(machine: Machine, ip_address: string): Promise<Machine> {
    const updatedMachineList: Array<Machine> = await db("machine")
        .update({
            ip_address,
            ready_at: db.fn.now()
        })
        .where("id", machine.id)
        .returning("*");
    return updatedMachineList[0];
}

export async function updateFileTransferStatus(machineId: number, status: boolean): Promise<any> {
    await db("machine")
        .update({ file_transfer_complete: status })
        .where("id", machineId);
}

export async function updateSetupCompleteStatus(machineId: number, status: boolean): Promise<any> {
    await db("machine")
        .update({ setup_complete: status })
        .where("id", machineId);
}

export async function updateIsMaster(id: number, is_master: boolean): Promise<void> {
    await db("machine")
        .update({ is_master })
        .where("id", id);
}

export async function updateDependencyInstallComplete(id: number, dependency_install_complete: boolean): Promise<void> {
    await db("machine")
        .update({ dependency_install_complete })
        .where("id", id);
}

export async function update(id: number, data: any): Promise<void> {
    await db("machine")
        .update(data)
        .where("id", id);
}