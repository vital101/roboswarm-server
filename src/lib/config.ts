import { User } from "../models/User";

export interface Plan {
    maxMachineHours: number;
    maxLoadTests: number;
    maxLoadTestDurationMinutes: number;
    maxReliabilityTestMinutes: number;
    maxReliabilityTestUsers: number;
    dataRetentionDays: number;
    maxUsers: number;
}

export interface Settings {
    free: Plan;
    startup: Plan;
    enterprise: Plan;
    "kernl-startup": Plan;
    "kernl-agency": Plan;
    "kernl-enterprise": Plan;
    "kernl-startup-2020": Plan;
    "kernl-agency-2020": Plan;
    "kernl-unlimited-2020": Plan;
    "2020-roboswarm-free": Plan;
    "2020-roboswarm-startup": Plan;
    "2020-roboswarm-enterprise": Plan;
}

export function getPlan(user: User): Plan {
    switch (user.stripe_plan_description) {
        case "free":
            return settings.free;
        case "startup":
            return settings.startup;
        case "enterprise":
            return settings.enterprise;
        case "kernl-startup-2020":
            return settings["kernl-startup-2020"];
        case "kernl-agency-2020":
            return settings["kernl-agency-2020"];
        case "kernl-unlimited-2020":
            return settings["kernl-unlimited-2020"];
        case "kernl-startup":
            return settings["kernl-startup"];
        case "kernl-agency":
            return settings["kernl-agency"];
        case "kernl-enterprise":
            return settings["kernl-enterprise"];
        case "2020-roboswarm-free":
            return settings["2020-roboswarm-free"];
        case "2020-roboswarm-startup":
            return settings["2020-roboswarm-startup"];
        case "2020-roboswarm-enterprise":
            return settings["2020-roboswarm-enterprise"];
        default:
            return settings.free;
    }
}

export const settings: Settings = {
    free: {
        maxMachineHours: 5,
        maxLoadTests: 2,
        maxLoadTestDurationMinutes: 15,
        maxReliabilityTestMinutes: 150,
        maxReliabilityTestUsers: 25,
        dataRetentionDays: 5,
        maxUsers: 100
    },
    startup: {
        maxMachineHours: 1000,
        maxLoadTests: 30,
        maxLoadTestDurationMinutes: 120,
        maxReliabilityTestMinutes: 1200,
        maxReliabilityTestUsers: 25,
        dataRetentionDays: 90,
        maxUsers: 5000
    },
    enterprise: {
        maxMachineHours: 7000,
        maxLoadTests: 300,
        maxLoadTestDurationMinutes: 360,
        maxReliabilityTestMinutes: 3600,
        maxReliabilityTestUsers: 25,
        dataRetentionDays: 365,
        maxUsers: 40000
    },
    "kernl-startup": {
        maxMachineHours: 5,
        maxLoadTests: 10,
        maxLoadTestDurationMinutes: 60,
        maxReliabilityTestMinutes: 600,
        maxReliabilityTestUsers: 25,
        dataRetentionDays: 30,
        maxUsers: 2000
    },
    "kernl-agency": {
        maxMachineHours: 30,
        maxLoadTests: 30,
        maxLoadTestDurationMinutes: 120,
        maxReliabilityTestMinutes: 1200,
        maxReliabilityTestUsers: 25,
        dataRetentionDays: 90,
        maxUsers: 10000
    },
    "kernl-enterprise": {
        maxMachineHours: 100,
        maxLoadTests: 100,
        maxLoadTestDurationMinutes: 300,
        maxReliabilityTestMinutes: 3000,
        maxReliabilityTestUsers: 25,
        dataRetentionDays: 365,
        maxUsers: 25000
    },
    "kernl-startup-2020": {
        maxMachineHours: 5,
        maxLoadTests: 10,
        maxLoadTestDurationMinutes: 60,
        maxReliabilityTestMinutes: 600,
        maxReliabilityTestUsers: 25,
        dataRetentionDays: 30,
        maxUsers: 2000
    },
    "kernl-agency-2020": {
        maxMachineHours: 100,
        maxLoadTests: 100,
        maxLoadTestDurationMinutes: 120,
        maxReliabilityTestMinutes: 1200,
        maxReliabilityTestUsers: 25,
        dataRetentionDays: 90,
        maxUsers: 25000
    },
    "kernl-unlimited-2020": {
        maxMachineHours: 500,
        maxLoadTests: 200,
        maxLoadTestDurationMinutes: 300,
        maxReliabilityTestMinutes: 3000,
        maxReliabilityTestUsers: 25,
        dataRetentionDays: 365,
        maxUsers: 50000
    },
    "2020-roboswarm-free": {
        maxMachineHours: 100000,
        maxLoadTests: 5,
        maxLoadTestDurationMinutes: 20,
        maxReliabilityTestMinutes: 20,
        maxReliabilityTestUsers: 5,
        dataRetentionDays: 25000,
        maxUsers: 5
    },
    "2020-roboswarm-startup": {
        maxMachineHours: 100000,
        maxLoadTests: 20,
        maxLoadTestDurationMinutes: 120,
        maxReliabilityTestMinutes: 120,
        maxReliabilityTestUsers: 500,
        dataRetentionDays: 25000,
        maxUsers: 500
    },
    "2020-roboswarm-enterprise": {
        maxMachineHours: 100000,
        maxLoadTests: 50,
        maxLoadTestDurationMinutes: 240,
        maxReliabilityTestMinutes: 240,
        maxReliabilityTestUsers: 2000,
        dataRetentionDays: 25000,
        maxUsers: 2000
    }
};