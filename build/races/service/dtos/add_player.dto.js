"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPlayerDto = void 0;
class AddPlayerDto {
    constructor(body) {
        this.userId = body.userId;
        this.username = body.username;
        this.avatar = body.avatar;
        this.raceId = body.raceId;
        this.startTime = body.startTime;
        this.endTime = body.endTime;
    }
}
exports.AddPlayerDto = AddPlayerDto;
