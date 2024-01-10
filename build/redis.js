"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const logger_1 = require("./lib/logger");
const redis_1 = require("redis");
const config_1 = __importDefault(require("./config"));
const redisConfig = config_1.default.thirdParty.redis;
const logger = new logger_1.Logger("REDIS");
exports.redisClient = (0, redis_1.createClient)({
    url: `redis://default:${redisConfig.password}@${redisConfig.url}:${redisConfig.port}`,
});
exports.redisClient.on("connect", () => logger.console("Redis connected", "green"));
exports.redisClient.on("error", (err) => logger.consoleErr(err));
