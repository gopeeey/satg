"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.attachListeners = exports.createServer = void 0;
const raceListeners = __importStar(require("../races/socket_listeners"));
const middleware_1 = require("../users/middleware");
const socket_io_1 = require("socket.io");
const socket_io_adapter_1 = require("./socket_io_adapter");
const createServer = () => {
    const io = new socket_io_1.Server({
        connectionStateRecovery: {
            maxDisconnectionDuration: 10,
            skipMiddlewares: true,
        },
    });
    const adaptedIo = new socket_io_adapter_1.SocketIoAdapter(io);
    return adaptedIo;
};
exports.createServer = createServer;
const attachListeners = (io, deps) => {
    const { userService, raceService } = deps;
    const userMiddleware = new middleware_1.UserMiddleware(userService);
    // Use usermiddleware to handle auth
    io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
        yield userMiddleware.auth(socket, next);
    }));
    // Use user middleware to handle session
    // Attach race event handlers
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        yield userMiddleware.session(socket);
        raceListeners.addListeners(socket, raceService);
    }));
};
exports.attachListeners = attachListeners;
// export const createSocketServer = (deps: ContainerInterface) => {
//   const { userService, raceService } = deps;
//   const io = new Server({
//     connectionStateRecovery: {
//       maxDisconnectionDuration: 10,
//       skipMiddlewares: true,
//     },
//   });
//   const userMiddleware = new UserMiddleware(userService);
//   // Use usermiddleware to handle auth
//   io.use(async (socket, next) => {
//     await userMiddleware.auth(socket, next);
//   });
//   // Use user middleware to handle session
//   // Attach race event handlers
//   io.on("connection", async (socket: AuthSocket) => {
//     await userMiddleware.session(socket);
//     raceListeners.addListeners(socket, raceService);
//   });
//   return io;
// };
