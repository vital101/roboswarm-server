import { settings, getPlan } from "../../src/lib/config";

describe("lib/config", () => {

    describe("getPlan", () => {
        test("returns the correct plan", () => {
            const user: any = {};
            user.stripe_plan_description = "free";
            expect(getPlan(user)).toEqual(settings.free);
            user.stripe_plan_description = "startup";
            expect(getPlan(user)).toEqual(settings.startup);
            user.stripe_plan_description = "enterprise";
            expect(getPlan(user)).toEqual(settings.enterprise);
        });

        test("returns the free plan for an invalid plan", () => {
            const user: any = { stripe_plan_description: "invalid" };
            expect(getPlan(user)).toEqual(settings.free);
        });
    });

});