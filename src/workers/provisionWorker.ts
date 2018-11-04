// Environment variables
require("dotenv").config();

import { dequeue, enqueue } from "../lib/events";
import { ProvisionEvent, WorkerEventType, SwarmProvisionEvent, MachineProvisionEvent, DeprovisionEvent, DataCaptureEvent } from "../interfaces/provisioning.interface";
import {
    processDataCaptureEvent,
    processDeprovisionEvent,
    processSwarmProvisionEvent,
    processMachineProvisionEvent
} from "../lib/setupHelpers";


console.log("Starting worker process with 10 threads...");
(() => {
    let threadPool = 10;
    const interval = setInterval(async () => {
        try {
            if (threadPool > 0) {
                threadPool -= 1;
                const workItem: ProvisionEvent|DeprovisionEvent = await dequeue();
                if (workItem) {
                    switch (workItem.eventType) {
                        case WorkerEventType.SWARM_PROVISION:
                            await processSwarmProvisionEvent(workItem as SwarmProvisionEvent);
                            break;
                        case WorkerEventType.MACHINE_PROVISION:
                            await processMachineProvisionEvent(workItem as MachineProvisionEvent);
                            break;
                        case WorkerEventType.DEPROVISION:
                            await processDeprovisionEvent(workItem as DeprovisionEvent);
                            break;
                        case WorkerEventType.DATA_CAPTURE:
                            await processDataCaptureEvent(workItem as DataCaptureEvent);
                            break;
                        default:
                            console.log("Fell through, re-enqueuing...");
                            await enqueue(workItem);
                            break;
                    }
                    threadPool += 1;
                } else {
                    threadPool += 1;
                }
            }
        } catch (err) {
            threadPool += 1;
        }
    }, 500);

    const stopProcess = () => {
        console.log("Stopping worker process...");
        clearInterval(interval);
        setTimeout(() => {
            process.exit();
        }, 55); // 55 seconds because PM2 will shoot it in the head at 60 seconds.
    };
    process.on("SIGINT", stopProcess);
    process.on("SIGTERM", stopProcess);
})();