import { Sequelize } from "sequelize-typescript";
import config from "./env";
import { User } from "../models/user.model";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import { Inventory } from "../models/inventory.model";

const sequelize = new Sequelize({
  dialect: "postgres",
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  username: config.db.user,
  password: config.db.password,
  models: [User, Order, Product, Inventory],
  modelMatch: (filename, member) => {
    return (
      filename.substring(0, filename.indexOf(".model")) === member.toLowerCase()
    );
  },
  logging: false,
  //logging: config.app.env === "development" ? console.log : false,
  dialectOptions: {
    useUTC: false,
  },
  timezone: config.app.timezone,
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      "Connection to the database has been established successfully."
    );

    if (config.app.env === "development") {
      await sequelize.sync({ alter: false });
      console.log("Database synchronized.");
    }
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

export { sequelize };
