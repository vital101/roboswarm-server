import { db } from "../lib/db";

const TABLE_NAME = "load_test_error";

export interface LoadTestError {
    swarm_id: number;
    method: string;
    path: string;
    message: string;
    error_count: number;
    created_at?: Date;
}


export async function create(data: LoadTestError): Promise<void> {
    await db.transaction(async (trx) => {
        await trx(TABLE_NAME)
            .delete()
            .where({ swarm_id: data.swarm_id });
        return trx(TABLE_NAME).insert(data);
    });
}

export async function getBySwarmId(swarm_id: number): Promise<LoadTestError[]> {
    const rows: LoadTestError[] = await db(TABLE_NAME)
        .where({ swarm_id })
        .orderBy("error_count", "DESC");
    return rows;
}
