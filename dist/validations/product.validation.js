"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productSchema = void 0;
// src/validations/product.validation.ts
const zod_1 = require("zod");
exports.productSchema = zod_1.z.object({
    name: zod_1.z.string().min(3),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive(),
    category: zod_1.z.enum(["comida", "bebida", "sobremesa", "outro"]),
    preparationTime: zod_1.z.number().int().positive().optional(),
    imageUrl: zod_1.z.string().url().optional(),
    initialStock: zod_1.z.number().int().nonnegative().optional(),
});
