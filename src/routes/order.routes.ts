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
  authorize([
    UserRole.KITCHEN,
    UserRole.ATTENDANT,
    UserRole.MANAGER,
    UserRole.MASTER,
  ]),
  OrderController.listOrders
);

router.get(
  "/history",
  authenticate,
  authorize([
    UserRole.ATTENDANT,
    UserRole.MANAGER,
    UserRole.MASTER,
    UserRole.KITCHEN,
  ]),
  OrderController.getOrderHistory
);

router.patch(
  "/:id/status",
  authenticate,
  authorize([
    UserRole.ATTENDANT,
    UserRole.KITCHEN,
    UserRole.MANAGER,
    UserRole.MASTER,
  ]),
  OrderController.updateOrderStatus
);

router.get(
  "/list/kitchen/orders",
  authenticate,
  authorize([UserRole.KITCHEN, UserRole.MANAGER, UserRole.MASTER]),
  OrderController.getKitchenOrders
);

// Rotas para gerentes
router.get(
  "/report",
  authenticate,
  authorize([UserRole.MANAGER, UserRole.MASTER]),
  OrderController.getOrderReport
);

export default router;
