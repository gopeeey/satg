import { SocketInterface } from "@socket/interfaces";
import { UserInterface, UserServiceInterface } from "@users/service/interfaces";
import { AddPlayerDto, CreateRaceDto, PlayerInputDto } from "./index";

export interface PlayerInterface {
  userId: UserInterface["_id"];
  username: UserInterface["username"];
  avatar: string;
  isBot: boolean;
  wpm?: number;
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
  excerpt: ExcerptType;
  allowedPlayerIds: PlayerInterface["userId"][];
}

export interface BotInterface {
  username: string;
  _id: string;
  wpm: number;
}

// Queues
export type ConsumerHandlerType<M> = (message: M) => Promise<void>;

export interface TaskQueueInterface<M> {
  name: string;
  publish: (message: M) => Promise<void>;
  consume: (callback: ConsumerHandlerType<M>) => void | Promise<void>;
  concurrency: number;
}

export type JoinRaceTaskType =
  | {
      userId: UserInterface["_id"];
      practice: boolean;
      entity: "player";
    }
  | {
      raceId: RaceInterface["_id"];
      bot: BotInterface;
      entity: "bot";
    };

export interface JoinRaceTaskQueueInterface
  extends TaskQueueInterface<JoinRaceTaskType> {}

// Repo
export interface RaceRepoInterface {
  createRace: (dto: CreateRaceDto) => Promise<RaceInterface>;
  findSuitableRace: (wpm: number) => Promise<RaceInterface | null>;
  findUserOngoingRace: (
    userId: UserInterface["_id"]
  ) => Promise<RaceInterface | null>;
  addPlayer: (dto: AddPlayerDto) => Promise<RaceInterface>;
  closeRace: (raceId: string) => Promise<void>;
  leaveRace: (
    raceId: RaceInterface["_id"],
    userId: UserInterface["_id"]
  ) => Promise<void>;
  findUserEmptyRace: (
    userId: UserInterface["_id"]
  ) => Promise<RaceInterface | null>;
  updateRaceWpm: (
    id: RaceInterface["_id"],
    maxWpm: number,
    minWpm: number
  ) => Promise<void>;
  findById: (id: string) => Promise<RaceInterface | null>;
}

// Race service
export interface RaceServiceDependencies {
  publishRaceJoinTask: JoinRaceTaskQueueInterface["publish"];
  getUserById: UserServiceInterface["getUserById"];
  updateUserStats: UserServiceInterface["updateUserStats"];
  repo: RaceRepoInterface;
  socket: SocketInterface;
}

export interface PlayerRaceProgressInterface {
  userId: UserInterface["_id"];
  raceId: RaceInterface["_id"];
  adjustedWpm: number;
  progress: number;
  correctEntries: number;
  totalEntries: number;
  accuracy: number;
  lastInput: string;
  position: number;
}

export type BotPositionUpdateType = {
  botId: BotInterface["_id"];
  raceId: RaceInterface["_id"];
  botWpm: number;
};
export interface RaceServiceInterface {
  queueRaceJoinRequest: (joinRequest: JoinRaceTaskType) => Promise<void>;
  handleRaceJoinRequest: (joinRequest: JoinRaceTaskType) => Promise<void>;
  handlePlayerInput: (playerInput: PlayerInputDto) => Promise<void>;
  getOngoingRaceData: (userId: UserInterface["_id"]) => Promise<{
    race: RaceInterface;
    progresses: PlayerRaceProgressInterface[];
    wordLength: number;
  } | null>;

  leaveRace: (
    raceId: RaceInterface["_id"],
    userId: UserInterface["_id"]
  ) => Promise<void>;

  updateBotPosition: (data: BotPositionUpdateType) => Promise<void>;
}
