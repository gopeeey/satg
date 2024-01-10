import { SocketInterface } from "@socket/interfaces";
import { UserInterface, UserServiceInterface } from "@users/service/interfaces";
import { AddPlayerDto, CreateRaceDto, PlayerInputDto } from "./index";

export interface PlayerInterface {
  userId: UserInterface["_id"];
  username: UserInterface["username"];
  avatar: string;
}

export type ExcerptType = {
  title?: string;
  body: string;
  author: string;
  year?: number;
};

export interface RaceInterface {
  _id: string;
  userIds: UserInterface["_id"][];
  minWpm: number;
  maxWpm: number;
  closed: boolean;
  startTime?: Date;
  endTime?: Date;
  players: PlayerInterface[];
  practice: boolean;
  excerpt: ExcerptType;
}

// Queues
export type ConsumerHandlerType<M> = (message: M) => Promise<void>;

export interface TaskQueueInterface<M> {
  name: string;
  publish: (message: M) => Promise<void>;
  consume: (callback: ConsumerHandlerType<M>) => void | Promise<void>;
  concurrency: number;
}

export type JoinRaceTaskType = {
  userId: UserInterface["_id"];
  practice: RaceInterface["practice"];
};
export interface JoinRaceTaskQueueInterface
  extends TaskQueueInterface<JoinRaceTaskType> {}

// Repo
export interface RaceRepoInterface {
  createRace: (dto: CreateRaceDto) => Promise<RaceInterface>;
  findSuitableRace: (wpm: number) => Promise<RaceInterface | null>;
  addPlayer: (dto: AddPlayerDto) => Promise<RaceInterface>;
  closeRace: (raceId: string) => Promise<void>;
}

// Race service
export interface RaceServiceDependencies {
  publishRaceJoinTask: JoinRaceTaskQueueInterface["publish"];
  getUserById: UserServiceInterface["getUserById"];
  repo: RaceRepoInterface;
  socket: SocketInterface;
}

export interface RaceServiceInterface {
  queueRaceJoinRequest: (joinRequest: JoinRaceTaskType) => Promise<void>;
  handleRaceJoinRequest: (joinRequest: JoinRaceTaskType) => Promise<void>;
  handlePlayerInput: (playerInput: PlayerInputDto) => Promise<void>;
}

export interface PlayerRaceProgressInterface {
  userId: UserInterface["_id"];
  raceId: RaceInterface["_id"];
  adjustedAvgWpm: number;
  progress: number;
  correctEntries: number;
  totalEntries: number;
  accuracy: number;
  lastInput: string;
}