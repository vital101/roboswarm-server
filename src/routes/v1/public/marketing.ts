import * as express from "express";
import * as moment from "moment";

const router = express.Router();

router.route("/")
    .get((req: express.Request, res: express.Response) => {
        res.status(200);
        res.render("home", {
            NODE_ENV: process.env.NODE_ENV,
            currentYear: moment().format("YYYY")
        });
    });

export default router;