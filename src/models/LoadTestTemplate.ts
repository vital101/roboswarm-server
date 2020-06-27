import { db } from "../lib/db";

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
}

export enum WordPressRouteType {
    AUTHENTICATED_FRONTEND_NAVIGATE,
    AUTHENTICATED_ADMIN_NAVIGATE,
    UNAUTHENTICATED_FRONTEND_NAVIGATE
}

function hydrate(template: TemplateComplex): TemplateComplex {
    return {
        ...template,
        routes: JSON.parse(template.routes as string) as WordPressRoute[]
    };
}

export async function create(template: TemplateComplex): Promise<TemplateComplex> {
    const complexTemplateList: TemplateComplex[] = await db(TABLE_NAME)
        .insert({
            ...template,
            routes: JSON.stringify(template.routes)
        })
        .returning("*");
    return hydrate(complexTemplateList[0]);
}

export async function update(id: number, template: TemplateComplex): Promise<TemplateComplex> {
    const updated: TemplateComplex[] = await db(TABLE_NAME)
        .update({
            ...template,
            routes: JSON.stringify(template.routes)
        })
        .where({ id })
        .returning("*");
    return hydrate(updated[0]);
}

export async function getByUserAndGroup(userId: number, groupId: number): Promise<TemplateSimple[]> {
    const testTemplates: TemplateSimple[] = await db(TABLE_NAME)
        .select("id", "name", "created_at")
        .where({
            user_id: userId,
            group_id: groupId
        });
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