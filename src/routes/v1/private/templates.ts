import { Router } from "express";
import { RoboRequest, RoboResponse } from "../../../interfaces/shared.interface";
import * as LoadTestTemplate from "../../../models/LoadTestTemplate";
import { getSitesFromSitemap, SitemapRoute } from "../../../lib/sitemap";
import * as WooCommerceTemplate from "../../../models/WooCommerce";
import * as email from "../../../lib/email";
import * as User from "../../../models/User";

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

interface GetWooCommerceTemplatesResponse extends RoboResponse {
    json: (data: WooCommerceTemplate.WooCommerceTemplate[]) => any;
}

interface CreateWooCommerceRequest extends RoboRequest {
    body: WooCommerceTemplate.AddUpdateWooCommerceTemplate;
}

interface WooCommerceRequest extends RoboRequest {
    params: {
        id: string;
    };
}

interface UpdateWooCommerceRequest extends WooCommerceRequest {
    body: WooCommerceTemplate.AddUpdateWooCommerceTemplate;
}

interface GetOrUpdateWooCommerceResponse extends RoboResponse {
    json: (data: WooCommerceTemplate.WooCommerceTemplate) => any;
}

const router = Router();

router.route("/woo-commerce/:id")
    .get(async (req: WooCommerceRequest, res: GetOrUpdateWooCommerceResponse) => {
        const id: number = Number(req.params.id);
        const result: WooCommerceTemplate.WooCommerceTemplate = await WooCommerceTemplate.getById(id);
        res.status(200);
        res.json(result);
    })
    .delete(async (req: WooCommerceRequest, res: RoboResponse) => {
        const id: number = Number(req.params.id);
        await WooCommerceTemplate.deleteById(id);
        res.status(200);
        res.send("ok");
    })
    .put(async (req: UpdateWooCommerceRequest, res: GetOrUpdateWooCommerceResponse) => {
        const id: number = Number(req.params.id);
        const result: WooCommerceTemplate.WooCommerceTemplate = await WooCommerceTemplate.update(id, req.body);
        res.status(200);
        res.json(result);
    });

router.route("/woo-commerce")
    .get(async (req: RoboRequest, res: GetWooCommerceTemplatesResponse) => {
        const templates: WooCommerceTemplate.WooCommerceTemplate[] = await WooCommerceTemplate.getByGroup(req.user.groupId);
        res.status(200);
        res.json(templates);
    })
    .post(async (req: CreateWooCommerceRequest, res: RoboResponse) => {
        const user: User.User = await User.getById(req.user.id);
        await WooCommerceTemplate.create({
            ...req.body,
            active: true,
            user_id: user.id,
            group_id: user.group.id
        });
        res.status(201);
        res.json({ ok: true });
    });

router.route("/sitemap")
    .post(async (req: GetSitemapRequest, res: GetSitemapResponse) => {
        const sites: SitemapRoute[] = await getSitesFromSitemap(req.body.url);
        res.status(200);
        res.json(sites);
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