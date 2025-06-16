"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const product_controller_1 = __importDefault(require("../controllers/product.controller"));
const user_model_1 = require("../models/user.model");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const product_validation_1 = require("../validations/product.validation");
const router = (0, express_1.Router)();
// Rotas públicas
router.get("/products", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([
    user_model_1.UserRole.ATTENDANT,
    user_model_1.UserRole.MANAGER,
    user_model_1.UserRole.STOCK,
    user_model_1.UserRole.KITCHEN,
    user_model_1.UserRole.MASTER,
]), product_controller_1.default.listActiveProducts);
// Rotas autenticadas
router.post("/", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([user_model_1.UserRole.MANAGER, user_model_1.UserRole.MASTER, user_model_1.UserRole.STOCK]), (0, validate_middleware_1.validate)(product_validation_1.productSchema), product_controller_1.default.createProduct);
router.put("/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([user_model_1.UserRole.MANAGER, user_model_1.UserRole.MASTER, user_model_1.UserRole.STOCK]), (0, validate_middleware_1.validate)(product_validation_1.productSchema), product_controller_1.default.updateProduct);
router.patch("/:id/status", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([user_model_1.UserRole.MANAGER, user_model_1.UserRole.MASTER, user_model_1.UserRole.STOCK]), product_controller_1.default.toggleProductStatus);
exports.default = router;
