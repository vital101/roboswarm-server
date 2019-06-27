import { db } from "../lib/db";
import { Status } from "../interfaces/shared.interface";
import { DropletListResponse } from "../interfaces/digitalOcean.interface";
import * as Machine from "./Machine";
import { getSwarmMachineIds, getSwarmMachines, getSwarmMaster, getSwarmIdByMachineId } from "./SwarmMachine";
import * as SSHKey from "./SSHKey";
import * as request from "request-promise";
import { RequestPromiseOptions } from "request-promise";
import * as events from "../lib/events";
import * as LoadTest from "./LoadTest";
import * as moment from "moment";
import { sendEmail } from "../lib/email";
import { WorkerEventType, SwarmProvisionEvent, SwarmSetupStep, DeprovisionEvent, DeprovisionEventType } from "../interfaces/provisioning.interface";
import * as User from "./User";
import * as SiteOwnership from "./SiteOwnership";
const node_ssh = require("node-ssh");

export interface Swarm {
    id: number;
    name: string;
    status: Status;
    group_id: number;
    user_id: number;
    user?: User.User;
    simulated_users: number;
    ssh_key_id: number;
    file_path: string;
    host_url: string;
    spawn_rate: number;
    created_at: Date;
    ready_at: Date;
    destroyed_at: Date;
    region: string;
    duration: number;
    setup_complete: boolean;
    file_transfer_complete: boolean;
    swarm_ui_type: string;
    master_ip?: string;
    size?: number;
    currentUsers?: number;
    soft_delete?: boolean;
    machines?: Machine.Machine[];
    load_test_started?: boolean;
}

export interface NewSwarm {
    name: string;
    duration: number;
    simulated_users: number;
    file_path: string;
    host_url?: string;
    site_id?: number;
    spawn_rate: number;
    machines: Array<Machine.NewMachine>;
    region: string;
    swarm_ui_type: string;
    reliability_test?: boolean;
    kernl_test?: boolean;
}

function getStatus(created_at: Date, ready_at: Date, destroyed_at: Date): Status {
    if (destroyed_at) {
        return Status.destroyed;
    } else if (ready_at) {
        return Status.ready;
    } else {
        return Status.new;
    }
}

export async function getByMachineId(machineId: number): Promise<Swarm> {
    const swarmId: number = await getSwarmIdByMachineId(machineId);
    return await getById(swarmId);
}

export async function create(swarm: NewSwarm, userId: number, groupId: number): Promise<Swarm> {
    // Create the SSH keys that this swarm will use.
    const key = await SSHKey.create();

    // Set the correct host_url
    let host_url;
    if (swarm.host_url && swarm.kernl_test) {
        host_url = swarm.host_url;
    } else {
        const siteOwnership: SiteOwnership.SiteOwnership = await SiteOwnership.findById(swarm.site_id);
        host_url = siteOwnership.base_url;
    }

    // Create the container swarm.
    const newSwarmResult: Array<Swarm> = await db("swarm")
        .insert({
            name: swarm.name,
            group_id: groupId,
            user_id: userId,
            simulated_users: swarm.simulated_users,
            file_path: swarm.file_path,
            host_url,
            spawn_rate: swarm.spawn_rate,
            ssh_key_id: key.id,
            region: swarm.region,
            duration: swarm.duration,
            swarm_ui_type: swarm.swarm_ui_type,
            size: swarm.machines.length - 1
        })
        .returning("*");

    const newSwarm = newSwarmResult[0];
    newSwarm.status = getStatus(newSwarm.created_at, newSwarm.ready_at, newSwarm.destroyed_at);

    const startProvisionEvent: SwarmProvisionEvent = {
        eventType: WorkerEventType.SWARM_PROVISION,
        createdSwarm: newSwarm,
        swarm,
        sshKey: key,
        maxRetries: 3,
        currentTry: 0,
        lastActionTime: new Date(),
        errors: [],
        stepToExecute: SwarmSetupStep.CREATE,
        steps: [
            SwarmSetupStep.READY,
            SwarmSetupStep.START_MASTER,
            SwarmSetupStep.STOP_SWARM
        ]
    };

    await events.enqueue(startProvisionEvent);

    return newSwarm;
}

