import * as sinon from "sinon";
import * as setupHelpers from "../../src/lib/setupHelpers";
import * as events from "../../src/lib/events";
import { MachineProvisionEvent, MachineSetupStep, DataCaptureEvent, WorkerEventType, DeprovisionEvent, DeprovisionEventType } from "../../src/interfaces/provisioning.interface";
import * as Swarm from "../../src/models/Swarm";
import * as Machine from "../../src/models/Machine";
import * as SSHKey from "../../src/models/SSHKey";
import { Status } from "../../src/interfaces/shared.interface";
import * as moment from "moment";
import Sinon = require("sinon");

describe("lib/setupHelpers", () => {
    let sandbox: sinon.SinonSandbox;
    let enqueueStub: sinon.SinonStub;

    beforeAll(() => {
        sandbox = sinon.createSandbox();
    });

    beforeEach(() => {
        enqueueStub = sandbox.stub(events, "enqueue").resolves();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("nextStep", () => {
        it("enqueue the next step if one exists", async () => {
            const theDate: Date = new Date();
            const event: MachineProvisionEvent = {
                sshKey: undefined,
                eventType: undefined,
                maxRetries: 10,
                currentTry: 10,
                lastActionTime: theDate,
                errors: [],
                swarm: undefined,
                machine: undefined,
                region: "nyc3",
                stepToExecute: MachineSetupStep.CREATE,
                steps: [MachineSetupStep.DELAY, MachineSetupStep.MACHINE_READY]
            };
            await setupHelpers.nextStep(event);
            expect(enqueueStub.callCount).toEqual(1);
            const enqueueArg: MachineProvisionEvent = enqueueStub.getCall(0).args[0];
            expect(enqueueArg).toEqual({
                sshKey: undefined,
                eventType: undefined,
                maxRetries: 10,
                currentTry: 0,
                lastActionTime: theDate,
                errors: [],
                swarm: undefined,
                machine: undefined,
                region: "nyc3",
                stepToExecute: MachineSetupStep.DELAY,
                steps: [MachineSetupStep.MACHINE_READY]
            });
        });

        it("does not enqueue the next step if one does not exist", async () => {
            const theDate: Date = new Date();
            const event: MachineProvisionEvent = {
                sshKey: undefined,
                eventType: undefined,
                maxRetries: 10,
                currentTry: 10,
                lastActionTime: theDate,
                errors: [],
                swarm: undefined,
                machine: undefined,
                region: "nyc3",
                stepToExecute: MachineSetupStep.CREATE,
                steps: []
            };
            await setupHelpers.nextStep(event);
            expect(enqueueStub.callCount).toEqual(0);
        });
    });

    describe("processDataCaptureEvent", () => {
        let baseCaptureEvent: DataCaptureEvent;

        beforeEach(() => {
            baseCaptureEvent = {
                sshKey: { public: "", private: "", created_at: new Date() },
                eventType: WorkerEventType.DATA_CAPTURE,
                maxRetries: 3,
                currentTry: 0,
                lastActionTime: new Date(),
                errors: [],
                swarm: {
                    status: Status.ready
                } as Swarm.Swarm,
            };
        });

        it("does not enqueue if the swarm has been destroyed", async () => {
            sandbox.stub(Swarm, "getById").resolves({
                status: Status.destroyed
            } as Swarm.Swarm);
            await setupHelpers.processDataCaptureEvent(baseCaptureEvent);
            expect(enqueueStub.callCount).toEqual(0);
        });

        it("only runs if currentTry < maxRetries", async () => {
            const getByIdStub: sinon.SinonStub = sandbox.stub(Swarm, "getById").resolves({} as Swarm.Swarm);
            await setupHelpers.processDataCaptureEvent({
                ...baseCaptureEvent,
                currentTry: 4
            });
            expect(enqueueStub.callCount).toEqual(0);
            expect(getByIdStub.callCount).toEqual(0);
        });

        it("will enqueue if there is no delay set", async () => {
            sandbox.stub(Swarm, "getById").resolves({
                status: Status.ready
            } as Swarm.Swarm);
            await setupHelpers.processDataCaptureEvent({
                ...baseCaptureEvent,
                delayUntil: undefined
            });
            expect(enqueueStub.callCount).toEqual(1);
            expect(enqueueStub.getCall(0).args[0].delayUntil).not.toBeUndefined();
        });

        it("will not fetch the load test metrics if the current time is less than delayUntil", async () => {
            sandbox.stub(Swarm, "getById").resolves({
                status: Status.ready
            } as Swarm.Swarm);
            const fetchMetricsStub: Sinon.SinonStub = sandbox.stub(Swarm, "fetchLoadTestMetrics").resolves();
            await setupHelpers.processDataCaptureEvent({
                ...baseCaptureEvent,
                delayUntil: moment().add(1, "day").toDate()
            });
            expect(enqueueStub.callCount).toEqual(1);
            expect(fetchMetricsStub.callCount).toEqual(0);
        });

        it("will fetch load test metrics if the current time is greater than or equal to delayUntil", async () => {
            sandbox.stub(Swarm, "getById").resolves({
                status: Status.ready
            } as Swarm.Swarm);
            const fetchMetricsStub: Sinon.SinonStub = sandbox.stub(Swarm, "fetchLoadTestMetrics").resolves();
            await setupHelpers.processDataCaptureEvent({
                ...baseCaptureEvent,
                delayUntil: moment().subtract(1, "day").toDate()
            });
            expect(enqueueStub.callCount).toEqual(1);
            expect(fetchMetricsStub.callCount).toEqual(1);
            expect(fetchMetricsStub.getCall(0).args[0]).toEqual({ status: Status.ready });
        });
    });

    describe("processDeprovisionEvent", () => {
        let baseDeprovisionEvent: DeprovisionEvent;
        let machineDeprovisionStub: Sinon.SinonStub;
        let sshKeyDeprovisionStub: Sinon.SinonStub;

        beforeEach(() => {
            baseDeprovisionEvent = {
                id: 1,
                eventType: WorkerEventType.DEPROVISION,
                deprovisionType: DeprovisionEventType.MACHINE,
                maxRetries: 5,
                currentTry: 0,
                lastActionTime: new Date(),
                errors: []
            };
            machineDeprovisionStub = sandbox.stub(Machine, "destroy").resolves();
            sshKeyDeprovisionStub = sandbox.stub(SSHKey, "destroy").resolves();
        });

        it("does not process the event if we have reached max retries", async () => {
            const doNotProcess: DeprovisionEvent = {
                ...baseDeprovisionEvent,
                currentTry: 6,
            };
            await setupHelpers.processDeprovisionEvent(doNotProcess);
            expect(machineDeprovisionStub.callCount).toEqual(0);
            expect(sshKeyDeprovisionStub.callCount).toEqual(0);

        });

        it("deprovisions the machine", async () => {
            await setupHelpers.processDeprovisionEvent(baseDeprovisionEvent);
            expect(machineDeprovisionStub.callCount).toEqual(1);
            expect(machineDeprovisionStub.getCall(0).args[0]).toEqual(baseDeprovisionEvent.id);
            expect(sshKeyDeprovisionStub.callCount).toEqual(0);
        });

        it("deprovisions the ssh key", async () => {
            const sshKeyDeprovisionEvent: DeprovisionEvent = {
                ...baseDeprovisionEvent,
                deprovisionType: DeprovisionEventType.SSH_KEY
            };
            await setupHelpers.processDeprovisionEvent(sshKeyDeprovisionEvent);
            expect(machineDeprovisionStub.callCount).toEqual(0);
            expect(sshKeyDeprovisionStub.callCount).toEqual(1);
            expect(sshKeyDeprovisionStub.getCall(0).args[0]).toEqual(sshKeyDeprovisionEvent.id);
        });
    });
});