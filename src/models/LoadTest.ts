import { db } from "../lib/db";

export interface Request {
    id?: number;
    swarm_id: number;
    created_at: Date;
    requests: number;
    failures: number;
    median_response_time: number;
    average_response_time: number;
    min_response_time: number;
    max_response_time: number;
    avg_content_size: number;
    requests_per_second: number;
}

export interface Distribution {
    id?: number;
    swarm_id: number;
    created_at: Date;
    requests: number;
    percentiles: string;
    percentilesObject?: Object;
}

export async function createRequest(request: Request): Promise<Request> {
    const result: Request[] = await db("load_test_requests")
        .insert(request)
        .returning("*");
    return result[0];
}

export async function createDistribution(distribution: Distribution): Promise<Distribution> {
    const result: Distribution[] = await db("load_test_distribution")
        .insert(distribution)
        .returning("*");
    return result[0];
}

export async function getLatestRequest(swarm_id: number): Promise<Request> {
    const result: Request[] = await db("load_test_requests")
        .where({ swarm_id })
        .orderBy("created_at", "DESC")
        .limit(1);
    if (result.length > 0) {
        return result[0];
    } else {
        return undefined;
    }
}

export async function getLatestDistribution(swarm_id: number): Promise<Distribution> {
    const result: Distribution[] = await db("load_test_distribution")
        .where({ swarm_id })
        .orderBy("created_at", "DESC")
        .limit(1);
    if (result.length > 0) {
        return result[0];
    } else {
        return undefined;
    }
}