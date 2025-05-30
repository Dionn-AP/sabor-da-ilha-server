import { Router } from "express";
import authRoutes from "./auth.routes";
import orderRoutes from "./order.routes";
import productRoutes from "./product.routes";
import reportRoutes from "./report.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/orders", orderRoutes);
router.use("/products", productRoutes);
router.use("/reports", reportRoutes);

export default router;
