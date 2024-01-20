import {
  JoinRaceTaskType,
  PlayerRaceProgressInterface,
  RaceServiceDependencies,
  RaceServiceInterface,
} from "@races/service/interfaces";
import { UserInterface } from "@users/service/interfaces";
import moment from "moment";
import {
  generateAvatar,
  generateExcerpt,
  generateId,
  generateUserName,
  randNumBtw,
} from "src/lib/helpers";
import { redisClient } from "src/redis";
import { raceEvents } from "./events";
import {
  AddPlayerDto,
  BotInterface,
  BotPositionUpdateType,
  CreateRaceDto,
  PlayerInputDto,
  PlayerInterface,
  PlayerProgressDto,
  RaceInterface,
} from "./index";

export class RaceService implements RaceServiceInterface {
  private readonly _publishJoinTask: RaceServiceDependencies["publishRaceJoinTask"];
  private readonly _getUserById: RaceServiceDependencies["getUserById"];
  private readonly _updateUserStats: RaceServiceDependencies["updateUserStats"];
  private readonly _repo: RaceServiceDependencies["repo"];
  private readonly _socket: RaceServiceDependencies["socket"];
  readonly maxPlayersPerRace = 5;
  readonly startCountDownDuration = 10; // seconds
  readonly maxRaceDuration = 10 * 60; // seconds
  readonly wordLength = 5; // characters
  readonly botsJoinTimeThreshold = 5; // seconds

  constructor(deps: RaceServiceDependencies) {
    this._repo = deps.repo;
    this._socket = deps.socket;
    this._publishJoinTask = deps.publishRaceJoinTask;
    this._getUserById = deps.getUserById;
    this._updateUserStats = deps.updateUserStats;
  }

  // Queues a race join request
  async queueRaceJoinRequest(joinRequest: JoinRaceTaskType) {
    if (joinRequest.entity === "bot") return;
    if (!joinRequest.practice) {
      // Check if user has an ongoing race that they didn't leave
      const ongoingRaceData = await this.getOngoingRaceData(joinRequest.userId);
      if (ongoingRaceData) {
        this._socket.addToRoom(ongoingRaceData.race._id, joinRequest.userId);
        this._socket.emitToRoom(
          joinRequest.userId,
          raceEvents.ongoingRace,
          ongoingRaceData
        );
        return;
      }
    } else {
      // Just emit a practice excerpt and avatar
      return this._socket.emitToRoom(
        joinRequest.userId,
        raceEvents.practiceData,
        { excerpt: generateExcerpt(), avatar: generateAvatar([]) }
      );
    }
    // Publish the join request to the race join queue
    await this._publishJoinTask(joinRequest);
  }

