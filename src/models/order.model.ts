import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType,
  AllowNull,
  Default,
} from "sequelize-typescript";
import { User } from "./user.model";

export enum OrderStatus {
  PENDING = "pendente",
  PREPARING = "preparando",
  READY = "pronto",
  DELIVERED = "entregue",
  CANCELLED = "cancelado",
}

@Table({
  tableName: "orders",
  timestamps: true,
  underscored: true,
})
export class Order extends Model {
  [x: string]: any;
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column
  attendantId!: number;

  @BelongsTo(() => User)
  attendant!: User;

  @ForeignKey(() => User)
  @Column
  kitchenUserId?: number;

  @BelongsTo(() => User, "kitchenUserId")
  kitchenUser?: User;

  @AllowNull(false)
  @Column(DataType.JSONB)
  items!: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
    observations?: string;
  }>;

  @AllowNull(false)
  @Default(OrderStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(OrderStatus)))
  status!: string;

  @Column(DataType.DECIMAL(10, 2))
  total!: number;

  @Column
  tableNumber?: number;

  @Column
  customerName?: string;

  @Column(DataType.TEXT)
  observations?: string;

  @Column
  closedAt?: Date;

  @Column
  startedAt?: Date; // Quando começou a preparação

  @Column
  readyAt?: Date; // Quando ficou pronto

  @Column
  deliveredAt?: Date; // Quando foi entregue
}
