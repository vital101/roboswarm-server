import * as sgMail from "@sendgrid/mail";

export interface Message {
    to: string;
    from: string;
    subject: string;
    text: string;
}

export async function sendEmail(message: Message): Promise<void> {
    console.log("Key: ", process.env.SENDGRID_API_KEY);
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send(message);
}