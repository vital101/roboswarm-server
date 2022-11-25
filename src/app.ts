// Environment variables
require("dotenv").config();

// 3rd Party modules
import * as express from "express";
import * as bodyParser from "body-parser";
import { expressjwt as jwt } from "express-jwt";
import * as cors from "cors";
import * as Sentry from "@sentry/node";
import { connect as connectToRedis } from "./lib/events";

// Private routes
import _siteOwnershipRoutes from "./routes/v1/private/siteOwnership";
import _swarmRoutes from "./routes/v1/private/swarm";
import _templateRoutes from "./routes/v1/private/templates";
import _userRoutes from "./routes/v1/private/user";

// Public Routes
import appRoutes from "./routes/v1/public/app";
import marketingRoutes from "./routes/v1/public/marketing";
import userRoutes from "./routes/v1/public/user";
import machineStatusRoutes from "./routes/v1/public/machineStatus";

// JWT Config
const jwtConfig: any = {
    algorithms: ["HS256"],
    secret: process.env.JWT_SECRET
};

// Sentry Config
if (process.env.NODE_ENV === "production") {
    Sentry.init({
        dsn: "https://cd5fd5753af74cf6ba3987e56d95063b@o19973.ingest.sentry.io/5383793"
    });
}

// Start Redis Connection
(async () => {
    await connectToRedis();
})();

// Create Express server
const app = express();

// Sentry Middleware
if (process.env.NODE_ENV === "production") {
    app.use(Sentry.Handlers.requestHandler());
}

// Express configuration
app.set("port", Number(process.env.PORT) || 3000);
app.use(bodyParser.json({ limit: "20000kb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Static marketing files
// if (process.env.NODE_ENV === "development") {
app.use("/marketing-static", express.static("marketing-static"));
// }

// Enable CORS
app.use(cors());

// Set Pug as the view engine
app.set("view engine", "pug");

// Application
app.use("/app", appRoutes);

// Public API
app.use("/api/v1/public/user", userRoutes);
app.use("/api/v1/public/machine", machineStatusRoutes);

// Private API
app.use("/api/v1/site-ownership", jwt(jwtConfig), _siteOwnershipRoutes);
app.use("/api/v1/swarm", jwt(jwtConfig), _swarmRoutes);
app.use("/api/v1/template", jwt(jwtConfig), _templateRoutes);
app.use("/api/v1/user", jwt(jwtConfig), _userRoutes);

// Sitemap
app.get("/sitemap.xml", (req, res) => {
    res.sendFile(`${process.env.APP_ROOT}/views/sitemap.xml`);
});

// Robots.txt
app.get("/robots.txt", (req, res) => {
    res.sendFile(`${process.env.APP_ROOT}/views/robots.txt`);
});

// Marketing Pages
app.use("/", marketingRoutes);

app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
});

// Sentry Error Handler
if (process.env.NODE_ENV === "production") {
    app.use(Sentry.Handlers.errorHandler());
}

// Error handler
app.use((req: any, res: any, next: any) => {
    res.status(500);
    res.json({});
});

module.exports = app;