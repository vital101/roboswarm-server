import * as sinon from "sinon";
import * as stripeHelpers from "../../src/lib/stripe";

describe("lib/authorization", () => {
    let sandbox: sinon.SinonSandbox;
    beforeAll(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("getAuthorizationDateRange", () => {
        test("returns an authorization date range", async () => {
            const getUserSubscriptionStub = sandbox.stub(stripeHelpers, "getUserSubscription").resolves({
                current_period_end: 123123,
                current_period_start: 123123,
                object: "subscription",
                application_fee_percent: undefined,
                billing: "charge_automatically",
                collection_method: "charge_automatically",
                billing_cycle_anchor: 0,
                billing_thresholds: undefined,
                cancel_at: undefined,
                cancel_at_period_end: true,
                canceled_at: undefined,
                created: 0,
                customer: "test",
                days_until_due: undefined,
                default_payment_method: "test",
                default_source: "test",
                default_tax_rates: [],
                discount: undefined,
                ended_at: undefined,
                items,
                latest_invoice: "test",
                livemode: true,
                metadata: {},
                start: 0,
                start_date: 0,
                status: "active",
                tax_percent: undefined,
                trial_end: undefined,
                trial_start: undefined,
            });
        });
    });
});