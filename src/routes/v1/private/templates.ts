import { Router } from "express";
import { RoboRequest, RoboResponse } from "../../../interfaces/shared.interface";
import * as LoadTestTemplate from "../../../models/LoadTestTemplate";
import { getSitesFromSitemap, SitemapRoute } from "../../../lib/sitemap";
import { generateLocustFile } from "../../../lib/templateGeneration";

interface GetTemplatesResponse extends RoboResponse {
    json: (data: LoadTestTemplate.TemplateSimple[]) => any;
}

interface PostTemplateRequest extends RoboRequest {
    body: LoadTestTemplate.TemplateComplex;
}

interface PostTemplateResponse extends RoboResponse {
    json: (data: LoadTestTemplate.TemplateComplex) => any;
}

interface GetTemplateByIdRequest extends RoboRequest {
    params: {
        id: string;
    };
}

interface GetTemplateByIdResponse extends RoboResponse {
    json: (data: LoadTestTemplate.TemplateComplex) => any;
}

interface PutTemplateByIdRequest extends GetTemplateByIdRequest {
    body: LoadTestTemplate.TemplateComplex;
}

interface GetSitemapResponse extends RoboResponse {
    json: (data: SitemapRoute[]) => any;
}

interface GetSitemapRequest extends RoboRequest {
    body: {
        url: string;
    };
}

const router = Router();

router.route("/sitemap")
    .post(async (req: GetSitemapRequest, res: GetSitemapResponse) => {
        const sites: SitemapRoute[] = await getSitesFromSitemap(req.body.url);
        res.status(200);
        res.json(sites);
    });


//
// TODO - Use this to test the template generation.
//
router.route("/:id/generate-locustfile")
    .get(async (req: RoboRequest, res: RoboResponse) => {
        try {
            const template = await generateLocustFile(Number(req.params.id));
            res.status(200);
            res.send(template);
        } catch (err) {
            console.log({err});
            res.status(500);
            res.json(err);
        }
    });

router.route("/:id")
    .delete(async (req: GetTemplateByIdRequest, res: RoboResponse) => {
        await LoadTestTemplate.deleteById(Number(req.params.id));
        res.status(200);
        res.json({ ok: true });
    })
    .get(async (req: GetTemplateByIdRequest, res: GetTemplateByIdResponse) => {
        const template = await LoadTestTemplate.getById(Number(req.params.id));
        res.status(200);
        res.json(template);
    })
    .put(async (req: PutTemplateByIdRequest, res: GetTemplateByIdResponse) => {
        const result = await LoadTestTemplate.update(Number(req.params.id), req.body);
        res.status(200);
        res.json(result);
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
        const complexTemplate: LoadTestTemplate.TemplateComplex = {
            ...req.body,
            user_id: req.user.id,
            group_id: req.user.groupId
        };
        const createdTemplate = await LoadTestTemplate.create(complexTemplate);
        res.status(201);
        res.json(createdTemplate);
    });

export default router;