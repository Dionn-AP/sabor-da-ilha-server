import app from "./app";
import { connectDB, sequelize } from "./config/database";
import config from "./config/env";

// Importe todos os modelos para garantir o registro
import "./models/user.model";
import "./models/order.model";
import "./models/product.model";
import "./models/inventory.model";

const startServer = async () => {
  try {
    await connectDB();

    if (config.app.env === "development") {
      await sequelize.sync({ alter: true });
      console.log("Database synchronized.");
    }

    app.listen(config.app.port, () => {
      console.log(`Server is running on port ${config.app.port}`);
      console.log(`Environment: ${config.app.env}`);
      console.log(`Timezone: ${config.app.timezone}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
