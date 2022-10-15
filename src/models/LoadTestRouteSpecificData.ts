import { db } from "../lib/db";

const TABLE_NAME = "load_test_route_specific_data";

export interface LoadTestRouteSpecificData {
    id?: number;
    created_at?: Date;
    swarm_id: number;
    method: string;
    route: string;
    requests: number;
    failures: number;
    median_response_time: number;
    average_response_time: number;
    min_response_time: number;
    max_response_time: number;
    avg_content_size: number;
    requests_per_second: number;
    failures_per_second: number;
    user_count: number;
    "50_percent": number;
    "66_percent": number;
    "75_percent": number;
    "80_percent": number;
    "90_percent": number;
    "95_percent": number;
    "98_percent": number;
    "99_percent": number;
    "100_percent": number;
}

export async function bulkCreate(data: LoadTestRouteSpecificData[]): Promise<void> {
    const promises = [];
    for (const item of data) {
        promises.push(db(TABLE_NAME).insert(item));
    }
    await Promise.all(promises);
}

export async function getRoutes(swarmId: number): Promise<string[]> {
    const results = await db(TABLE_NAME)
        .distinct("route")
        .where({ swarm_id: swarmId })
        .orderBy("route");
    return results.map(r => r.route);
}