import { Request, Response, NextFunction } from "express";
import { UserRole } from "../models/user.model";

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Verifica se o usuário está autenticado
    if (!req.user) {
      return res.status(401).json({
        status: "fail",
        message: "Não autorizado - usuário não autenticado",
      });
    }

    // Verifica se o usuário tem uma das roles permitidas
    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return res.status(403).json({
        status: "fail",
        message: "Acesso negado - permissões insuficientes",
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};
