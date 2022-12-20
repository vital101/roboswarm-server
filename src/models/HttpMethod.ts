import { db } from "../lib/db";

export interface HttpMethod {
    id?: number;
    method: string;
}

export async function getByName(name: string): Promise<HttpMethod> {
    const nameUpperCase = name.toUpperCase();
    return await db<HttpMethod>("http_method")
        .where({ method: nameUpperCase })
        .first();
}