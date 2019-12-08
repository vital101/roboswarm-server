import * as sinon from "sinon";
import * as stripeHelpers from "../../src/lib/stripe";
import * as authorization from "../../src/lib/authorization";
import * as moment from "moment";
import * as Swarm from "../../src/models/Swarm";
import * as SiteOwnership from "../../src/models/SiteOwnership";
import { User } from "../../src/models/User";
import { RoboError } from "../../src/interfaces/shared.interface";

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
            id: 1,
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
        test("returns true if the test exceeds the max duration", () => {
            const result: boolean = authorization.willExceedMaxLoadTestDuration(user, 500, false);
            expect(result).toBe(true);
        });
        test("returns true if the reliability test exceeds the max duration", () => {
            const result: boolean = authorization.willExceedMaxLoadTestDuration(user, 50000, true);
            expect(result).toBe(true);
        });
        test("returns false if the test does not exceed the max duration", () => {
            const result: boolean = authorization.willExceedMaxLoadTestDuration(user, 10, false);
            expect(result).toBe(false);
        });
        test("returns false if the reliability test does not exceed the max duration", () => {
            const result: boolean = authorization.willExceedMaxLoadTestDuration(user, 140, true);
            expect(result).toBe(false);
        });
    });

    describe("willExceedMaxUsers", () => {
        test("returns true if the test exceeds the max users", () => {
            const result: boolean = authorization.willExceedMaxUsers(user, 120, false);
            expect(result).toBe(true);
        });
        test("returns true if the reliability test exceeds the max users", () => {
            const result: boolean = authorization.willExceedMaxUsers(user, 30, true);
            expect(result).toBe(true);
        });
        test("returns false if the test does not exceed the max users", () => {
            const result: boolean = authorization.willExceedMaxUsers(user, 100, false);
            expect(result).toBe(false);
        });
        test("returns false if the reliability test does not exceed the max users", () => {
            const result: boolean = authorization.willExceedMaxUsers(user, 25, true);
            expect(result).toBe(false);
        });
    });

    describe("isValidSite", () => {
        test("returns true for Kernl initiated tests", async () => {
            const swarm: any = {
                kernl_test: true,
                host_url: "https://some.test.url"
            };
            expect(await authorization.isValidSite(user, swarm)).toBe(true);

        });

        test("returns false if the swarm host_url is not set", async () => {
            const swarm: any = {
                kernl_test: false,
                host_url: "https://some.test.url"
            };
            expect(await authorization.isValidSite(user, swarm)).toBe(false);
        });

        test("returns false if the current user does not own the site", async () => {
            const findByIdStub: sinon.SinonStub = sandbox.stub(SiteOwnership, "findById").resolves({
                user_id: 123,
                verified: false
            } as any);
            const swarm: any = {
                kernl_test: false,
                host_url: undefined,
                site_id: 1
            };
            expect(await authorization.isValidSite(user, swarm)).toBe(false);
            expect(findByIdStub.callCount).toBe(1);
            expect(findByIdStub.getCall(0).args[0]).toBe(swarm.site_id);
        });

        test("returns false if the site is not verified", async () => {
            const findByIdStub: sinon.SinonStub = sandbox.stub(SiteOwnership, "findById").resolves({
                user_id: 1,
                verified: false
            } as any);
            const swarm: any = {
                kernl_test: false,
                host_url: undefined,
                site_id: 1
            };
            expect(await authorization.isValidSite(user, swarm)).toBe(false);
            expect(findByIdStub.callCount).toBe(1);
            expect(findByIdStub.getCall(0).args[0]).toBe(swarm.site_id);
        });

        test("returns true if the site is verified", async () => {
            const findByIdStub: sinon.SinonStub = sandbox.stub(SiteOwnership, "findById").resolves({
                user_id: 1,
                verified: true
            } as any);
            const swarm: any = {
                kernl_test: false,
                host_url: undefined,
                site_id: 1
            };
            expect(await authorization.isValidSite(user, swarm)).toBe(true);
            expect(findByIdStub.callCount).toBe(1);
            expect(findByIdStub.getCall(0).args[0]).toBe(swarm.site_id);
        });
    });

    describe("canCreateSwarm", () => {

        test("throws if there is an exception", async () => {
            const swarm: any = {
                machines: [1, 2, 3, 4],
                kernl_test: true,
                host_url: "https://some.test.url"
            };
            const dropletPoolAvailabilityStub: sinon.SinonStub = sandbox.stub(Swarm, "willExceedDropletPoolAvailability").throws();
            const result: any = await authorization.canCreateSwarm(user, swarm, false);
            expect(result).toEqual({
                err: "There was error verifying your account status. Please reach out to jack@kernl.us",
                status: 500
            });
            expect(dropletPoolAvailabilityStub.callCount).toBe(1);
        });

        test("rejects if not a valid site", async () => {
            const swarm: any = {
                machines: [1, 2, 3, 4],
                kernl_test: false,
                host_url: "https://some.test.url"
            };
            const result: any = await authorization.canCreateSwarm(user, swarm, false);
            expect(result).toEqual({
                err: "The site is not valid. Be sure to verify your ownership.",
                status: 400
            });

        });
        test("rejects if test will exceed droplet pool availability", async () => {
            const swarm: any = {
                machines: [1, 2, 3, 4],
                kernl_test: true,
                host_url: "https://some.test.url"
            };
            const dropletPoolAvailabilityStub: sinon.SinonStub = sandbox.stub(Swarm, "willExceedDropletPoolAvailability").resolves(true);
            const result: any = await authorization.canCreateSwarm(user, swarm, false);
            expect(result).toEqual({
                err: "This request will exceed the resources that RoboSwarm has available. Our team has been notified.",
                status: 500
            });
            expect(dropletPoolAvailabilityStub.callCount).toBe(1);
        });
        test("rejects if test will exceed max available machine hours", async () => {
            const swarm: any = {
                machines: [1, 2, 3, 4],
                duration: 300,
                kernl_test: true,
                host_url: "https://some.test.url"
            };
            sandbox.stub(Swarm, "willExceedDropletPoolAvailability").resolves(false);
            sandbox.stub(Swarm, "totalMachineSecondsInPeriod").resolves(10);
            const result: any = await authorization.canCreateSwarm(user, swarm, false);
            expect(result).toEqual({
                err: "This request will exceed the number of hours you have left on your plan before your next billing cycle. Try a smaller swarm size.",
                status: 403
            });
        });
        test("rejects if test will exceed max available load tests", async () => {
            const swarm: any = {
                machines: [1, 2, 3, 4],
                duration: 15,
                kernl_test: true,
                host_url: "https://some.test.url"
            };
            sandbox.stub(Swarm, "willExceedDropletPoolAvailability").resolves(false);
            sandbox.stub(Swarm, "totalMachineSecondsInPeriod").resolves(10);
            sandbox.stub(Swarm, "getSwarmsInDateRange").resolves(5);
            const result: any = await authorization.canCreateSwarm(user, swarm, false);
            expect(result).toEqual({
                err: "This request will exceed the maximum number of load tests that your plan allows.",
                status: 403
            });
        });
        test("rejects if test will exceed max duration", async () => {
            user.stripe_plan_description = "startup";
            const swarm: any = {
                machines: [1],
                duration: 15000,
                kernl_test: true,
                host_url: "https://some.test.url"
            };
            sandbox.stub(Swarm, "willExceedDropletPoolAvailability").resolves(false);
            sandbox.stub(Swarm, "totalMachineSecondsInPeriod").resolves(10);
            sandbox.stub(Swarm, "getSwarmsInDateRange").resolves(0);
            const result: any = await authorization.canCreateSwarm(user, swarm, false);
            expect(result).toEqual({
                err: "This request will exceed the maximum load test duration for your account. Please try again with a shorter duration.",
                status: 403
            });
        });
        test("rejects if test will exceed max users", async () => {
            user.stripe_plan_description = "startup";
            const swarm: any = {
                machines: [1],
                duration: 30,
                kernl_test: true,
                simulated_users: 5001,
                host_url: "https://some.test.url"
            };
            sandbox.stub(Swarm, "willExceedDropletPoolAvailability").resolves(false);
            sandbox.stub(Swarm, "totalMachineSecondsInPeriod").resolves(10);
            sandbox.stub(Swarm, "getSwarmsInDateRange").resolves(0);
            const result: any = await authorization.canCreateSwarm(user, swarm, false);
            expect(result).toEqual({
                err: "This request will exceed the maximum number of users (5000) allowed by your account. To run a larger load test, upgrade to a bigger plan.",
                status: 403
            });
        });
        test("rejects if the user in delinquent", async () => {
            user.stripe_plan_description = "startup";
            user.is_delinquent = true;
            const swarm: any = {
                machines: [1],
                duration: 30,
                kernl_test: true,
                simulated_users: 4000,
                host_url: "https://some.test.url"
            };
            sandbox.stub(Swarm, "willExceedDropletPoolAvailability").resolves(false);
            sandbox.stub(Swarm, "totalMachineSecondsInPeriod").resolves(10);
            sandbox.stub(Swarm, "getSwarmsInDateRange").resolves(0);
            const result: any = await authorization.canCreateSwarm(user, swarm, false);
            expect(result).toEqual({
                err: "This account is past due. You cannot create swarms while your account is past due.",
                status: 402
            });
        });
        test("resolves if the user can create a swarm", async () => {
            user.stripe_plan_description = "startup";
            const swarm: any = {
                machines: [1],
                duration: 30,
                kernl_test: true,
                simulated_users: 4000,
                host_url: "https://some.test.url"
            };
            sandbox.stub(Swarm, "willExceedDropletPoolAvailability").resolves(false);
            sandbox.stub(Swarm, "totalMachineSecondsInPeriod").resolves(10);
            sandbox.stub(Swarm, "getSwarmsInDateRange").resolves(0);
            const result: any = await authorization.canCreateSwarm(user, swarm, false);
            expect(result).toBe(true);
        });
    });

    describe("getUserResourceAvailability", () => {
        test("returns the user's available resources", async () => {
            sandbox.stub(Swarm, "getSwarmsInDateRange").resolves(5);
            sandbox.stub(Swarm, "totalMachineSecondsInPeriod").resolves(10);
            const resources: authorization.ResourceAvailability = await authorization.getUserResourceAvailability(user);
            expect(resources.delinquent).toBe(false);
            expect(resources.loadTests).toBe(5);
            expect(resources.machineSeconds).toBe(10);
            expect(resources.maxDurationMinutes).toBe(15);
            expect(resources.maxLoadTests).toBe(2);
            expect(resources.maxMachineSeconds).toBe(18000);
        });
    });
});