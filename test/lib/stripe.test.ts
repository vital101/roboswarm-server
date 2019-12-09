import * as sinon from "sinon";
import * as Stripe from "stripe";
import * as User from "../../src/models/User";


describe("lib/stripe", () => {
    let sandbox: sinon.SinonSandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("createStripeCustomer", () => {
        test("creates the stripe customer", async () => {

        });
    });

});