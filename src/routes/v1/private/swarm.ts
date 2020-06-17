import { Router } from "express";
import * as Swarm from "../../../models/Swarm";
import * as Machine from "../../../models/Machine";
import * as SwarmMachine from "../../../models/SwarmMachine";
import * as LoadTest from "../../../models/LoadTest";
import * as User from "../../../models/User";
import { RoboRequest, RoboResponse, RoboError } from "../../../interfaces/shared.interface";
import { canCreateSwarm } from "../../../lib/authorization";
import * as multer from "multer";

interface NewSwarmRequest extends RoboRequest {
    body: Swarm.NewSwarm;
}

interface LoadTestMetrics {
    requests: LoadTest.Request[];
    distribution: LoadTest.Distribution[];
}

interface LoadTestMetricsFinal {
    requests: LoadTest.RequestFinal[];
    distribution: LoadTest.DistributionFinal[];
}

interface LoadTestMetricsQuery {
    lastDistributionId: number;
    lastRequestId: number;
    showAll: boolean;
}

interface LoadTestMetricsResponse extends RoboResponse {
    json: (metrics: LoadTestMetrics) => any;
}

interface LoadTestMetricsRequest extends RoboRequest {
    body: LoadTestMetricsQuery;
}

interface RepeatSwarmResponse extends RoboResponse {
    json: (newSwarm: Swarm.Swarm) => any;
}

interface IPAddress {
    ip_address: string;
    traceroute: string;
}

interface LoadTestIpAddressesResponse extends RoboResponse {
    json: (ips: IPAddress[]) => any;
}

interface GroupedSwarmResponse extends RoboResponse {
    json: (swarms: Swarm.GroupedSwarm[]) => any;
}

const router = Router();

// Note: This is still used by Kernl. DO NOT REMOVE.
const dest = process.env.FILE_UPLOAD_PATH || "uploads/";
const upload = multer({ dest });
router.route("/file-upload")
    .post(upload.single("loadTestData"),
        (req: RoboRequest, res: RoboResponse) => {
            res.status(201);
            res.json({
                filePath: req.file.path
            });
        });

router.route("/:id/metrics/final")
    .get(async (req: RoboRequest, res: RoboResponse) => {
        const id: number = parseInt(req.params.id, 10);
        const swarm: Swarm.Swarm = await Swarm.getById(id);
        if (swarm.group_id !== req.user.groupId) {
            res.status(401);
            res.send("Unauthorized.");
            return;
        }
        const finalData: LoadTestMetricsFinal = {
            requests: await LoadTest.getRequestsFinal(id),
            distribution: await LoadTest.getDistributionFinal(id)
        };
        res.status(200);
        res.json(finalData);
    });

router.route("/:id/metrics")
    .post(async (req: LoadTestMetricsRequest, res: LoadTestMetricsResponse) => {
        const id: number = parseInt(req.params.id, 10);
        const swarm: Swarm.Swarm = await Swarm.getById(id);
        if (swarm.group_id !== req.user.groupId) {
            res.status(401);
            res.send("Unauthorized.");
            return;
        }
        try {
            const totalRequestRows: number = await LoadTest.getTotalRequestRows(id, req.body.lastRequestId);
            const totalDistributionRows: number = await LoadTest.getTotalDistributionRows(id, req.body.lastDistributionId);
            const requestRowsBetweenPoints: number = LoadTest.getRowsInBetweenPoints(totalRequestRows);
            const distributionRowsBetweenPoints: number = LoadTest.getRowsInBetweenPoints(totalDistributionRows);
            let rowsBetweenPoints: number = requestRowsBetweenPoints > distributionRowsBetweenPoints ? requestRowsBetweenPoints : distributionRowsBetweenPoints;
            if (req.body.showAll) { rowsBetweenPoints = 1; }
            const data: LoadTestMetrics = {
                requests: await LoadTest.getRequestsInRange(id, rowsBetweenPoints, req.body.lastRequestId, ),
                distribution: await LoadTest.getDistributionsInRange(id, rowsBetweenPoints, req.body.lastDistributionId)
            };

            res.status(200);
            res.json(data);
        } catch (err) {
            res.status(500);
            res.json(err);
        }
    });

