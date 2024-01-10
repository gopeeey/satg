import {
  AddPlayerDto,
  CreateRaceDto,
  PlayerInterface,
} from "@races/service/index";
import { RaceInterface, RaceRepoInterface } from "@races/service/interfaces";
import moment from "moment";
import DbRace from "./model";

export class RaceRepo implements RaceRepoInterface {
  // Creates a new race
  async createRace(dto: CreateRaceDto) {
    const player: PlayerInterface = {
      userId: dto.userId,
      username: dto.username,
      avatar: dto.avatar,
    };
    const race = await DbRace.create({
      ...dto,
      players: [player],
      userIds: [dto.userId],
    });
    return race.toJSON();
  }

  // Gets a race that isn't closed and where the provided wpm is between the minWpm and maxWpm
  async findSuitableRace(wpm: number) {
    const race = await DbRace.findOne({
      closed: false,
      practice: false,
      minWpm: { $lte: wpm },
      maxWpm: { $gte: wpm },
      $or: [
        { startTime: { $exists: false } },
        { startTime: { $gt: moment().add(10, "seconds").toDate() } },
      ],
    });

    return race ? race.toJSON() : null;
  }

  // Adds a user's id to a race's array of user ids and
  // updates the start and end time
  async addPlayer(dto: AddPlayerDto) {
    const { userId, username, avatar, raceId, startTime, endTime } = dto;

    const race = await DbRace.findById(raceId);
    if (!race) throw new Error("Race not found");
    const newPlayer: PlayerInterface = { userId, username, avatar };

    const savedRace = await DbRace.findByIdAndUpdate(
      raceId,
      {
        $set: { startTime, endTime },
        $addToSet: { userIds: userId },
        $push: { players: newPlayer },
      },
      { runValidators: true, new: true }
    );

    if (!savedRace) throw new Error("Error adding player to race");

    return savedRace.toJSON();
  }

  // Closes a race
  async closeRace(raceId: RaceInterface["_id"]) {
    await DbRace.findByIdAndUpdate(raceId, { $set: { closed: true } });
  }
}
