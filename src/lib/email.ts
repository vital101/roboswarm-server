import * as sgMail from "@sendgrid/mail";

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