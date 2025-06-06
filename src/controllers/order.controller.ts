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

interface OrderRequestItem {
  productId: number;
  quantity: number;
  observations?: string;
}

interface OrderItemWithPrice extends OrderRequestItem {
  unitPrice: number;
  itemTotal: number;
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
      const orderItems: OrderItemWithPrice[] = items.map(
        (item: OrderRequestItem) => {
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
        }
      );

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

      const enhancedOrders = await Promise.all(
        orders.map(async (order) => {
          const itemsWithProduct = await Promise.all(
            order.items.map(async (item: any) => {
              const product = await Product.findByPk(item.productId);
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
            })
          );

          return {
            ...order.toJSON(),
            items: itemsWithProduct,
          };
        })
      );

      return res.status(200).json(enhancedOrders);
    } catch (error) {
      console.error("Error listing orders:", error);
      res.status(500).json({ message: "Erro ao listar pedidos" });
    }
  }

  static async updateOrderStatus(req: Request, res: Response) {
    const transaction = await sequelize.transaction(); // Adicionar transação
    try {
      const { id } = req.params;
      const { status, cancelReason } = req.body; // Desestruturar cancelReason
      const userId = req.user?.id;

      // Validação centralizada
      if (!Object.values(OrderStatus).includes(status)) {
        await transaction.rollback();
        return res.status(400).json({ message: "Status inválido" });
      }

      const order = await Order.findByPk(id, { transaction });
      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      // Validação de fluxo
      if (status === OrderStatus.CANCELLED) {
        if (!cancelReason) {
          await transaction.rollback();
          return res
            .status(400)
            .json({ message: "Motivo do cancelamento é obrigatório" });
        }
        order.cancelReason = cancelReason;
      }

      // Atualizações condicionais
      if (status === OrderStatus.PREPARING) {
        order.kitchenUserId = userId;
        order.startedAt = new Date(); // Novo campo para tempo de preparo
      } else if (status === OrderStatus.READY) {
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
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Erro ao atualizar status" });
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

      // Única query com todos os dados necessários
      const report = await Order.findAll({
        where,
        attributes: [
          "status",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          [sequelize.fn("SUM", sequelize.col("total")), "totalAmount"],
        ],
        group: ["status"],
        raw: true,
      });

      // Cálculo dos totais
      const totals = {
        totalOrders: report.reduce(
          (sum, item) => sum + parseInt(item.count),
          0
        ),
        totalRevenue: report.reduce(
          (sum, item) => sum + parseFloat(item.totalAmount || "0"),
          0
        ),
      };

      res.json({ byStatus: report, totals });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Erro ao gerar relatório" });
    }
  }

  static async getKitchenOrders(req: Request, res: Response) {
    try {
      const orders = await Order.findAll({
        where: {
          status: [
            OrderStatus.PENDING,
            OrderStatus.PREPARING,
            OrderStatus.READY,
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
            sequelize.literal(
              '(SELECT name FROM users WHERE id = "Order"."attendant_id")'
            ),
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
        ...new Set(
          orders.flatMap((order) =>
            order.items.map((item: any) => item.productId)
          )
        ),
      ];

      // Buscar os produtos no banco
      const products = await Product.findAll({
        where: { id: allProductIds },
        attributes: ["id", "name"],
        raw: true,
      });

      const productMap = Object.fromEntries(
        products.map((product) => [product.id, product.name])
      );

      // Inserir o nome do produto em cada item
      const enrichedOrders = orders.map((order) => ({
        ...order,
        items: order.items.map((item: any) => ({
          ...item,
          name: productMap[item.productId] || "Produto não encontrado",
        })),
      }));

      res.json(enrichedOrders);
    } catch (error) {
      console.error("Error fetching kitchen orders:", error);
      res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
  }

  static async getByStatus(req: Request, res: Response) {
    const { status } = req.query;

    const orders = await Order.findAll({
      where: status ? { status } : {},
      include: [
        { model: User, as: "attendant", attributes: ["name"] },
        { model: User, as: "kitchenUser", attributes: ["name"] },
      ],
      order: [["createdAt", "ASC"]],
    });

    res.json(orders);
  }

  // GET /orders/history?status=entregue
  static async getOrderHistory(req: Request, res: Response) {
    const orders = await Order.findAll({
      where: { status: req.query.status },
      include: [
        { model: User, as: "attendant", attributes: ["name"] },
        { model: User, as: "kitchenUser", attributes: ["name"] },
      ],
      order: [["deliveredAt", "DESC"]],
    });
    res.json(orders);
  }
}