export function provision(event: SwarmProvisionEvent): Promise<Machine.Machine[]> {
    const promises = event.swarm.machines.map(machine => {
        return Machine.create(machine, event.createdSwarm, event.sshKey);
    });
    return Promise.all(promises);
}

export async function destroyById(id: number, group_id: number): Promise<Swarm> {
    const destroyedSwarm: Array<Swarm> = await db("swarm")
        .update({ destroyed_at: db.fn.now() })
        .where({
            id,
            group_id
        })
        .returning("*");


    try {
        // Fetch the final load test metrics.
        await fetchLoadTestMetrics(destroyedSwarm[0], true);
    } catch (err) { }

    // Fetch all of the machines and enqueue for deletion.
    const machines = await getSwarmMachines(id);
    for (let i = 0; i < machines.length; i++) {
        if (!machines[i].destroyed_at) {
            const machineDestroyEvent: DeprovisionEvent = {
                id: machines[i].id,
                eventType: WorkerEventType.DEPROVISION,
                deprovisionType: DeprovisionEventType.MACHINE,
                maxRetries: 10,
                currentTry: 0,
                lastActionTime: new Date(),
                errors: []
            };
            await events.enqueue(machineDestroyEvent);
        }
    }

    // Destroy SSH Key
    const sshKeyDestroyEvent: DeprovisionEvent = {
        id: destroyedSwarm[0].ssh_key_id,
        eventType: WorkerEventType.DEPROVISION,
        deprovisionType: DeprovisionEventType.SSH_KEY,
        maxRetries: 10,
        currentTry: 0,
        lastActionTime: new Date(),
        errors: []
    };
    await events.enqueue(sshKeyDestroyEvent);

    return destroyedSwarm[0];
}

export async function getById(id: number): Promise<Swarm> {
    const data: Swarm = await db("swarm")
                                .where("id", id)
                                .first();
    data.status = getStatus(
        data.created_at,
        data.ready_at,
        data.destroyed_at
    );

    // Fetch machines and return the file transfer status and setup_complete.
    const machines = await getSwarmMachines(id);
    data.machines = machines;
    let file_transfer_complete = true;
    let setup_complete = true;
    machines.forEach(machine => {
        if (machine.is_master) { data.master_ip = machine.ip_address; }
        if (!machine.file_transfer_complete) { file_transfer_complete = false; }
        if (!machine.setup_complete) { setup_complete = false; }
    });
    data.file_transfer_complete = file_transfer_complete;
    data.setup_complete = setup_complete;
    data.currentUsers = 0;

    // Calculate the current number of users
    const metrics: LoadTest.Request[] = await LoadTest.getLastRequestMetricForSwarm(id);
    const lastMetric: LoadTest.Request = metrics && metrics.length > 0 ? metrics[0] : undefined;
    if (lastMetric) {
        const swarmReady: moment.Moment = moment(data.ready_at);
        const duration: moment.Duration = moment.duration(swarmReady.diff(lastMetric.created_at));
        const seconds: number = Math.abs(duration.asSeconds());
        const currentUsers = Math.floor(seconds * data.spawn_rate);
        data.currentUsers = currentUsers <= data.simulated_users ? currentUsers : data.simulated_users;
    }

    // Hydrate the user who owns this.
    data.user = await User.getById(data.user_id);
    data.user.password = undefined;
    data.user.stripe_card_id = undefined;
    data.user.stripe_id = undefined;
    data.user.stripe_plan_description = undefined;
    data.user.stripe_plan_id = undefined;
    delete data.user.password;
    delete data.user.stripe_card_id;
    delete data.user.stripe_id;
    delete data.user.stripe_plan_description;
    delete data.user.stripe_plan_id;

    return data;
}

