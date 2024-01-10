import { DebugLogger, debuglog } from "util";

type ColorType = "green" | "error" | "warning";

const colorMap: { [key in ColorType]: string[] } = {
  green: ["\x1b[92m", "\x1b[0m"],
  error: ["\x1b[31m", "\x1b[0m"],
  warning: ["\x1b[33m", "\x1b[0m"],
};

export class Logger {
  private debugger: DebugLogger;

  constructor(debugSectionName?: string) {
    let section = "default";
    if (debugSectionName) section = debugSectionName;
    this.debugger = debuglog(section);
  }

  private color(str: string, color: ColorType) {
    const wrapper = colorMap[color];
    str = wrapper[0] + str + wrapper[1];

    return str;
  }

  private convertToString(msg: unknown) {
    let string = "";

    if (typeof msg === "number") return msg.toString();
    if (typeof msg === "string") return msg.toString();
    if (typeof msg === "function") return msg.toString();
    if (typeof msg === "boolean") return msg.toString();
    if (typeof msg === "undefined") return "undefined";

    if (msg instanceof Error) {
      string = msg.message;
      if (msg.stack) string += "\n" + msg.stack;
    }

    return string;
  }

  debug(msg: unknown, color?: ColorType) {
    let logString = this.convertToString(msg);
    if (color) logString = this.color(logString, color);

    this.debugger(logString);
  }

  debugErr(msg: unknown) {
    let logString = this.convertToString(msg);
    logString = this.color(logString, "error");

    this.debugger(logString);
  }

  console(msg: unknown, color?: ColorType) {
    let logString = this.convertToString(msg);
    if (color) logString = this.color(logString, color);

    console.log(logString);
  }

  consoleErr(msg: unknown) {
    let logString = this.convertToString(msg);
    logString = this.color(logString, "error");

    console.log(logString);
  }
}
