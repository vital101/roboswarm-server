// Environment variables
require("dotenv").config();
import { migrateData } from "../models/LoadTestRouteSpecificData";

let hasRun = false;

console.log("Starting migration worker.");
(async() => {
    if (!hasRun) {
        await migrateData();
        hasRun = true;
    }

    const interval = setInterval(async () => {
        console.log("Busy wait. Migration complete. Delete this worker.");
    }, 5000);

    const stopProcess = () => {
        console.log("Stopping worker process in 5 seconds...");
        clearInterval(interval);
        setTimeout(() => {
            process.exit();
        }, 20000);
    };
    process.on("SIGINT", stopProcess);
    process.on("SIGTERM", stopProcess);
})();