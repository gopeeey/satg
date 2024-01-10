"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerProgressDto = void 0;
class PlayerProgressDto {
    constructor(_a) {
        var { adjustedAvgWpm = 0, progress = 0, correctEntries = 0, totalEntries = 0, accuracy = 0, lastInput = "" } = _a, props = __rest(_a, ["adjustedAvgWpm", "progress", "correctEntries", "totalEntries", "accuracy", "lastInput"]);
        this.userId = props.userId;
        this.raceId = props.raceId;
        this.adjustedAvgWpm = adjustedAvgWpm;
        this.progress = progress;
        this.correctEntries = correctEntries;
        this.totalEntries = totalEntries;
        this.accuracy = accuracy;
        this.lastInput = lastInput;
    }
}
exports.PlayerProgressDto = PlayerProgressDto;
