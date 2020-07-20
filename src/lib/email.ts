import * as sgMail from "@sendgrid/mail";
import { User } from "../models/User";

export interface Message {
    to: string;
    from: string;
    subject: string;
    text: string;
}

export async function sendEmail(message: Message): Promise<void> {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send(message);
}

export function sendRegistrationEmail(user: User): void {
    const templateId = "d-3bcf1df68e6c4c9b8686a0b9215e86ec";
    const msg = {
        to: user.email,
        from: "jack@kernl.us",
        templateId,
        asm: {
            groupId: 13686
        },
        dynamicTemplateData: {
            name: user.first_name
        },
    };
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sgMail.send(msg);
}

export function sendFirstTestCompleteEmail(user: User, simulated_users: number, duration_in_minutes: number): void {
    const templateId = "d-3a8c3bacca664b4fafb13bf2eb217d63";
    const msg = {
        to: user.email,
        from: "jack@kernl.us",
        templateId,
        asm: {
            groupId: 13686
        },
        dynamicTemplateData: {
            name: user.first_name,
            simulated_users,
            duration_in_minutes
        },
    };
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sgMail.send(msg);
}