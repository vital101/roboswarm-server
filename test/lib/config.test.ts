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
            user.stripe_plan_description = "kernl-startup-2020";
            expect(getPlan(user)).toEqual(settings["kernl-startup-2020"]);
            user.stripe_plan_description = "kernl-agency-2020";
            expect(getPlan(user)).toEqual(settings["kernl-agency-2020"]);
            user.stripe_plan_description = "kernl-unlimited-2020";
            expect(getPlan(user)).toEqual(settings["kernl-unlimited-2020"]);
            user.stripe_plan_description = "kernl-startup";
            expect(getPlan(user)).toEqual(settings["kernl-startup"]);
            user.stripe_plan_description = "kernl-agency";
            expect(getPlan(user)).toEqual(settings["kernl-agency"]);
            user.stripe_plan_description = "kernl-enterprise";
            expect(getPlan(user)).toEqual(settings["kernl-enterprise"]);
        });

        test("returns the free plan for an invalid plan", () => {
            const user: any = { stripe_plan_description: "invalid" };
            expect(getPlan(user)).toEqual(settings.free);
        });
    });

});