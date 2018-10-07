export interface Droplet {
    id: number;
    name: string;
    memory: number;
    vcpus: number;
    disk: number;
    locked: boolean;
    status: string;
    created_at: string;
    networks: Network;
}

export interface Network {
    v4: Array<NetworkInterface>;
    v6: Array<NetworkInterface>;
}

export interface NetworkInterface {
    ip_address: string;
    netmask: string;
    gateway: string;
    type: string;
}

export interface DropletResponse {
    droplet: Droplet;
}

export interface SSHKey {
    id: number;
    fingerprint: string;
    public_key: string;
    name: string;
}
export interface SSHKeyResponse {
    ssh_key: SSHKey;
}

export interface DropletListResponse {
    droplets: Array<Droplet>;
    links: any;
    meta: DropletResponseMeta;
}

export interface DropletResponseMeta {
    total: number;
}