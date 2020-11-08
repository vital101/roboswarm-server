import { destroyById as destroySwarmById } from "../models/Swarm";
import { SwarmProvisionEvent, SwarmSetupStep } from "../interfaces/provisioning.interface";
import { enqueue } from "./events";

export async function cleanUpSwarmProvisionEvent(event: SwarmProvisionEvent): Promise<void> {
    switch (event.stepToExecute) {
        case SwarmSetupStep.CREATE: {
            // No-op. If the create step failed, the db wasn't available to begin with.
            break;
        }
        case SwarmSetupStep.READY: {
            event.currentTry = 0;
            event.steps = [];
            event.stepToExecute = SwarmSetupStep.STOP_SWARM;
            await enqueue(event);
            break;
        }
        case SwarmSetupStep.DELAY: {
            // No-op. We shouldn't get here.
            break;
        }
        case SwarmSetupStep.START_MASTER: {
            // We should see if the swarm exists in the db. If so, enqueue stop swarm.
            if (event.createdSwarm && event.createdSwarm.id) {
                event.currentTry = 0;
                event.steps = [];
                event.stepToExecute = SwarmSetupStep.STOP_SWARM;
                await enqueue(event);
            }
            break;
        }
        case SwarmSetupStep.STOP_SWARM: {
            // Set the swarm and destroyed. Rely on the cleanup daemon to kill the machines.
            try {
                await destroySwarmById(event.createdSwarm.id, event.createdSwarm.group_id);
            } catch (err) {
                // no-op
            }
            break;
        }
    }
}