export async function getByGroupId(groupId: number): Promise<Array<Swarm>> {
    const swarmQuery = db("swarm")
        .where({
            group_id: groupId,
            soft_delete: false
        })
        .orderBy("created_at", "DESC");
    const swarms: Array<Swarm> = await swarmQuery;
    const swarmSizes: any = {};
    const swarmStatus: any = {};
    for (let swarm of swarms) {
        // Get swarm size.
        swarm = swarm as Swarm;
        const swarmSize = await getSwarmSizeById(swarm.id);
        swarmSizes[swarm.id] = swarmSize;

        // Get swarm status.
        swarmStatus[swarm.id] = getStatus(swarm.created_at, swarm.ready_at, swarm.destroyed_at);

        // Fetch machines and return the file transfer status and setup_complete.
        const machines = await getSwarmMachines(swarm.id);
        swarm.machines = machines;
        let file_transfer_complete = true;
        let setup_complete = true;
        machines.forEach(machine => {
            if (!machine.file_transfer_complete) { file_transfer_complete = false; }
            if (!machine.setup_complete) { setup_complete = false; }
        });
        swarm.file_transfer_complete = file_transfer_complete;
        swarm.setup_complete = setup_complete;
    }
    const temp = swarms.map(swarm => {
        const size = swarmSizes[swarm.id];
        const status = swarmStatus[swarm.id];
        return {
            ...swarm,
            size,
            status
        };
    });
    return temp;
}

export async function getSwarmSizeById(swarmId: number): Promise<number> {
    const row = await db("swarm_machine")
                        .where("swarm_id", swarmId)
                        .count();

    return row[0].count;
}

export async function swarmReady(swarmId: number): Promise<boolean> {
    let swarmReady = true;
    const machineIds = await getSwarmMachineIds(swarmId);
    for (let i = 0; i < machineIds.length; i++) {
        const m = await Machine.findById(machineIds[i]);
        if (!m.dependency_install_complete) {
            swarmReady = false;
        }
    }
    return swarmReady;
}

export async function setReadyAt(swarm: Swarm): Promise<Swarm> {
    const updatedSwarmList: Array<Swarm> = await db("swarm")
        .update({ ready_at: db.fn.now() })
        .where("id", swarm.id)
        .returning("*");
    return updatedSwarmList[0];
}
export async function willExceedDropletPoolAvailability(newSwarmSize: number): Promise<boolean> {
    const headers = {
        Authorization: `Bearer ${process.env.DIGITAL_OCEAN_TOKEN}`,
        "Content-Type": "application/json"
    };
    const url = `https://api.digitalocean.com/v2/droplets`;
    const options: RequestPromiseOptions = {
        headers,
        json: true
    };
    const result: DropletListResponse = await request.get(url, options);
    const availableDroplets = parseInt(process.env.DROPLET_POOL_SIZE, 10) - result.meta.total;
    if (availableDroplets - newSwarmSize < 10) {
        sendEmail({
            to: "jack@kernl.us",
            from: "jack@kernl.us",
            subject: `RoboSwarm Droplet Pool Availability: ${availableDroplets} - ${newSwarmSize}`,
            text: `A swarm with ${newSwarmSize} droplets wasn't created. There were only ${availableDroplets} droplets available at the time.`
        });
    }
    return availableDroplets - newSwarmSize < 0;
}

interface SSHCommandResult {
    stdout: string;
    stderr: string;
}

