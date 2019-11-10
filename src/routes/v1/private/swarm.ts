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

const upload = multer({
    dest: process.env.FILE_UPLOAD_PATH || "uploads/"
});
router.route("/file-upload")
    .post(upload.single("loadTestData"),
        (req: RoboRequest, res: RoboResponse) => {
            res.status(201);
            res.json({
                filePath: req.file.path
            });
        });

router.route("/grouped-swarms")
        .get(async (req: RoboRequest, res: GroupedSwarmResponse) => {
        });

router.route("/:id/metrics/final")
    .get(async (req: RoboRequest, res: RoboResponse) => {
        const finalData: LoadTestMetricsFinal = {
            requests: await LoadTest.getRequestsFinal(req.params.id),
            distribution: await LoadTest.getDistributionFinal(req.params.id)
        };
        res.status(200);
        res.json(finalData);
    });

router.route("/:id/metrics")
    .post(async (req: LoadTestMetricsRequest, res: LoadTestMetricsResponse) => {
        try {
            const totalRequestRows: number = await LoadTest.getTotalRequestRows(req.params.id, req.body.lastRequestId);
            const totalDistributionRows: number = await LoadTest.getTotalDistributionRows(req.params.id, req.body.lastDistributionId);
            const requestRowsBetweenPoints: number = LoadTest.getRowsInBetweenPoints(totalRequestRows);
            const distributionRowsBetweenPoints: number = LoadTest.getRowsInBetweenPoints(totalDistributionRows);
            let rowsBetweenPoints: number = requestRowsBetweenPoints > distributionRowsBetweenPoints ? requestRowsBetweenPoints : distributionRowsBetweenPoints;
            if (req.body.showAll) { rowsBetweenPoints = 1; }
            const data: LoadTestMetrics = {
                requests: await LoadTest.getRequestsInRange(req.params.id, rowsBetweenPoints, req.body.lastRequestId, ),
                distribution: await LoadTest.getDistributionsInRange(req.params.id, rowsBetweenPoints, req.body.lastDistributionId)
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
        const machines: Machine.Machine[] = await SwarmMachine.getSwarmMachines(req.params.id);
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
        const newSwarm: Swarm.NewSwarm = await Swarm.createRepeatSwarmRequest(req.params.id);
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
        try {
            await Swarm.softDelete(req.params.id, req.user.groupId);
            res.status(204);
            res.send("ok");
        } catch (err) {
            res.status(500);
            res.json(err);
        }
    });

router.route("/:id")
    .delete(async (req: RoboRequest, res: RoboResponse) => {
        try {
            await Swarm.destroyById(req.params.id, req.user.groupId);
            res.status(204);
            res.send("ok");
        } catch (err) {
            res.status(500);
            res.json(err);
        }
    })
    .get(async (req: RoboRequest, res: RoboResponse) => {
        try {
            const swarm: Swarm.Swarm = await Swarm.getById(req.params.id);
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
