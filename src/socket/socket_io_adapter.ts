import { Server } from "socket.io";
import { SocketInterface } from "./interfaces";

export class SocketIoAdapter implements SocketInterface {
  io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  emitToRoom(roomId: string, event: string, data: unknown) {
    this.io.in(roomId).emit(event, data);
  }

  addToRoom(roomId: string, userId: string) {
    this.io.in(userId).socketsJoin(roomId);
  }

  removeFromRoom(roomId: string, userId: string) {
    this.io.in(userId).socketsLeave(roomId);
  }
}
