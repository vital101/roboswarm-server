import { User } from "../models/User";

interface Plan {
    maxMachineHours: number;
    maxLoadTests: number;
    maxLoadTestDurationMinutes: number;
    dataRetentionDays: number;
}

interface Settings {
    free: Plan;
    startup: Plan;
    enterprise: Plan;
}

export function getPlan(user: User): Plan {
    switch (user.stripe_plan_description) {
        case "free":
        return settings.free;
        case "startup":
        return settings.startup;
        case "enterprise":
        return settings.enterprise;
        default:
        return settings.free;
    }
}

export const settings: Settings = {
    free: {
        maxMachineHours: 5,
        maxLoadTests: 2,
        maxLoadTestDurationMinutes: 30,
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
    }
};