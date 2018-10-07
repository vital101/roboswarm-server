import { db } from "../lib/db";
import { Machine } from "./Machine";

export interface SwarmMachine {
    machine_id: number;
    swarm_id: number;
}

export async function create(swarmMachine: SwarmMachine): Promise<SwarmMachine> {
    const swarmMachineList: Array<SwarmMachine> = await db("swarm_machine")
        .insert({
            swarm_id: swarmMachine.swarm_id,
            machine_id: swarmMachine.machine_id
        })
        .returning("*");
    return swarmMachineList[0];
}

export async function getSwarmMachines(swarmId: number): Promise<Array<Machine>> {
    const machineIds = await getSwarmMachineIds(swarmId);
    const machineList: Array<Machine> = await db("machine")
        .whereIn("id", machineIds);
    return machineList;
}

export async function getSwarmMachineIds(swarmId: number): Promise<Array<number>> {
    const swarmMachineList: Array<SwarmMachine> = await db("swarm_machine")
        .where("swarm_id", "=", swarmId);
    return swarmMachineList.map(item => {
        return item.machine_id;
    });
}