import * as Stripe from "stripe";
import * as User from "../models/User";
const stripe = new Stripe(process.env.STRIPE_API_SECRET);

const stripePlans: any = {
    development: {
        free: "plan_DsOgBFnxs3q0Fu",
        startup: "plan_DsOgpbf6qZDIYc",
        enterprise: "plan_DsOhDhHNxMpAYi"
    },
    production: {
        free: "plan_DsOd6cJgabydY8",
        startup: "plan_DsOewMGOIvBRfW",
        enterprise: "plan_DsOfpolJtdkCLD"
    }
};

function getPlanId(planName: string): string {
    if (process.env.NODE_ENV === "development") {
        return stripePlans.development[planName];
    } else {
        return stripePlans.production[planName];
    }
}

export async function createStripeCustomer(user: User.User): Promise<void> {
    const customerOptions: Stripe.customers.ICustomerCreationOptions = {
        email: user.email,
        description: `${user.first_name} ${user.last_name}`
    };
    const newCustomer: Stripe.customers.ICustomer = await stripe.customers.create(customerOptions);
    await User.updateById(user.id, { stripe_id: newCustomer.id });
}

export async function setStripePlan(userId: number, planName: string): Promise<void> {
    const user: User.User = await User.getById(userId);
    const subscriptionListOptions: Stripe.subscriptions.ISubscriptionListOptions = {
        customer: user.stripe_id
    };
    const subscriptions: Stripe.IList<Stripe.subscriptions.ISubscription> = await stripe.subscriptions.list(subscriptionListOptions);

    // User has an existing plan. Update it.
    if (subscriptions.total_count > 0) {
        const subscription: Stripe.subscriptions.ISubscription = await stripe.subscriptions.retrieve(subscriptions.data[0].id);
        const updateOptions: Stripe.subscriptions.ISubscriptionUpdateOptions = {
            cancel_at_period_end: false,
            items: [{
            id: subscription.items.data[0].id,
            plan: getPlanId(planName)
            }]
        };
        await stripe.subscriptions.update(subscription.id, updateOptions);

    // User does not yet have a plan, create subscription.
    } else {
        const createOptions: Stripe.subscriptions.ISubscriptionCreationOptions = {
            customer: user.stripe_id,
            items: [{ plan: getPlanId(planName) }]
        };
        await stripe.subscriptions.create(createOptions);
    }

    // Store the planId and planDescription with the user.
    await User.updateById(user.id, {
        stripe_plan_id: getPlanId(planName),
        stripe_plan_description: planName
    });
}

export async function addCardToCustomer(userId: number, token: string, cardId: string): Promise<void> {
    const user: User.User = await User.getById(userId);
    const options: Stripe.customers.ICustomerUpdateOptions = { source: token };
    await stripe.customers.update(user.stripe_id, options);
    await User.updateById(userId, { stripe_card_id: cardId });
}