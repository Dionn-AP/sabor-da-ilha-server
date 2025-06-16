"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const date_fns_1 = require("date-fns");
class ReportController {
    static async getSalesReport(req, res) {
        try {
            const { period = "day" } = req.query;
            const now = new Date();
            let startDate, endDate;
            switch (period) {
                case "week":
                    startDate = (0, date_fns_1.startOfWeek)(now);
                    endDate = (0, date_fns_1.endOfWeek)(now);
                    break;
                case "month":
                    startDate = (0, date_fns_1.startOfMonth)(now);
                    endDate = (0, date_fns_1.endOfMonth)(now);
                    break;
                case "year":
                    startDate = (0, date_fns_1.startOfYear)(now);
                    endDate = (0, date_fns_1.endOfYear)(now);
                    break;
                default:
                    startDate = (0, date_fns_1.startOfDay)(now);
                    endDate = (0, date_fns_1.endOfDay)(now);
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
            const report = await database_1.sequelize.query(query, {
                replacements: { startDate, endDate },
                type: sequelize_1.QueryTypes.SELECT,
            });
            const formattedReport = report.map((item) => ({
                period: item.period,
                ordersCount: Number(item.ordersCount),
                totalRevenue: Number(item.totalRevenue || 0),
            }));
            res.json({
                period,
                startDate: (0, date_fns_1.format)(startDate, "yyyy-MM-dd"),
                endDate: (0, date_fns_1.format)(endDate, "yyyy-MM-dd"),
                data: formattedReport,
            });
        }
        catch (error) {
            console.error("Erro detalhado:", error);
            res.status(500).json({ message: "Erro ao gerar relatório", error });
        }
    }
    static async getInventoryReport(req, res) {
        try {
            const { threshold = 10 } = req.query;
            const products = await database_1.sequelize.query(`
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
    `, {
                replacements: { threshold },
                type: sequelize_1.QueryTypes.SELECT,
            });
            res.json(products.map((p) => ({
                ...p,
                currentStock: Number(p.currentStock),
            })));
        }
        catch (error) {
            console.error("Erro ao gerar relatório de estoque:", error);
            res.status(500).json({ message: "Erro ao gerar relatório", error });
        }
    }
    static async getFinancialReport(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const report = await database_1.sequelize.query(`
      SELECT 
        date_trunc('month', o.created_at) as "month",
        COUNT(o.id) as "ordersCount",
        SUM(o.total) as "totalRevenue"
      FROM orders o
      WHERE o.status = 'entregue'
      AND o.created_at BETWEEN :startDate AND :endDate
      GROUP BY "month"
      ORDER BY "month" ASC
    `, {
                replacements: {
                    startDate,
                    endDate,
                },
                type: sequelize_1.QueryTypes.SELECT,
            });
            res.json(report.map((r) => ({
                ...r,
                ordersCount: Number(r.ordersCount),
                totalRevenue: Number(r.totalRevenue),
            })));
        }
        catch (error) {
            console.error("Erro ao gerar relatório financeiro:", error);
            res.status(500).json({ message: "Erro ao gerar relatório", error });
        }
    }
}
exports.default = ReportController;
