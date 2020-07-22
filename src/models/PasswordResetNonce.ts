import { db } from "../lib/db";
import { v4 as generateUUID } from "uuid";
import { invalidateCache } from "swig";

export interface PasswordResetNonce {
    id?: number;
    created_at?: Date;
    user_id: number;
    nonce: string;
    valid: boolean;
}

export async function create(user_id: number): Promise<PasswordResetNonce> {
    const rows: PasswordResetNonce[] = await db("password_reset_nonce")
        .insert({
            user_id,
            nonce: generateUUID(),
            valid: true
        })
        .returning("*");
    return rows[0];
}

export async function getByNonce(nonce: string): Promise<PasswordResetNonce> {
    const row: PasswordResetNonce = await db("password_reset_nonce")
        .where({ nonce, valid: true})
        .first();
    return row;
}

export async function invalidate(id: number): Promise<void> {
    await db("password_reset_nonce")
        .update({ valid: false })
        .where({ id });
}