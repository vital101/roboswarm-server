import { db } from "../lib/db";
import { compare, genSalt, hash } from "bcrypt";

export interface User {
    id?: number;
    email: string;
    password?: string;
    first_name: string;
    last_name: string;
    stripe_id?: string;
    stripe_plan_id?: string;
    stripe_plan_description?: string;
    stripe_card_id?: string;
    created_at?: Date;
    group?: Group;
}

export interface Group {
    id?: number;
    name: string;
}

export interface UserGroup {
    user_id: number;
    group_id: number;
}

async function generatePasswordHash(password: string): Promise<string> {
    const salt = await genSalt(parseInt(process.env.SALT_WORK_FACTOR, 10));
    return await hash(password, salt);
}

async function isValidPassword(password: string, passwordHash: string): Promise<boolean> {
    return await compare(password, passwordHash);
}

export async function createUser(userData: User): Promise<User> {
    const group: Array<Group> = await db("group").insert({ name: userData.email }, "*");
    const passwordHash = await generatePasswordHash(userData.password);
    userData.password = passwordHash;
    const user: Array<User> = await db("user").insert(userData, "*");
    await db("usergroup").insert({
        user_id: user[0].id,
        group_id: group[0].id
    });
    user[0].group = group[0];
    user[0].password = undefined;
    return user[0];
}

export async function exists(email: string): Promise<boolean> {
    const users: Array<User> = await db("user").where({ email });
    return users.length > 0;
}

export async function authenticate(email: string, password: string): Promise<boolean> {
    const foundUser: Array<User> = await db("user").where({ email });
    if (foundUser.length !== 1) {
        return false;
    }
    const user = foundUser[0];
    return await isValidPassword(password, user.password);
}

export async function getByEmail(email: string): Promise<User> {
    const foundUser: Array<User> = await db("user").where({ email });
    const foundUserGroup: Array<UserGroup> = await db("usergroup").where({ user_id: foundUser[0].id });
    const foundGroup: Array<Group> = await db("group").where({ id: foundUserGroup[0].group_id });
    const user = foundUser[0];
    user.password = undefined;
    user.group = foundGroup[0];
    return user;
}

export async function getById(id: number): Promise<User> {
    const foundUser: Array<User> = await db("user").where({ id });
    const foundUserGroup: Array<UserGroup> = await db("usergroup").where({ user_id: foundUser[0].id });
    const foundGroup: Array<Group> = await db("group").where({ id: foundUserGroup[0].group_id });
    const user = foundUser[0];
    user.password = undefined;
    user.group = foundGroup[0];
    return user;
}

export async function updateById(id: number, fields: any): Promise<User> {
    await db("user").update(fields).where("id", id);
    const foundUser: Array<User> = await db("user").where("id", id);
    return foundUser[0];
}