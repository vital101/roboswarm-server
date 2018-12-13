import { Router } from "express";
import { RoboRequest, RoboResponse } from "../../../interfaces/shared.interface";
import * as User from "../../../models/User";
import * as Stripe from "../../../lib/stripe";
import { sendEmail } from "../../../lib/email";
import { getUserResourceAvailability, ResourceAvailability } from "../../../lib/authorization";

interface UserBodyResponse extends RoboResponse {
    json: (user: User.User) => any;
}

interface SetPlanBody {
    planName: string;
}

interface UpdateCardBody {
    token: string;
    cardId: string;
}

interface SetPlanRequest extends RoboRequest {
    body: SetPlanBody;
}

interface UpdateCardRequest extends RoboRequest {
    body: UpdateCardBody;
}

interface ResourceResponse extends RoboResponse {
    json: (resources: ResourceAvailability) => any;
}

const router = Router();

router.route("/me/card")
    .post(async (req: UpdateCardRequest, res: RoboResponse) => {
        await Stripe.addCardToCustomer(req.user.id, req.body.token, req.body.cardId);
        res.status(200);
        res.send("ok");
    });

router.route("/me/plan")
    .post(async (req: SetPlanRequest, res: RoboResponse) => {
        try {
            await Stripe.setStripePlan(req.user.id, req.body.planName);
            if (req.body.planName !== "free") {
                sendEmail({
                    to: "jack@kernl.us",
                    from: "jack@kernl.us",
                    subject: `RoboSwarm Account Upgrade: ${req.user.email} -> ${req.body.planName}`,
                    text: `${req.user.email} has changed their account to ${req.body.planName}`
                });
            }
            res.status(200);
            res.send("ok");
        } catch (err) {
            res.status(500);
            res.send(err.toString());
        }
    });

router.route("/me/resources")
    .get(async (req: RoboRequest, res: ResourceResponse) => {
        const user: User.User = await User.getById(req.user.id);
        const resources: ResourceAvailability = await getUserResourceAvailability(user);
        res.status(200);
        res.json(resources);
    });

router.route("/me")
    .get(async (req: RoboRequest, res: UserBodyResponse) => {
        const user: User.User = await User.getById(req.user.id);
        res.status(200);
        res.json(user);
    });

export default router;
