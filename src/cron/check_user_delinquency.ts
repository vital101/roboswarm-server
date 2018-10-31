// Environment variables
require("dotenv").config();

import * as Stripe from "stripe";
import * as stripeHelpers from "../lib/stripe";
import * as User from "../models/User";

function asyncSleep(durationInSeconds: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, durationInSeconds * 1000);
    });
}

(async () => {
    console.log("Checking user delinquency...");
    const users: User.User[] = await User.getAll();
    for (const user of users) {
        console.log(`Updating status for: ${user.email}`);
        try {
            const stripeCustomer: Stripe.customers.ICustomer = await stripeHelpers.getCustomer(user.id);
            await User.updateById(user.id, { is_delinquent: stripeCustomer.delinquent });
        } catch (err) {
            // No-Op.
        }
        asyncSleep(1);
    }
    console.log("Done.");
    process.exit();
})();