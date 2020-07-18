import * as express from "express";
import * as User from "../../../models/User";
import * as Stripe from "../../../lib/stripe";
import {
    getUserToken,
    isValidAuthBody,
    isValidUserBody
} from "../../../lib/userHelpers";
import { TokenizedUser } from "../../../interfaces/shared.interface";
import { sendEmail } from "../../../lib/email";

const router = express.Router();

router.route("/")
    .post(async (req: express.Request, res: express.Response) => {
        if (!isValidUserBody(req.body)) {
            res.status(400);
            res.send("Invalid request. email, first_name, last_name, and password fields are required.");
            return;
        }

        if (await User.exists(req.body.email)) {
            res.status(400);
            res.send("A user already exists with that email address.");
            return;
        }

        try {
            const newUser: User.User = await User.createUser(req.body);
            const tokenUser: TokenizedUser = {
                id: newUser.id,
                groupId: newUser.group.id,
                email: newUser.email
            };
            await Stripe.createStripeCustomer(newUser);
            await Stripe.setStripePlan(newUser.id, "2020-roboswarm-free");
            sendEmail({
                to: "jack@kernl.us",
                from: "jack@kernl.us",
                subject: `A new RoboSwarm user has signed up: ${newUser.email}`,
                text: `${newUser.first_name} ${newUser.last_name} (${newUser.email})`
            });
            res.status(201);
            res.json({
                token: getUserToken(tokenUser),
                user: newUser,
            });
        } catch (err) {
            res.status(500);
            res.json({
                message: "There was an error creating your user.",
                err: err.toString()
            });
        }
    });

router.route("/auth")
    .post(async (req: express.Request, res: express.Response) => {
        if (!isValidAuthBody(req.body)) {
            res.status(400);
            res.send("Invalid request. email and password fields are required.");
            return;
        }

        const valid = await User.authenticate(req.body.email, req.body.password);
        if (!valid) {
            res.status(400);
            res.send("Invalid email or password.");
        } else {
            const authenticatedUser = await User.getByEmail(req.body.email);
            res.status(200);
            res.json(getUserToken({
                id: authenticatedUser.id,
                groupId: authenticatedUser.group.id,
                email: authenticatedUser.email
            }));
        }
    });

export default router;
