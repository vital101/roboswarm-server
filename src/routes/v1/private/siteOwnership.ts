import { Router } from "express";
import { RoboRequest } from "../../../interfaces/shared.interface";
import { SiteOwnership } from "src/models/SiteOwnership";

const router = Router();

router.route("/site-ownership")
    .get(async (req: RoboRequest, res: SiteOwnershipResponse) => {

    });

export default router;