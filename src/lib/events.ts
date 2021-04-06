import * as redis from "redis";
const EVENT_QUEUE_NAME = "events";

function log(type: string) {
    return function anon() {
        console.log(`Redis is ${type}.`);
    };
}

// Make Redis connection
let url;
let config;
if (["development", "test"].includes(process.env.NODE_ENV)) {
    url = "redis://localhost";
    config = {
        retry_strategy: () => {
            return 2000;
        },
    };
} else {
    url = process.env.REDIS_TLS_URL;
    config = {
        tls: {},
        retry_strategy: () => {
            return 2000;
        },
    };
}

const client = redis.createClient(url, config);
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
