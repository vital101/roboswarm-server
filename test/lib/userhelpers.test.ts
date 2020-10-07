import * as sinon from "sinon";
import * as userHelpers from "../../src/lib/userHelpers";
import { User } from "../../src/models/User";

describe("lib/userHelpers", () => {
    let sandbox: sinon.SinonSandbox;

    beforeAll(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("canSelectPlan", () => {
        test("it returns false if the user is on a RoboSwarm plan and does not have a card", () => {
            const u: any = { stripe_card_id: undefined };
            const canSelectPlan = userHelpers.canSelectPlan(u as User, "2020-roboswarm-startup");
            expect(canSelectPlan).toBe(false);
        });

        test("it returns true if the user is on a RoboSwarm plan and has a card", () => {
            const u: any = { stripe_card_id: "123" };
            const canSelectPlan = userHelpers.canSelectPlan(u as User, "2020-roboswarm-startup");
            expect(canSelectPlan).toBe(true);
        });

        test("it returns true if the user is not on a RoboSwarm plan", () => {
            const u: any = { stripe_card_id: undefined };
            const canSelectPlan = userHelpers.canSelectPlan(u as User, "2020-kernl");
            expect(canSelectPlan).toBe(true);
        });

        test("it returns true if the user is a beta tester", () => {
            const u: any = { stripe_card_id: undefined, is_beta: true };
            const canSelectPlan = userHelpers.canSelectPlan(u as User, "2020-roboswarm-startup");
            expect(canSelectPlan).toBe(true);
        });
    });
});