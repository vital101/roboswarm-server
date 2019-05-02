import { db } from "../lib/db";
import * as moment from "moment";

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
    failures_per_second?: number;
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
    const latestRequestResult: Request[] = await db("load_test_requests")
        .where({ swarm_id : request.swarm_id })
        .orderBy("created_at", "DESC")
        .limit(1);

    // Determine failures per second. This compares the last request we have with this one
    // figures out how much time passed, and then averages total failures per second over
    // that period.
    let failuresPerSecond = 0;
    if (latestRequestResult && latestRequestResult.length === 1) {
        const start: moment.Moment = moment(latestRequestResult[0].created_at);
        const end: moment.Moment = moment(request.created_at);
        const duration: moment.Duration = moment.duration(start.diff(end));
        const totalSeconds: number = Math.ceil(Math.abs(duration.asSeconds()));
        failuresPerSecond = Math.ceil((request.failures - latestRequestResult[0].failures) / totalSeconds);
    }

    request.failures_per_second = failuresPerSecond;
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

export async function getRequestsInRange(swarm_id: number, rowsBetweenPoints: number, startId?: number): Promise<Request[]> {
    let query = db("load_test_requests").where({ swarm_id });
    if (startId) {
        query = query.andWhere("id", ">", startId);
    }
    query = query.orderBy("created_at", "ASC");
    const result: Request[] = await query;
    return result;
    // rowsBetweenPoints = rowsBetweenPoints === 0 ? 1 : rowsBetweenPoints;
    // let query = `
    //     SELECT t.*
    //     FROM (
    //         select *, row_number() OVER(ORDER BY id ASC) AS row
    //         from "load_test_requests"
    //         where "swarm_id" = ${swarm_id}
    // `;
    // if (startId) {
    //     query += `id > ${startId}`;
    // }
    // query += `
    //         order by "created_at" ASC
    //     ) t
    //     WHERE t.row % ${rowsBetweenPoints} = 0 OR t.failures_per_second > 0
    // `;
    // const result = await db.raw(query);
    // return result.rows as Request[];
}

export async function getTotalRequestRows(swarm_id: number, startId?: number): Promise<number> {
    let query = db("load_test_requests").where({ swarm_id });
    if (startId) {
        query = query.andWhere("id", ">", startId);
    }
    query = query.count();
    const totalRequestRows = await query;
    return parseInt(totalRequestRows[0].count, 10);
}

export async function getLastRequestMetricForSwarm(swarm_id: number): Promise<Request[]> {
    const results: Request[] = await db("load_test_requests")
        .where({ swarm_id })
        .orderBy("created_at", "DESC")
        .limit(1);

    return results;
}

export async function getDistributionsInRange(swarm_id: number, rowsBetweenPoints: number, startId?: number, ): Promise<Distribution[]> {
    let query = db("load_test_distribution").where({ swarm_id });
    if (startId) { query = query.andWhere("id", ">", startId); }
    query = query.orderBy("created_at", "ASC");
    const result: Distribution[] = await query;
    return result;
    // rowsBetweenPoints = rowsBetweenPoints === 0 ? 1 : rowsBetweenPoints;
    // let query = `
    //     SELECT t.*
    //     FROM (
    //         select *, row_number() OVER(ORDER BY id ASC) AS row
    //         from "load_test_distribution"
    //         where "swarm_id" = ${swarm_id}
    // `;
    // if (startId) {
    //     query += `id > ${startId}`;
    // }
    // query += `
    //         order by "created_at" ASC
    //     ) t
    //     WHERE t.row % ${rowsBetweenPoints} = 0
    // `;
    // const result = await db.raw(query);
    // return result.rows as Distribution[];
}

export async function getTotalDistributionRows(swarm_id: number, startId?: number): Promise<number> {
    let query = db("load_test_distribution").where({ swarm_id });
    if (startId) { query = query.andWhere("id", ">", startId); }
    query = query.count();
    const totalDistributionRows = await query;
    return parseInt(totalDistributionRows[0].count, 10);
}

export async function getRequestsFinal(swarm_id: number): Promise<RequestFinal[]> {
    const result: RequestFinal[] = await db("load_test_requests_final").where({ swarm_id });
    return result;
}

export async function getDistributionFinal(swarm_id: number): Promise<DistributionFinal[]> {
    const result: DistributionFinal[] = await db("load_test_distribution_final").where({ swarm_id });
    return result;
}

export function getRowsInBetweenPoints(totalRows: number): number {
    let i = 1;
    if (totalRows < 300) {
        return i;
    } else {
        while (i) {
            if ((totalRows / i) <= 300) {
                return i;
            }
            i++;
        }
    }
}
