import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  AllowNull,
  DataType,
} from "sequelize-typescript";
import { Product } from "./product.model";
import { User } from "./user.model";

export enum InventoryMovementType {
  ENTRY = "entrada",
  EXIT = "saída",
  ADJUSTMENT = "ajuste",
}

@Table({
  tableName: "inventory",
  timestamps: true,
  underscored: true,
})
export class Inventory extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @ForeignKey(() => Product)
  @AllowNull(false)
  @Column
  productId!: number;

  @BelongsTo(() => Product)
  product!: Product;

  @ForeignKey(() => User)
  @Column
  userId?: number;

  @BelongsTo(() => User)
  user?: User;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(InventoryMovementType)))
  movementType!: InventoryMovementType;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  quantity!: number;

  @Column(DataType.DECIMAL(10, 2))
  unitPrice?: number;

  @Column(DataType.TEXT)
  description?: string;
}
