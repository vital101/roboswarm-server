import { db } from "../lib/db";
import { v1 as generateUUID } from "uuid";
import { readFile } from "fs";
import { SSHKeyResponse } from "../interfaces/digitalOcean.interface";
import { execSync } from "child_process";
import { httpRequest, RequestOptions } from "../lib/http";

export interface SSHKey {
    id?: number;
    public: string;
    private: string;
    external_id?: number;
    created_at: Date;
    destroyed_at?: Date;
}

interface KeyPair {
    public: string;
    private: string;
    uuid: string;
}

function executeShell(command: string): any {
    return execSync(command, { cwd: "/tmp" });
}

function readFileAsync(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
        readFile(path, "utf8", (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

async function generateKeys(): Promise<KeyPair> {
    const sshUUID = generateUUID();
    const ssh_private_path = `/tmp/${sshUUID}`;
    const ssh_public_path = `/tmp/${sshUUID}.pub`;

    // Generate the SSH key
    executeShell(`ssh-keygen -m PEM -C roboswarm.dev -t rsa -N "" -f /tmp/${sshUUID}`);

    // Read the SSH keys
    const privateKey = await readFileAsync(ssh_private_path);
    const publicKey = await readFileAsync(ssh_public_path);

    // Delete the keys from disk.
    executeShell(`rm ${ssh_private_path}`);
    executeShell(`rm ${ssh_public_path}`);

    return {
        public: publicKey,
        private: privateKey,
        uuid: sshUUID,
    };
}

async function createDigitalOceanSSHKey(keys: KeyPair): Promise<SSHKeyResponse> {
    // Query digital ocean.
    const headers = {
        Authorization: `Bearer ${process.env.ROBOSWARM__DIGITAL_OCEAN_TOKEN}`,
        "Content-Type": "application/json"
    };
    const data = {
        name: `RoboSwarm SSH Key - ${keys.uuid}`,
        public_key: keys.public
    };
    const url = "https://api.digitalocean.com/v2/account/keys";
    const options: RequestOptions = {
        body: data,
        headers,
        url,
        responseType: "JSON",
        method: "POST"
    };
    return httpRequest<SSHKeyResponse>(options);
}

export async function create(): Promise<SSHKey> {
    const keys: KeyPair = await generateKeys();
    const result: SSHKeyResponse = await createDigitalOceanSSHKey(keys);
    const newSSHKey: Array<SSHKey> = await db.table("ssh_key")
        .insert({
            external_id: result.ssh_key.id,
            public: keys.public,
            private: keys.private
        })
        .returning("*");
    return newSSHKey[0];
}

export async function destroy(id: number): Promise<void> {
    // Mark as destroyed.
    const destroyedSSHKey: Array<SSHKey> = await db("ssh_key")
        .update({ destroyed_at: db.fn.now() })
        .where({
            id
        })
        .returning("*");

    // Delete from Digital Ocean.
    const headers = {
        Authorization: `Bearer ${process.env.ROBOSWARM__DIGITAL_OCEAN_TOKEN}`,
        "Content-Type": "application/json"
    };
    const url = `https://api.digitalocean.com/v2/account/keys/${destroyedSSHKey[0].external_id}`;
    const options: RequestOptions = {
        url,
        method: "DELETE",
        headers,
    };
    await httpRequest(options);
}

export async function getById(id: number): Promise<SSHKey> {
    const sshKeys: Array<SSHKey> = await db.table("ssh_key").where("id", id);
    return sshKeys[0];
}