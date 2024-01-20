import { PickWithOptional } from "src/types";
import { PlayerRaceProgressInterface } from "../interfaces";

export class PlayerProgressDto {
  userId;
  raceId;
  wpm;
  progress;
  correctEntries;
  totalEntries;
  accuracy;
  lastInput;
  position;

  constructor({
    wpm = 0,
    progress = 0,
    correctEntries = 0,
    totalEntries = 0,
    accuracy = 0,
    lastInput = "",
    ...props
  }: PickWithOptional<PlayerRaceProgressInterface, "userId" | "raceId">) {
    this.userId = props.userId;
    this.raceId = props.raceId;
    this.wpm = wpm;
    this.progress = progress;
    this.correctEntries = correctEntries;
    this.totalEntries = totalEntries;
    this.accuracy = accuracy;
    this.lastInput = lastInput;
    this.position = 0;
  }
}
