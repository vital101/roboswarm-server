import { db } from "../lib/db";

const TABLE_NAME: string = "load_test_template_route";
export interface LoadTestTemplateRoute {
    id?: number;
    created_at?: Date;
    load_test_template_id: number;
    method: string;
    path: string;
}

export async function create(route: LoadTestTemplateRoute): Promise<LoadTestTemplateRoute> {
    const routeList: LoadTestTemplateRoute[] = await db(TABLE_NAME)
        .insert(route)
        .returning("*");
    return routeList[0];
}

export async function getByTemplateId(templateId: number): Promise<LoadTestTemplateRoute[]> {
    const routes: LoadTestTemplateRoute[] = await db(TABLE_NAME)
        .where({ load_test_template_id: templateId });
    return routes;
}

export async function deleteById(id: number): Promise<void> {
    await db(TABLE_NAME).delete().where({ id });
}

export async function deleteByTemplateId(templateId: number): Promise<void> {
    await db(TABLE_NAME).delete().where({ load_test_template_id: templateId });
}