import { Request, Response } from "express";

export enum Status {
    destroyed = "destroyed",
    new = "new",
    ready = "ready",
    building = "building",
    active = "active"
}

export interface RoboRequest extends Request {
    user: TokenizedUser;
}

export interface RoboResponse extends Response {
}

export interface TokenizedUser {
    id: number;
    groupId: number;
    email: string;
}

export interface RoboError {
    err: string;
    status: number;
}