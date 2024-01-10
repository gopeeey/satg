import { Logger } from "@lib/logger";
import { createClient } from "redis";
import config from "src/config";
const redisConfig = config.thirdParty.redis;

const logger = new Logger("REDIS");

export const redisClient = createClient({
  url: `redis://default:${redisConfig.password}@${redisConfig.url}:${redisConfig.port}`,
});

redisClient.on("connect", () => logger.console("Redis connected", "green"));
redisClient.on("error", (err) => logger.consoleErr(err));
