// Environment variables
require("dotenv").config();

import * as moment from "moment";
import * as User from "../models/User";
import * as Swarm from "../models/Swarm";
import { getPlan, Plan } from "../lib/config";
import { unlimitedMaxDurationUsers } from "../lib/authorization";

(async () => {
    console.log("Checking for orphaned swarms...");
    const swarms: Swarm.Swarm[] = await Swarm.getActiveSwarms();
    console.log(`${swarms.length} active swarms.`);
    for (const swarm of swarms) {
        const swarmUser: User.User = await User.getById(swarm.user_id);
        const plan: Plan = getPlan(swarmUser);
        const now: moment.Moment = moment();
        let maxSwarmEnd: moment.Moment;

        // If the number of users is under 25 odds are that this is a
        // reliability swarm so we need to check for that instead of
        // normal max load test duration.
        if (swarm.simulated_users <= 25) {
            maxSwarmEnd = moment(swarm.created_at).add(plan.maxReliabilityTestMinutes, "minutes");
        } else {
            maxSwarmEnd = moment(swarm.created_at).add(plan.maxLoadTestDurationMinutes, "minutes");
        }

        // Exception for people with unlimited max duration.
        if (unlimitedMaxDurationUsers.includes(swarmUser.email)) {
            maxSwarmEnd = moment(swarm.created_at).add(3, "days");
        }

        if (now.isAfter(maxSwarmEnd)) {
            console.log("Destroying swarm ", swarm.name);
            await Swarm.destroyById(swarm.id, swarm.group_id);
        }
    }
    console.log("Done.");
    process.exit();
})();