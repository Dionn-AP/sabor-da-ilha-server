"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = exports.connectDB = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const env_1 = __importDefault(require("./env"));
const user_model_1 = require("../models/user.model");
const order_model_1 = require("../models/order.model");
const product_model_1 = require("../models/product.model");
const inventory_model_1 = require("../models/inventory.model");
const sequelize = new sequelize_typescript_1.Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    protocol: "postgres",
    models: [user_model_1.User, order_model_1.Order, product_model_1.Product, inventory_model_1.Inventory],
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
    logging: false,
    retry: {
        max: 5,
        timeout: 30000,
    },
});
exports.sequelize = sequelize;
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connection to the database has been established successfully.");
        if (env_1.default.app.env === "development") {
            await sequelize.sync({ alter: false });
            console.log("Database synchronized.");
        }
    }
    catch (error) {
        console.error("Unable to connect to the database:", error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
