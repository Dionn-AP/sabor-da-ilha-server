import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import ProductController from "../controllers/product.controller";
import { UserRole } from "../models/user.model";
import { validate } from "../middlewares/validate.middleware";
import { productSchema } from "../validations/product.validation";

const router = Router();

// Rotas públicas
router.get(
  "/products",
  authenticate,
  authorize([
    UserRole.ATTENDANT,
    UserRole.MANAGER,
    UserRole.STOCK,
    UserRole.KITCHEN,
    UserRole.MASTER,
  ]),
  ProductController.listActiveProducts
);

// Rotas autenticadas
router.post(
  "/",
  authenticate,
  authorize([UserRole.MANAGER, UserRole.MASTER, UserRole.STOCK]),
  validate(productSchema),
  ProductController.createProduct
);

router.put(
  "/:id",
  authenticate,
  authorize([UserRole.MANAGER, UserRole.MASTER, UserRole.STOCK]),
  validate(productSchema),
  ProductController.updateProduct
);

router.patch(
  "/:id/status",
  authenticate,
  authorize([UserRole.MANAGER, UserRole.MASTER, UserRole.STOCK]),
  ProductController.toggleProductStatus
);

export default router;
