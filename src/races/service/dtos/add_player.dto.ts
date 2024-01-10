type PropsType = {
  userId: string;
  username: string;
  avatar: string;
  raceId: string;
  startTime?: Date;
  endTime?: Date;
};

export class AddPlayerDto {
  userId: string;
  username: string;
  avatar: string;
  raceId: string;
  startTime?: Date;
  endTime?: Date;

  constructor(body: PropsType) {
    this.userId = body.userId;
    this.username = body.username;
    this.avatar = body.avatar;
    this.raceId = body.raceId;
    this.startTime = body.startTime;
    this.endTime = body.endTime;
  }
}
