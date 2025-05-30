"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string({
        required_error: "Email é obrigatório",
        invalid_type_error: "Email deve ser uma string",
    })
        .email("E-mail inválido"),
    password: zod_1.z
        .string({
        required_error: "Senha é obrigatória",
        invalid_type_error: "Senha deve ser uma string",
    })
        .min(1, "A senha é obrigatória"),
});
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
    email: zod_1.z.string().email("E-mail inválido"),
    password: zod_1.z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    role: zod_1.z.enum([
        "atendente",
        "cozinha",
        "caixa",
        "gerente",
        "estoque",
        "master",
    ]),
});
