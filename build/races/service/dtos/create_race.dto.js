"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRaceDto = void 0;
class CreateRaceDto {
    constructor(body) {
        this.minWpm = body.minWpm;
        this.maxWpm = body.maxWpm;
        this.userId = body.userId;
        this.username = body.username;
        this.avatar = body.avatar;
        this.practice = body.practice;
        this.closed = body.closed;
        this.excerpt = body.excerpt;
        this.startTime = body.startTime;
    }
}
exports.CreateRaceDto = CreateRaceDto;
