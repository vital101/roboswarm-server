import { db } from "../lib/db";
import { v1 as generateUUID } from "uuid";
import { asyncWriteFile } from "../lib/lib";

export interface LoadTestFile {
    id?: number;
    created_at?: Date;
    swarm_id: number;
    lt_file: Buffer;
}

export async function create(loadTestFile: LoadTestFile): Promise<LoadTestFile> {
    const result: LoadTestFile[] = await db("load_test_file")
        .insert(loadTestFile)
        .returning("*");
    return result[0];
}

export async function update(id: number, lt_file: BinaryType): Promise<LoadTestFile> {
    const result: LoadTestFile[] = await db("load_test_file")
        .update({ lt_file })
        .where({ id })
        .returning("*");
    return result[0];
}

export async function remove(id: number): Promise<void> {
    await db("load_test_file").delete().where({ id });
}

export async function getLocalFilePathBySwarmId(swarm_id: number): Promise<string> {
    const result: LoadTestFile = await db("load_test_file")
        .where({ swarm_id })
        .first();
    const path = `/tmp/${generateUUID()}.zip`;
    await asyncWriteFile(path, result.lt_file);
    return path;
}

export async function getBySwarmId(swarm_id: number): Promise<LoadTestFile> {
    const result: LoadTestFile = await db("load_test_file")
        .where({ swarm_id })
        .first();
    return result;
}