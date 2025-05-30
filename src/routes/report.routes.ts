import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import ReportController from "../controllers/report.controller";
import { UserRole } from "../models/user.model";

const router = Router();

router.get(
  "/sales",
  authenticate,
  authorize([UserRole.MANAGER, UserRole.CASHIER, UserRole.MASTER]),
  ReportController.getSalesReport
);

router.get(
  "/inventory",
  authenticate,
  authorize([UserRole.MANAGER, UserRole.STOCK, UserRole.MASTER]),
  ReportController.getInventoryReport
);

router.get(
  "/financial",
  authenticate,
  authorize([UserRole.MANAGER, UserRole.MASTER]),
  ReportController.getFinancialReport
);

export default router;
