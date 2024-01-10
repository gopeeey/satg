"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const util_1 = require("util");
const colorMap = {
    green: ["\x1b[92m", "\x1b[0m"],
    error: ["\x1b[31m", "\x1b[0m"],
    warning: ["\x1b[33m", "\x1b[0m"],
};
class Logger {
    constructor(debugSectionName) {
        let section = "default";
        if (debugSectionName)
            section = debugSectionName;
        this.debugger = (0, util_1.debuglog)(section);
    }
    color(str, color) {
        const wrapper = colorMap[color];
        str = wrapper[0] + str + wrapper[1];
        return str;
    }
    convertToString(msg) {
        let string = "";
        if (typeof msg === "number")
            return msg.toString();
        if (typeof msg === "string")
            return msg.toString();
        if (typeof msg === "function")
            return msg.toString();
        if (typeof msg === "boolean")
            return msg.toString();
        if (typeof msg === "undefined")
            return "undefined";
        if (msg instanceof Error) {
            string = msg.message;
            if (msg.stack)
                string += "\n" + msg.stack;
        }
        return string;
    }
    debug(msg, color) {
        let logString = this.convertToString(msg);
        if (color)
            logString = this.color(logString, color);
        this.debugger(logString);
    }
    debugErr(msg) {
        let logString = this.convertToString(msg);
        logString = this.color(logString, "error");
        this.debugger(logString);
    }
    console(msg, color) {
        let logString = this.convertToString(msg);
        if (color)
            logString = this.color(logString, color);
        console.log(logString);
    }
    consoleErr(msg) {
        let logString = this.convertToString(msg);
        logString = this.color(logString, "error");
        console.log(logString);
    }
}
exports.Logger = Logger;
