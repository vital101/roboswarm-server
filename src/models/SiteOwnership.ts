import { db } from "../lib/db";
import { v4 as generateUUID } from "uuid";

export interface SiteOwnership {
    id?: number;
    group_id: number;
    user_id: number;
    base_url: string;
    uuid?: string;
    verified: boolean;
    created_at: Date;
}

export async function create(site: SiteOwnership): Promise<SiteOwnership> {
    const rows: SiteOwnership[] = await db("site_ownership")
        .insert({
            ...site,
            uuid: generateUUID()
        })
        .returning("*");
    return rows[0];
}

export async function find(fields: Object): Promise<SiteOwnership[]> {
    const rows: SiteOwnership[] = await db("site_ownership").where(fields);
    return rows;
}

export async function update(where: Object, fieldsToUpdate: Object): Promise<SiteOwnership[]> {
    const rows: SiteOwnership[] = await db("site_ownership")
        .update(fieldsToUpdate)
        .where(where)
        .returning("*");
    return rows;
}