import * as redis from "redis";
const EVENT_QUEUE_NAME = "events";
let isReady = false;

// For later user:
// const client = redis.createClient(SETTINGS.REDIS_URI, {
// password: SETTINGS.REDIS_PASSWORD,
function log(type: string, available: boolean) {
    isReady = available;
    return function anon() {
        console.log(`Redis is ${type}.`);
    };
}

const client = redis.createClient({
    retry_strategy: () => {
        return 2000;
    },
});
client.on("connect", log("connecting", false));
client.on("ready", log("ready", true));
client.on("reconnecting", log("reconnecting", false));
client.on("error", log("error", false));
client.on("end", log("end", false));

export function enqueue(item: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(item);
        client.lpush(EVENT_QUEUE_NAME, data, (err, reply) => {
            if (err) {
                reject(err);
            } else {
                resolve(reply);
            }
        });
    });
}

export function dequeue(): Promise<any> {
    return new Promise((resolve, reject) => {
        client.rpop(EVENT_QUEUE_NAME, (err, reply) => {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(reply));
            }
        });
    });
}

export function isEventQueueAvailable(): boolean {
    return isReady;
}