  // Adds a user to a race
  private async joinRace(
    race: RaceInterface,
    user: { username: string; _id: string; isBot: boolean; wpm?: number }
  ) {
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
      isBot: user.isBot,
      wpm: user.wpm,
    });
    // if race has no start or end time, add them
    if (!race.startTime) {
      addUserDto.startTime = moment()
        .add(this.startCountDownDuration, "seconds")
        .toDate();
      addUserDto.endTime = moment()
        .add(this.maxRaceDuration + this.startCountDownDuration, "seconds")
        .toDate();
    }
    const updatedRace = await this._repo.addPlayer(addUserDto);
    if (!user.isBot) this._socket.addToRoom(race._id, user._id);

    // Update race on redis
    const nowMoment = moment();
    await redisClient.setEx(
      `race:${race._id}`,
      moment(updatedRace.startTime).diff(nowMoment, "seconds") +
        this.maxRaceDuration,
      JSON.stringify(updatedRace)
    );

    // Create player progresses
    for (const player of updatedRace.players.filter((pl) => !pl.isBot)) {
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

    // Alert other players in race of new player and race info
    const newPlayer: PlayerInterface = {
      userId: user._id,
      username: user.username,
      avatar: userAvatar,
      isBot: user.isBot,
      wpm: user.wpm,
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
  private async createNewRace(user: UserInterface, practice: boolean) {
    // Create race
    const newRace = await this._repo.createRace(
      new CreateRaceDto({
        minWpm: Math.max(0, (user.avgwpm || 40) - 20),
        maxWpm: (user.avgwpm || 20) + 20,
        userId: user._id,
        username: user.username,
        avatar: generateAvatar([]),
        closed: false,
        excerpt: generateExcerpt(),
      })
    );

    // Add user to race room
    this._socket.addToRoom(newRace._id, user._id);

    return newRace;
  }

  // Adds the user to a new or existing race based on their wpm
  async handleRaceJoinRequest(joinRequest: JoinRaceTaskType) {
    if (joinRequest.entity === "player") {
      const { userId } = joinRequest;

      // Fetch the user
      const user = await this._getUserById(userId);

      // Find a suitable race
      let race = await this._repo.findSuitableRace(user.avgwpm);

      if (race && !race.userIds.includes(user._id)) {
        await this.joinRace(race, {
          _id: user._id,
          username: user.username,
          isBot: false,
        });
      } else {
        // Check if the user already has a race waiting for other players to join
        const existingOpenRace = await this._repo.findUserEmptyRace(userId);
        if (existingOpenRace) {
          const user = await this._getUserById(userId);
          await this._repo.updateRaceWpm(
            existingOpenRace._id,
            user.avgwpm + 20,
            Math.max(user.avgwpm - 15, 0)
          );
          this._socket.addToRoom(existingOpenRace._id, userId);
          return;
        }
        // If no suitable race is found create a new one
        const race = await this.createNewRace(user, false);
        setTimeout(
          () => this.addBotToRace(race._id),
          this.botsJoinTimeThreshold * 1000
        );
      }
    } else {
      const { raceId, bot } = joinRequest;
      const race = await this._repo.findById(raceId);
      if (!race) return;
      if (race.players.length >= this.maxPlayersPerRace) return;
      await this.joinRace(race, { ...bot, isBot: true });
    }
  }

  // Adds a random number of bots to a race if the race only has one player
  private async addBotToRace(raceId: RaceInterface["_id"]) {
    const race = await this._repo.findById(raceId);
    if (!race) return;
    if (race.players.length > 1) return;
    let botCount = randNumBtw(1, this.maxPlayersPerRace - race.players.length);

    while (botCount > 1) {
      const bot: BotInterface = {
        username: generateUserName(),
        _id: "bot_" + generateId(),
        wpm: Math.round(randNumBtw(race.minWpm, race.maxWpm)),
      };

      const joinTask: JoinRaceTaskType = {
        entity: "bot",
        raceId: race._id,
        bot,
      };
      await this._publishJoinTask(joinTask);
      botCount--;
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

    // If the player already has a position, they've completed the race
    // and no further updates should be made
    if (playerProgress.position) return;

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

    const match = inputText.match(
      playerProgress.lastInput.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&")
    );
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

    // Calculate the player's wpm
    const raceStartMoment = moment(race.startTime);
    const minutes = moment().diff(raceStartMoment, "milliseconds") / 60000;
    playerProgress.wpm = Math.round(
      correctTypedText.length / this.wordLength / minutes
    );

    // If player has completed the race
    if (playerProgress.lastInput === race.excerpt.body) {
      // Get their position
      const key = `racePosition:${raceId}`;
      let [res] = await redisClient
        .multi()
        .incr(key)
        .expireAt(key, endMoment.toDate())
        .exec();
      playerProgress.position = Number(res) || 0;
      await this.leaveRace(race._id, userId);

      // Update their stats
      await this.updateUserStats(userId, playerProgress.wpm);
    }

    // Update player's race progress object on redis
    await redisClient.setEx(
      progressKey,
      endMoment.diff(nowMoment, "seconds"),
      JSON.stringify(playerProgress)
    );

    // Broadcast the player's new progress and wpm to all players in the race
    this._socket.emitToRoom(raceId, raceEvents.playerUpdate, playerProgress);
  }

  // Gets an ongoing race that the player has not left
  // as well as the progress data for all players in the race
  async getOngoingRaceData(userId: UserInterface["_id"]) {
    const race = await this._repo.findUserOngoingRace(userId);
    if (!race) return null;
    const progresses: PlayerRaceProgressInterface[] = [];

    for (const playerId of race.userIds) {
      const progressStr = await redisClient.get(
        this.makePlayerProgressId(race._id, playerId)
      );
      if (!progressStr) continue;
      const progress: PlayerRaceProgressInterface = JSON.parse(progressStr);
      progresses.push(progress);
    }

    return { race, progresses, wordLength: this.wordLength };
  }

  async leaveRace(raceId: RaceInterface["_id"], userId: UserInterface["_id"]) {
    await this._repo.leaveRace(raceId, userId);
  }

  private async updateUserStats(userId: UserInterface["_id"], wpm: number) {
    const user = await this._getUserById(userId);
    let wpmTotal = user.avgwpm * user.gamesPlayed;
    const newAvgWpm = (wpmTotal + wpm) / (user.gamesPlayed + 1);
    await this._updateUserStats(user._id, user.gamesPlayed + 1, newAvgWpm);
  }

  // Gives a bot the next available position in the race
  async updateBotPosition(data: BotPositionUpdateType) {
    const { botId, botWpm, raceId } = data;

    // Since multiple clients are pushing the bots, only one of them should
    // be allowed to get a position at a time
    const botLockKey = `botRaceLock:${botId}`;
    const botLock = await redisClient.set(botLockKey, "lock", {
      EX: 10,
      NX: true,
    });
    if (!botLock) return;

    try {
      const botKey = `botRacePosition:${botId}`;
      let position = 0;
      const positionRes = await redisClient.get(botKey);
      if (positionRes) position = Number(positionRes) || 0;

      const race = await this._repo.findById(raceId);
      if (!race) throw new Error();

      if (!position) {
        const endMoment = moment(race.endTime);

        const positionKey = `racePosition:${raceId}`;
        let [res] = await redisClient
          .multi()
          .incr(positionKey)
          .expireAt(positionKey, endMoment.toDate())
          .exec();

        position = Number(res) || 0;

        // Cache the position for this bot till the end of the race
        await redisClient.set(botKey, position.toString(), {
          EX: endMoment.diff(moment(), "seconds"),
          NX: true,
        });
      }

      const progress: PlayerRaceProgressInterface = {
        accuracy: 100,
        wpm: botWpm,
        correctEntries: race.excerpt.body.length,
        lastInput: race.excerpt.body,
        progress: 100,
        raceId,
        totalEntries: race.excerpt.body.length,
        userId: botId,
        position,
      };

      this._socket.emitToRoom(race._id, raceEvents.playerUpdate, progress);
      await redisClient.del(botLockKey);
    } catch (err) {
      await redisClient.del(botLockKey);
    }
  }
}
