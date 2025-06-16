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

      let startDate: Date, endDate: Date;
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

      // Atenção: estamos interpolando a string diretamente porque o PostgreSQL não aceita o date_trunc com bind parameter
      const query = `
      SELECT 
        date_trunc('${period}', o.created_at) AS period,
        COUNT(o.id) AS "ordersCount",
        SUM(o.total) AS "totalRevenue"
      FROM orders o
      WHERE o.status = 'entregue'
      AND o.created_at BETWEEN :startDate AND :endDate
      GROUP BY period
      ORDER BY period ASC
    `;

      const report = await sequelize.query<{
        period: Date;
        ordersCount: string;
        totalRevenue: string;
      }>(query, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT,
      });

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
      console.error("Erro detalhado:", error);
      res.status(500).json({ message: "Erro ao gerar relatório", error });
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
        (
          COALESCE((
            SELECT SUM(quantity) 
            FROM inventory 
            WHERE product_id = p.id 
            AND movement_type = 'entrada'
          ), 0) 
          - 
          COALESCE((
            SELECT SUM(quantity) 
            FROM inventory 
            WHERE product_id = p.id 
            AND movement_type = 'saída'
          ), 0)
        ) AS "currentStock"
      FROM products p
      WHERE (
        COALESCE((
          SELECT SUM(quantity) 
          FROM inventory 
          WHERE product_id = p.id 
          AND movement_type = 'entrada'
        ), 0) 
        - 
        COALESCE((
          SELECT SUM(quantity) 
          FROM inventory 
          WHERE product_id = p.id 
          AND movement_type = 'saída'
        ), 0)
      ) <= :threshold
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
      console.error("Erro ao gerar relatório de estoque:", error);
      res.status(500).json({ message: "Erro ao gerar relatório", error });
    }
  }

  static async getFinancialReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const report = await sequelize.query<{
        month: string;
        ordersCount: string;
        totalRevenue: string;
      }>(
        `
      SELECT 
        date_trunc('month', o.created_at) as "month",
        COUNT(o.id) as "ordersCount",
        SUM(o.total) as "totalRevenue"
      FROM orders o
      WHERE o.status = 'entregue'
      AND o.created_at BETWEEN :startDate AND :endDate
      GROUP BY "month"
      ORDER BY "month" ASC
    `,
        {
          replacements: {
            startDate,
            endDate,
          },
          type: QueryTypes.SELECT,
        }
      );

      res.json(
        report.map((r) => ({
          ...r,
          ordersCount: Number(r.ordersCount),
          totalRevenue: Number(r.totalRevenue),
        }))
      );
    } catch (error) {
      console.error("Erro ao gerar relatório financeiro:", error);
      res.status(500).json({ message: "Erro ao gerar relatório", error });
    }
  }
}
