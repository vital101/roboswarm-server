import { Router } from "express";
import { RoboRequest, RoboResponse, RoboError } from "../../../interfaces/shared.interface";
import * as LoadTestTemplate from "../../../models/LoadTestTemplate";

interface GetTemplatesResponse extends RoboResponse {
    json: (data: LoadTestTemplate.LoadTestTemplate[]) => any;
}

interface PostTemplateRequest extends RoboRequest {
    body: LoadTestTemplate.LoadTestTemplate;
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

const router = Router();

router.route("/:id")
    .get(async (req: GetTemplateByIdRequest, res: GetTemplateByIdResponse) => {
        const hydrate = true;
        const hydratedTemplate = await LoadTestTemplate.getById(Number(req.params.id), hydrate) as LoadTestTemplate.LoadTestTemplateHydrated;
        res.status(200);
        res.json(hydratedTemplate);
    });

//
// Need to create:
// PUT /:id - Deletes all routes, replaces with the new ones
// DELETE /:id - Deletes template and all routes.
//

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
        const newTemplate = await LoadTestTemplate.create(req.body);
        res.status(201);
        res.json(newTemplate);
    });

export default router;