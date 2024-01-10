export interface UserInterface {
  _id: string;
  username: string;
  avgwpm: number;
  gamesPlayed: number;
  gamesWon: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRepoInterface {
  createUser: () => Promise<UserInterface>;
  getUserById: (id: string) => Promise<UserInterface | undefined>;
}

export interface UserServiceInterface {
  getOrCreateUser: (id: string) => Promise<UserInterface>;
  getUserById: (id: string) => Promise<UserInterface>;
}

export interface UserServiceDependencies {
  repo: UserRepoInterface;
}
