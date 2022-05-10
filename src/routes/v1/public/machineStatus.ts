import * as express from "express";
import * as interfaces from "../../../interfaces/machineStatus.interface";
import * as Machine from "../../../models/Machine";
import * as SwarmMachine from "../../../models/SwarmMachine";
import * as  Swarm from "../../../models/Swarm";
import { getLocalFilePathBySwarmId } from "../../../models/LoadTestFile";

const router = express.Router();

router.route("/:id/status")
    .post(async (req: interfaces.MachineStatusRequest, res: interfaces.MachineStatusResponse) => {
        const machineId = Number(req.params.id);
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
            case "setup_complete":
                // Mark that the machine setup complete.
                await Machine.updateSetupCompleteStatus(machineId, true);
                const swarmId = await SwarmMachine.getSwarmIdByMachineId(machineId);

                // Mark if the swarm setup is complete.
                const machines: Machine.Machine[] = await SwarmMachine.getSwarmMachines(swarmId);
                const machineCount: number = machines.length - 1;
                const setupCompleteCount: number = machines
                    .filter(m => !m.is_master)
                    .filter(m => m.setup_complete)
                    .length;
                await Swarm.updateLoadTestStarted(swarmId, !!(machineCount === setupCompleteCount));
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

export default router;
