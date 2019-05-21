import { Router } from "express";
import { RoboRequest, RoboResponse } from "../../../interfaces/shared.interface";
import * as SiteOwnership from "../../../models/SiteOwnership";

interface SiteOwnershipResponse extends RoboResponse {
    json: (data: SiteOwnership.SiteOwnership[]) => any;
}

interface SiteOwnershipCreateResponse extends RoboResponse {
    json: (data: SiteOwnership.SiteOwnership) => any;
}

interface SiteOwnershipCreateRequest extends RoboRequest {
    body: SiteOwnership.SiteOwnership;
}

interface SiteOwnershipVerifyRequest extends RoboRequest {
    params: {
        id: string;
    };
}

interface SiteOwnershipVerifyResponse extends RoboResponse {
    json: (data: SiteOwnership.SiteOwnership) => any;
}

const router = Router();

router.route("/verify/:id")
    .get(async (req: SiteOwnershipVerifyRequest, res: SiteOwnershipVerifyResponse) => {
        let siteToVerify: SiteOwnership.SiteOwnership = await SiteOwnership.findById(parseInt(req.params.id, 10));
        if (!siteToVerify) {
            res.status(404);
            res.send("Not found.");
            return;
        }
        await SiteOwnership.verify(siteToVerify);
        siteToVerify = await SiteOwnership.findById(parseInt(req.params.id, 10));
        res.status(200);
        res.json(siteToVerify);
    });

router.route("/")
    .get(async (req: RoboRequest, res: SiteOwnershipResponse) => {
        const results: SiteOwnership.SiteOwnership[] = await SiteOwnership.find({
            user_id: req.user.id,
            group_id: req.user.groupId
        });
        res.status(200);
        res.json(results);
    })
    .post(async (req: SiteOwnershipCreateRequest, res: SiteOwnershipCreateResponse) => {
        req.body.user_id = req.user.id;
        req.body.group_id = req.user.groupId;
        const newSite: SiteOwnership.SiteOwnership = await SiteOwnership.create(req.body);
        res.status(201);
        res.json(newSite);
    });

export default router;