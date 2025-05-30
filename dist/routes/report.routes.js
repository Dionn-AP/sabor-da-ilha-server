"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const report_controller_1 = __importDefault(require("../controllers/report.controller"));
const user_model_1 = require("../models/user.model");
const router = (0, express_1.Router)();
router.get("/sales", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([user_model_1.UserRole.MANAGER, user_model_1.UserRole.CASHIER, user_model_1.UserRole.MASTER]), report_controller_1.default.getSalesReport);
router.get("/inventory", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([user_model_1.UserRole.MANAGER, user_model_1.UserRole.STOCK, user_model_1.UserRole.MASTER]), report_controller_1.default.getInventoryReport);
router.get("/financial", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([user_model_1.UserRole.MANAGER, user_model_1.UserRole.MASTER]), report_controller_1.default.getFinancialReport);
exports.default = router;
