"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const order_controller_1 = __importDefault(require("../controllers/order.controller"));
const user_model_1 = require("../models/user.model");
const router = (0, express_1.Router)();
// Rotas para atendentes
router.post("/order", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([user_model_1.UserRole.ATTENDANT, user_model_1.UserRole.MANAGER, user_model_1.UserRole.MASTER]), order_controller_1.default.createOrder);
router.get("/orders", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([user_model_1.UserRole.KITCHEN, user_model_1.UserRole.ATTENDANT, user_model_1.UserRole.MANAGER]), order_controller_1.default.listOrders);
// Rotas para cozinha
router.patch("/:id/status", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([user_model_1.UserRole.KITCHEN, user_model_1.UserRole.MANAGER, user_model_1.UserRole.MASTER]), order_controller_1.default.updateOrderStatus);
// Rotas para gerentes
router.get("/report", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([user_model_1.UserRole.MANAGER, user_model_1.UserRole.MASTER]), order_controller_1.default.getOrderReport);
exports.default = router;
