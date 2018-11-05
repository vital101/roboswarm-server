import * as moment from "moment";
import { User } from "../models/User";
import * as stripeHelpers from "./stripe";
import * as Stripe from "stripe";
import * as Swarm from "../models/Swarm";
import { getPlan } from "./config";
import { RoboError } from "../interfaces/shared.interface";

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

export async function willExceedMaxMachineHours(user: User, testDurationInMinutes: number): Promise<boolean> {
    const queryDateRange: DateRange = await getAuthorizationDateRange(user);
    const total: number = await Swarm.totalMachineSecondsInPeriod(queryDateRange.start, queryDateRange.end, user.group.id);
    const maxAllowedMachineSeconds: number = getPlan(user).maxMachineHours * 60 * 60;
    const testDurationInSeconds = testDurationInMinutes * 60;
    console.log({
        queryDateRange,
        total,
        maxAllowedMachineSeconds,
        testDurationInSeconds
    });
    return ((total + testDurationInSeconds) > maxAllowedMachineSeconds);
}

export async function willExceedMaxLoadTests(user: User): Promise<boolean> {
    const queryDateRange: DateRange = await getAuthorizationDateRange(user);
    const swarmsInRange: number = await Swarm.getSwarmsInDateRange(queryDateRange.start, queryDateRange.end, user.group.id);
    const maxLoadTests: number = getPlan(user).maxLoadTests;
    console.log({
        queryDateRange,
        swarmsInRange,
        maxLoadTests
    });
    return swarmsInRange < maxLoadTests ? false : true;
}

export async function canCreateSwarm(user: User, swarm: Swarm.NewSwarm): Promise<RoboError|boolean> {
    if (await Swarm.willExceedDropletPoolAvailability(swarm.machines.length)) {
        return {
            err: "This request will exceed the resources that RoboSwarm has available. Our team has been notified.",
            status: 500
        };
    }

    const swarmMachineMinutes: number = swarm.duration * swarm.machines.length;
    if (await willExceedMaxMachineHours(user, swarmMachineMinutes)) {
        return {
            err: "This request will exceed the number of hours you have left on your plan before your next billing cycle. Try a smaller swarm size.",
            status: 403
        };
    }

    if (await willExceedMaxLoadTests(user)) {
        return {
            err: "This request will exceed the maximum number of load tests that your plan allows",
            status: 403
        };
    }

    //
    // Todo: willExceedMaxLoadTestDuration(user)
    //

    if (user.is_delinquent) {
        return {
            err: "This account is past due. You cannot create swarms while your account is past due.",
            status: 402
        };
    }

    return true;
}