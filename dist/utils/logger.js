"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const { combine, timestamp, printf, colorize, align } = winston_1.default.format;
const logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
    format: combine(colorize({ all: true }), timestamp({
        format: "YYYY-MM-DD HH:mm:ss.SSS",
    }), align(), printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)),
    transports: [new winston_1.default.transports.Console()],
});
exports.logger = logger;
