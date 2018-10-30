import { Router } from "express";
import { RoboRequest, RoboResponse } from "../../../interfaces/shared.interface";
import * as User from "../../../models/User";
import * as Stripe from "../../../lib/stripe";

interface UserBodyResponse extends RoboResponse {
    json: (user: User.User) => any;
}

interface SetPlanBody {
    planName: string;
}

interface SetPlanRequest extends RoboRequest {
    body: SetPlanBody;
}

const router = Router();

router.route("/me/plan")
    .post(async (req: SetPlanRequest, res: RoboResponse) => {
        await Stripe.setStripePlan(req.user.id, req.body.planName);
        res.status(200);
        res.send("ok");
    });

router.route("/me")
    .get(async (req: RoboRequest, res: UserBodyResponse) => {
        const user: User.User = await User.getById(req.user.id);
        res.status(200);
        res.json(user);
    });

export default router;
