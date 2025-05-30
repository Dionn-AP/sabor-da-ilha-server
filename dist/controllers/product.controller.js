"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const product_model_1 = require("../models/product.model");
const inventory_model_1 = require("../models/inventory.model");
const inventory_model_2 = require("../models/inventory.model");
const database_1 = require("../config/database");
class ProductController {
    static async listActiveProducts(req, res) {
        try {
            const { category } = req.query;
            const where = { isActive: true };
            if (category &&
                Object.values(product_model_1.ProductCategory).includes(category)) {
                where.category = category;
            }
            const products = await product_model_1.Product.findAll({
                where,
                order: [["name", "ASC"]],
            });
            res.json(products);
        }
        catch (error) {
            console.error("Error listing products:", error);
            res.status(500).json({ message: "Erro ao listar produtos" });
        }
    }
    static async createProduct(req, res) {
        const transaction = await database_1.sequelize.transaction();
        try {
            const { name, description, price, category, preparationTime, imageUrl, initialStock, } = req.body;
            const product = await product_model_1.Product.create({
                name,
                description,
                price,
                category,
                preparationTime,
                imageUrl,
                isActive: true,
            }, { transaction });
            // Registrar estoque inicial se fornecido
            if (initialStock) {
                await inventory_model_1.Inventory.create({
                    productId: product.id,
                    movementType: inventory_model_2.InventoryMovementType.ENTRY,
                    quantity: initialStock,
                    description: "Estoque inicial",
                }, { transaction });
            }
            await transaction.commit();
            res.status(201).json(product);
        }
        catch (error) {
            await transaction.rollback();
            console.error("Error creating product:", error);
            res.status(500).json({ message: "Erro ao criar produto" });
        }
    }
    static async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const { name, description, price, category, preparationTime, imageUrl } = req.body;
            const product = await product_model_1.Product.findByPk(id);
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
        }
        catch (error) {
            console.error("Error updating product:", error);
            res.status(500).json({ message: "Erro ao atualizar produto" });
        }
    }
    static async toggleProductStatus(req, res) {
        try {
            const { id } = req.params;
            const product = await product_model_1.Product.findByPk(id);
            if (!product) {
                return res.status(404).json({ message: "Produto não encontrado" });
            }
            product.isActive = !product.isActive;
            await product.save();
            res.json({
                message: `Produto ${product.isActive ? "ativado" : "desativado"} com sucesso`,
                isActive: product.isActive,
            });
        }
        catch (error) {
            console.error("Error toggling product status:", error);
            res.status(500).json({ message: "Erro ao alterar status do produto" });
        }
    }
}
exports.default = ProductController;
