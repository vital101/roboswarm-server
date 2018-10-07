// Environment variables
require("dotenv").config();

// 3rd Party modules
import * as express from "express";
import * as bodyParser from "body-parser";
import * as jwt from "express-jwt";
import * as cors from "cors";

// Private routes
import _swarmRoutes from "./routes/v1/private/swarm";

// Public Routes
import userRoutes from "./routes/v1/public/user";

// JWT Config
const jwtConfig = { secret: process.env.JWT_SECRET };

// Create Express server
const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// Public API
app.use("/api/v1/public/user", userRoutes);

// Private API
app.use("/api/v1/swarm", jwt(jwtConfig), _swarmRoutes);

// Error handler
// app.use((req: any, res: any, next: any) => {
//     res.status(500);
//     res.json(err);
// });

module.exports = app;