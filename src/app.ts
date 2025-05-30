import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./utils/errorHandler"; // Adicione esta linha

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", routes);

// Error handler (deve ser o último middleware)
app.use(errorHandler); // Adicione esta linha

export default app;
