import { db } from "../lib/db";

export interface Route {
    id?: number;
    route: string;
}

export async function getByName(route: string): Promise<Route> {
    return await db<Route>("route")
        .where({ route })
        .first();
}

export async function create(path: string): Promise<Route> {
    return await db<Route>("route")
        .insert({ route: path })
        .returning("*")
        .first();
}

export async function getOrCreate(path: string): Promise<Route> {
    const existingRoute = await getByName(path);
    if (existingRoute) {
        return existingRoute;
    } else {
        return await create(path);
    }
}