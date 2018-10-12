const node_ssh = require("node-ssh");
const sftp_client = require("ssh2-sftp-client");
import { writeFileSync } from "fs";
import { asyncSleep } from "../lib/lib";
import * as Machine from "../models/Machine";
import { Swarm } from "../models/Swarm";
import { SwarmProvisionEvent, MachineProvisionEvent, MachineSetupStep } from "../interfaces/provisioning.interface";
import { enqueue } from "./events";

export async function nextStep(event: MachineProvisionEvent) {
    if (event.steps.length > 0) {
        const nextStep = event.steps.shift();
        event.stepToExecute = nextStep;
        event.currentTry = 0;
        return enqueue(event);
    }
}

export async function processSwarmProvisionEvent(event: SwarmProvisionEvent): Promise<void> {
    console.log("processSwarmProvisionEvent() called.");
    const promises = event.swarm.machines.map(machine => {
        return Machine.create(machine, event.createdSwarm, event.sshKey);
    });
    await Promise.all(promises);
}

// TODO
// Make queue reliable. If an event is there longer than 3 minutes, push it back into the queue to be
// worked again. Need to figure out a way to handle issues with processing gracefully.

export async function processMachineProvisionEvent(event: MachineProvisionEvent): Promise<void> {
    console.log("processMachineProvisionEvent() called.");
    if (event.currentTry < event.maxRetries) {
        try {
            switch (event.stepToExecute) {
                case MachineSetupStep.CREATE: {
                    await Machine.createExternalMachine(event.machine.id, event.region, event.sshKey.external_id);
                    break;
                }
                case MachineSetupStep.DELAY: {
                    // Todo extract most of this into a function
                    // Set the delay if we need to.
                    if (event.delayUntil === undefined) {
                        const delayTime = new Date();
                        delayTime.setSeconds(delayTime.getSeconds() + 60);
                        event.delayUntil = delayTime;
                    }

                    const now = new Date();
                    const delayTime = new Date(event.delayUntil);
                    if (now.getTime() < delayTime.getTime()) {
                        console.log("Delay.....");
                        event.steps.unshift(MachineSetupStep.DELAY);
                    } else {
                        event.delayUntil = undefined;
                    }
                    break;
                }
                case MachineSetupStep.OPEN_PORTS: {
                    await openPorts(event.machine.id, event.machine.ip_address, event.sshKey.private);
                    break;
                }
                case MachineSetupStep.MACHINE_READY: {
                    const ready = await isMachineReady(event.machine.id);
                    if (ready) {
                        event.machine = await Machine.findById(event.machine.id);
                    } else {
                        await asyncSleep(5);
                        event.steps.unshift(MachineSetupStep.MACHINE_READY);
                    }
                    break;
                }
                case MachineSetupStep.PACKAGE_INSTALL: {
                    await installPackagesOnMachine(event.machine.ip_address, event.sshKey.private);
                    break;
                }
                case MachineSetupStep.TRANSFER_FILE: {
                    await transferFileToMachine(event.machine.ip_address, event.swarm.file_path, event.sshKey.private);
                    break;
                }
                case MachineSetupStep.UNZIP_AND_PIP_INSTALL: {
                    await unzipPackageAndPipInstall(event.machine.id, event.machine.ip_address, event.sshKey.private);
                    break;
                }
                case MachineSetupStep.START_MASTER: {
                    // TODO, might have a seperate event type at the provision worker level for checking
                    // every so often if the cluster is ready. Once it is ready, pick a machine and set it to
                    // master. Then fire off events to start everything once master is ready
                    break;
                }
                case MachineSetupStep.START_SLAVE: {
                    break;
                }
            }
            await nextStep(event);
        } catch (err) {
            console.log("There was an error. Retrying.:", err);
            await asyncSleep(3);
            event.currentTry += 1;
            await enqueue(event);
        }
    } else {
        console.log(`Dropping event after ${event.maxRetries} retries.`);
    }
}

export async function installPackagesOnMachine(machineIp: string, privateKey: string): Promise<void> {
    const ssh = new node_ssh();
    console.log(`Starting package install on ${machineIp}`);
    await ssh.connect({
        host: machineIp,
        username: "root",
        privateKey,
    });
    const commands: Array<string> = [
        "apt-get update",
        "apt-get upgrade -y",
        "apt-get install -y python2.7 python-pip unzip"
    ];
    await ssh.execCommand(commands.join(" && "));
    ssh.connection.end();
    console.log(`Finished package install on ${machineIp}`);
}

export async function transferFileToMachine(machineIp: string, filePath: string, privateKey: string): Promise<void> {
    console.log(`Starting: Transfer ${filePath} to ${machineIp} @ path /root/load_test_data.zip`);
    const sftp = new sftp_client();
    await sftp.connect({
        host: machineIp,
        port: 22,
        username: "root",
        privateKey
    });
    await sftp.put(filePath, "/root/load_test_data.zip");
    console.log("Success transferring file " + filePath);
}

