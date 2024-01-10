"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../../lib/helpers");
const mongoose_1 = __importDefault(require("mongoose"));
const player = new mongoose_1.default.Schema({
    userId: { type: String },
    username: { type: String },
    avatar: { type: String },
});
const excerpt = new mongoose_1.default.Schema({
    author: { type: String },
    body: { type: String, required: true },
    title: { type: String },
    year: { type: Number },
});
const raceSchema = new mongoose_1.default.Schema({
    _id: { type: String, default: helpers_1.generateId },
    userIds: { type: [String], default: [] },
    minWpm: { type: Number, default: 0 },
    maxWpm: { type: Number, default: 0 },
    closed: { type: Boolean, default: false },
    startTime: { type: Date },
    endTime: { type: Date },
    players: { type: [player], default: [] },
    practice: { type: Boolean, default: false },
    excerpt,
}, { timestamps: true });
raceSchema.index({ closed: 1, minWpm: 1, maxWpm: -1 });
const DbRace = mongoose_1.default.model("races", raceSchema);
exports.default = DbRace;
