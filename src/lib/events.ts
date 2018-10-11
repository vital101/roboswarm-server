import * as redis from "redis";
const client = redis.createClient();
const EVENT_QUEUE_NAME = "events";

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
