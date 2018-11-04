import { Router } from "express";
import * as Swarm from "../../../models/Swarm";
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
}

interface LoadTestMetricsResponse extends RoboResponse {
    json: (metrics: LoadTestMetrics) => any;
}

interface LoadTestMetricsRequest extends RoboRequest {
    body: LoadTestMetricsQuery;
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
            const data: LoadTestMetrics = {
                requests: await LoadTest.getRequestsInRange(req.params.id, req.body.lastRequestId),
                distribution: await LoadTest.getDistributionsInRange(req.params.id, req.body.lastDistributionId)
            };
            res.status(200);
            res.json(data);
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
        const limit = 10;
        const swarms: Array<Swarm.Swarm> = await Swarm.getByGroupId(req.user.groupId, limit);
        res.status(200);
        res.json(swarms);
    })
    .post(async (req: NewSwarmRequest, res: RoboResponse) => {
        // Always add one machine to the pool so it can be master.
        req.body.machines.push({ region: req.body.machines[0].region });
        const user: User.User = await User.getById(req.user.id);
        const canProceed: boolean|RoboError = await canCreateSwarm(user, req.body);
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
