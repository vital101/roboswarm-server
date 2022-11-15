import * as express from "express";
import * as interfaces from "../../../interfaces/machineStatus.interface";
import * as Machine from "../../../models/Machine";
import * as SwarmMachine from "../../../models/SwarmMachine";
import * as  Swarm from "../../../models/Swarm";
import { getLocalFilePathBySwarmId } from "../../../models/LoadTestFile";
import { RoboResponse } from "../../../interfaces/shared.interface";
import * as LoadTest from "../../../models/LoadTest";
import * as LoadTestError from "../../../models/LoadTestError";

const router = express.Router();

router.route("/:id/status")
    .post(async (req: interfaces.MachineStatusRequest, res: interfaces.MachineStatusResponse) => {
        const machineId = Number(req.params.id);
        let swarmId: number;
        switch (req.body.action) {
            case "port_open_complete":
                await Machine.update(machineId, { port_open_complete: true });
                break;
            case "dependency_install_complete":
                await Machine.updateDependencyInstallComplete(machineId, true);
                break;
            case "test_started":
                await Machine.update(machineId, { test_started: true });
                break;
            case "is_master":
                const machine: Machine.Machine = await Machine.findById(machineId);
                await Machine.setIsMaster(machine);
                break;
            case "is_ready":
                const m: Machine.Machine = await Machine.findById(machineId);
                await Machine.setReadyAtAndIp(m, req.body.ip_address);
                break;
            case "master_started_complete":
                await Machine.update(machineId, { test_started: true });
                break;
            case "file_transfer_complete":
                await Machine.update(machineId, { file_transfer_complete: true });
                break;
            case "setup_complete":
                // Mark that the machine setup complete.
                await Machine.updateSetupCompleteStatus(machineId, true);
                swarmId = await SwarmMachine.getSwarmIdByMachineId(machineId);

                // Mark if the swarm setup is complete.
                const machines: Machine.Machine[] = await SwarmMachine.getSwarmMachines(swarmId);
                const machineCount: number = machines.length - 1;
                const setupCompleteCount: number = machines
                    .filter(m => !m.is_master)
                    .filter(m => m.setup_complete)
                    .length;
                await Swarm.updateLoadTestStarted(swarmId, !!(machineCount === setupCompleteCount));
                break;
            case "final_data_sent":
                swarmId = await SwarmMachine.getSwarmIdByMachineId(machineId);
                await Swarm.update(swarmId, {
                    final_data_sent: true
                });
                break;
        }
        res.status(200);
        res.json(await Machine.findById(machineId));
    });

router.route("/:id/template")
    .get(async (req: interfaces.MachineTemplateRequest, res: interfaces.MachineTemplateResponse) => {
        const machineId: number = Number(req.params.id);
        const swarmId: number = await SwarmMachine.getSwarmIdByMachineId(machineId);
        const filePath: string = await getLocalFilePathBySwarmId(swarmId);
        res.status(200);
        res.download(filePath, "template.zip");
    });

router.route("/:id/is-master")
    .get(async (req: interfaces.MachineIsMasterRequest, res: express.Response) => {
        const machineId: number = Number(req.params.id);
        const m: Machine.Machine = await Machine.findById(machineId);
        res.status(200);
        res.send(m.is_master);
    });

router.route("/:id/is-master-started")
    .get(async (req: interfaces.MachineIsMasterRequest, res: express.Response) => {
        const machineId: number = Number(req.params.id);
        const swarmId: number = await SwarmMachine.getSwarmIdByMachineId(machineId);
        const machines: Machine.Machine[] = await SwarmMachine.getSwarmMachines(swarmId);
        const master: Machine.Machine = machines.find(m => m.is_master);
        res.status(200);
        res.send(master ? master.test_started : false);
    });

router.route("/:id/master-ip")
    .get(async (req: interfaces.MachineIsMasterRequest, res: express.Response) => {
        const machineId: number = Number(req.params.id);
        const swarmId: number = await SwarmMachine.getSwarmIdByMachineId(machineId);
        const machines: Machine.Machine[] = await SwarmMachine.getSwarmMachines(swarmId);
        const master: Machine.Machine = machines.find(m => m.is_master);
        res.status(200);
        res.send(master.ip_address);
    });

router.route("/:id/should-send-final-data")
    .get(async (req: interfaces.MachineIsMasterRequest, res: interfaces.ShouldSendFinalDataResponse) => {
        const swarmId = await SwarmMachine.getSwarmIdByMachineId(Number(req.params.id));
        const swarm = await Swarm.getById(swarmId);
        res.status(200);
        res.json(swarm.should_send_final_data);
    });

