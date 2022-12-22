import { Request, Response, NextFunction } from "express";

export function validateServiceKey(req: Request, res: Response, next: NextFunction) {
    const incomingServiceKey = req.headers.authorization;
    if (incomingServiceKey !== process.env.SERVICE_KEY) {
        res.status(401);
        res.send("Invalid service key.");
    } else {
        next();
    }
}