import * as express from "express";

const router = express.Router();

router.route("/")
    .get(async (req: express.Request, res: express.Response) => {
        res.status(200);
        res.sendFile("/var/www/roboswarm-static/static/dist/index.html");
    });

export default router;
