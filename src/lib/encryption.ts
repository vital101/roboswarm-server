import { createEncryptor } from "simple-encryptor";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "test-key";
const encryptor = createEncryptor({
    key: ENCRYPTION_KEY,
    hmac: false, debug:
    false
});

export function encrypt(text: string): string {
    return encryptor.encrypt(text);
}

export function decrypt(text: string): string {
    return encryptor.decrypt(text);
}