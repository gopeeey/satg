"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RaceService = void 0;
const moment_1 = __importDefault(require("moment"));
const helpers_1 = require("../../lib/helpers");
const redis_1 = require("../../redis");
const events_1 = require("./events");
const index_1 = require("./index");
class RaceService {
    constructor(deps) {
        this.maxPlayersPerRace = 5;
        this.startCountDownDuration = 30; // seconds
        this.maxRaceDuration = 10 * 60; // seconds
        this.wordLength = 5; // characters
        this._repo = deps.repo;
        this._socket = deps.socket;
        this._publishJoinTask = deps.publishRaceJoinTask;
        this._getUserById = deps.getUserById;
    }
    // Queues a race join request
    queueRaceJoinRequest(joinRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            // Publish the join request to the race join queue
            yield this._publishJoinTask(joinRequest);
        });
    }
    // Adds a user to a race
    joinRace(race, user) {
        return __awaiter(this, void 0, void 0, function* () {
            // Generate a new avatar for the new player
            const userAvatar = (0, helpers_1.generateAvatar)(race.players.map((player) => player.avatar));
            // Add the user's id to the race
            const addUserDto = new index_1.AddPlayerDto({
                userId: user._id,
                username: user.username,
                avatar: userAvatar,
                raceId: race._id,
            });
            // if race has no start or end time, add them
            if (!race.startTime) {
                addUserDto.startTime = (0, moment_1.default)()
                    .add(this.startCountDownDuration, "seconds")
                    .toDate();
                addUserDto.endTime = (0, moment_1.default)()
                    .add(this.maxRaceDuration, "seconds")
                    .toDate();
            }
            const updatedRace = yield this._repo.addPlayer(addUserDto);
            this._socket.addToRoom(race._id, user._id);
            // Update race on redis
            const nowMoment = (0, moment_1.default)();
            yield redis_1.redisClient.setEx(`race:${race._id}`, (0, moment_1.default)(updatedRace.startTime).diff(nowMoment, "seconds") +
                this.maxRaceDuration, JSON.stringify(updatedRace));
            // Create player progresses
            for (const player of updatedRace.players) {
                const playerProgressDto = new index_1.PlayerProgressDto({
                    userId: player.userId,
                    raceId: race._id,
                });
                yield redis_1.redisClient.setEx(this.makePlayerProgressId(race._id, player.userId), (0, moment_1.default)(updatedRace.startTime).diff(nowMoment, "seconds") +
                    this.maxRaceDuration, JSON.stringify(playerProgressDto));
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
            const newPlayer = {
                userId: user._id,
                username: user.username,
                avatar: userAvatar,
            };
            const data = { newPlayer, race: updatedRace, wordLength: this.wordLength };
            this._socket.emitToRoom(race._id, events_1.raceEvents.newPlayer, data);
            // If the race is full, close the race
            if (updatedRace.players.length >= this.maxPlayersPerRace)
                this._repo.closeRace(updatedRace._id);
        });
    }
    makePlayerProgressId(raceId, userId) {
        return `raceProgress:${raceId}:${userId}`;
    }
    // Creates a new race
    createNewRace(user, practice) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create race
            const newRace = yield this._repo.createRace(new index_1.CreateRaceDto({
                minWpm: Math.max(0, user.avgwpm - 15),
                maxWpm: user.avgwpm + 20,
                userId: user._id,
                username: user.username,
                avatar: (0, helpers_1.generateAvatar)([]),
                practice,
                closed: practice,
                excerpt: (0, helpers_1.generateExcerpt)(),
                startTime: practice
                    ? (0, moment_1.default)().add(this.startCountDownDuration, "seconds").toDate()
                    : undefined,
            }));
            // Add user to race room
            this._socket.addToRoom(newRace._id, user._id);
            // If it is a practice session, persist the race in redis
            // and notify the user of the race immediately
            if (practice) {
                // Update race on redis
                const nowMoment = (0, moment_1.default)();
                yield redis_1.redisClient.setEx(`race:${newRace._id}`, (0, moment_1.default)(newRace.startTime).diff(nowMoment, "seconds") +
                    this.maxRaceDuration, JSON.stringify(newRace));
                // Create player progress
                const playerProgress = new index_1.PlayerProgressDto({
                    userId: user._id,
                    raceId: newRace._id,
                });
                yield redis_1.redisClient.setEx(this.makePlayerProgressId(newRace._id, user._id), (0, moment_1.default)(newRace.startTime).diff(nowMoment, "seconds") +
                    this.maxRaceDuration, JSON.stringify(playerProgress));
                const data = {
                    newPlayer: newRace.players[0],
                    race: newRace,
                    wordLength: this.wordLength,
                };
                this._socket.emitToRoom(newRace._id, events_1.raceEvents.newPlayer, data);
            }
        });
    }
    // Adds the user to a new or existing race based on their wpm
    handleRaceJoinRequest(joinRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, practice } = joinRequest;
            // Fetch the user
            const user = yield this._getUserById(userId);
            // Find a suitable race
            let race = yield this._repo.findSuitableRace(user.avgwpm);
            if (race) {
                yield this.joinRace(race, user);
            }
            else {
                // If no suitable race is found create a new one
                yield this.createNewRace(user, practice);
            }
        });
    }
    // Handles players' text input
    handlePlayerInput(playerInput) {
        return __awaiter(this, void 0, void 0, function* () {
            const { inputText, raceId, userId } = playerInput;
            // Fetch the race from redis
            let raceStr = yield redis_1.redisClient.get(`race:${raceId}`);
            if (!raceStr)
                return;
            const race = JSON.parse(raceStr);
            // Prevent updates if race has not started or has ended
            const nowMoment = (0, moment_1.default)();
            if (!race.startTime || nowMoment.isBefore((0, moment_1.default)(race.startTime))) {
                return;
            }
            const endMoment = (0, moment_1.default)(race.startTime).add(this.maxRaceDuration, "seconds");
            if (nowMoment.isAfter(endMoment))
                return;
            // Get the player's race progress object from redis
            const progressKey = this.makePlayerProgressId(raceId, userId);
            const playerRaceProgressStr = yield redis_1.redisClient.get(progressKey);
            if (!playerRaceProgressStr)
                return;
            const playerProgress = JSON.parse(playerRaceProgressStr);
            const raceText = race.excerpt.body;
            let correctTypedText = "";
            // Check if the player has typed the correct text
            for (let i = 0; i < inputText.length; i++) {
                if (inputText[i] === raceText[i]) {
                    correctTypedText += inputText[i];
                }
                else {
                    break;
                }
            }
            const match = inputText.match(playerProgress.lastInput);
            if (match) {
                const newCharsStart = playerProgress.lastInput.length;
                const newChars = inputText.slice(newCharsStart, inputText.length);
                playerProgress.totalEntries += newChars.length;
                let newCorrectChars = correctTypedText.slice(newCharsStart, inputText.length);
                playerProgress.correctEntries += newCorrectChars.length;
            }
            playerProgress.lastInput = inputText;
            // Calculate accuracy
            playerProgress.accuracy =
                (playerProgress.correctEntries / playerProgress.totalEntries) * 100;
            // Calculate the player's progress percentage
            playerProgress.progress = Math.max(playerProgress.progress, (correctTypedText.length / race.excerpt.body.length) * 100);
            // Calculate the player's avgWpm and adjustedAvgWpm
            const raceStartMoment = (0, moment_1.default)(race.startTime);
            const minutes = (0, moment_1.default)().diff(raceStartMoment, "milliseconds") / 60000;
            const wpm = inputText.length / this.wordLength / minutes;
            playerProgress.adjustedAvgWpm = Math.round(wpm * (playerProgress.accuracy / 100));
            // Update player's race progress object on redis
            yield redis_1.redisClient.setEx(progressKey, endMoment.diff(nowMoment, "seconds"), JSON.stringify(playerProgress));
            // Broadcast the player's new progress and wpm to all players in the race
            this._socket.emitToRoom(raceId, events_1.raceEvents.playerUpdate, playerProgress);
        });
    }
}
exports.RaceService = RaceService;
