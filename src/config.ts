import dotenv from "dotenv";

dotenv.config();

const {
  BASE_URL,
  PORT,
  MONGO_DB_CONNECTION_STRING,
  RABBITMQ_CONNECTION_URL,
  REDIS_URL,
  REDIS_PORT,
  REDIS_PASSWORD,
  NODE_ENV,
} = process.env as {
  [key: string]: string;
};

// Template globals
const templateGlobals = {
  appName: "SATG",
  description:
    "Level up your typing skills by competing against other players in the most epic type racing game!",
  baseUrl: BASE_URL,
} as const;

// Server
const server = {
  port: Number(PORT),
  env: NODE_ENV,
};

// Database
const db = {
  connectionString: MONGO_DB_CONNECTION_STRING,
};

// Third party
const thirdParty = {
  rabbitMq: { connectionUrl: RABBITMQ_CONNECTION_URL },
  redis: { url: REDIS_URL, port: REDIS_PORT, password: REDIS_PASSWORD },
};

export default {
  templateGlobals,
  server,
  db,
  thirdParty,
};
