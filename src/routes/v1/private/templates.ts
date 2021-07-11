import { Router } from "express";
import * as multer from "multer";
import { RoboRequest, RoboResponse } from "../../../interfaces/shared.interface";
import * as LoadTestTemplate from "../../../models/LoadTestTemplate";
import { getSitesFromSitemap, SitemapRoute } from "../../../lib/sitemap";
import * as WooCommerceTemplate from "../../../models/WooCommerce";
import * as User from "../../../models/User";
import { readFileSync } from "fs";

export interface TemplateAuth {
    username: string;
    password: string;
}

interface GetTemplatesResponse extends RoboResponse {
    json: (data: LoadTestTemplate.TemplateSimple[]) => any;
}

interface PostTemplateRequest extends RoboRequest {
    body: LoadTestTemplate.TemplateComplex;
}

interface AuthFileUploadRequest extends RoboRequest {

}

interface AuthFileUploadResponse extends RoboResponse {
    json: (data: TemplateAuth[]) => any;
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

interface TemplateBlobGetAllResponse extends RoboResponse {
    json: (data: LoadTestTemplate.TemplateBlob[]) => any;
}

interface TemplateBlobCreateOrUpdate extends RoboRequest {
    body: LoadTestTemplate.TemplateBlob;
}

interface TemplateBlobResponse extends RoboResponse {
    json: (data: LoadTestTemplate.TemplateBlob) => any;
}

interface TemplateBlobSingleRequest extends RoboRequest {
    params: {
        id: string;
    };
}


const router = Router();

router.route("/blob/:id")
    .get(async (req: TemplateBlobSingleRequest, res: TemplateBlobResponse) => {
        const template = await LoadTestTemplate.getTemplateBlobById(
            req.user.id,
            req.user.groupId,
            Number(req.params.id)
        );
        res.status(200);
        res.json(template);
    })
    .put(async (req: TemplateBlobCreateOrUpdate, res: TemplateBlobResponse) => {
        const template = await LoadTestTemplate.updateTemplateBlob(req.body);
        res.status(200);
        res.json(template);
    })
    .delete(async (req: TemplateBlobSingleRequest, res: RoboResponse) => {
        await LoadTestTemplate.deleteTemplateBlob(
            req.user.id,
            req.user.groupId,
            Number(req.params.id)
        );
        res.status(204);
        res.send("Deleted.");
    });

router.route("/blob")
    .get(async (req: RoboRequest, res: TemplateBlobGetAllResponse) => {
        const templates = await LoadTestTemplate.getTemplateBlobs(req.user.id, req.user.groupId);
        res.status(200);
        res.json(templates);
    })
    .post(async (req: TemplateBlobCreateOrUpdate, res: TemplateBlobResponse) => {
        const createdTemplate = await LoadTestTemplate.createTemplateBlob(req.body);
        res.status(201);
        res.json(createdTemplate);
    });

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

const upload = multer({ dest: "/tmp" });
router.route("/auth-file-upload")
    .post(upload.single("loadTestAuthData"),
        (async (req: AuthFileUploadRequest, res: AuthFileUploadResponse) => {
            const data: string = readFileSync(req.file.path).toString();
            const lines: string[] = data.split(/\r?\n/);
            const formatted: TemplateAuth[] = lines.map(l => {
                const tmp = l.split(":");
                return { username: tmp[0], password: tmp[1] };
            });
            res.status(200);
            res.json(formatted);
        }));

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