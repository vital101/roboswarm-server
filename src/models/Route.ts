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
        .insert({ route: path });
}

export async function getOrCreate(path: string): Promise<Route> {
    const existingRoute = await getByName(path);
    if (existingRoute) {
        return existingRoute;
    } else {
        await create(path);
        return await getByName(path);
    }
}