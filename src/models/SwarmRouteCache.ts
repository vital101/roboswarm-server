import { db } from "../lib/db";

export interface SwarmRouteCache {
    id?: number;
    created_at?: Date;
    swarm_id: number;
    routes: string;
}

export interface SwarmRouteCacheHydrated extends Omit<SwarmRouteCache, "routes"> {
    routes: string[];
}

export async function create(swarm_id: number, routes: string[]): Promise<SwarmRouteCacheHydrated> {
    const result = await db<SwarmRouteCache>("swarm_route_cache")
        .insert({
            swarm_id,
            routes: JSON.stringify(routes)
        })
        .returning("*");
    const insertedItem: SwarmRouteCache = result[0];
    return {
        ...insertedItem,
        routes: JSON.parse(insertedItem.routes)
    };
};

export async function update(swarm_id: number, routes: string[]): Promise<SwarmRouteCacheHydrated> {
    await db<SwarmRouteCache>("swarm_route_cache")
        .update({
            routes: JSON.stringify(routes)
        })
        .where({ swarm_id });
    return await get(swarm_id);
}

export async function get(swarm_id: number): Promise<SwarmRouteCacheHydrated|null> {
    const result = await db<SwarmRouteCache>("swarm_route_cache")
        .where({ swarm_id })
        .first();
    if (result) {
        return {
            ...result,
            routes: JSON.parse(result.routes)
        };
    }
    return null;
}