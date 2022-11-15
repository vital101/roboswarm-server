import { Request, Response } from "express";
import { Machine } from "../models/Machine";

export interface MachineStatusRequest extends Request {
    params: {
        id: string;
    };
    body: {
        action: string;
        ip_address?: string;
    };
}

export interface MachineStatusResponse extends Response {
    json: (data: Machine) => any;
}

export interface MachineTemplateRequest extends Request {
    params: {
        id: string;
    };
}

export interface MachineTemplateResponse extends Response {}

export interface MachineIsMasterRequest extends Request {
    params: {
        id: string;
    };
}

export interface ShouldSendFinalDataResponse extends Response {
    json: (result: boolean) => any;
}

export interface SwarmFinalMetricsRequest extends Request {
    params: {
        id: string;
    };
    body: Array<Array<string>>;
}

export interface SwarmFailureMetricsRequest extends Request {
    params: {
        id: string;
    };
    body: Array<Array<string>>;
}

export interface SwarmRouteSpecificMetricsRequest extends Request {
    params: {
        id: string;
    };
    body: Array<Array<string>>;
}

export interface AggregateDataRequest extends Request {
    params: {
        id: string;
    };
    body: Array<string>;
}