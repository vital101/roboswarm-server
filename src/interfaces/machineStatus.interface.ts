import { Request, Response } from "express";
import { Machine } from "../models/Machine";
import { RoboResponse } from "./shared.interface";

interface MachineStatusRouteRequest extends Request {
    params: {
        id: string;
    };
}

export interface MachineStatusRequest extends MachineStatusRouteRequest {
    body: {
        action: string;
        ip_address?: string;
    };
}

export interface MachineStatusResponse extends Response {
    json: (data: Machine) => any;
}

export interface DataWatchResponse extends RoboResponse {}

export interface DataWatchRequest extends MachineStatusRequest { }
export interface MachineTemplateRequest extends MachineStatusRouteRequest { }

export interface MachineTemplateResponse extends Response {}

export interface MachineIsMasterRequest extends MachineStatusRouteRequest { }

export interface ShouldSendFinalDataResponse extends Response {
    json: (result: {
        should_send_final_data: boolean;
    }) => any;
}

export interface IsSwarmReadyResponse extends Response {
    json: (result: {
        is_swarm_ready: boolean;
    }) => any;
}

export interface SwarmFinalMetricsRequest extends MachineStatusRouteRequest {
    body: Array<Array<string>>;
}

export interface SwarmFailureMetricsRequest extends MachineStatusRouteRequest {
    body: Array<Array<string>>;
}

export interface MachineIsSwarmReadyRequest extends MachineStatusRouteRequest { }

export interface SwarmRouteSpecificMetricsRequest extends MachineStatusRouteRequest {
    body: Array<Array<string>>;
}

export interface AggregateDataRequest extends MachineStatusRouteRequest {
    body: Array<string>;
}