import { db } from "../lib/db";

const localCache: any = {};
let initialized = false;

export interface Route {
    id?: number;
    route: string;
}

export async function getByName(route: string): Promise<Route> {
    if (localCache["route"]) {
        return {
            id: localCache["route"],
            route
        };
    } else {
        const result = await db<Route>("route")
            .where({ route })
            .first();
        localCache[result.route] = result.id;
        return result;
    }

}

export async function create(path: string): Promise<Route> {
    return await db<Route>("route")
        .insert({ route: path });
}

export async function getOrCreate(path: string): Promise<Route> {
    // WIP - Cache for making migrations faster. Remove after.
    if (!initialized) {
        const allRoutes: Route[] = await db<Route>("route");
        for (let i = 0; i < allRoutes.length; i++) {
            localCache[`${allRoutes[i].route}`] = allRoutes[i].id;
        }
        initialized = true;
    }
    // WIP - check cache and create an entry
    const existingRoute = await getByName(path);
    if (existingRoute) {
        return existingRoute;
    } else {
        // WIP - Add to cache and create entry.
        await create(path);
        return await getByName(path);
    }
}