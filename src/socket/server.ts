import * as raceListeners from "@races/socket_listeners";
import { AuthSocket } from "@socket/interfaces";
import { Server } from "socket.io";
import { ContainerInterface } from "src/container";
import { Middleware } from "./middleware";
import { SocketIoAdapter } from "./socket_io_adapter";

export const createServer = () => {
  const io = new Server({
    connectionStateRecovery: {
      maxDisconnectionDuration: 10,
      skipMiddlewares: true,
    },
  });

  const adaptedIo = new SocketIoAdapter(io);

  return adaptedIo;
};

export const attachListeners = (io: Server, deps: ContainerInterface) => {
  const { raceService } = deps;

  const middleware = new Middleware(deps);

  // Use middleware to handle auth
  io.use(async (socket, next) => {
    await middleware.auth(socket, next);
  });

  // Use user middleware to handle session
  // Attach race event handlers
  io.on("connection", async (socket: AuthSocket) => {
    await middleware.session(socket);
    raceListeners.addListeners(socket, raceService);
  });
};
