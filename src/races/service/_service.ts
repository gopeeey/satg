import {
  JoinRaceTaskType,
  PlayerRaceProgressInterface,
  RaceServiceDependencies,
  RaceServiceInterface,
} from "@races/service/interfaces";
import { UserInterface } from "@users/service/interfaces";
import moment from "moment";
import { generateAvatar, generateExcerpt } from "src/lib/helpers";
import { redisClient } from "src/redis";
import { raceEvents } from "./events";
import {
  AddPlayerDto,
  CreateRaceDto,
  PlayerInputDto,
  PlayerInterface,
  PlayerProgressDto,
  RaceInterface,
} from "./index";

export class RaceService implements RaceServiceInterface {
  private readonly _publishJoinTask: RaceServiceDependencies["publishRaceJoinTask"];
  private readonly _getUserById: RaceServiceDependencies["getUserById"];
  private readonly _repo: RaceServiceDependencies["repo"];
  private readonly _socket: RaceServiceDependencies["socket"];
  readonly maxPlayersPerRace = 5;
  readonly startCountDownDuration = 30; // seconds
  readonly maxRaceDuration = 10 * 60; // seconds
  readonly wordLength = 5; // characters

  constructor(deps: RaceServiceDependencies) {
    this._repo = deps.repo;
    this._socket = deps.socket;
    this._publishJoinTask = deps.publishRaceJoinTask;
    this._getUserById = deps.getUserById;
  }

  // Queues a race join request
  async queueRaceJoinRequest(joinRequest: JoinRaceTaskType) {
    // Publish the join request to the race join queue
    await this._publishJoinTask(joinRequest);
  }

  // Adds a user to a race
  async joinRace(race: RaceInterface, user: UserInterface) {
    // Generate a new avatar for the new player
    const userAvatar = generateAvatar(
      race.players.map((player) => player.avatar)
    );

    // Add the user's id to the race
    const addUserDto = new AddPlayerDto({
      userId: user._id,
      username: user.username,
      avatar: userAvatar,
      raceId: race._id,
    });
    // if race has no start or end time, add them
    if (!race.startTime) {
      addUserDto.startTime = moment()
        .add(this.startCountDownDuration, "seconds")
        .toDate();
      addUserDto.endTime = moment()
        .add(this.maxRaceDuration, "seconds")
        .toDate();
    }
    const updatedRace = await this._repo.addPlayer(addUserDto);
    this._socket.addToRoom(race._id, user._id);

    // Update race on redis
    const nowMoment = moment();
    await redisClient.setEx(
      `race:${race._id}`,
      moment(updatedRace.startTime).diff(nowMoment, "seconds") +
        this.maxRaceDuration,
      JSON.stringify(updatedRace)
    );

    // Create player progresses
    for (const player of updatedRace.players) {
      const playerProgressDto = new PlayerProgressDto({
        userId: player.userId,
        raceId: race._id,
      });
      await redisClient.setEx(
        this.makePlayerProgressId(race._id, player.userId),
        moment(updatedRace.startTime).diff(nowMoment, "seconds") +
          this.maxRaceDuration,
        JSON.stringify(playerProgressDto)
      );
    }
    // const playerProgress = new PlayerProgressDto({
    //   userId: user._id,
    //   raceId: race._id,
    //   lastUpdated: moment(race.startTime).toISOString(),
    // });
    // await redisClient.setEx(
    //   this.makePlayerProgressId(race._id, user._id),
    //   moment(race.startTime).diff(nowMoment, "seconds") + this.maxRaceDuration,
    //   JSON.stringify(playerProgress)
    // );

    // Alert other players in race of new player and race info
    const newPlayer: PlayerInterface = {
      userId: user._id,
      username: user.username,
      avatar: userAvatar,
    };
    const data = { newPlayer, race: updatedRace, wordLength: this.wordLength };

    this._socket.emitToRoom(race._id, raceEvents.newPlayer, data);

    // If the race is full, close the race
    if (updatedRace.players.length >= this.maxPlayersPerRace)
      this._repo.closeRace(updatedRace._id);
  }

  makePlayerProgressId(
    raceId: RaceInterface["_id"],
    userId: UserInterface["_id"]
  ) {
    return `raceProgress:${raceId}:${userId}`;
  }

