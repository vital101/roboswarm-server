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

export async function getSwarmMaster(swarmId: number): Promise<Machine> {
    const query = db("swarm_machine")
        .join("swarm", "swarm_machine.swarm_id", "swarm.id")
        .join("machine", "swarm_machine.machine_id", "machine.id")
        .select("machine.*")
        .where("swarm.id", "=", swarmId)
        .andWhere("machine.is_master", "=", true);
    const result: Machine[] = await query;
    return result[0];
}

export async function getSwarmIdByMachineId(machineId: number): Promise<number> {
    const result: SwarmMachine[] = await db("swarm_machine").where({ machine_id: machineId });
    return result[0].swarm_id;
}