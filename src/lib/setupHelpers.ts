const node_ssh = require("node-ssh");
const sftp_client = require("ssh2-sftp-client");
import { asyncSleep } from "../lib/lib";
import * as Machine from "../models/Machine";
import { Swarm } from "../models/Swarm";

export function installPackagesOnMachine(machineIp: string, privateKey: string): Promise<boolean> {
    console.log(`Waiting to install packages on ${machineIp}...`);
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            const ssh = new node_ssh();
            try {
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
                const result = await ssh.execCommand(commands.join(" && "));
                console.log(`Finished package install on ${machineIp}`);
                resolve(true);
            } catch (err) {
                console.log(`Error installing packages on ${machineIp}:`, err);
                reject({
                    type: "package",
                    machineIp,
                    privateKey
                });
            }
        }, 60 * 1000);
    });
}

export function transferFileToMachine(machineIp: string, filePath: string, privateKey: string): Promise<boolean> {
    console.log(`Waiting: Transfer ${filePath} to ${machineIp} @ path /root/load_test_data.zip`);
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            console.log(`Starting: Transfer ${filePath} to ${machineIp} @ path /root/load_test_data.zip`);
            try {
                const sftp = new sftp_client();
                await sftp.connect({
                    host: machineIp,
                    port: 22,
                    username: "root",
                    privateKey
                });
                await sftp.put(filePath, "/root/load_test_data.zip");
                console.log("Success transferring file " + filePath);
                resolve(true);
            } catch (err) {
                console.log("Error transferring file: ", err);
                reject({
                    type: "fileTransfer",
                    machineIp,
                    privateKey,
                    filePath
                });
            }
        }, 60 * 1000); // 60 second wait to start transfer. Lets the box boot up completely.
    });
}

export async function unzipPackageAndPipInstall(machineId: number, machineIp: string, privateKey: string): Promise<boolean> {
    const randomStart = Math.floor(Math.random() * 6) + 1;
    asyncSleep(randomStart);
    const ssh = new node_ssh();
    try {
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
        console.log(`Finished pip install on ${machineIp}`);
        await Machine.updateDependencyInstallComplete(machineId, true);
        console.log(`Machine dependency_install_complete flag set ${machineIp}`);
        return true;
    } catch (err) {
        console.log(`Error pip install on ${machineIp}:`, err);
        return false;
    }
}

export async function openPorts(machineId: number, machineIp: string, privateKey: string): Promise<boolean> {
    const randomStart = Math.floor(Math.random() * 6) + 1;
    asyncSleep(randomStart);
    const ssh = new node_ssh();
    try {
        console.log(`Opening ports on ${machineIp}`);
        await ssh.connect({
            host: machineIp,
            username: "root",
            privateKey,
        });
        await ssh.execCommand("ufw allow 8000:65535/tcp");
        console.log(`Finished opening ports ${machineIp}`);

        await Machine.update(machineId, { port_open_complete: true });
        console.log(`Machine port_open_complete flag set ${machineIp}`);
        return true;
    } catch (err) {
        console.log(`Error opening ports on ${machineIp}:`, err);
        return false;
    }
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

export async function startSlave(swarm: Swarm, master: Machine.Machine, slave: Machine.Machine, privateKey: string): Promise<boolean> {
    try {
        console.log(`Starting slave at ${slave.ip_address}`);
        const ssh = new node_ssh();
        await ssh.connect({
            host: slave.ip_address,
            username: "root",
            privateKey,
        });
        const flags = [
            "--slave",
            `--master-host=${master.ip_address}`
        ];
        const command = `locust ${flags.join(" ")} &`;
        console.log(`Executing ${command} on slave at ${slave.ip_address}`);
        ssh.execCommand(command);
        await asyncSleep(15);
        ssh.connection.end();
        console.log(`Finished starting slave at ${slave.ip_address}`);
        return true;
    } catch (err) {
        console.log(`Error starting slave on ${slave.ip_address}: `, err);
        return false;
    }
}