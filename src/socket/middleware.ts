import { Logger } from "@lib/logger";
import { RaceServiceInterface } from "@races/service";
import { AuthSocket } from "@socket/interfaces";
import { UserServiceInterface } from "@users/service";

const logger = new Logger("socket-middleware");

type Dependencies = {
  raceService: RaceServiceInterface;
  userService: UserServiceInterface;
};

export class Middleware {
  _userService: UserServiceInterface;
  _raceService: RaceServiceInterface;

  constructor(deps: {
    raceService: RaceServiceInterface;
    userService: UserServiceInterface;
  }) {
    this._userService = deps.userService;
    this._raceService = deps.raceService;
  }

  // Gets or creates a user and adds the user's id to the socket
  auth = async (socket: AuthSocket, next: (err?: Error) => void) => {
    try {
      const id = socket.handshake.auth.userId;
      const user = await this._userService.getOrCreateUser(id);
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

      const user = await this._userService.getUserById(socket.userId);
      const ongoingRace = await this._raceService.getOngoingRaceData(
        socket.userId
      );
      if (ongoingRace) socket.join(ongoingRace.race._id);

      socket.emit("user:session", { user, ongoingRace });
    } catch (err) {
      logger.debugErr(err);
      throw err;
    }
  };
}
