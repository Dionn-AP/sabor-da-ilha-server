"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        // Verifica se o usuário está autenticado
        if (!req.user) {
            return res.status(401).json({
                status: "fail",
                message: "Não autorizado - usuário não autenticado",
            });
        }
        // Verifica se o usuário tem uma das roles permitidas
        if (!allowedRoles.includes(req.user.role)) {
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
exports.authorize = authorize;
