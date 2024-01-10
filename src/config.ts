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
} = process.env as {
  [key: string]: string;
};

// Template globals
const templateGlobals = {
  appName: "SATG",
  description:
    "Have fun racing against friends and strangers in a Super Awesome Typing Game",
  baseUrl: BASE_URL,
} as const;

// Server
const server = {
  port: Number(PORT),
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
