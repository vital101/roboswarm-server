import * as sinon from "sinon";
import * as stripeHelpers from "../../src/lib/stripe";
import * as authorization from "../../src/lib/authorization";
import * as moment from "moment";
import { User } from "../../src/models/User";

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
            const testUser: User = {
                email: "test@example.com",
                first_name: "test",
                last_name: "user",
                is_delinquent: false
            };
            const end: number = 1575919680;
            const start: number = 1575719680;
            const getUserSubscriptionStub = sandbox.stub(stripeHelpers, "getUserSubscription").resolves({
                current_period_end: end,
                current_period_start: start
            } as any);
            const dateRange: authorization.DateRange = await authorization.getAuthorizationDateRange(testUser);
            expect(getUserSubscriptionStub.callCount).toBe(1);
            const startDate: Date = moment.unix(start).toDate();
            const endDate: Date = moment.unix(end).toDate();
            expect(startDate.getSeconds()).toBe(dateRange.start.getSeconds());
            expect(endDate.getSeconds()).toBe(dateRange.end.getSeconds());

        });
    });
});