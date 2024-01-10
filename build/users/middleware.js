"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMiddleware = void 0;
const logger_1 = require("../lib/logger");
const logger = new logger_1.Logger("socket-middleware-users");
class UserMiddleware {
    constructor(service) {
        // Gets or creates a user and adds the user's id to the socket
        this.auth = (socket, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = socket.handshake.auth.userId;
                const user = yield this._service.getOrCreateUser(id);
                socket.userId = user._id;
                if (next)
                    next();
            }
            catch (err) {
                logger.debugErr(err);
                if (err instanceof Error && next)
                    return next(err);
            }
        });
        // Adds the user to a room with their user id and emits the session event
        // to indicate to the frontend that a session has started
        this.session = (socket) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!socket.userId)
                    throw new Error("Unauthenticated");
                yield socket.join(socket.userId);
                const user = yield this._service.getUserById(socket.userId);
                socket.emit("user:session", user);
            }
            catch (err) {
                logger.debugErr(err);
                throw err;
            }
        });
        this._service = service;
    }
}
exports.UserMiddleware = UserMiddleware;
