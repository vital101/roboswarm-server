import * as express from "express";

const router = express.Router();

router.route("/")
    .get((req: express.Request, res: express.Response) => {
        res.status(200);
        res.render("home", {
            NODE_ENV: process.env.NODE_ENV
        });
    });

export default router;