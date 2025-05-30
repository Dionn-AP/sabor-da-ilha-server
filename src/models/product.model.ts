import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  DataType,
  HasMany,
  Default,
} from "sequelize-typescript";
import { Inventory } from "./inventory.model";

export enum ProductCategory {
  FOOD = "comida",
  DRINK = "bebida",
  DESSERT = "sobremesa",
  OTHER = "outro",
}

@Table({
  tableName: "products",
  timestamps: true,
  underscored: true,
})
export class Product extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @AllowNull(false)
  @Column
  name!: string;

  @Column(DataType.TEXT)
  description?: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL(10, 2))
  price!: number;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(ProductCategory)))
  category!: ProductCategory;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @Column
  imageUrl?: string;

  @Column(DataType.INTEGER)
  preparationTime?: number;

  @HasMany(() => Inventory)
  inventoryMovements!: Inventory[];
}
