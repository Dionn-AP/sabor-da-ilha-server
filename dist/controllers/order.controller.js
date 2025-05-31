"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const order_model_1 = require("../models/order.model");
const user_model_1 = require("../models/user.model");
const product_model_1 = require("../models/product.model");
const database_1 = require("../config/database");
const sequelize_1 = require("sequelize");
class OrderController {
    static async createOrder(req, res) {
        const transaction = await database_1.sequelize.transaction();
        try {
            const { items, tableNumber, customerName, observations } = req.body;
            const attendantId = req.user?.id;
            // Calcular total e verificar produtos
            let total = 0;
            const products = await product_model_1.Product.findAll({
                where: {
                    id: { [sequelize_1.Op.in]: items.map((item) => item.productId) },
                    isActive: true,
                },
                transaction,
            });
            if (products.length !== items.length) {
                await transaction.rollback();
                return res.status(400).json({
                    message: "Alguns produtos não foram encontrados ou estão inativos",
                });
            }
            // Preparar itens com preços atuais
            const orderItems = items.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                if (!product)
                    throw new Error("Produto não encontrado");
                const itemTotal = product.price * item.quantity;
                total += itemTotal;
                return {
                    productId: product.id,
                    quantity: item.quantity,
                    unitPrice: product.price,
                    observations: item.observations,
                    itemTotal,
                };
            });
            // Criar pedido
            const order = await order_model_1.Order.create({
                attendantId,
                items: orderItems,
                status: order_model_1.OrderStatus.PENDING,
                total,
                tableNumber,
                customerName,
                observations,
            }, { transaction });
            await transaction.commit();
            res.status(201).json(order);
        }
        catch (error) {
            await transaction.rollback();
            console.error("Error creating order:", error);
            res.status(500).json({ message: "Erro ao criar pedido" });
        }
    }
    static async listOrders(req, res) {
        try {
            const { status } = req.query;
            const where = {};
            if (status)
                where.status = status;
            // Atendentes veem apenas seus pedidos, gerentes veem todos
            if (req.user?.role === "atendente") {
                where.attendantId = req.user.id;
            }
            const orders = await order_model_1.Order.findAll({
                where,
                include: [
                    { model: user_model_1.User, as: "attendant", attributes: ["name"] },
                    { model: user_model_1.User, as: "kitchenUser", attributes: ["name"] },
                ],
                order: [["createdAt", "DESC"]],
            });
            res.json(orders);
        }
        catch (error) {
            console.error("Error listing orders:", error);
            res.status(500).json({ message: "Erro ao listar pedidos" });
        }
    }
    static async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const kitchenUserId = req.user?.id;
            const validStatusValues = Object.values(order_model_1.OrderStatus);
            if (!validStatusValues.includes(status)) {
                return res.status(400).json({ message: "Status inválido" });
            }
            const order = await order_model_1.Order.findByPk(id);
            if (!order) {
                return res.status(404).json({ message: "Pedido não encontrado" });
            }
            // Atualizar status e registrar quem alterou (para pedidos preparando/pronto)
            if (status === order_model_1.OrderStatus.PREPARING || status === order_model_1.OrderStatus.READY) {
                order.kitchenUserId = kitchenUserId;
            }
            // Em updateOrderStatus:
            if (status === order_model_1.OrderStatus.CANCELLED && !req.body.cancelReason) {
                return res
                    .status(400)
                    .json({ message: "Motivo do cancelamento é obrigatório" });
            }
            order.cancelReason = req.body.cancelReason; // Adicione este campo no modelo
            order.status = status;
            await order.save();
            res.json(order);
        }
        catch (error) {
            console.error("Error updating order status:", error);
            res.status(500).json({ message: "Erro ao atualizar status do pedido" });
        }
    }
    static async getOrderReport(req, res) {
        try {
            const { startDate, endDate, status } = req.query;
            const where = {};
            if (status)
                where.status = status;
            if (startDate && endDate) {
                where.createdAt = {
                    [sequelize_1.Op.between]: [
                        new Date(startDate),
                        new Date(endDate),
                    ],
                };
            }
            // 1. Primeira query para totais agregados
            const totals = await order_model_1.Order.findOne({
                where,
                attributes: [
                    [database_1.sequelize.fn("COUNT", database_1.sequelize.col("id")), "totalOrders"],
                    [database_1.sequelize.fn("SUM", database_1.sequelize.col("total")), "totalRevenue"],
                ],
                raw: true,
            });
            // 2. Segunda query para agrupamento por status
            const byStatus = await order_model_1.Order.findAll({
                where,
                attributes: [
                    "status",
                    [database_1.sequelize.fn("COUNT", database_1.sequelize.col("id")), "count"],
                    [database_1.sequelize.fn("SUM", database_1.sequelize.col("total")), "amount"],
                ],
                group: ["status"],
                raw: true,
            });
            // Formatar resposta
            const result = (await order_model_1.Order.findAll({
                where,
                attributes: [
                    [database_1.sequelize.fn("COUNT", database_1.sequelize.col("id")), "count"],
                    [database_1.sequelize.fn("SUM", database_1.sequelize.col("total")), "totalAmount"],
                ],
                group: ["status"],
                raw: true,
            }));
            res.json(result);
        }
        catch (error) {
            console.error("Error generating order report:", error);
            res.status(500).json({ message: "Erro ao gerar relatório" });
        }
    }
    static async getKitchenOrders(req, res) {
        const orders = await order_model_1.Order.findAll({
            where: {
                status: [order_model_1.OrderStatus.PENDING, order_model_1.OrderStatus.PREPARING],
            },
            attributes: ["id", "items", "status", "tableNumber", "observations"],
            order: [
                ["status", "ASC"],
                ["createdAt", "ASC"],
            ], // Prioritiza pedidos mais antigos
        });
        res.json(orders);
    }
}
exports.default = OrderController;
