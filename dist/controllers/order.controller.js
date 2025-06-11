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
            const enhancedOrders = await Promise.all(orders.map(async (order) => {
                const itemsWithProduct = await Promise.all(order.items.map(async (item) => {
                    const product = await product_model_1.Product.findByPk(item.productId);
                    return {
                        quantity: item.quantity,
                        observations: item.observations,
                        itemTotal: item.itemTotal,
                        product: product
                            ? {
                                id: product.id,
                                name: product.name,
                                price: product.price,
                            }
                            : null,
                    };
                }));
                return {
                    ...order.toJSON(),
                    items: itemsWithProduct,
                };
            }));
            return res.status(200).json(enhancedOrders);
        }
        catch (error) {
            console.error("Error listing orders:", error);
            res.status(500).json({ message: "Erro ao listar pedidos" });
        }
    }
    static async updateOrderStatus(req, res) {
        const transaction = await database_1.sequelize.transaction(); // Adicionar transação
        try {
            const { id } = req.params;
            const { status, cancelReason } = req.body; // Desestruturar cancelReason
            const userId = req.user?.id;
            // Validação centralizada
            if (!Object.values(order_model_1.OrderStatus).includes(status)) {
                await transaction.rollback();
                return res.status(400).json({ message: "Status inválido" });
            }
            const order = await order_model_1.Order.findByPk(id, { transaction });
            if (!order) {
                await transaction.rollback();
                return res.status(404).json({ message: "Pedido não encontrado" });
            }
            // Validação de fluxo
            if (status === order_model_1.OrderStatus.CANCELLED) {
                if (!cancelReason) {
                    await transaction.rollback();
                    return res
                        .status(400)
                        .json({ message: "Motivo do cancelamento é obrigatório" });
                }
                order.cancelReason = cancelReason;
            }
            // Atualizações condicionais
            if (status === order_model_1.OrderStatus.PREPARING) {
                order.kitchenUserId = userId;
                order.startedAt = new Date(); // Novo campo para tempo de preparo
            }
            else if (status === order_model_1.OrderStatus.READY) {
                order.readyAt = new Date();
            }
            if (order.status === "pronto" && status === "preparando") {
                return res
                    .status(400)
                    .json({ message: "Status não pode ser revertido" });
            }
            order.status = status;
            await order.save({ transaction });
            await transaction.commit();
            res.json(order);
        }
        catch (error) {
            await transaction.rollback();
            console.error("Error updating order status:", error);
            res.status(500).json({ message: "Erro ao atualizar status" });
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
            // Única query com todos os dados necessários
            const report = await order_model_1.Order.findAll({
                where,
                attributes: [
                    "status",
                    [database_1.sequelize.fn("COUNT", database_1.sequelize.col("id")), "count"],
                    [database_1.sequelize.fn("SUM", database_1.sequelize.col("total")), "totalAmount"],
                ],
                group: ["status"],
                raw: true,
            });
            // Cálculo dos totais
            const totals = {
                totalOrders: report.reduce((sum, item) => sum + parseInt(item.count), 0),
                totalRevenue: report.reduce((sum, item) => sum + parseFloat(item.totalAmount || "0"), 0),
            };
            res.json({ byStatus: report, totals });
        }
        catch (error) {
            console.error("Error generating report:", error);
            res.status(500).json({ message: "Erro ao gerar relatório" });
        }
    }
    static async getKitchenOrders(req, res) {
        try {
            const orders = await order_model_1.Order.findAll({
                where: {
                    status: [
                        order_model_1.OrderStatus.PENDING,
                        order_model_1.OrderStatus.PREPARING,
                        order_model_1.OrderStatus.READY,
                    ],
                },
                attributes: [
                    "id",
                    "items",
                    "status",
                    ["table_number", "tableNumber"],
                    "observations",
                    ["created_at", "createdAt"],
                    [
                        database_1.sequelize.literal('(SELECT name FROM users WHERE id = "Order"."attendant_id")'),
                        "attendantName",
                    ],
                ],
                order: [
                    ["status", "ASC"],
                    ["created_at", "ASC"],
                ],
                raw: true,
            });
            // Coletar todos os productIds únicos usados nos pedidos
            const allProductIds = [
                ...new Set(orders.flatMap((order) => order.items.map((item) => item.productId))),
            ];
            // Buscar os produtos no banco
            const products = await product_model_1.Product.findAll({
                where: { id: allProductIds },
                attributes: ["id", "name"],
                raw: true,
            });
            const productMap = Object.fromEntries(products.map((product) => [product.id, product.name]));
            // Inserir o nome do produto em cada item
            const enrichedOrders = orders.map((order) => ({
                ...order,
                items: order.items.map((item) => ({
                    ...item,
                    name: productMap[item.productId] || "Produto não encontrado",
                })),
            }));
            res.json(enrichedOrders);
        }
        catch (error) {
            console.error("Error fetching kitchen orders:", error);
            res.status(500).json({ message: "Erro ao buscar pedidos" });
        }
    }
    static async getByStatus(req, res) {
        const { status } = req.query;
        const orders = await order_model_1.Order.findAll({
            where: status ? { status } : {},
            include: [
                { model: user_model_1.User, as: "attendant", attributes: ["name"] },
                { model: user_model_1.User, as: "kitchenUser", attributes: ["name"] },
            ],
            order: [["createdAt", "ASC"]],
        });
        res.json(orders);
    }
    static async getOrderHistory(req, res) {
        try {
            const { status, onlyMine } = req.query;
            const userId = req.user?.id;
            const userRole = req.user?.role;
            const where = {};
            if (status)
                where.status = status;
            const isOnlyMine = String(onlyMine) === "true";
            if (isOnlyMine && userRole === "attendant") {
                where.attendantId = userId;
            }
            const orders = await order_model_1.Order.findAll({
                where,
                include: [
                    { model: user_model_1.User, as: "attendant", attributes: ["name"] },
                    { model: user_model_1.User, as: "kitchenUser", attributes: ["name"] },
                ],
                order: [["deliveredAt", "DESC"]],
            });
            res.json(orders);
        }
        catch (error) {
            console.error("Erro ao buscar histórico:", error);
            res.status(500).json({ error: "Erro ao buscar histórico de pedidos" });
        }
    }
}
exports.default = OrderController;
