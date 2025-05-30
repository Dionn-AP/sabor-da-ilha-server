// src/validations/product.validation.ts
import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.enum(["comida", "bebida", "sobremesa", "outro"]),
  preparationTime: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional(),
  initialStock: z.number().int().nonnegative().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
