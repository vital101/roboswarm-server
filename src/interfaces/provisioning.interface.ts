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

export enum ProvisionEventType {
    SWARM_PROVISION,
    MACHINE_PROVISION
}

export interface ProvisionEvent {
    sshKey: SSHKey;
    eventType: ProvisionEventType;
    maxRetries: number;
    currentTry: number;
    delayUntil?: Date;
    lastActionTime: Date;
    errors: any[];
}

export interface MachineProvisionEvent extends ProvisionEvent {
    swarm: Swarm;
    machine: Machine;
    region: string;
    stepToExecute: MachineSetupStep;
    steps: MachineSetupStep[];
}

export interface SwarmProvisionEvent extends ProvisionEvent {
    swarm: NewSwarm;
    createdSwarm: Swarm;
}