import { Router } from "express";
import { RoboRequest, RoboResponse } from "../../../interfaces/shared.interface";
import * as User from "../../../models/User";
import * as Stripe from "../../../lib/stripe";
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

interface UpdateUserRequest extends RoboRequest {
    body: {
        email: string;
        first_name: string;
        last_name: string;
    };
}

const router = Router();

router.route("/me/card")
    .delete(async (req: RoboRequest, res: RoboResponse) => {
        await Stripe.deleteCardFromCustomer(req.user.id);
        await Stripe.setStripePlan(req.user.id, "2020-roboswarm-free");
        await User.updateById(req.user.id, { stripe_card_id: "" });
        res.status(200);
        res.send("ok");
    })
    .post(async (req: UpdateCardRequest, res: RoboResponse) => {
        await Stripe.addCardToCustomer(req.user.id, req.body.token, req.body.cardId);
        res.status(200);
        res.send("ok");
    });

router.route("/me/plan")
    .post(async (req: SetPlanRequest, res: RoboResponse) => {
        try {
            const user: User.User = await User.getById(req.user.id);
            const requiresCard = ["2020-roboswarm-startup", "2020-roboswarm-enterprise"];
            if (requiresCard.includes(req.body.planName) && !user.stripe_card_id) {
                res.status(400);
                res.send("You must have a credit card on file to select this plan.");
            } else {
                await Stripe.setStripePlan(req.user.id, req.body.planName);
                res.status(200);
                res.send("ok");
            }
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
    })
    .put(async (req: UpdateUserRequest, res: UserBodyResponse) => {
        const user: User.User = await User.updateById(req.user.id, req.body);
        res.status(200);
        res.json(user);
    });

export default router;
