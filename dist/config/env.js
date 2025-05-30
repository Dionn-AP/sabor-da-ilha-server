"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({
    path: path_1.default.resolve(__dirname, "../../.env"),
});
// Set the timezone to Brazil
process.env.TZ = "America/Sao_Paulo";
const config = {
    db: {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5433", 10),
        name: process.env.DB_NAME || "lanchonete_db",
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgresql",
    },
    app: {
        port: parseInt(process.env.PORT || "3000", 10),
        env: process.env.NODE_ENV || "development",
        timezone: process.env.TIMEZONE || "America/Sao_Paulo",
    },
    jwt: {
        secret: process.env.JWT_SECRET || "sabordailha123",
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    },
    bcrypt: {
        saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10),
    },
};
exports.default = config;
