import { db } from "../lib/db";

interface Request {
    id?: number;
    swarm_id: number;
    created_ad: Date;
    requests: number;
    failures: number;
    median_response_time: number;
    average_response_time: number;
    min_response_time: number;
    max_response_time: number;
    avg_content_size: number;
    requests_per_second: number;
}

interface Distribution {
    id?: number;
    swarm_id: number;
    created_ad: Date;
    requests: number;
    percentiles: Object;
}