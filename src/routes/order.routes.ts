import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import OrderController from "../controllers/order.controller";
import { UserRole } from "../models/user.model";

const router = Router();

// Rotas para atendentes
router.post(
  "/order",
  authenticate,
  authorize([UserRole.ATTENDANT, UserRole.MANAGER, UserRole.MASTER]),
  OrderController.createOrder
);

router.get(
  "/orders",
  authenticate,
  authorize([UserRole.KITCHEN, UserRole.ATTENDANT, UserRole.MANAGER]),
  OrderController.listOrders
);

// Rotas para cozinha
router.patch(
  "/:id/status",
  authenticate,
  authorize([UserRole.KITCHEN, UserRole.MANAGER, UserRole.MASTER]),
  OrderController.updateOrderStatus
);

// Rotas para gerentes
router.get(
  "/report",
  authenticate,
  authorize([UserRole.MANAGER, UserRole.MASTER]),
  OrderController.getOrderReport
);

export default router;
