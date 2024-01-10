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
exports.RaceRepo = void 0;
const moment_1 = __importDefault(require("moment"));
const model_1 = __importDefault(require("./model"));
class RaceRepo {
    // Creates a new race
    createRace(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            const player = {
                userId: dto.userId,
                username: dto.username,
                avatar: dto.avatar,
            };
            const race = yield model_1.default.create(Object.assign(Object.assign({}, dto), { players: [player], userIds: [dto.userId] }));
            return race.toJSON();
        });
    }
    // Gets a race that isn't closed and where the provided wpm is between the minWpm and maxWpm
    findSuitableRace(wpm) {
        return __awaiter(this, void 0, void 0, function* () {
            const race = yield model_1.default.findOne({
                closed: false,
                practice: false,
                minWpm: { $lte: wpm },
                maxWpm: { $gte: wpm },
                $or: [
                    { startTime: { $exists: false } },
                    { startTime: { $gt: (0, moment_1.default)().add(10, "seconds").toDate() } },
                ],
            });
            return race ? race.toJSON() : null;
        });
    }
    // Adds a user's id to a race's array of user ids and
    // updates the start and end time
    addPlayer(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, username, avatar, raceId, startTime, endTime } = dto;
            const race = yield model_1.default.findById(raceId);
            if (!race)
                throw new Error("Race not found");
            const newPlayer = { userId, username, avatar };
            const savedRace = yield model_1.default.findByIdAndUpdate(raceId, {
                $set: { startTime, endTime },
                $addToSet: { userIds: userId },
                $push: { players: newPlayer },
            }, { runValidators: true, new: true });
            if (!savedRace)
                throw new Error("Error adding player to race");
            return savedRace.toJSON();
        });
    }
    // Closes a race
    closeRace(raceId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield model_1.default.findByIdAndUpdate(raceId, { $set: { closed: true } });
        });
    }
}
exports.RaceRepo = RaceRepo;
