import { RaceInterface } from "../interfaces";
// Defines the data used in creating a race
type PropType = {
  minWpm: RaceInterface["minWpm"];
  maxWpm: RaceInterface["maxWpm"];
  userId: RaceInterface["userIds"][number];
  username: string;
  avatar: string;
  excerpt: RaceInterface["excerpt"];
  closed?: RaceInterface["closed"];
  startTime?: RaceInterface["startTime"];
};

export class CreateRaceDto {
  minWpm: PropType["minWpm"];
  maxWpm: PropType["maxWpm"];
  userId: PropType["userId"];
  username: string;
  avatar: string;
  excerpt: PropType["excerpt"];
  closed?: PropType["closed"];
  startTime?: PropType["startTime"];

  constructor(body: PropType) {
    this.minWpm = body.minWpm;
    this.maxWpm = body.maxWpm;
    this.userId = body.userId;
    this.username = body.username;
    this.avatar = body.avatar;
    this.closed = body.closed;
    this.excerpt = body.excerpt;
    this.startTime = body.startTime;
  }
}
