import { Logger } from "@lib/logger";
import { AuthSocket } from "@socket/interfaces";
import { UserServiceInterface } from "./service/interfaces";

const logger = new Logger("socket-middleware-users");

export class UserMiddleware {
  _service: UserServiceInterface;

  constructor(service: UserServiceInterface) {
    this._service = service;
  }

  // Gets or creates a user and adds the user's id to the socket
  auth = async (socket: AuthSocket, next: (err?: Error) => void) => {
    try {
      const id = socket.handshake.auth.userId;
      const user = await this._service.getOrCreateUser(id);
      socket.userId = user._id;
      if (next) next();
    } catch (err) {
      logger.debugErr(err);
      if (err instanceof Error && next) return next(err);
    }
  };

  // Adds the user to a room with their user id and emits the session event
  // to indicate to the frontend that a session has started
  session = async (socket: AuthSocket) => {
    try {
      if (!socket.userId) throw new Error("Unauthenticated");
      await socket.join(socket.userId);
      const user = await this._service.getUserById(socket.userId);
      socket.emit("user:session", user);
    } catch (err) {
      logger.debugErr(err);
      throw err;
    }
  };
}
