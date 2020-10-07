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

export function canSelectPlan(user: User, plan: string): boolean {
    const requiresCard = ["2020-roboswarm-startup", "2020-roboswarm-enterprise"];
    if (requiresCard.includes(plan)) {
        if (user.is_beta) {
            return true;
        } else {
            return !!(user.stripe_card_id);
        }
    } else {
        return true;
    }
}