  // Creates a new race
  async createNewRace(user: UserInterface, practice: boolean) {
    // Create race
    const newRace = await this._repo.createRace(
      new CreateRaceDto({
        minWpm: Math.max(0, user.avgwpm - 15),
        maxWpm: user.avgwpm + 20,
        userId: user._id,
        username: user.username,
        avatar: generateAvatar([]),
        practice,
        closed: practice,
        excerpt: generateExcerpt(),
        startTime: practice
          ? moment().add(this.startCountDownDuration, "seconds").toDate()
          : undefined,
      })
    );

    // Add user to race room
    this._socket.addToRoom(newRace._id, user._id);

    // If it is a practice session, persist the race in redis
    // and notify the user of the race immediately
    if (practice) {
      // Update race on redis
      const nowMoment = moment();
      await redisClient.setEx(
        `race:${newRace._id}`,
        moment(newRace.startTime).diff(nowMoment, "seconds") +
          this.maxRaceDuration,
        JSON.stringify(newRace)
      );

      // Create player progress
      const playerProgress = new PlayerProgressDto({
        userId: user._id,
        raceId: newRace._id,
      });
      await redisClient.setEx(
        this.makePlayerProgressId(newRace._id, user._id),
        moment(newRace.startTime).diff(nowMoment, "seconds") +
          this.maxRaceDuration,
        JSON.stringify(playerProgress)
      );

      const data = {
        newPlayer: newRace.players[0],
        race: newRace,
        wordLength: this.wordLength,
      };
      this._socket.emitToRoom(newRace._id, raceEvents.newPlayer, data);
    }
  }

  // Adds the user to a new or existing race based on their wpm
  async handleRaceJoinRequest(joinRequest: JoinRaceTaskType) {
    const { userId, practice } = joinRequest;

    // Fetch the user
    const user = await this._getUserById(userId);

    // Find a suitable race
    let race = await this._repo.findSuitableRace(user.avgwpm);

    if (race) {
      await this.joinRace(race, user);
    } else {
      // If no suitable race is found create a new one
      await this.createNewRace(user, practice);
    }
  }

  // Handles players' text input
  async handlePlayerInput(playerInput: PlayerInputDto) {
    const { inputText, raceId, userId } = playerInput;

    // Fetch the race from redis
    let raceStr = await redisClient.get(`race:${raceId}`);
    if (!raceStr) return;
    const race: RaceInterface = JSON.parse(raceStr);

    // Prevent updates if race has not started or has ended
    const nowMoment = moment();
    if (!race.startTime || nowMoment.isBefore(moment(race.startTime))) {
      return;
    }
    const endMoment = moment(race.startTime).add(
      this.maxRaceDuration,
      "seconds"
    );
    if (nowMoment.isAfter(endMoment)) return;

    // Get the player's race progress object from redis
    const progressKey = this.makePlayerProgressId(raceId, userId);
    const playerRaceProgressStr = await redisClient.get(progressKey);
    if (!playerRaceProgressStr) return;
    const playerProgress: PlayerRaceProgressInterface = JSON.parse(
      playerRaceProgressStr
    );

    const raceText = race.excerpt.body;
    let correctTypedText = "";

    // Check if the player has typed the correct text
    for (let i = 0; i < inputText.length; i++) {
      if (inputText[i] === raceText[i]) {
        correctTypedText += inputText[i];
      } else {
        break;
      }
    }

    const match = inputText.match(playerProgress.lastInput);
    if (match) {
      const newCharsStart = playerProgress.lastInput.length;
      const newChars = inputText.slice(newCharsStart, inputText.length);
      playerProgress.totalEntries += newChars.length;
      let newCorrectChars = correctTypedText.slice(
        newCharsStart,
        inputText.length
      );
      playerProgress.correctEntries += newCorrectChars.length;
    }
    playerProgress.lastInput = inputText;

    // Calculate accuracy
    playerProgress.accuracy =
      (playerProgress.correctEntries / playerProgress.totalEntries) * 100;

    // Calculate the player's progress percentage
    playerProgress.progress = Math.max(
      playerProgress.progress,
      (correctTypedText.length / race.excerpt.body.length) * 100
    );

    // Calculate the player's avgWpm and adjustedAvgWpm
    const raceStartMoment = moment(race.startTime);
    const minutes = moment().diff(raceStartMoment, "milliseconds") / 60000;
    const wpm = inputText.length / this.wordLength / minutes;
    playerProgress.adjustedAvgWpm = Math.round(
      wpm * (playerProgress.accuracy / 100)
    );

    // Update player's race progress object on redis
    await redisClient.setEx(
      progressKey,
      endMoment.diff(nowMoment, "seconds"),
      JSON.stringify(playerProgress)
    );

    // Broadcast the player's new progress and wpm to all players in the race
    this._socket.emitToRoom(raceId, raceEvents.playerUpdate, playerProgress);
  }
}
