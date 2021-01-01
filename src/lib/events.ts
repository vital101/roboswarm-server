import * as redis from "redis";
const EVENT_QUEUE_NAME = "events";

function log(type: string) {
    return function anon() {
        console.log(`Redis is ${type}.`);
    };
}

// Make Redis connection
const url = process.env.REDIS_URI || "redis://localhost";
const password = process.env.REDIS_PASSWORD || undefined;
const client = redis.createClient(url, {
    password,
    retry_strategy: () => {
        return 2000;
    },
});
client.on("connect", log("connecting"));
client.on("ready", log("ready"));
client.on("reconnecting", log("reconnecting"));
client.on("error", log("error"));
client.on("end", log("end"));

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
    return client.connected;
}
