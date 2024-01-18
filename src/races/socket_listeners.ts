import {
  JoinRaceTaskType,
  RaceServiceInterface,
} from "@races/service/interfaces";
import { AuthSocket } from "@socket/interfaces";
import { raceEvents } from "./service/events";
import {
  BotPositionUpdateType,
  PlayerInputDto,
  RaceInterface,
} from "./service/index";

// Defines and adds listeners to race events
export const addListeners = (
  socket: AuthSocket,
  service: RaceServiceInterface
) => {
  // Define listeners
  async function raceJoinHandler(this: AuthSocket, practice: boolean) {
    if (!this.userId) return;
    const joinRequest: JoinRaceTaskType = {
      userId: this.userId,
      practice,
      entity: "player",
    };
    await service.queueRaceJoinRequest(joinRequest);
  }

  async function raceTypeHandler(this: AuthSocket, raceType: string) {
    if (!this.userId) return;
  }

  async function playerInputHandler(this: AuthSocket, input: PlayerInputDto) {
    if (!this.userId) return;
    const dto = new PlayerInputDto(input);
    dto.userId = this.userId;
    await service.handlePlayerInput(dto);
  }

  async function leaveRaceHandler(
    this: AuthSocket,
    raceId: RaceInterface["_id"]
  ) {
    if (!this.userId) return;
    await service.leaveRace(raceId, this.userId);
  }

  async function botPositionUpdateHandler(
    this: AuthSocket,
    data: BotPositionUpdateType
  ) {
    if (!this.userId) return;
    await service.updateBotPosition(data);
  }

  socket.on(raceEvents.join, raceJoinHandler);
  socket.on(raceEvents.playerInput, playerInputHandler);
  socket.on(raceEvents.leave, leaveRaceHandler);
  socket.on(raceEvents.botFinished, botPositionUpdateHandler);
};
