import { User } from "../models/User";
import { sign } from "jsonwebtoken";

export interface TokenData {
    id: number;
    groupId: number;
    email: string;
}

export function isValidAuthBody(userData: any): boolean {
    return userData.email !== undefined && userData.password !== undefined;
}

export function isValidUserBody(userData: User): boolean {
    return userData.email !== undefined &&
           userData.first_name !== undefined &&
           userData.last_name !== undefined &&
           userData.password !== undefined;
}

export function getUserToken(data: TokenData): string {
    return sign({
        id: data.id,
        email: data.email,
        groupId: data.groupId
    }, process.env.JWT_SECRET);
}