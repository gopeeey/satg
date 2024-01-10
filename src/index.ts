import * as sockets from "@socket/server";
import { buildContainer } from "src/container";
import * as db from "src/db";
import { redisClient } from "src/redis";
import server from "src/server";

const init = async () => {
  // Connect to database
  await db.connect();

  // Connect to redis
  await redisClient.connect();

  // Create socket
  const adaptedSocket = sockets.createServer();

  // Build dependency container with socket
  const container = buildContainer(adaptedSocket);

  // Attach event listeners to socket
  sockets.attachListeners(adaptedSocket.io, container);

  // Start listening on socket
  adaptedSocket.io.listen(server.httpServer);

  // Start listening on http server
  server.start();
};

init();
