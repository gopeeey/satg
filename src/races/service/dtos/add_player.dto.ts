type PropsType = {
  userId: string;
  username: string;
  avatar: string;
  raceId: string;
  isBot: boolean;
  wpm?: number;
  startTime?: Date;
  endTime?: Date;
};

export class AddPlayerDto {
  userId;
  username;
  avatar;
  raceId;
  startTime;
  endTime;
  isBot;
  wpm;

  constructor(body: PropsType) {
    this.userId = body.userId;
    this.username = body.username;
    this.avatar = body.avatar;
    this.raceId = body.raceId;
    this.startTime = body.startTime;
    this.endTime = body.endTime;
    this.isBot = body.isBot;
    this.wpm = body.wpm;
  }
}
