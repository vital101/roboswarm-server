import { Router } from "express";
import { RoboRequest, RoboResponse } from "../../../interfaces/shared.interface";
import * as User from "../../../models/User";
import { canSelectPlan } from "../../../lib/userHelpers";
import * as Stripe from "../../../lib/stripe";
import { getUserResourceAvailability, ResourceAvailability } from "../../../lib/authorization";
import { Stripe as StripeLib } from "stripe";

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

interface GetInvoicesResponse extends RoboResponse {
    json: (invoices: StripeLib.ApiList<StripeLib.Invoice|undefined>) => any;
}

interface PayInvoiceRequest extends RoboRequest {
    params: {
        id: string;
    };
}

interface PayInvoiceResponse extends RoboResponse {
    json: (invoice: StripeLib.Invoice) => any;
}

const router = Router();

router.route("/me/invoices/:id/pay")
    .post(async (req: PayInvoiceRequest, res: PayInvoiceResponse) => {
        try {
            const invoice: StripeLib.Invoice = await Stripe.payInvoice(req.params.id);
            await User.updateById(req.auth.id, { is_delinquent: false });
            res.status(200);
            res.json(invoice);
        } catch (err) {
            res.status(200);
            res.json(undefined);
        }
    });

router.route("/me/invoices")
    .get(async (req: RoboRequest, res: GetInvoicesResponse) => {
        const invoices: StripeLib.ApiList<StripeLib.Invoice> = await Stripe.getInvoices(req.auth.id);
        res.status(200);
        res.json(invoices);
    });

router.route("/me/card")
    .delete(async (req: RoboRequest, res: RoboResponse) => {
        await Stripe.deleteCardFromCustomer(req.auth.id);
        await Stripe.setStripePlan(req.auth.id, "2020-roboswarm-free");
        await User.updateById(req.auth.id, { stripe_card_id: "" });
        res.status(200);
        res.send("ok");
    })
    .post(async (req: UpdateCardRequest, res: RoboResponse) => {
        await Stripe.addCardToCustomer(req.auth.id, req.body.token, req.body.cardId);
        res.status(200);
        res.send("ok");
    });

router.route("/me/plan")
    .post(async (req: SetPlanRequest, res: RoboResponse) => {
        try {
            const user: User.User = await User.getById(req.auth.id);
            if (!canSelectPlan(user, req.body.planName)) {
                res.status(400);
                res.send("You must have a credit card on file to select this plan.");
            } else {
                await Stripe.setStripePlan(req.auth.id, req.body.planName);
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
        const user: User.User = await User.getById(req.auth.id);
        const resources: ResourceAvailability = await getUserResourceAvailability(user);
        res.status(200);
        res.json(resources);
    });

router.route("/me")
    .get(async (req: RoboRequest, res: UserBodyResponse) => {
        const user: User.User = await User.getById(req.auth.id);
        res.status(200);
        res.json(user);
    })
    .put(async (req: UpdateUserRequest, res: UserBodyResponse) => {
        const user: User.User = await User.updateById(req.auth.id, req.body);
        res.status(200);
        res.json(user);
    });

export default router;
