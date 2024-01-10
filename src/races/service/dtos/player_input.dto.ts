import { UserInterface } from "@users/service/interfaces";
import { RaceInterface } from "../interfaces";

type Props = {
  inputText: string;
  raceId: RaceInterface["_id"];
  userId: UserInterface["_id"];
};

export class PlayerInputDto {
  inputText: Props["inputText"];
  raceId: Props["raceId"];
  userId: Props["userId"];

  constructor(props: Props) {
    this.inputText = props.inputText;
    this.raceId = props.raceId;
    this.userId = props.userId;
  }
}
