import { Request, Response } from "express";
import { Product, ProductCategory } from "../models/product.model";
import { Inventory } from "../models/inventory.model";
import { InventoryMovementType } from "../models/inventory.model";
import { sequelize } from "../config/database";

export default class ProductController {
  static async listActiveProducts(req: Request, res: Response) {
    try {
      const { category, isActive } = req.query;

      const where: any = {};
      if (isActive !== undefined) {
        where.isActive = isActive === "true";
      }
      if (
        category &&
        Object.values(ProductCategory).includes(category as ProductCategory)
      ) {
        where.category = category;
      }

      const products = await Product.findAll({
        where,
        order: [["name", "ASC"]],
      });

      res.json(products);
    } catch (error) {
      console.error("Error listing products:", error);
      res.status(500).json({ message: "Erro ao listar produtos" });
    }
  }

  static async createProduct(req: Request, res: Response) {
    const transaction = await sequelize.transaction();

    try {
      const {
        name,
        description,
        price,
        category,
        preparationTime,
        imageUrl,
        initialStock,
      } = req.body;

      const product = await Product.create(
        {
          name,
          description,
          price,
          category,
          preparationTime,
          imageUrl,
          isActive: true,
        },
        { transaction }
      );

      // Registrar estoque inicial se fornecido
      if (initialStock) {
        await Inventory.create(
          {
            productId: product.id,
            movementType: InventoryMovementType.ENTRY,
            quantity: initialStock,
            description: "Estoque inicial",
          },
          { transaction }
        );
      }

      await transaction.commit();
      res.status(201).json(product);
    } catch (error) {
      await transaction.rollback();
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Erro ao criar produto" });
    }
  }

  static async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, price, category, preparationTime, imageUrl } =
        req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      await product.update({
        name,
        description,
        price,
        category,
        preparationTime,
        imageUrl,
      });

      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Erro ao atualizar produto" });
    }
  }

  static async toggleProductStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      product.isActive = !product.isActive;
      await product.save();

      res.json({
        message: `Produto ${product.isActive ? "ativado" : "desativado"} com sucesso`,
        isActive: product.isActive,
      });
    } catch (error) {
      console.error("Error toggling product status:", error);
      res.status(500).json({ message: "Erro ao alterar status do produto" });
    }
  }
}
