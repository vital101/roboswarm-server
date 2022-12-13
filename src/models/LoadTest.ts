import { db } from "../lib/db";
import { LoadTestRouteSpecificData } from "./LoadTestRouteSpecificData";

export interface Request {
    id?: number;
    swarm_id: number;
    created_at: Date;
    user_count?: number;
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

export interface RequestWithWindowAvg extends Request {
    AVG_REQUEST_PER_SEC: number;
    AVG_FAILURE_PER_SEC: number;
    AVG_RESPONSE_TIME_WINDOW: number;
    MED_RESPONSE_TIME_WINDOW: number;
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

export async function getRequestsAndFailuresInRange(swarmId: number, totalRows: number, startId?: number): Promise<RequestWithWindowAvg[]> {
    // For cases with fewer than 50 rows, we just return all of the rows and fake the average.
    // This case also generally handles the "startId" case where we're looking at live data.
    if (totalRows <= 50) {
        const query = db("load_test_requests")
            .where("swarm_id", swarmId)
            .orderBy("created_at", "asc");
        if (startId) {
            query.where("id", ">", startId);
        }
        const result: Request[] = await query;
        const resultWithFakeAverage: RequestWithWindowAvg[] = result.map(r => {
            return {
                ...r,
                AVG_REQUEST_PER_SEC: r.requests_per_second,
                AVG_FAILURE_PER_SEC: r.failures_per_second,
                AVG_RESPONSE_TIME_WINDOW: r.average_response_time,
                MED_RESPONSE_TIME_WINDOW: r.median_response_time
            };
        });
        return resultWithFakeAverage;
    } else {
        // Usually viewing the full set here so we will use window functions to get averages.
        const modulo = Math.floor(totalRows / 50);
        const query = `
            SELECT
                AVG(requests_per_second) OVER(
                    ORDER BY id ASC ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
                ) AS AVG_REQUEST_PER_SEC,
                AVG(failures_per_second) OVER(
                    ORDER BY id ASC ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
                ) AS AVG_FAILURE_PER_SEC,
                AVG(average_response_time) OVER(
                    ORDER BY id ASC ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
                ) AS AVG_RESPONSE_TIME_WINDOW,
                AVG(median_response_time) OVER(
                    ORDER BY id ASC ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
                ) AS MED_RESPONSE_TIME_WINDOW,
            *
            FROM (
                SELECT
                    ROW_NUMBER() OVER(ORDER BY "created_at" ASC) AS rn,
                    *
                FROM "load_test_requests"
                WHERE "swarm_id" = ${swarmId}
            ) t
            WHERE rn % ${modulo} = 0
            ORDER BY "created_at" ASC
        `;
        const result = await db.raw(query);
        return result.rows as RequestWithWindowAvg[];
    }
}

export async function getRequestsInRange(swarm_id: number, rowsBetweenPoints: number, startId?: number): Promise<Request[]> {
    rowsBetweenPoints = rowsBetweenPoints === 0 ? 1 : rowsBetweenPoints;
    let query = `
        SELECT t.*
        FROM (
            select *, row_number() OVER(ORDER BY id ASC) AS row
            from "load_test_requests"
            where "swarm_id" = ${swarm_id}
    `;
    if (startId) {
        query += ` AND id > ${startId}`;
    }
    query += `
            order by "created_at" ASC
        ) t
        WHERE t.row % ${rowsBetweenPoints} = 0 OR t.failures_per_second > 0
    `;
    console.log(query);
    const result = await db.raw(query);
    return result.rows as Request[];
}

export async function getRouteSpecificInRange(swarm_id: number, route: string, rowsBetweenPoints: number, startId?: number): Promise<LoadTestRouteSpecificData[]> {
    rowsBetweenPoints = rowsBetweenPoints === 0 ? 1 : rowsBetweenPoints;
    let query = `
        SELECT t.*
        FROM (
            select *, row_number() OVER(ORDER BY id ASC) AS row
            from "load_test_route_specific_data"
            where "swarm_id" = ? AND "route" = ?
    `;
    if (startId) {
        query += " AND id > ?";
    }
    query += `
            order by "created_at" ASC
        ) t
        WHERE t.row % ? = 0
    `;
    const result = startId ?
        await db.raw(query, [swarm_id, route, startId, rowsBetweenPoints]) :
        await db.raw(query, [swarm_id, route, rowsBetweenPoints]);
    return result.rows as LoadTestRouteSpecificData[];
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

export async function getTotalRouteSpecificRows(swarm_id: number, route: string, startId?: number): Promise<number> {
    let query = db("load_test_route_specific_data").where({ swarm_id, route });
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

export async function getLatestDistribution(swarm_id: number): Promise<Distribution[]> {
    return await db<Distribution>("load_test_distribution")
        .where("swarm_id", "=", swarm_id)
        .orderBy("created_at", "desc")
        .limit(1);
}

export async function getTotalDistributionRows(swarm_id: number, startId?: number): Promise<number> {
    let query = db("load_test_distribution").where({ swarm_id });
    if (startId) {
        query = query.andWhere("id", ">", startId);
    }
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
    if (totalRows < 200) {
        return i;
    } else {
        while (i) {
            if ((totalRows / i) <= 200) {
                return i;
            }
            i++;
        }
    }
}
