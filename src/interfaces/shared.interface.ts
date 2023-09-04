import { Request, Response } from "express";

export enum Status {
    destroyed = "destroyed",
    new = "new",
    ready = "ready",
    building = "building",
    active = "active"
}

export interface RoboRequest extends Request {
    auth: TokenizedUser;
}

export interface RoboResponse extends Response {
    // json: (value: object) => any;
    // send: (value: string) => any;
    // status: (value: number) => any;
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