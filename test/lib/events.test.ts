import * as sinon from "sinon";
import * as redis from "redis";
import * as events from "../../src/lib/events";

describe("lib/authorization", () => {
    let sandbox: sinon.SinonSandbox;
    let client: redis.RedisClient;

    beforeAll(() => {
        sandbox = sinon.createSandbox();
    });

    beforeEach(done => {
        client = redis.createClient();
        client.flushall(done);
    });

    afterEach(done => {
        sandbox.restore();
        client.quit(done);
    });

    describe("dequeue", () => {
        test("it 'rpop's the event off of the Redis queue and resolves", async () => {
            await events.enqueue({ test: 1 });
            expect(await events.dequeue()).toEqual({ test: 1 });
        });
    });

    describe("enqueue", () => {
        test("it 'lpush's the event onto the Redis queue and resolves", async () => {
            const result = await events.enqueue({ test: 1 });
            expect(result).toBe(1);
        });
    });

    describe("isEventQueueAvailable", () => {
        test("it returns the status of the Redis connection", () => {
            expect(events.isEventQueueAvailable()).toBe(false);
        });
    })
});