import * as sinon from "sinon";
import { sendEmail, Message } from "../../src/lib/email";
import * as sgMail from "@sendgrid/mail";

describe("lib/email", () => {
    let sandbox: sinon.SinonSandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("sendEmail", () => {
        test("sends email", async () => {
            const setApiKeyStub = sandbox.stub(sgMail, "setApiKey").returns();
            const sendStub = sandbox.stub(sgMail, "send").resolves();
            const message: Message = {
                to: process.env.ROBOSWARM__ADMIN_EMAIL,
                from: "no-reply@kernl.us",
                subject: "A Test Message",
                text: "A test message test body"
            };
            await sendEmail(message);
            expect(setApiKeyStub.callCount).toBe(1);
            expect(sendStub.getCall(0).args[0]).toEqual(message);
        });
    });

});