router.route("/:id/aggregate-data")
    .post(async (req: interfaces.AggregateDataRequest, res: RoboResponse) => {
        const swarmId = await SwarmMachine.getSwarmIdByMachineId(Number(req.params.id));
        const createdAt = new Date();

        // Request status.
        const requestTotalData: LoadTest.Request = {
            swarm_id: swarmId,
            created_at: createdAt,
            user_count: parseFloat(req.body[1]),
            requests: parseFloat(req.body[17]),
            failures: parseFloat(req.body[18]),
            median_response_time: parseFloat(req.body[19]),
            average_response_time: parseFloat(req.body[20]),
            min_response_time: parseFloat(req.body[21]),
            max_response_time: parseFloat(req.body[22]),
            avg_content_size: parseFloat(req.body[23]),
            requests_per_second: Math.floor(parseFloat(req.body[4])),
            failures_per_second: Math.floor(parseFloat(req.body[5]))
        };
        await LoadTest.createRequest(requestTotalData);

        // Response time distribution.
        const distributionTotalData: LoadTest.Distribution = {
            swarm_id: swarmId,
            created_at: createdAt,
            requests: requestTotalData.requests,
            percentiles: JSON.stringify({
                "50%": parseFloat(req.body[6]),
                "66%": parseFloat(req.body[7]),
                "75%": parseFloat(req.body[8]),
                "80%": parseFloat(req.body[9]),
                "90%": parseFloat(req.body[10]),
                "95%": parseFloat(req.body[11]),
                "98%": parseFloat(req.body[12]),
                "99%": parseFloat(req.body[13]),
                "100%": parseFloat(req.body[16]),
            })
        };
        await LoadTest.createDistribution(distributionTotalData);
        res.status(201);
        res.send("OK");
    });

router.route("/:id/failure-metrics")
    .post(async (req: interfaces.SwarmFailureMetricsRequest, res: RoboResponse) => {
        try {
            const swarmId = await SwarmMachine.getSwarmIdByMachineId(Number(req.params.id));
            const promises: Array<Promise<void>> = [];
            req.body.forEach(rowData => {
                const error_count = parseInt(rowData.pop(), 10);
                let message = "";
                for (let i = 2; i < rowData.length; i++) {
                    message += `,${rowData[i]}`;
                }
                const lte: LoadTestError.LoadTestError = {
                    swarm_id: swarmId,
                    method: rowData[0],
                    path: rowData[1],
                    message,
                    error_count,
                };
                console.log(lte);
                promises.push(LoadTestError.create(lte));
            });
            await Promise.all(promises);
        } catch (err) {
            console.log("Error fetching load test errors: ", {
                err,
                machine_id: req.params.id,
                rows: req.body
            });
        }
        res.status(201);
        res.send("OK");
    });

router.route("/:id/final-metrics")
    .post(async (req: interfaces.SwarmFinalMetricsRequest, res: RoboResponse) => {
        const swarmId = await SwarmMachine.getSwarmIdByMachineId(Number(req.params.id));
        const createdAt = new Date();
        for (const row of req.body) {
            try {
                const data: LoadTest.RequestFinal = {
                    swarm_id: swarmId,
                    created_at: createdAt,
                    method: row[0],
                    route: row[1],
                    requests: parseFloat(row[2]),
                    failures: parseFloat(row[3]),
                    median_response_time: parseFloat(row[4]),
                    average_response_time: parseFloat(row[5]),
                    min_response_time: parseFloat(row[6]),
                    max_response_time: parseFloat(row[7]),
                    avg_content_size: parseFloat(row[8]),
                    requests_per_second: parseFloat(row[9])
                };
                await LoadTest.createRequestFinal(data);

                // Response time distribution per route.
                const distributionTotalData: LoadTest.DistributionFinal = {
                    swarm_id: swarmId,
                    method: data.method,
                    route: data.route,
                    created_at: createdAt,
                    requests: data.requests,
                    percentiles: JSON.stringify({
                        "50%": parseFloat(row[11]),
                        "66%": parseFloat(row[12]),
                        "75%": parseFloat(row[13]),
                        "80%": parseFloat(row[14]),
                        "90%": parseFloat(row[15]),
                        "95%": parseFloat(row[16]),
                        "98%": parseFloat(row[17]),
                        "99%": parseFloat(row[18]),
                        "100%": parseFloat(row[21]),
                    })
                };
                await LoadTest.createDistributionFinal(distributionTotalData);
            } catch (err) {
                console.log("Request row final error: ", err);
            }
        }
        res.status(200);
        res.send("OK");
    });

export default router;
