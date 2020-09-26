import { db } from "../lib/db";

const TABLE_NAME = "load_test_template_woo_commerce";

export interface WooCommerceTemplate {
    id?: number;
    created_at?: Date;
    group_id: Number;
    user_id: Number;
    name: string;
    file_path: string;
    description: string;
}

export async function create(template: WooCommerceTemplate): Promise<WooCommerceTemplate> {
    const result: WooCommerceTemplate[] = await db(TABLE_NAME)
        .insert(template)
        .returning("*");
    return result[0];
}

export async function getByGroup(group_id: number): Promise<WooCommerceTemplate[]> {
    const results: WooCommerceTemplate[] = await db(TABLE_NAME)
        .where({ group_id })
        .orderBy("name");
    return results;
}

export async function getById(id: number): Promise<WooCommerceTemplate> {
    const results: WooCommerceTemplate[] = await db(TABLE_NAME)
        .where({ id });
    if (results && results.length === 1) {
        return results[0];
    } else {
        return undefined;
    }
}