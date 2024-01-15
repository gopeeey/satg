import { SocketInterface } from "@socket/interfaces";

export interface UserInterface {
  _id: string;
  username: string;
  avgwpm: number;
  gamesPlayed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRepoInterface {
  createUser: () => Promise<UserInterface>;
  getUserById: (id: string) => Promise<UserInterface | undefined>;
  updateUserStats: (
    userId: UserInterface["_id"],
    gamesPlayed: number,
    avgWpm: number
  ) => Promise<UserInterface | null>;
}

export interface UserServiceInterface {
  getOrCreateUser: (id: string) => Promise<UserInterface>;
  getUserById: (id: string) => Promise<UserInterface>;
  updateUserStats: (
    userId: UserInterface["_id"],
    gamesPlayed: number,
    avgWpm: number
  ) => Promise<void>;
}

export interface UserServiceDependencies {
  repo: UserRepoInterface;
  socket: SocketInterface;
}
