import { Request, Response } from "express";
import { QueryTypes } from "sequelize";
import { Product } from "../models/product.model";
import { sequelize } from "../config/database";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

export default class ReportController {
  static async getSalesReport(req: Request, res: Response) {
    try {
      const { period = "day" } = req.query;
      const now = new Date();

      let startDate, endDate;
      switch (period) {
        case "week":
          startDate = startOfWeek(now);
          endDate = endOfWeek(now);
          break;
        case "month":
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case "year":
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
        default:
          startDate = startOfDay(now);
          endDate = endOfDay(now);
      }

      const report = await sequelize.query<{
        period: Date;
        ordersCount: string;
        totalRevenue: string;
      }>(
        `
        SELECT 
          date_trunc(:period, o."createdAt") as period,
          COUNT(o.id) as "ordersCount",
          SUM(o.total) as "totalRevenue"
        FROM orders o
        WHERE o.status = 'entregue'
        AND o."createdAt" BETWEEN :startDate AND :endDate
        GROUP BY period
        ORDER BY period ASC
      `,
        {
          replacements: { period, startDate, endDate },
          type: QueryTypes.SELECT,
        }
      );

      const formattedReport = report.map((item) => ({
        period: item.period,
        ordersCount: Number(item.ordersCount),
        totalRevenue: Number(item.totalRevenue || 0),
      }));

      res.json({
        period,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        data: formattedReport,
      });
    } catch (error) {
      console.error("Error generating sales report:", error);
      res.status(500).json({ message: "Erro ao gerar relatório de vendas" });
    }
  }

  static async getInventoryReport(req: Request, res: Response) {
    try {
      const { threshold = 10 } = req.query;

      const products = await sequelize.query<{
        id: number;
        name: string;
        category: string;
        currentStock: string;
      }>(
        `
        SELECT 
          p.id,
          p.name,
          p.category,
          (COALESCE((
            SELECT SUM(quantity) 
            FROM inventory 
            WHERE product_id = p.id 
            AND movement_type = 'entrada'
          ), 0) - COALESCE((
            SELECT SUM(quantity) 
            FROM inventory 
            WHERE product_id = p.id 
            AND movement_type = 'saída'
          ), 0)) as "currentStock"
        FROM products p
        HAVING (COALESCE((
          SELECT SUM(quantity) 
          FROM inventory 
          WHERE product_id = p.id 
          AND movement_type = 'entrada'
        ), 0) - COALESCE((
          SELECT SUM(quantity) 
          FROM inventory 
          WHERE product_id = p.id 
          AND movement_type = 'saída'
        ), 0)) <= :threshold
        ORDER BY "currentStock" ASC
      `,
        {
          replacements: { threshold },
          type: QueryTypes.SELECT,
        }
      );

      res.json(
        products.map((p) => ({
          ...p,
          currentStock: Number(p.currentStock),
        }))
      );
    } catch (error) {
      console.error("Error generating inventory report:", error);
      res.status(500).json({ message: "Erro ao gerar relatório de estoque" });
    }
  }

  static async getFinancialReport(req: Request, res: Response) {
    try {
      const { year } = req.query;
      const currentYear = new Date().getFullYear();
      const reportYear = year ? parseInt(year as string) : currentYear;

      const monthlySales = await sequelize.query<{
        month: Date;
        ordersCount: string;
        totalRevenue: string;
      }>(
        `
        SELECT 
          date_trunc('month', o."createdAt") as "month",
          COUNT(o.id) as "ordersCount",
          SUM(o.total) as "totalRevenue"
        FROM orders o
        WHERE o.status = 'entregue'
        AND o."createdAt" BETWEEN :startDate AND :endDate
        GROUP BY "month"
        ORDER BY "month" ASC
      `,
        {
          replacements: {
            startDate: new Date(`${reportYear}-01-01`),
            endDate: new Date(`${reportYear}-12-31`),
          },
          type: QueryTypes.SELECT,
        }
      );

      const topProducts = await sequelize.query<{
        productId: number;
        totalQuantity: string;
        totalRevenue: string;
      }>(
        `
        SELECT 
          (jsonb_array_elements(items)->>'productId')::int as "productId",
          SUM((jsonb_array_elements(items)->>'quantity')::int) as "totalQuantity",
          SUM((jsonb_array_elements(items)->>'itemTotal')::decimal) as "totalRevenue"
        FROM orders
        WHERE status = 'entregue'
        AND "createdAt" BETWEEN :startDate AND :endDate
        GROUP BY "productId"
        ORDER BY "totalRevenue" DESC
        LIMIT 5
      `,
        {
          replacements: {
            startDate: new Date(`${reportYear}-01-01`),
            endDate: new Date(`${reportYear}-12-31`),
          },
          type: QueryTypes.SELECT,
        }
      );

      const productIds = topProducts.map((item) => item.productId);
      const products = await Product.findAll({
        where: { id: productIds },
        raw: true,
      });

      const formattedTopProducts = topProducts.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return {
          productId: item.productId,
          productName: product?.name || "Desconhecido",
          totalQuantity: Number(item.totalQuantity),
          totalRevenue: Number(item.totalRevenue || 0),
        };
      });

      res.json({
        year: reportYear,
        monthlySales: monthlySales.map((item) => ({
          month: item.month,
          ordersCount: Number(item.ordersCount),
          totalRevenue: Number(item.totalRevenue || 0),
        })),
        topProducts: formattedTopProducts,
      });
    } catch (error) {
      console.error("Error generating financial report:", error);
      res.status(500).json({ message: "Erro ao gerar relatório financeiro" });
    }
  }
}
