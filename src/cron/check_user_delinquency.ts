// Environment variables
require("dotenv").config();

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
            const stripeCustomer = await stripeHelpers.getCustomer(user.id);
            const is_delinquent = "delinquent" in stripeCustomer ? stripeCustomer.delinquent : true;
            if ("delinquent" in stripeCustomer) {
                await User.updateById(user.id, { is_delinquent });
            }
        } catch (err) {
            console.error(err);
        }
        asyncSleep(1);
    }
    console.log("Done.");
    process.exit();
})();