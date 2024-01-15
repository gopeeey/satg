import { generateId } from "@lib/helpers";
import { ExcerptType, PlayerInterface, RaceInterface } from "@races/service";
import mongoose from "mongoose";

const player = new mongoose.Schema<PlayerInterface>({
  userId: { type: String },
  username: { type: String },
  avatar: { type: String },
});

const excerpt = new mongoose.Schema<ExcerptType>({
  author: { type: String },
  body: { type: String, required: true },
  title: { type: String },
  year: { type: Number },
});

const raceSchema = new mongoose.Schema<RaceInterface>(
  {
    _id: { type: String, default: generateId },
    userIds: { type: [String], default: [] },
    minWpm: { type: Number, default: 0 },
    maxWpm: { type: Number, default: 0 },
    closed: { type: Boolean, default: false },
    startTime: { type: Date },
    endTime: { type: Date },
    players: { type: [player], default: [] },
    practice: { type: Boolean, default: false },
    excerpt,
    allowedPlayerIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

raceSchema.index({ allowedPlayerIds: 1, endTime: 1 });
raceSchema.index({ closed: 1, minWpm: 1, maxWpm: -1 });
raceSchema.index({ userIds: 1 });

const DbRace = mongoose.model("races", raceSchema);

export default DbRace;
