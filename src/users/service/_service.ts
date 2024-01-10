import {
  UserRepoInterface,
  UserServiceDependencies,
  UserServiceInterface,
} from "@users/service/interfaces";

export class UserService implements UserServiceInterface {
  private readonly _repo: UserRepoInterface;

  constructor(deps: UserServiceDependencies) {
    this._repo = deps.repo;
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
}
