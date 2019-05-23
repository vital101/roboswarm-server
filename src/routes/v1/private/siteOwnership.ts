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

interface SiteOwnershipDeleteRequest extends RoboRequest {
    params: {
        id: string;
    };
}

const router = Router();

router.route("/verify/:id")
    .post(async (req: SiteOwnershipVerifyRequest, res: SiteOwnershipVerifyResponse) => {
        const id: number = parseInt(req.params.id, 10);
        let siteToVerify: SiteOwnership.SiteOwnership = await SiteOwnership.findById(id);
        if (!siteToVerify) {
            res.status(404);
            res.send("Not found.");
            return;
        }
        await SiteOwnership.verify(siteToVerify);
        siteToVerify = await SiteOwnership.findById(id);
        res.status(200);
        res.json(siteToVerify);
    });

router.route("/:id")
    .delete(async (req: SiteOwnershipDeleteRequest, res: RoboResponse) => {
        const id: number = parseInt(req.params.id, 10);
        const siteToDelete: SiteOwnership.SiteOwnership = await SiteOwnership.findById(id);
        if (siteToDelete.user_id !== req.user.id) {
            res.status(403);
            res.send("Unauthorized.");
            return;
        }
        await SiteOwnership.deleteById(id);
        res.status(200);
        res.send("Deleted.");
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
        req.body.verified = false;
        const newSite: SiteOwnership.SiteOwnership = await SiteOwnership.create(req.body);
        res.status(201);
        res.json(newSite);
    });

export default router;