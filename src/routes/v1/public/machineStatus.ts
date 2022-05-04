import * as express from "express";
import * as interfaces from "../../../interfaces/machineStatus.interface";
import * as Machine from "../../../models/Machine";
import * as SwarmMachine from "../../../models/SwarmMachine";
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

export default router;
