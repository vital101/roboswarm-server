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

const router = Router();

router.route("/site-ownership")
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