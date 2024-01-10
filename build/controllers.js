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
exports.notFound = exports.publicController = exports.index = void 0;
const helpers = __importStar(require("./lib/helpers"));
const index = (path) => __awaiter(void 0, void 0, void 0, function* () {
    const template = yield helpers.getTemplate("base");
    return {
        payload: template,
        contentType: "html",
        statusCode: 200,
    };
});
exports.index = index;
const publicController = (path) => __awaiter(void 0, void 0, void 0, function* () {
    const filename = path.replace("public/", "");
    const asset = yield helpers.getStaticAsset(filename);
    const extension = filename.split(".")[1];
    let contentType = "plain";
    if (extension === "js")
        contentType = "js";
    if (extension === "css")
        contentType = "css";
    if (extension === "html")
        contentType = "html";
    if (extension === "ico")
        contentType = "ico";
    if (extension === "png")
        contentType = "png";
    if (extension === "jpg")
        contentType = "jpg";
    if (extension === "jpeg")
        contentType = "jpg";
    if (extension === "svg")
        contentType = "svg";
    return {
        payload: asset,
        contentType,
        statusCode: 200,
    };
});
exports.publicController = publicController;
const notFound = (path) => __awaiter(void 0, void 0, void 0, function* () {
    return {
        payload: "Not found",
        contentType: "html",
        statusCode: 404,
    };
});
exports.notFound = notFound;
