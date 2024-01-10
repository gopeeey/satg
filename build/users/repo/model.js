"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../../lib/helpers");
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    _id: { type: String, default: helpers_1.generateId },
    username: { type: String, default: helpers_1.generateUserName },
    avgwpm: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
}, { timestamps: true });
const User = mongoose_1.default.model("users", userSchema);
exports.default = User;
