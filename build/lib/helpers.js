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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExcerpt = exports.generateAvatar = exports.generateId = exports.generateUserName = exports.getStaticAsset = exports.getTemplate = exports.interpolateStr = exports.parseJsonToObject = void 0;
const fs_1 = __importDefault(require("fs"));
const nanoid_1 = require("nanoid");
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config"));
const misce_1 = require("./misce");
// Simply parses JSON to a javascript object
const parseJsonToObject = (json) => {
    try {
        const object = JSON.parse(json);
        return object;
    }
    catch (err) {
        return {};
    }
};
exports.parseJsonToObject = parseJsonToObject;
// Matches and replaces variable placeholders in a given string
// using the data object provided.
const interpolateStr = (templateStr, data) => {
    if (!data)
        data = {};
    for (const key in config_1.default.templateGlobals) {
        data["global." + key] =
            config_1.default.templateGlobals[key];
    }
    for (const key in data) {
        const replace = data[key];
        templateStr = templateStr.replace(new RegExp(`{${key}}`, "g"), replace.toString());
    }
    return templateStr;
};
exports.interpolateStr = interpolateStr;
// Reads in a template from the template folder
// and replaces it variable placeholders with actual values
const getTemplate = (fileName, data) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const templatePath = path_1.default.join(__dirname, "/../../templates/", fileName + ".html");
        // const templatePath = new URL(
        //   "/../../templates/" + fileName + ".html",
        //   __dirname
        // );
        // Read in the template
        fs_1.default.readFile(templatePath, "utf-8", (err, template) => {
            if (err || !template)
                return reject(err || new Error("Template not found"));
            // Replace placeholders
            const filledTemplate = (0, exports.interpolateStr)(template, data);
            resolve(filledTemplate);
        });
    });
});
exports.getTemplate = getTemplate;
// Gets static assets from the public folder
const getStaticAsset = (filename) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const filePath = __dirname + `/../../public/${filename}`;
        // const filePath = new URL(`../../public/${filename}`, __dirname);
        fs_1.default.readFile(filePath, (err, buffer) => {
            if (err || !buffer)
                return reject(err || new Error("File not found"));
            resolve(buffer);
        });
    });
});
exports.getStaticAsset = getStaticAsset;
// Uses linear interpolation to scale a number x between two numbers x0 and x1
// to a number y between two numbers y0 and y1
const scaleNumber = (x, x0, x1, y0, y1) => {
    return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0); // returns y
};
// Selects a random number between two numbers a and b
const randNumBtw = (a, b) => {
    const rand = Math.random();
    return scaleNumber(rand, 0, 1, a, b);
};
// Generates user name by selecting randomly from
// an array of adjectives and an array of nouns
const generateUserName = () => {
    const adjIndex = Math.round(randNumBtw(0, misce_1.nameAdjectives.length - 1));
    const nounIndex = Math.round(randNumBtw(0, misce_1.nameNouns.length - 1));
    return `${misce_1.nameAdjectives[adjIndex]} ${misce_1.nameNouns[nounIndex]}`;
};
exports.generateUserName = generateUserName;
// Generates an id
const generateId = () => (0, nanoid_1.nanoid)();
exports.generateId = generateId;
// Selects a random avatar from the avatars array while exempting the specified ones
const generateAvatar = (exempt) => {
    const availableAvatars = misce_1.avatarArray.filter((avatar) => !exempt.includes(avatar));
    return availableAvatars[Math.round(randNumBtw(0, availableAvatars.length - 1))];
};
exports.generateAvatar = generateAvatar;
const generateExcerpt = () => {
    return misce_1.excerpts[Math.round(randNumBtw(0, misce_1.excerpts.length - 1))];
};
exports.generateExcerpt = generateExcerpt;
