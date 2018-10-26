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

export interface RequestFinal extends Request {
    method: string;
    route: string;
}

export interface Distribution {
    id?: number;
    swarm_id: number;
    created_at: Date;
    requests: number;
    percentiles: string;
}

export interface DistributionFinal extends Distribution {
    method: string;
    route: string;
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

export async function createRequestFinal(requestFinal: RequestFinal): Promise<RequestFinal> {
    const result: RequestFinal[] = await db("load_test_requests_final")
        .insert(requestFinal)
        .returning("*");
    return result[0];
}

export async function createDistributionFinal(distributionFinal: DistributionFinal): Promise<DistributionFinal> {
    const result: DistributionFinal[] = await db("load_test_distribution_final")
        .insert(distributionFinal)
        .returning("*");
    return result[0];
}

export async function getRequestsInRange(swarm_id: number, startId?: number): Promise<Request[]> {
    let query = db("load_test_requests").where({ swarm_id });
    if (startId) {
        query = query.andWhere("id", ">", startId);
    }
    query = query.orderBy("created_at", "ASC");
    const result: Request[] = await query;
    return result;
}

export async function getDistributionsInRange(swarm_id: number, startId?: number): Promise<Distribution[]> {
    let query = db("load_test_distribution").where({ swarm_id });
    if (startId) { query = query.andWhere("id", ">", startId); }
    query = query.orderBy("created_at", "ASC");
    const result: Distribution[] = await query;
    return result;
}

export async function getRequestsFinal(swarm_id: number): Promise<RequestFinal[]> {
    const result: RequestFinal[] = await db("load_test_requests_final").where({ swarm_id });
    return result;
}

export async function getDistributionFinal(swarm_id: number): Promise<DistributionFinal[]> {
    const result: DistributionFinal[] = await db("load_test_distribution_final").where({ swarm_id });
    return result;
}