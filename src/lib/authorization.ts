import * as moment from "moment";
import { User } from "../models/User";
import * as stripeHelpers from "./stripe";
import * as Stripe from "stripe";

export interface DateRange {
    start: Date;
    end: Date;
}

export async function getAuthorizationDateRange(user: User): Promise<DateRange> {
    const subscription: Stripe.subscriptions.ISubscription = await stripeHelpers.getUserSubscription(user);
    return {
        start: moment.unix(subscription.current_period_start).toDate(),
        end: moment.unix(subscription.current_period_end).toDate()
    };
}

export async function verifyLoadTestDuration(user: User, testDurationInMinutes: number): Promise<boolean> {
    const queryDateRange: DateRange = await getAuthorizationDateRange(user);
    // Get all swarms created within DateRange.
    // Add up their durations (sum maybe? in SQL)
    // if duration + testDurationINMinutes exceeds, fail.
}