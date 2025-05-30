"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const env_1 = __importDefault(require("./config/env"));
const startServer = async () => {
    try {
        await (0, database_1.connectDB)();
        app_1.default.listen(env_1.default.app.port, () => {
            console.log(`Server is running on port ${env_1.default.app.port}`);
            console.log(`Environment: ${env_1.default.app.env}`);
            console.log(`Timezone: ${env_1.default.app.timezone}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};
startServer();
