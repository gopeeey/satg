"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketIoAdapter = void 0;
class SocketIoAdapter {
    constructor(io) {
        this.io = io;
    }
    emitToRoom(roomId, event, data) {
        this.io.in(roomId).emit(event, data);
    }
    addToRoom(roomId, userId) {
        this.io.in(userId).socketsJoin(roomId);
    }
    removeFromRoom(roomId, userId) {
        this.io.in(userId).socketsLeave(roomId);
    }
}
exports.SocketIoAdapter = SocketIoAdapter;
