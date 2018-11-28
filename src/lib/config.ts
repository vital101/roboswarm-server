import { User } from "../models/User";

export interface Plan {
    maxMachineHours: number;
    maxLoadTests: number;
    maxLoadTestDurationMinutes: number;
    dataRetentionDays: number;
}

export interface Settings {
    free: Plan;
    startup: Plan;
    enterprise: Plan;
    "kernl-startup": Plan;
    "kernl-agency": Plan;
    "kernl-enterprise": Plan;
}

export function getPlan(user: User): Plan {
    switch (user.stripe_plan_description) {
        case "free":
        return settings.free;
        case "startup":
        return settings.startup;
        case "enterprise":
        return settings.enterprise;
        case "kernl-startup":
        return settings["kernl-startup"];
        case "kernl-agency":
        return settings["kernl-agency"];
        case "kernl-enterprise":
        return settings["kernl-enterprise"];
        default:
        return settings.free;
    }
}

const settings: Settings = {
    free: {
        maxMachineHours: 5,
        maxLoadTests: 2,
        maxLoadTestDurationMinutes: 15,
        dataRetentionDays: 5
    },
    startup: {
        maxMachineHours: 1000,
        maxLoadTests: 30,
        maxLoadTestDurationMinutes: 120,
        dataRetentionDays: 90
    },
    enterprise: {
        maxMachineHours: 7000,
        maxLoadTests: 300,
        maxLoadTestDurationMinutes: 360,
        dataRetentionDays: 365
    },
    "kernl-startup": {
        maxMachineHours: 5,
        maxLoadTests: 10,
        maxLoadTestDurationMinutes: 60,
        dataRetentionDays: 30
    },
    "kernl-agency": {
        maxMachineHours: 30,
        maxLoadTests: 30,
        maxLoadTestDurationMinutes: 120,
        dataRetentionDays: 90
    },
    "kernl-enterprise": {
        maxMachineHours: 100,
        maxLoadTests: 100,
        maxLoadTestDurationMinutes: 300,
        dataRetentionDays: 365
    }
};