router.route("/:id/ip-addresses")
    .get(async (req: RoboRequest, res: LoadTestIpAddressesResponse) => {
        const id: number = parseInt(req.params.id, 10);
        const swarm: Swarm.Swarm = await Swarm.getById(id);
        if (swarm.group_id !== req.user.groupId) {
            res.status(401);
            res.send("Unauthorized.");
            return;
        }
        const machines: Machine.Machine[] = await SwarmMachine.getSwarmMachines(id);
        const ips: IPAddress[] = machines
            .filter(m => !m.is_master)
            .map(m => {
                return {
                    ip_address: m.ip_address,
                    traceroute: m.traceroute
                };
            });
        res.status(200);
        res.json(ips);
    });

router.route("/:id/repeat")
    .post(async (req: RoboRequest, res: RepeatSwarmResponse) => {
        const id: number = parseInt(req.params.id, 10);
        const swarm: Swarm.Swarm = await Swarm.getById(id);
        if (swarm.group_id !== req.user.groupId) {
            res.status(401);
            res.send("Unauthorized.");
            return;
        }
        const newSwarm: Swarm.NewSwarm = await Swarm.createRepeatSwarmRequest(id);
        if (req.body && req.body.kernl_test) { newSwarm.kernl_test = req.body.kernl_test; }
        const user: User.User = await User.getById(req.user.id);
        const isReliabilityTest = !!(newSwarm.simulated_users <= 25 && newSwarm.duration > 120);
        const canProceed: boolean | RoboError = await canCreateSwarm(user, newSwarm, isReliabilityTest);
        if (canProceed !== true) {
            const err = canProceed as RoboError;
            res.status(err.status);
            res.send(err.err);
        } else {
            try {
                const mySwarm: Swarm.Swarm = await Swarm.create(newSwarm, req.user.id, req.user.groupId);
                res.status(201);
                res.json(mySwarm);
            } catch (err) {
                res.status(500);
                res.send("There was an error creating your new swarm.");
            }
        }
    });

router.route("/:id/soft-delete")
    .delete(async (req: RoboRequest, res: RoboResponse) => {
        const id: number = parseInt(req.params.id, 10);
        const swarm: Swarm.Swarm = await Swarm.getById(id);
        if (swarm.group_id !== req.user.groupId) {
            res.status(401);
            res.send("Unauthorized.");
            return;
        }
        try {
            await Swarm.softDelete(id, req.user.groupId);
            res.status(204);
            res.send("ok");
        } catch (err) {
            res.status(500);
            res.json(err);
        }
    });

router.route("/:id")
    .delete(async (req: RoboRequest, res: RoboResponse) => {
        const id: number = parseInt(req.params.id, 10);
        const swarm: Swarm.Swarm = await Swarm.getById(id);
        if (swarm.group_id !== req.user.groupId) {
            res.status(401);
            res.send("Unauthorized.");
            return;
        }
        try {
            await Swarm.destroyById(id, req.user.groupId);
            res.status(204);
            res.send("ok");
        } catch (err) {
            res.status(500);
            res.json(err);
        }
    })
    .get(async (req: RoboRequest, res: RoboResponse) => {
        const id: number = parseInt(req.params.id, 10);
        const swarm: Swarm.Swarm = await Swarm.getById(id);
        if (swarm.group_id !== req.user.groupId) {
            res.status(401);
            res.send("Unauthorized.");
            return;
        }
        try {
            const swarm: Swarm.Swarm = await Swarm.getById(id);
            res.status(200);
            res.json(swarm);
        } catch (err) {
            res.status(500);
            res.json(err);
        }
    });

router.route("/")
    .get(async (req: RoboRequest, res: RoboResponse) => {
        const swarms: Array<Swarm.Swarm> = await Swarm.getByGroupId(req.user.groupId);
        res.status(200);
        res.json(swarms);
    })
    .post(async (req: NewSwarmRequest, res: RoboResponse) => {
        // Always add one machine to the pool so it can be master.
        req.body.machines.push({ region: req.body.machines[0].region });
        const user: User.User = await User.getById(req.user.id);
        const canProceed: boolean|RoboError = await canCreateSwarm(user, req.body, req.body.reliability_test);
        if (canProceed !== true) {
            const err = canProceed as RoboError;
            res.status(err.status);
            res.send(err.err);
        } else {
            try {
                const mySwarm: Swarm.Swarm = await Swarm.create(req.body, req.user.id, req.user.groupId);
                res.status(201);
                res.json(mySwarm);
            } catch (err) {
                console.log(err);
            }
        }
    });

export default router;