export async function fetchLoadTestMetrics(swarm: Swarm, isFinal?: boolean): Promise<void> {
    const sshKey: SSHKey.SSHKey = await SSHKey.getById(swarm.ssh_key_id);
    const master: Machine.Machine = await getSwarmMaster(swarm.id);

    const ssh = new node_ssh();
    await ssh.connect({
        host: master.ip_address,
        username: "root",
        privateKey: sshKey.private
    });

    const requests: SSHCommandResult = await ssh.execCommand("cat /root/status_requests.csv");
    const requestRows = requests.stdout.split("\n");

    if (isFinal) {
        // For the final request, we store the route path information. Regular JSON object should be fine.
        if (requestRows.length > 2) {
            requestRows.shift();
            requestRows.pop();
            for (const row of requestRows) {
                try {
                    const splitRow = row.split(",");
                    const data: LoadTest.RequestFinal = {
                        swarm_id: swarm.id,
                        created_at: new Date(),
                        method: splitRow[0],
                        route: splitRow[1],
                        requests: parseInt(splitRow[2], 10),
                        failures: parseInt(splitRow[3], 10),
                        median_response_time: parseInt(splitRow[4], 10),
                        average_response_time: parseInt(splitRow[5], 10),
                        min_response_time: parseInt(splitRow[6], 10),
                        max_response_time: parseInt(splitRow[7], 10),
                        avg_content_size: parseInt(splitRow[8], 10),
                        requests_per_second: Math.floor(parseFloat(splitRow[9]))
                    };
                    await LoadTest.createRequestFinal(data);
                } catch (err) {
                    console.log("Request row final error: ", err);
                }
            }
        }
    } else {
        try {
            const requestTotals = requestRows[requestRows.length - 1].split(",");
            const requestTotalData: LoadTest.Request = {
                swarm_id: swarm.id,
                created_at: new Date(),
                requests: parseInt(requestTotals[2], 10),
                failures: parseInt(requestTotals[3], 10),
                median_response_time: parseInt(requestTotals[4], 10),
                average_response_time: parseInt(requestTotals[5], 10),
                min_response_time: parseInt(requestTotals[6], 10),
                max_response_time: parseInt(requestTotals[7], 10),
                avg_content_size: parseInt(requestTotals[8], 10),
                requests_per_second: Math.floor(parseFloat(requestTotals[9]))
            };
            await LoadTest.createRequest(requestTotalData);
        } catch (err) {
            console.log("Request row error: ", {
                err,
                swarm_id: swarm.id,
                requestRows
            });
        }
    }

    const distribution: SSHCommandResult = await ssh.execCommand("cat /root/status_distribution.csv");
    const distributionRows = distribution.stdout.split("\n");

    if (isFinal) {
        // For the final request, we store the route path information. Regular JSON object should be fine.
        if (distributionRows.length > 2) {
            distributionRows.shift();
            distributionRows.pop();
            for (const row of distributionRows) {
                try {
                    const splitRow = row.split(",");
                    const methodRoute = splitRow[0].split(" ");
                    let method = "";
                    try {
                        method = methodRoute[0].replace(/\"/g, "");
                    } catch (err) { }

                    let route = "";
                    try {
                        route = methodRoute[1].replace(/\"/g, "");
                    } catch (err) { }

                    const data: LoadTest.DistributionFinal = {
                        swarm_id: swarm.id,
                        created_at: new Date(),
                        method,
                        route,
                        requests: parseInt(splitRow[1], 10),
                        percentiles: JSON.stringify({
                            "50%": splitRow[2],
                            "66%": splitRow[3],
                            "75%": splitRow[4],
                            "80%": splitRow[5],
                            "90%": splitRow[6],
                            "95%": splitRow[7],
                            "98%": splitRow[8],
                            "99%": splitRow[9],
                            "100%": splitRow[10]
                        })
                    };
                    await LoadTest.createDistributionFinal(data);
                } catch (err) {
                    console.log("DistributionFinal Error: ", err);
                }
            }
        }
    } else {
        try {
            const distributionTotals = distributionRows[distributionRows.length - 1].split(",");
            const distributionTotalData: LoadTest.Distribution = {
                swarm_id: swarm.id,
                created_at: new Date(),
                requests: parseInt(distributionTotals[1], 10),
                percentiles: JSON.stringify({
                    "50%": distributionTotals[2],
                    "66%": distributionTotals[3],
                    "75%": distributionTotals[4],
                    "80%": distributionTotals[5],
                    "90%": distributionTotals[6],
                    "95%": distributionTotals[7],
                    "98%": distributionTotals[8],
                    "99%": distributionTotals[9],
                    "100%": distributionTotals[10]
                })
            };
            await LoadTest.createDistribution(distributionTotalData);
        } catch (err) {
            console.log("Distribution row error: ", {
                err,
                swarm_id: swarm.id,
                distributionRows
            });
        }
    }

    ssh.connection.end();
}

export async function shouldStop(swarm: Swarm): Promise<boolean> {
    const swarmStartTime: Date = swarm.ready_at;
    const swarmDuration: number = swarm.duration; // minutes;
    const endTime: Date = moment(swarmStartTime).add(swarmDuration, "m").toDate();
    const now = new Date();
    return moment(now).isAfter(endTime);
}

export async function totalMachineSecondsInPeriod(start: Date, end: Date, group_id: number): Promise<number> {
    const swarms: Swarm[] = await db("swarm")
        .where("created_at", ">=", start)
        .where("created_at", "<=", end)
        .where("group_id", group_id);

    let totalSeconds = 0;
    for (const swarm of swarms) {
        const machines: Machine.Machine[] = await getSwarmMachines(swarm.id);
        machines.forEach(machine => {
            if (machine.created_at && machine.destroyed_at) {
                const created = moment(machine.created_at);
                const destroyed = moment(machine.destroyed_at);
                totalSeconds += Math.abs(moment.duration(created.diff(destroyed)).asSeconds());
            } else {
                totalSeconds += swarm.duration * 60;
            }
        });
    }
    return totalSeconds;
}

export async function getSwarmsInDateRange(start: Date, end: Date, group_id: number): Promise<number> {
    const swarms: Swarm[] = await db("swarm")
        .where("created_at", ">=", start)
        .where("created_at", "<=", end)
        .where("group_id", group_id);
    return swarms.length;
}

export async function getActiveSwarms(): Promise<Swarm[]> {
    const swarms: Swarm[] = await db("swarm").whereNull("destroyed_at");
    return swarms;
}

export async function createRepeatSwarmRequest(swarmId: number): Promise<NewSwarm> {
    const oldSwarm: Swarm = await getById(swarmId);
    const newSwarm: NewSwarm = {
        name: oldSwarm.name,
        duration: oldSwarm.duration,
        simulated_users: oldSwarm.simulated_users,
        file_path: oldSwarm.file_path,
        host_url: oldSwarm.host_url,
        spawn_rate: oldSwarm.spawn_rate,
        machines: [],
        region: oldSwarm.region,
        swarm_ui_type: oldSwarm.swarm_ui_type
    };

    // Rotate through the old machines and regions evenly distributing the load.
    const oldMachines: Machine.Machine[] = await getSwarmMachines(swarmId);
    const oldRegions = oldSwarm.region.split(",");
    newSwarm.machines = oldMachines.map(m => {
        const currentRegion = oldRegions.pop();
        const newMachine = { region: currentRegion };
        oldRegions.unshift(currentRegion);
        return newMachine;
    });

    // Plus one extra machine to be master.
    newSwarm.machines.push({ region: oldRegions[0] });

    return newSwarm;

}

export async function softDelete(swarmId: number, group_id: number): Promise<Swarm> {
    await db("swarm")
        .update({ soft_delete: true })
        .where({ id: swarmId, group_id });
    return await getById(swarmId);
}

export async function decrementSwarmSize(swarmId: number): Promise<Swarm> {
    await db("swarm")
        .where({ id: swarmId })
        .decrement("size", 1);
    return await getById(swarmId);
}