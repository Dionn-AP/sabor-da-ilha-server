"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = __importStar(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const user_model_1 = require("../models/user.model");
class AuthController {
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await user_model_1.User.findOne({
                where: { email },
            });
            if (!user || !(await user.comparePassword(password))) {
                return res.status(401).json({ message: "Credenciais inválidas" });
            }
            if (!user.isActive) {
                return res.status(403).json({ message: "Usuário desativado" });
            }
            const payload = {
                id: user.id,
                role: user.role,
                name: user.name,
            };
            const options = {
                expiresIn: "1d",
                algorithm: "HS256",
            };
            const token = jwt.sign(payload, env_1.default.jwt.secret, options);
            res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        }
        catch (error) {
            console.error("Login error:", error);
            res.status(500).json({ message: "Erro no servidor" });
        }
    }
    static async register(req, res) {
        try {
            const { name, email, password, role } = req.body;
            const existingUser = await user_model_1.User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: "Email já cadastrado" });
            }
            const user = await user_model_1.User.create({
                name,
                email,
                password,
                role,
                isActive: true,
            });
            res.status(201).json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            });
        }
        catch (error) {
            console.error("Register error:", error);
            res.status(500).json({ message: "Erro no servidor" });
        }
    }
    static async listUsers(req, res) {
        try {
            const users = await user_model_1.User.findAll({
                attributes: ["id", "name", "email", "role", "isActive"], // Campos que serão retornados
                order: [["name", "ASC"]], // Ordenar por nome
            });
            res.json(users);
        }
        catch (error) {
            console.error("Error listing users:", error);
            res.status(500).json({ message: "Erro ao listar usuários" });
        }
    }
}
exports.default = AuthController;