export async function unzipPackageAndPipInstall(machineId: number, machineIp: string, privateKey: string): Promise<void> {
    const ssh = new node_ssh();
    console.log(`Starting pip install on ${machineIp}`);
    await ssh.connect({
        host: machineIp,
        username: "root",
        privateKey,
    });
    const commands: Array<string> = [
        "unzip load_test_data.zip",
        "pip install -r requirements.txt"
    ];
    await ssh.execCommand(commands.join(" && "));
    ssh.connection.end();
    console.log(`Finished pip install on ${machineIp}`);
    await Machine.updateDependencyInstallComplete(machineId, true);
    console.log(`Machine dependency_install_complete flag set ${machineIp}`);
}

export async function openPorts(machineId: number, machineIp: string, privateKey: string): Promise<void> {
    // Todo try large machine batches without random start. Might not need it.
    const randomStart = Math.floor(Math.random() * 3) + 1;
    asyncSleep(randomStart);

    const ssh = new node_ssh();
    console.log(`Opening ports on ${machineIp}`);
    await ssh.connect({
        host: machineIp,
        username: "root",
        privateKey,
    });
    await ssh.execCommand("ufw allow 8000:65535/tcp");
    ssh.connection.end();
    console.log(`Finished opening ports ${machineIp}`);

    await Machine.update(machineId, { port_open_complete: true });
    console.log(`Machine port_open_complete flag set ${machineIp}`);
}

export async function startMaster(swarm: Swarm, machine: Machine.Machine, slaveCount: number, privateKey: string): Promise<boolean> {
    try {
        console.log(`Starting master at ${machine.ip_address}`);
        const ssh = new node_ssh();
        await ssh.connect({
            host: machine.ip_address,
            username: "root",
            privateKey,
        });
        const users = swarm.simulated_users;
        const rate = swarm.spawn_rate;
        const runTime = `${swarm.duration}m`;
        const flags = [
            // `-c ${users}`,
            // `-r ${rate}`,
            // `--run-time ${runTime}`,
            `--host=${swarm.host_url}`,
            // "--no-web",
            "--master",
            // `--expect-slaves=${slaveCount}`
        ];
        const command = `nohup locust ${flags.join(" ")}`;
        // Executing locust -c 50 -r 1 --host=https://kernl.us --master --expect-slaves=1 & on master at 165.227.123.149
        console.log(`Executing ${command} on master at ${machine.ip_address} &`);
        ssh.execCommand(command, { options: { pty: true } });
        await asyncSleep(30);
        ssh.connection.end();
        console.log(`Finished starting master at ${machine.ip_address}`);
        return true;
    } catch (err) {
        console.log(`Error starting master on ${machine.ip_address}: `, err);
        return false;
    }
}

export async function isMachineReady(machineId: number): Promise<boolean> {
    console.log(`Checking machine ready: ${machineId}`);
    const m = await Machine.findById(machineId);
    if (m.ready_at === null) {
        const response = await Machine.checkStatus(m);
        if (response.droplet.status === "active") {
            const ip_address = response.droplet.networks.v4[0].ip_address;
            await Machine.setReadyAtAndIp(m, ip_address);
            console.log(`Machine ready: ${machineId}`);
            return true;
        }
    }
    return false;
}

export async function startSlave(swarm: Swarm, master: Machine.Machine, slave: Machine.Machine, privateKey: string): Promise<boolean> {
    // Create bash template and send to slave
    console.log("Transferring template to slave at ", slave.ip_address);
    const bashTemplate = `
        #!/bin/bash
        locust --slave --master-host=${master.ip_address} --logfile=/root/locustlog.log --loglevel=debug &
    `;
    const bashPath = `/tmp/${slave.id}.bash`;
    writeFileSync(`/tmp/${slave.id}.bash`, bashTemplate);
    const sftp = new sftp_client();
    await sftp.connect({
        host: slave.ip_address,
        port: 22,
        username: "root",
        privateKey
    });
    await sftp.put(bashPath, "/root/start.sh");

    try {
        console.log(`Starting slave at ${slave.ip_address}`);
        const ssh = new node_ssh();
        await ssh.connect({
            host: slave.ip_address,
            username: "root",
            privateKey,
        });
        await ssh.execCommand("chmod +xrw /root/start.sh");
        const command = "/bin/bash /root/start.sh";
        console.log(`Executing ${command} on slave at ${slave.ip_address}`);
        // await ssh.execCommand(command, { options: { pty: true } });
        // With streaming stdout/stderr callbacks
        ssh.exec(command, [], {
            cwd: "/root",
            onStdout(chunk: any) {
                console.log("stdoutChunk", chunk.toString("utf8"));
            },
            onStderr(chunk: any) {
                console.log("stderrChunk", chunk.toString("utf8"));
            },
        });
        await asyncSleep(15);
        ssh.connection.end();
        console.log(`Finished starting slave at ${slave.ip_address}`);
        return true;
    } catch (err) {
        console.log(`Error starting slave on ${slave.ip_address}: `, err);
        return false;
    }
}