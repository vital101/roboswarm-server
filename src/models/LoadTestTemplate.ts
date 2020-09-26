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
        password: encryption.encrypt(template.password),
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