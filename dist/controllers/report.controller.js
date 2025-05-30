"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const product_model_1 = require("../models/product.model");
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
            const report = await database_1.sequelize.query(`
        SELECT 
          date_trunc(:period, o."createdAt") as period,
          COUNT(o.id) as "ordersCount",
          SUM(o.total) as "totalRevenue"
        FROM orders o
        WHERE o.status = 'entregue'
        AND o."createdAt" BETWEEN :startDate AND :endDate
        GROUP BY period
        ORDER BY period ASC
      `, {
                replacements: { period, startDate, endDate },
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
            console.error("Error generating sales report:", error);
            res.status(500).json({ message: "Erro ao gerar relatório de vendas" });
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
            console.error("Error generating inventory report:", error);
            res.status(500).json({ message: "Erro ao gerar relatório de estoque" });
        }
    }
    static async getFinancialReport(req, res) {
        try {
            const { year } = req.query;
            const currentYear = new Date().getFullYear();
            const reportYear = year ? parseInt(year) : currentYear;
            const monthlySales = await database_1.sequelize.query(`
        SELECT 
          date_trunc('month', o."createdAt") as "month",
          COUNT(o.id) as "ordersCount",
          SUM(o.total) as "totalRevenue"
        FROM orders o
        WHERE o.status = 'entregue'
        AND o."createdAt" BETWEEN :startDate AND :endDate
        GROUP BY "month"
        ORDER BY "month" ASC
      `, {
                replacements: {
                    startDate: new Date(`${reportYear}-01-01`),
                    endDate: new Date(`${reportYear}-12-31`),
                },
                type: sequelize_1.QueryTypes.SELECT,
            });
            const topProducts = await database_1.sequelize.query(`
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
      `, {
                replacements: {
                    startDate: new Date(`${reportYear}-01-01`),
                    endDate: new Date(`${reportYear}-12-31`),
                },
                type: sequelize_1.QueryTypes.SELECT,
            });
            const productIds = topProducts.map((item) => item.productId);
            const products = await product_model_1.Product.findAll({
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
        }
        catch (error) {
            console.error("Error generating financial report:", error);
            res.status(500).json({ message: "Erro ao gerar relatório financeiro" });
        }
    }
}
exports.default = ReportController;
