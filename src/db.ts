import { Logger } from "@lib/logger";
import mongoose from "mongoose";
import config from "src/config";

const logger = new Logger();

export const connect = async () => {
  await mongoose.connect(config.db.connectionString);
  logger.console("Connected to database", "green");
};
