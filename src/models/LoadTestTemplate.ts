import { db } from "../lib/db";
import * as LoadTestTemplateRoute from "./LoadTestTemplateRoute";

const TABLE_NAME: string = "load_test_template";
export interface LoadTestTemplate {
    id?: number;
    created_at?: Date;
    group_id: Number;
    user_id: Number;
    name: string;
}

export interface LoadTestTemplateHydrated extends LoadTestTemplate {
    routes: LoadTestTemplateRoute.LoadTestTemplateRoute[];
}

export async function create(template: LoadTestTemplate): Promise<LoadTestTemplate> {
    const testTemplateList: LoadTestTemplate[] = await db(TABLE_NAME)
        .insert(template)
        .returning("*");
    return testTemplateList[0];
}

export async function getByUserAndGroup(userId: number, groupId: number): Promise<LoadTestTemplate[]> {
    const testTemplates: LoadTestTemplate[] = await db(TABLE_NAME)
        .where({
            user_id: userId,
            group_id: groupId
        });
    return testTemplates;
}

export async function deleteById(id: number): Promise<void> {
    await db(TABLE_NAME).delete().where({ id });
}

export async function getById(id: number, hydrated = false): Promise<LoadTestTemplate|LoadTestTemplateHydrated> {
    const template: LoadTestTemplate = await db(TABLE_NAME)
        .where({ id })
        .first();
    if (!hydrated) return template;

    const hydratedTemplate: LoadTestTemplateHydrated = {
        ...template,
        routes: await LoadTestTemplateRoute.getByTemplateId(id)
    };
    return hydratedTemplate;
}