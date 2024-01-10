import * as raceListeners from "@races/socket_listeners";
import { AuthSocket } from "@socket/interfaces";
import { UserMiddleware } from "@users/middleware";
import { Server } from "socket.io";
import { ContainerInterface } from "src/container";
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
  const { userService, raceService } = deps;

  const userMiddleware = new UserMiddleware(userService);

  // Use usermiddleware to handle auth
  io.use(async (socket, next) => {
    await userMiddleware.auth(socket, next);
  });

  // Use user middleware to handle session
  // Attach race event handlers
  io.on("connection", async (socket: AuthSocket) => {
    await userMiddleware.session(socket);
    raceListeners.addListeners(socket, raceService);
  });
};

// export const createSocketServer = (deps: ContainerInterface) => {
//   const { userService, raceService } = deps;

//   const io = new Server({
//     connectionStateRecovery: {
//       maxDisconnectionDuration: 10,
//       skipMiddlewares: true,
//     },
//   });

//   const userMiddleware = new UserMiddleware(userService);

//   // Use usermiddleware to handle auth
//   io.use(async (socket, next) => {
//     await userMiddleware.auth(socket, next);
//   });

//   // Use user middleware to handle session
//   // Attach race event handlers
//   io.on("connection", async (socket: AuthSocket) => {
//     await userMiddleware.session(socket);
//     raceListeners.addListeners(socket, raceService);
//   });

//   return io;
// };
