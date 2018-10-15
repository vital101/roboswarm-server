import { Machine } from "../models/Machine";
import { Swarm, NewSwarm } from "../models/Swarm";
import { SSHKey } from "../models/SSHKey";

export enum MachineSetupStep {
    CREATE,
    MACHINE_READY,
    DELAY,
    OPEN_PORTS,
    PACKAGE_INSTALL,
    TRANSFER_FILE,
    UNZIP_AND_PIP_INSTALL,
    START_MASTER,
    START_SLAVE
}

export enum SwarmSetupStep {
    CREATE,
    DELAY,
    READY,
    START_MASTER
}

export enum DeprovisionEventType {
    MACHINE,
    SSH_KEY
}

export enum WorkerEventType {
    DEPROVISION,
    SWARM_PROVISION,
    MACHINE_PROVISION
}


export interface DeprovisionEvent {
    id: number;
    eventType: WorkerEventType;
    deprovisionType: DeprovisionEventType;
    maxRetries: number;
    currentTry: number;
    delayUntil?: Date;
    lastActionTime: Date;
    errors: any[];
}

export interface ProvisionEvent {
    sshKey: SSHKey;
    eventType: WorkerEventType;
    maxRetries: number;
    currentTry: number;
    delayUntil?: Date;
    lastActionTime: Date;
    errors: any[];
}

export interface MachineProvisionEvent extends ProvisionEvent {
    swarm: Swarm;
    master?: Machine;
    machine: Machine;
    region: string;
    stepToExecute: MachineSetupStep;
    slaveCount?: number;
    slaveIds?: number[];
    steps: MachineSetupStep[];
}

export interface SwarmProvisionEvent extends ProvisionEvent {
    swarm: NewSwarm;
    createdSwarm: Swarm;
    stepToExecute: SwarmSetupStep;
    steps: SwarmSetupStep[];
}