import { Router } from "express";
import { RoboRequest, RoboResponse, RoboError } from "../../../interfaces/shared.interface";
import * as LoadTestTemplate from "../../../models/LoadTestTemplate";
import * as LoadTestTemplateRoute from "../../../models/LoadTestTemplateRoute";

interface GetTemplatesResponse extends RoboResponse {
    json: (data: LoadTestTemplate.LoadTestTemplate[]) => any;
}

interface PostTemplateRequest extends RoboRequest {
    body: {
        name: string;
        routes: Array<{
            method: string;
            path: string;
        }>
    };
}

interface PostTemplateResponse extends RoboResponse {
    json: (data: LoadTestTemplate.LoadTestTemplate) => any;
}

interface GetTemplateByIdRequest extends RoboRequest {
    params: {
        id: string;
    };
}

interface GetTemplateByIdResponse extends RoboResponse {
    json: (data: LoadTestTemplate.LoadTestTemplateHydrated) => any;
}

interface PutTemplateByIdRequest extends GetTemplateByIdRequest {
    body: {
        routes: LoadTestTemplateRoute.LoadTestTemplateRoute[];
    };
}

const router = Router();

router.route("/:id")
    .delete(async (req: GetTemplateByIdRequest, res: RoboResponse) => {
        await LoadTestTemplateRoute.deleteByTemplateId(Number(req.params.id));
        await LoadTestTemplate.deleteById(Number(req.params.id));
        res.status(200);
        res.json({ ok: true });
    })
    .get(async (req: GetTemplateByIdRequest, res: GetTemplateByIdResponse) => {
        const hydrate = true;
        const hydratedTemplate = await LoadTestTemplate.getById(Number(req.params.id), hydrate) as LoadTestTemplate.LoadTestTemplateHydrated;
        res.status(200);
        res.json(hydratedTemplate);
    })
    .put(async (req: PutTemplateByIdRequest, res: GetTemplateByIdResponse) => {
        const template: LoadTestTemplate.LoadTestTemplate = await LoadTestTemplate.getById(Number(req.params.id));
        if (template && template.user_id === req.user.id) {
            await LoadTestTemplateRoute.deleteByTemplateId(Number(req.params.id));
            const promises: any = [];
            req.body.routes.forEach(route => {
                promises.push(LoadTestTemplateRoute.create({
                    ...route,
                    id: Number(req.params.id)
                }));
            });
            await Promise.all(promises);
        }
        const hydrate = true;
        const templateHydrated = await LoadTestTemplate.getById(Number(req.params.id), hydrate) as LoadTestTemplate.LoadTestTemplateHydrated;
        res.status(200);
        res.json(templateHydrated);
    });

router.route("/")
    .get(async (req: RoboRequest, res: GetTemplatesResponse) => {
        const templates = await LoadTestTemplate.getByUserAndGroup(
            req.user.id,
            req.user.groupId
        );
        res.status(200);
        res.json(templates);
    })
    .post(async (req: PostTemplateRequest, res: PostTemplateResponse) => {
        const newTemplate = await LoadTestTemplate.create({
            group_id: req.user.groupId,
            user_id: req.user.id,
            name: req.body.name
        });
        for (const r of req.body.routes) {
            console.log({
                load_test_template_id: newTemplate.id,
                method: r.method,
                path: r.path
            });
            await LoadTestTemplateRoute.create({
                load_test_template_id: newTemplate.id,
                method: r.method,
                path: r.path
            });
        }
        res.status(201);
        res.json(newTemplate);
    });

export default router;