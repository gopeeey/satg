"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const { BASE_URL, PORT, MONGO_DB_CONNECTION_STRING, RABBITMQ_CONNECTION_URL, REDIS_URL, REDIS_PORT, REDIS_PASSWORD, } = process.env;
// Template globals
const templateGlobals = {
    appName: "SATG",
    description: "Have fun racing against friends and strangers in a Super Awesome Typing Game",
    baseUrl: BASE_URL,
};
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
exports.default = {
    templateGlobals,
    server,
    db,
    thirdParty,
};
