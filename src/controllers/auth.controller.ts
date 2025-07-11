import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import config from "../config/env";
import { User } from "../models/user.model";
import { UserRole } from "../models/user.model";
import { loginSchema } from "../validations/auth.validation";
import { sequelize } from "../config/database";

class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({
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

      const options: jwt.SignOptions = {
        expiresIn: "1d",
        algorithm: "HS256",
      };

      const token = jwt.sign(payload, config.jwt.secret, options);

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro no servidor" });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const { name, email, password, role } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      const user = await User.create({
        name,
        email,
        password,
        role,
        isActive: false,
      });

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Erro no servidor" });
    }
  }

  static async listUsers(req: Request, res: Response) {
    try {
      const users = await User.findAll({
        attributes: ["id", "name", "email", "role", "isActive"], // Campos que serão retornados
        order: [["name", "ASC"]], // Ordenar por nome
      });

      res.json(users);
    } catch (error) {
      console.error("Error listing users:", error);
      res.status(500).json({ message: "Erro ao listar usuários" });
    }
  }

  static async listInactiveUsers(req: Request, res: Response) {
    try {
      const inactiveUsers = await User.findAll({
        where: { isActive: false },
        attributes: ["id", "name", "email", "role", "isActive"],
        order: [["name", "ASC"]],
      });

      res.json(inactiveUsers);
    } catch (error) {
      console.error("Erro ao listar usuários inativos:", error);
      res.status(500).json({ message: "Erro ao listar usuários inativos" });
    }
  }

  static async activateUser(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      user.isActive = true;
      await user.save();

      res.json({ message: "Usuário ativado com sucesso", user });
    } catch (error) {
      console.error("Erro ao ativar usuário:", error);
      res.status(500).json({ message: "Erro ao ativar usuário" });
    }
  }
}

export default AuthController;
