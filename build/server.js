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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./lib/logger");
const http_1 = __importDefault(require("http"));
const config_1 = __importDefault(require("./config"));
const controllers = __importStar(require("./controllers"));
const string_decoder_1 = require("string_decoder");
const url_1 = __importDefault(require("url"));
const logger = new logger_1.Logger("server");
// Routes supported by the http server
const routes = {
    "": controllers.index,
    public: controllers.publicController,
};
// Handles incoming http and https requests
const reqListener = (req, res) => {
    if (!req.url || !req.method || req.method.toLowerCase() !== "get")
        return res.end("");
    // Parse the url and extract the path
    const parsedUrl = url_1.default.parse(req.url, true);
    if (!parsedUrl.path)
        return res.end("");
    const trimmedPath = parsedUrl.path.replace(/^\/+|\/+$/g, "");
    // Get request payload if any (useless though)
    const decoder = new string_decoder_1.StringDecoder("utf-8");
    let buffer = "";
    req.on("data", (chunk) => {
        buffer += decoder.write(chunk);
    });
    req.on("end", () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        buffer += decoder.end();
        // Find the appropriate controller (default to notFound)
        const rootPath = trimmedPath.split("/")[0];
        let selectedController = routes[rootPath];
        if (!selectedController)
            selectedController = controllers.notFound;
        // Determine the content type of the resource based on response from selected controller
        let statusCode, contentType, payload;
        try {
            const response = yield selectedController(trimmedPath);
            const contentTypeMap = {
                css: "text/css",
                html: "text/html ",
                plain: "text/plain",
                ico: "image/vnd.microsoft.icon",
                jpg: "image/jpeg",
                png: "image/png",
                svg: "image/svg+xml",
                js: "application/javascript",
            };
            contentType = contentTypeMap[response.contentType];
            statusCode = response.statusCode;
            payload = response.payload;
        }
        catch (err) {
            // if (err instanceof Error) logger.debug(err, "error");
            logger.console(err, "error");
            contentType = "application/json";
            statusCode = 500;
            payload = JSON.stringify({
                message: "Sorry an unexpected error occurred",
            });
        }
        // Send response
        res.setHeader("Content-Type", contentType);
        res.writeHead(statusCode);
        res.end(payload);
        logger.debug(`${statusCode} - ${(_a = req.method) === null || _a === void 0 ? void 0 : _a.toUpperCase()} ${parsedUrl.path}`);
    }));
};
const httpServer = http_1.default.createServer(reqListener);
exports.default = {
    httpServer,
    start: () => httpServer.listen(config_1.default.server.port, () => {
        logger.console(`Server is listening on port ${config_1.default.server.port}`, "green");
    }),
};
