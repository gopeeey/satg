import { generateId, generateUserName } from "@lib/helpers";
import { UserInterface } from "@users/service/interfaces";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema<UserInterface>(
  {
    _id: { type: String, default: generateId },
    username: { type: String, default: generateUserName },
    avgwpm: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.model("users", userSchema);

export default User;
