import User from "@users/repo/model";
import { UserInterface, UserRepoInterface } from "@users/service/interfaces";

export class UserRepo implements UserRepoInterface {
  // Persists a user to the database
  async createUser() {
    const user = await User.create({});
    return user.toJSON<UserInterface>();
  }

  // Gets a user by id
  async getUserById(id: string) {
    const user = await User.findById(id);
    return user?.toJSON<UserInterface>();
  }
}
