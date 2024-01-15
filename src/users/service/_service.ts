import { SocketInterface } from "@socket/interfaces";
import {
  UserInterface,
  UserRepoInterface,
  UserServiceDependencies,
  UserServiceInterface,
} from "@users/service/interfaces";
import { userEvents } from "./events";

export class UserService implements UserServiceInterface {
  private readonly _repo: UserRepoInterface;
  private readonly _socket: SocketInterface;

  constructor(deps: UserServiceDependencies) {
    this._repo = deps.repo;
    this._socket = deps.socket;
  }

  // Gets a user by id and throws an error if not found
  async getUserById(id: string) {
    const user = await this._repo.getUserById(id);
    if (!user) throw new Error("User not found");
    return user;
  }

  // Gets a user by id
  // Creates and returns a new user if not found or id isn't provided
  async getOrCreateUser(id: string) {
    if (!id) return await this._repo.createUser();

    let user = await this._repo.getUserById(id);
    if (!user) return await this._repo.createUser();

    return user;
  }

  async updateUserStats(
    userId: UserInterface["_id"],
    gamesPlayed: number,
    avgWpm: number
  ) {
    const user = await this._repo.updateUserStats(userId, gamesPlayed, avgWpm);
    if (!user) throw new Error("User not found");
    this._socket.emitToRoom(user._id, userEvents.update, user);
  }
}
