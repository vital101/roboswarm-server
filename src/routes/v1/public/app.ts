import * as express from "express";
import { getIndexPath } from "../../../lib/lib";

const router = express.Router();

const indexPath: string = getIndexPath();

router.route("/")
    .get(async (req: express.Request, res: express.Response) => {
        res.status(200);
        res.sendFile(indexPath);
    });

export default router;
