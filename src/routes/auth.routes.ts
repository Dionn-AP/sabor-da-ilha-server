import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { loginSchema, registerSchema } from "../validations/auth.validation";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { UserRole } from "@models/user.model";

const router = Router();

router.post("/login", validate(loginSchema), AuthController.login);
router.post("/register", validate(registerSchema), AuthController.register);
router.get(
  "/users",
  authenticate,
  authorize([UserRole.MANAGER, UserRole.MASTER]),
  AuthController.listUsers
);
router.get(
  "/users/inactive",
  authenticate,
  authorize([UserRole.MANAGER, UserRole.MASTER]),
  AuthController.listInactiveUsers
);

router.patch(
  "/users/:id/activate",
  authenticate,
  authorize([UserRole.MANAGER, UserRole.MASTER]),
  AuthController.activateUser
);

export default router;
