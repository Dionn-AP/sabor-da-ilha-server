import app from "./app";
import { connectDB } from "./config/database";
import config from "./config/env";

const startServer = async () => {
  try {
    await connectDB();

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
