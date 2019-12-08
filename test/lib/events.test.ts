import * as sinon from "sinon";
import * as redis from "redis";
import * as events from "../../src/lib/events";

type RedisCbType = (err: any, reply: any) => any;

describe("lib/authorization", () => {
    let sandbox: sinon.SinonSandbox;

    beforeAll(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("dequeue", () => {
        test.todo("it 'rpop's the event off of the Redis queue and resolves");
        test.todo("it rejects if there is an error");
    });

    describe("enqueue", () => {
        test("it 'lpush's the event onto the Redis queue and resolves", async() => {
            const lpushStub: sinon.SinonStub = sinon.stub(redis, "createClient").returns({
                lpush: (queueName: string, data: any, cb: RedisCbType) => {
                    cb(undefined, 1);
                }
            } as any);
            const result = await events.enqueue({ test: 1 });
            expect(result).toBe(1);
            // WIP -> Lpush needs to be a stub that calls back....
        });
        test.todo("it rejects if there is an error");
    });
});