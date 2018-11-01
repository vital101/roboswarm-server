// Environment variables
require("dotenv").config();

import * as moment from "moment";
import * as User from "../models/User";
import * as Swarm from "../models/Swarm";
import { getPlan, Plan } from "../lib/config";

(async () => {
    console.log("Checking for orphaned swarms...");
    const swarms: Swarm.Swarm[] = await Swarm.getActiveSwarms();
    console.log(`${swarms.length} active swarms.`);
    for (const swarm of swarms) {
        const swarmUser: User.User = await User.getById(swarm.user_id);
        const plan: Plan = getPlan(swarmUser);
        const now = moment();
        const maxSwarmEnd = moment(swarm.created_at).add(plan.maxLoadTestDurationMinutes, "minutes");
        if (now.isAfter(maxSwarmEnd)) {
            console.log("Destroying swarm ", swarm.name);
            await Swarm.destroyById(swarm.id, swarm.group_id);
        }
    }
    console.log("Done.");
    process.exit();
})();