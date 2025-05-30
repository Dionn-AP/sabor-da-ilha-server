import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { JsonWebTokenError } from "jsonwebtoken";
import { logger } from "./logger";

interface AppError extends Error {
  statusCode?: number;
  code?: number;
  errors?: Record<string, string>;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log do erro completo para desenvolvimento
  if (process.env.NODE_ENV === "development") {
    logger.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);
  }

  // Tratamento para erros de validação Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "fail",
      errors: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Tratamento para erros JWT
  if (err instanceof JsonWebTokenError) {
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
      errors: (err as any).errors.map((e: any) => ({
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
      errors: (err as any).errors.map((e: any) => ({
        path: e.path,
        message: e.message,
      })),
    });
  }

  // Status code padrão
  const statusCode = err.statusCode || err.code || 500;

  // Mensagem de erro (não mostra detalhes em produção)
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "Erro interno no servidor"
      : err.message;

  res.status(statusCode as number).json({
    status: statusCode === 500 ? "error" : "fail",
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      fullError: err,
    }),
  });
};
