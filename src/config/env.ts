import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

// Set the timezone to Brazil
process.env.TZ = "America/Sao_Paulo";

interface Config {
  db: {
    [x: string]: any;
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  app: {
    port: number;
    env: string;
    timezone: string;
  };
  jwt: {
    secret: string;
    expiresIn: string | number;
  };
  bcrypt: {
    saltRounds: number;
  };
}

const config: Config = {
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    name: process.env.DB_NAME || "lanchonete_db",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgresql",
  },
  app: {
    port: parseInt(process.env.PORT || "3000", 10),
    env: process.env.NODE_ENV || "development",
    timezone: process.env.TIMEZONE || "America/Sao_Paulo",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "sabordailha123",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  } as Config["jwt"],
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10),
  },
};

export default config;
