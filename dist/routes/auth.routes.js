"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const validate_middleware_1 = require("../middlewares/validate.middleware");
const auth_validation_1 = require("../validations/auth.validation");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const user_model_1 = require("@models/user.model");
const router = (0, express_1.Router)();
router.post("/login", (0, validate_middleware_1.validate)(auth_validation_1.loginSchema), auth_controller_1.default.login);
router.post("/register", (0, validate_middleware_1.validate)(auth_validation_1.registerSchema), auth_controller_1.default.register);
router.get("/users", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)([user_model_1.UserRole.MANAGER, user_model_1.UserRole.MASTER]), auth_controller_1.default.listUsers);
router.get("/users/inactive", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)([user_model_1.UserRole.MANAGER, user_model_1.UserRole.MASTER]), auth_controller_1.default.listInactiveUsers);
router.patch("/users/:id/activate", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)([user_model_1.UserRole.MANAGER, user_model_1.UserRole.MASTER]), auth_controller_1.default.activateUser);
exports.default = router;
