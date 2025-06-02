import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import OrderController from "../controllers/order.controller";
import { validate } from "../middlewares/validate.middleware";
import { loginSchema, registerSchema } from "../validations/auth.validation";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.post("/login", validate(loginSchema), AuthController.login);
router.post("/register", validate(registerSchema), AuthController.register);
router.get("/users", authenticate, AuthController.listUsers);

export default router;
