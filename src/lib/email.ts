import * as sgMail from "@sendgrid/mail";
import { User } from "../models/User";
import { Swarm } from "../models/Swarm";

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

export function sendLoadTestCompleteEmail(user: User, swarm: Swarm): void {
    const templateId = "d-d20c9ddc3d3f46e69676e8ceee0f24c8";
    const msg = {
        to: user.email,
        from: "jack@kernl.us",
        templateId,
        asm: {
            groupId: 13686
        },
        dynamicTemplateData: {
            first_name: user.first_name,
            swarm_name: swarm.name,
            swarm_simulated_users: swarm.simulated_users,
            swarm_duration: swarm.duration,
            swarm_id: swarm.id
        },
    };
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sgMail.send(msg);
}

export function sendPasswordResetEmail(email: string, uuid: string): void {
    const templateId = "d-ef854018ef2c43d7934f9e87b8ec72ff";
    const msg = {
        to: email,
        from: "jack@kernl.us",
        templateId,
        asm: {
            groupId: 13686
        },
        dynamicTemplateData: {
            uuid,
        },
    };
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sgMail.send(msg);
}

export function sendWooCommerceTemplateRequestEmail(user: User): void {
    const templateId = "d-92c66f525e704c0daa0273928cb94c68";
    const msg = {
        to: "jack@kernl.us",
        from: "jack@kernl.us",
        templateId,
        asm: {
            groupId: 13686
        },
        dynamicTemplateData: {
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email
        },
    };
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sgMail.send(msg);
}