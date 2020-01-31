import * as sinon from "sinon";
import * as setupHelpers from "../../src/lib/setupHelpers";
import * as events from "../../src/lib/events";
import { MachineProvisionEvent, MachineSetupStep } from "../../src/interfaces/provisioning.interface";

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
});