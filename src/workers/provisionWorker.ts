// Environment variables
require("dotenv").config();

import { db } from "../lib/db";
import { dequeue, enqueue } from "../lib/events";
import { ProvisionEvent, ProvisionEventType, SwarmProvisionEvent, MachineProvisionEvent } from "../interfaces/provisioning.interface";
import { processSwarmProvisionEvent, processMachineProvisionEvent } from "../lib/setupHelpers";

console.log("Starting worker process...");
(() => {
    let working = false;
    const interval = setInterval(async () => {
        try {
            if (!working) {
                const workItem: ProvisionEvent = await dequeue();
                if (workItem) {
                    console.log("Working on item.");
                    working = true;
                    switch (workItem.eventType) {
                        case ProvisionEventType.SWARM_PROVISION:
                            await processSwarmProvisionEvent(workItem as SwarmProvisionEvent);
                            break;
                        case ProvisionEventType.MACHINE_PROVISION:
                            await processMachineProvisionEvent(workItem as MachineProvisionEvent);
                            break;
                        default:
                            console.log("Fell through, re-enqueuing...");
                            await enqueue(workItem);
                            break;
                    }
                    working = false;
                    console.log("Done working on item.");
                }
            }
        } catch (err) {
            console.log("Error: ", err);
            working = false;
        }
    }, 200);

    const stopProcess = () => {
        console.log("Stopping worker process...");
        clearInterval(interval);
        setTimeout(() => {
            process.exit();
        }, 9000);
    };
    process.on("SIGINT", stopProcess);
    process.on("SIGTERM", stopProcess);
})();