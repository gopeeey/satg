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
exports.addListeners = void 0;
const events_1 = require("./service/events");
const index_1 = require("./service/index");
// Defines and adds listeners to race events
const addListeners = (socket, service) => {
    // Define listeners
    function raceJoinHandler(practice) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.userId)
                return;
            const joinRequest = {
                userId: this.userId,
                practice,
            };
            yield service.queueRaceJoinRequest(joinRequest);
        });
    }
    function raceTypeHandler(raceType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.userId)
                return;
        });
    }
    function playerInputHandler(input) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.userId)
                return;
            const dto = new index_1.PlayerInputDto(input);
            dto.userId = this.userId;
            yield service.handlePlayerInput(dto);
        });
    }
    socket.on(events_1.raceEvents.join, raceJoinHandler);
    socket.on(events_1.raceEvents.playerInput, playerInputHandler);
};
exports.addListeners = addListeners;
