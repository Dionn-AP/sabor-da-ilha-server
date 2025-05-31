import { Sequelize } from "sequelize-typescript";
import config from "./env";
import { User } from "../models/user.model";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import { Inventory } from "../models/inventory.model";

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: "postgres",
  protocol: "postgres",
  models: [User, Order, Product, Inventory],
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
  retry: {
    max: 5,
    timeout: 30000,
  },
});

// const sequelize = new Sequelize({
//   dialect: "postgres",
//   host: config.db.host,
//   port: config.db.port,
//   database: config.db.name,
//   username: config.db.user,
//   password: config.db.password,
//   dialectOptions: {
//     ssl: config.db.ssl
//       ? {
//           require: true,
//           rejectUnauthorized: false, // Necessário para o Neon
//         }
//       : false,
//     useUTC: false,
//   },
//   logging: false,
//   pool: {
//     max: 5,
//     min: 0,
//     acquire: 30000,
//     idle: 10000,
//   },
//   retry: {
//     max: 3, // Tentar reconectar 3 vezes
//     timeout: 60000, // 60 segundos entre tentativas
//   },
//   timezone: config.app.timezone,
// });

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
