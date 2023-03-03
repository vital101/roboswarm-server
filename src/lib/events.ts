import * as redis from "redis";
import { RedisClientOptions } from "redis";
const EVENT_QUEUE_NAME = "events";
let redisStatus: string = undefined;

function log(type: string) {
    return function anon() {
        redisStatus = type;
        console.log(`Redis is ${type}.`);
    };
}

// Make Redis connection
const url = ["development", "test"].includes(process.env.NODE_ENV) ?
    "redis://localhost" :
    process.env.ROBOSWARM__REDIS_URL;
const options: RedisClientOptions = {
    url,
    socket: {
        reconnectStrategy: () => {
            return 2000;
        }
    }
};
const redisClient = redis.createClient(options);

redisClient.on("connect", log("connecting"));
redisClient.on("ready", log("ready"));
redisClient.on("reconnecting", log("reconnecting"));
redisClient.on("error", log("error"));
redisClient.on("end", log("end"));

export async function connect() {
    if (redisStatus !== "ready") {
        try {
            await redisClient.connect();
        } catch (err) { /* no-op */}
    }
}

export async function enqueue(item: any): Promise<void> {
    if (redisStatus !== "ready") {
        await connect();
    }
    const data = JSON.stringify(item);
    await redisClient.lPush(EVENT_QUEUE_NAME, data);
}

export async function dequeue(): Promise<any> {
    if (redisStatus !== "ready") {
        await connect();
    }
    const reply = await redisClient.rPop(EVENT_QUEUE_NAME);
    if (reply && typeof reply === "string" && reply.trim() !== "") {
        return JSON.parse(reply);
    } else {
        return false;
    }
}

export function isEventQueueAvailable(): boolean {
    console.log(redisStatus);
    return redisStatus === "ready";
}
