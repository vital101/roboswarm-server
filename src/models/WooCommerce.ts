import { db } from "../lib/db";

const TABLE_NAME = "load_test_template_woo_commerce";

export interface WooCommerceTemplate {
    id?: number;
    created_at?: Date;
    active: boolean;
    group_id: Number;
    user_id: Number;
    name: string;
    description: string;
    shop_url: string;
    cart_url: string;
    checkout_url: string;
    product_a_url: string;
    product_b_url: string;
}

export interface AddUpdateWooCommerceTemplate {
    id?: number;
    name: string;
    description: string;
    shop_url: string;
    cart_url: string;
    checkout_url: string;
    product_a_url: string;
    product_b_url: string;
}

export async function create(template: WooCommerceTemplate): Promise<WooCommerceTemplate> {
    const result: WooCommerceTemplate[] = await db(TABLE_NAME)
        .insert(template)
        .returning("*");
    return result[0];
}

export async function update(id: number, fields: AddUpdateWooCommerceTemplate): Promise<WooCommerceTemplate> {
    const result: WooCommerceTemplate[] = await db(TABLE_NAME)
        .where({ id })
        .update(fields)
        .returning("*");
    return result[0];
}

export async function deleteById(id: number): Promise<void> {
    await db(TABLE_NAME).where({ id }).update({ active: false });
}

export async function getByGroup(group_id: number): Promise<WooCommerceTemplate[]> {
    const results: WooCommerceTemplate[] = await db(TABLE_NAME)
        .where({ group_id, active: true })
        .orderBy("name");
    return results;
}

export async function getById(id: number): Promise<WooCommerceTemplate> {
    const results: WooCommerceTemplate[] = await db(TABLE_NAME)
        .where({ id, active: true });
    if (results && results.length === 1) {
        return results[0];
    } else {
        return undefined;
    }
}