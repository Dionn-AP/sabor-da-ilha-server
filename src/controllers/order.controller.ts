import { Request, Response } from "express";
import { Order, OrderStatus } from "../models/order.model";
import { User } from "../models/user.model";
import { Product } from "../models/product.model";
import { sequelize } from "../config/database";
import { Op } from "sequelize";

declare namespace Order {
  interface ReportItem {
    status: string;
    count: string;
    totalAmount: string | null;
  }

  interface ReportTotals {
    totalOrders: string;
    totalRevenue: string | null;
  }
}

export default class OrderController {
  static async createOrder(req: Request, res: Response) {
    const transaction = await sequelize.transaction();

    try {
      const { items, tableNumber, customerName, observations } = req.body;
      const attendantId = req.user?.id;

      // Calcular total e verificar produtos
      let total = 0;
      const products = await Product.findAll({
        where: {
          id: { [Op.in]: items.map((item: any) => item.productId) },
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
      const orderItems = items.map((item: any) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) throw new Error("Produto não encontrado");

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
      const order = await Order.create(
        {
          attendantId,
          items: orderItems,
          status: OrderStatus.PENDING,
          total,
          tableNumber,
          customerName,
          observations,
        },
        { transaction }
      );

      await transaction.commit();
      res.status(201).json(order);
    } catch (error) {
      await transaction.rollback();
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Erro ao criar pedido" });
    }
  }

  static async listOrders(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const where: any = {};

      if (status) where.status = status;

      // Atendentes veem apenas seus pedidos, gerentes veem todos
      if (req.user?.role === "atendente") {
        where.attendantId = req.user.id;
      }

      const orders = await Order.findAll({
        where,
        include: [
          { model: User, as: "attendant", attributes: ["name"] },
          { model: User, as: "kitchenUser", attributes: ["name"] },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.json(orders);
    } catch (error) {
      console.error("Error listing orders:", error);
      res.status(500).json({ message: "Erro ao listar pedidos" });
    }
  }

  static async updateOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const kitchenUserId = req.user?.id;

      const validStatusValues = Object.values(OrderStatus);
      if (!validStatusValues.includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      // Atualizar status e registrar quem alterou (para pedidos preparando/pronto)
      if (status === OrderStatus.PREPARING || status === OrderStatus.READY) {
        order.kitchenUserId = kitchenUserId;
      }

      order.status = status;
      await order.save();

      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Erro ao atualizar status do pedido" });
    }
  }

  static async getOrderReport(req: Request, res: Response) {
    try {
      const { startDate, endDate, status } = req.query;

      const where: any = {};
      if (status) where.status = status;

      if (startDate && endDate) {
        where.createdAt = {
          [Op.between]: [
            new Date(startDate as string),
            new Date(endDate as string),
          ],
        };
      }

      // 1. Primeira query para totais agregados
      const totals = await Order.findOne({
        where,
        attributes: [
          [sequelize.fn("COUNT", sequelize.col("id")), "totalOrders"],
          [sequelize.fn("SUM", sequelize.col("total")), "totalRevenue"],
        ],
        raw: true,
      });

      // 2. Segunda query para agrupamento por status
      const byStatus = await Order.findAll({
        where,
        attributes: [
          "status",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          [sequelize.fn("SUM", sequelize.col("total")), "amount"],
        ],
        group: ["status"],
        raw: true,
      });

      // Formatar resposta
      const result = (await Order.findAll({
        where,
        attributes: [
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          [sequelize.fn("SUM", sequelize.col("total")), "totalAmount"],
        ],
        group: ["status"],
        raw: true,
      })) as unknown as Array<{
        status: string;
        count: string;
        totalAmount: string | null;
      }>;

      res.json(result);
    } catch (error) {
      console.error("Error generating order report:", error);
      res.status(500).json({ message: "Erro ao gerar relatório" });
    }
  }
}
