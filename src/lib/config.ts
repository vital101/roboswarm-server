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