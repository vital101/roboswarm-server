import * as sinon from "sinon";
import * as stripeHelpers from "../../src/lib/stripe";
import * as authorization from "../../src/lib/authorization";
import * as moment from "moment";
import * as Swarm from "../../src/models/Swarm";
import { User } from "../../src/models/User";

describe("lib/authorization", () => {
    let sandbox: sinon.SinonSandbox;
    let user: User;
    let getUserSubscriptionStub: sinon.SinonStub;
    const end: number = 1575919680;
    const start: number = 1575719680;

    beforeAll(() => {
        sandbox = sinon.createSandbox();
    });

    beforeEach(() => {
        user = {
            email: "test@example.com",
            first_name: "test",
            last_name: "user",
            is_delinquent: false,
            stripe_plan_description: "free",
            group: { id: 1, name: "Test Group" }
        };
        getUserSubscriptionStub = sandbox.stub(stripeHelpers, "getUserSubscription").resolves({
            current_period_end: end,
            current_period_start: start
        } as any);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("getAuthorizationDateRange", () => {
        test("returns an authorization date range", async () => {
            const dateRange: authorization.DateRange = await authorization.getAuthorizationDateRange(user);
            expect(getUserSubscriptionStub.callCount).toBe(1);
            const startDate: Date = moment.unix(start).toDate();
            const endDate: Date = moment.unix(end).toDate();
            expect(startDate.getSeconds()).toBe(dateRange.start.getSeconds());
            expect(endDate.getSeconds()).toBe(dateRange.end.getSeconds());

        });
    });

    describe("willExceedMaxMachineHours", () => {
        let machinesInPeriodStub: sinon.SinonStub;
        beforeEach(() => {
            machinesInPeriodStub = sandbox.stub(Swarm, "totalMachineSecondsInPeriod").resolves(10);
        });

        test("returns true if the test duration exceeds the max available machine hours", async () => {
            const willExceedMaxMachineHours: boolean = await authorization.willExceedMaxMachineHours(user, 500);
            expect(willExceedMaxMachineHours).toBe(true);
            expect(getUserSubscriptionStub.callCount).toBe(1);
            expect(machinesInPeriodStub.callCount).toBe(1);
        });

        test("returns false if the test duration does not exceed the max available machine hours", async () => {
            const willExceedMaxMachineHours: boolean = await authorization.willExceedMaxMachineHours(user, 5);
            expect(willExceedMaxMachineHours).toBe(false);
            expect(getUserSubscriptionStub.callCount).toBe(1);
            expect(machinesInPeriodStub.callCount).toBe(1);
        });
    });

    describe("willExceedMaxLoadTests", () => {
        let getSwarmsInDateRangeStub: sinon.SinonStub;

        test("returns true if the test will exceed the maximum amount of load tests for this user", async () => {
            getSwarmsInDateRangeStub = sandbox.stub(Swarm, "getSwarmsInDateRange").resolves(5);
            const willExceedMaxLoadTests: boolean = await authorization.willExceedMaxLoadTests(user);
            expect(willExceedMaxLoadTests).toBe(true);
            expect(getUserSubscriptionStub.callCount).toBe(1);
            expect(getSwarmsInDateRangeStub.callCount).toBe(1);
        });

        test("returns false if the test will not exceed the maximum amount of load tests for this user", async () => {
            getSwarmsInDateRangeStub = sandbox.stub(Swarm, "getSwarmsInDateRange").resolves(1);
            const willExceedMaxLoadTests: boolean = await authorization.willExceedMaxLoadTests(user);
            expect(willExceedMaxLoadTests).toBe(false);
            expect(getUserSubscriptionStub.callCount).toBe(1);
            expect(getSwarmsInDateRangeStub.callCount).toBe(1);
        });
    });

    describe("willExceedMaxLoadTestDuration", () => {
        test.todo("returns true if the test exceeds the max duration");
        test.todo("returns true if the reliability test exceeds the max duration");
        test.todo("returns false if the test exceeds the max duration");
        test.todo("returns false if the reliability test exceeds the max duration");
    });
});