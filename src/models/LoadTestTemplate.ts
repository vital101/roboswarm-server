import { db } from "../lib/db";
import * as encryption from "../lib/encryption";

const TABLE_NAME: string = "load_test_template_complex";

export interface TemplateRoute {
    id?: number;
    created_at?: Date;
    load_test_template_id?: number;
    method: string;
    path: string;
}

export interface WordPressRoute {
    routeType: WordPressRouteType;
    routes: TemplateRoute[];
    sitemapUrl?: string;
}

export interface TemplateSimple {
    id: number;
    name: string;
    created_at: Date;
    is_woo_commerce?: boolean;
}

export interface TemplateComplex {
    id?: number;
    group_id: Number;
    user_id: Number;
    created_at?: Date;
    name: string;
    site_url?: string;
    username?: string;
    password?: string;
    routes: WordPressRoute[] | string;
    scenario_names: string;
}

export enum WordPressRouteType {
    AUTHENTICATED_FRONTEND_NAVIGATE,
    AUTHENTICATED_ADMIN_NAVIGATE,
    UNAUTHENTICATED_FRONTEND_NAVIGATE
}

export interface TemplateBlob {
    id?: number;
    group_id: number;
    user_id: number;
    created_at: Date;
    active: boolean;
    template: string;
}

function getRouteTypeName(routeType: WordPressRouteType): string {
    switch (routeType) {
        case WordPressRouteType.AUTHENTICATED_ADMIN_NAVIGATE:
            return "Authenticated WordPress Admin Browsing";
        case WordPressRouteType.AUTHENTICATED_FRONTEND_NAVIGATE:
            return "Authenticated WordPress Frontend Browsing";
        case WordPressRouteType.UNAUTHENTICATED_FRONTEND_NAVIGATE:
            return "Unauthenticated WordPress Frontend Browsing";
    }
}

function hydrate(template: TemplateComplex): TemplateComplex {
    return {
        ...template,
        password: encryption.decrypt(template.password),
        routes: JSON.parse(template.routes as string) as WordPressRoute[]
    };
}

export async function create(template: TemplateComplex): Promise<TemplateComplex> {
    const routes: WordPressRoute[] = template.routes as WordPressRoute[];
    const data: TemplateComplex = {
        ...template,
        password: template?.password ? encryption.encrypt(template.password) : "",
        routes: JSON.stringify(routes),
        scenario_names: routes.map(route => getRouteTypeName(route.routeType)).join(",")
    };
    const complexTemplateList: TemplateComplex[] = await db(TABLE_NAME)
        .insert(data)
        .returning("*");

    return hydrate(complexTemplateList[0]);
}

export async function update(id: number, template: TemplateComplex): Promise<TemplateComplex> {
    const routes: WordPressRoute[] = template.routes as WordPressRoute[];
    const data: TemplateComplex = {
        ...template,
        password: encryption.encrypt(template.password),
        routes: JSON.stringify(routes),
        scenario_names: routes.map(route => getRouteTypeName(route.routeType)).join(",")
    };
    const updated: TemplateComplex[] = await db(TABLE_NAME)
        .update(data)
        .where({ id })
        .returning("*");

    return hydrate(updated[0]);
}

export async function getByUserAndGroup(userId: number, groupId: number): Promise<TemplateSimple[]> {
    const testTemplates: TemplateSimple[] = await db(TABLE_NAME)
        .select("id", "name", "scenario_names", "created_at")
        .where({
            user_id: userId,
            group_id: groupId
        })
        .orderBy("name");
    return testTemplates;
}

export async function deleteById(id: number): Promise<void> {
    await db(TABLE_NAME).delete().where({ id });
}

export async function getById(id: number): Promise<TemplateComplex> {
    const template: TemplateComplex = await db(TABLE_NAME)
        .where({ id })
        .first();
    return hydrate(template);
}

export async function createTemplateBlob(template: TemplateBlob): Promise<TemplateBlob> {
    const savedRows: TemplateBlob[] = await db("template_blob")
        .insert(template)
        .returning("*");
    return savedRows[0];
}

export async function getTemplateBlobs(userId: number, groupId: number): Promise<TemplateBlob[]> {
    const rows: TemplateBlob[] = await db("template_blob")
        .select("*")
        .where({ user_id: userId, group_id: groupId, active: true });

    return rows;
}

export async function getTemplateBlobById(userId: number, groupId: number, id: number): Promise<TemplateBlob> {
    const template: TemplateBlob = await db("template_blob")
        .where({ id, user_id: userId, group_id: groupId, active: true })
        .first();
    return template;
}

export async function updateTemplateBlob(template: TemplateBlob): Promise<TemplateBlob> {
    const updatedTemplate: TemplateBlob[] = await db("template_blob")
        .update(template)
        .where({ id: template.id, user_id: template.user_id, group_id: template.group_id })
        .returning("*");
    return updatedTemplate[0];
}

export async function deleteTemplateBlob(userId: number, groupId: number, id: number): Promise<void> {
    await db("template_blob")
        .update({ active: false })
        .where({ id, user_id: userId, group_id: groupId });
}