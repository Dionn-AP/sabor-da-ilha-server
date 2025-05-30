import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  Unique,
  AllowNull,
  DataType,
  HasMany,
  BeforeCreate,
} from "sequelize-typescript";
import { Order } from "./order.model";
import bcrypt from "bcryptjs";
import config from "../config/env";

export enum UserRole {
  ATTENDANT = "atendente",
  KITCHEN = "cozinha",
  CASHIER = "caixa",
  MANAGER = "gerente",
  STOCK = "estoque",
  MASTER = "master",
}

@Table({
  tableName: "users",
  timestamps: true,
  underscored: true,
})
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @AllowNull(false)
  @Column
  name!: string;

  @Unique
  @AllowNull(false)
  @Column
  email!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  get password(): string {
    return this.getDataValue("password");
  }

  set password(value: string) {
    this.setDataValue("password", value);
  }

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(UserRole)))
  role!: UserRole;

  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @HasMany(() => Order)
  orders!: Order[];

  @BeforeCreate
  static async hashPassword(user: User) {
    user.password = await bcrypt.hash(user.password, config.bcrypt.saltRounds);
  }

  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
