"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const jsonwebtoken_1 = require("jsonwebtoken");
const logger_1 = require("./logger");
const errorHandler = (err, req, res, next) => {
    // Log do erro completo para desenvolvimento
    if (process.env.NODE_ENV === "development") {
        logger_1.logger.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);
    }
    // Tratamento para erros de validação Zod
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            status: "fail",
            errors: err.errors.map((e) => ({
                path: e.path.join("."),
                message: e.message,
            })),
        });
    }
    // Tratamento para erros JWT
    if (err instanceof jsonwebtoken_1.JsonWebTokenError) {
        return res.status(401).json({
            status: "fail",
            message: "Token inválido ou expirado",
        });
    }
    // Erros de banco de dados
    if (err.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
            status: "fail",
            message: "Conflito de dados",
            errors: err.errors.map((e) => ({
                path: e.path,
                message: e.message,
            })),
        });
    }
    // Erros de validação do Sequelize
    if (err.name === "SequelizeValidationError") {
        return res.status(400).json({
            status: "fail",
            message: "Erro de validação",
            errors: err.errors.map((e) => ({
                path: e.path,
                message: e.message,
            })),
        });
    }
    // Status code padrão
    const statusCode = err.statusCode || err.code || 500;
    // Mensagem de erro (não mostra detalhes em produção)
    const message = statusCode === 500 && process.env.NODE_ENV === "production"
        ? "Erro interno no servidor"
        : err.message;
    res.status(statusCode).json({
        status: statusCode === 500 ? "error" : "fail",
        message,
        ...(process.env.NODE_ENV === "development" && {
            stack: err.stack,
            fullError: err,
        }),
    });
};
exports.errorHandler = errorHandler;
