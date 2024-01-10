import { Socket } from "socket.io";

export interface AuthSocket extends Socket {
  userId?: string;
}

export interface SocketInterface {
  emitToRoom: (roomId: string, event: string, data: unknown) => void;
  addToRoom: (roomId: string, userId: string) => void;
  removeFromRoom: (roomId: string, userId: string) => void;
}
