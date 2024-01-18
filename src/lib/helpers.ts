import fs from "fs";
import { nanoid } from "nanoid";
import path from "path";
import config from "src/config";
import { avatarArray, excerpts, nameAdjectives, nameNouns } from "./misce";

export type TemplateDataType = { [key: string]: string | number };

// Simply parses JSON to a javascript object
export const parseJsonToObject = <O>(json: string) => {
  try {
    const object = JSON.parse(json);
    return object as O;
  } catch (err) {
    return {};
  }
};

// Matches and replaces variable placeholders in a given string
// using the data object provided.
export const interpolateStr = (
  templateStr: string,
  data?: TemplateDataType
) => {
  if (!data) data = {};
  for (const key in config.templateGlobals) {
    data["global." + key] =
      config.templateGlobals[key as keyof typeof config.templateGlobals];
  }

  for (const key in data) {
    const replace = data[key];
    templateStr = templateStr.replace(
      new RegExp(`{${key}}`, "g"),
      replace.toString()
    );
  }

  return templateStr;
};

// Reads in a template from the template folder
// and replaces it variable placeholders with actual values
export const getTemplate = async (
  fileName: string,
  data?: TemplateDataType
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const templatePath = path.join(
      __dirname,
      "/../../templates/",
      fileName + ".html"
    );

    // const templatePath = new URL(
    //   "/../../templates/" + fileName + ".html",
    //   __dirname
    // );

    // Read in the template
    fs.readFile(templatePath, "utf-8", (err, template) => {
      if (err || !template)
        return reject(err || new Error("Template not found"));

      // Replace placeholders
      const filledTemplate = interpolateStr(template, data);
      resolve(filledTemplate);
    });
  });
};

// Gets static assets from the public folder
export const getStaticAsset = async (filename: string) => {
  return new Promise((resolve, reject) => {
    const filePath = __dirname + `/../../public/${filename}`;
    // const filePath = new URL(`../../public/${filename}`, __dirname);

    fs.readFile(filePath, (err, buffer) => {
      if (err || !buffer) return reject(err || new Error("File not found"));
      resolve(buffer);
    });
  });
};

// Uses linear interpolation to scale a number x between two numbers x0 and x1
// to a number y between two numbers y0 and y1
const scaleNumber = (
  x: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number
) => {
  return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0); // returns y
};

// Selects a random number between two numbers a and b
export const randNumBtw = (a: number, b: number) => {
  const rand = Math.random();
  return scaleNumber(rand, 0, 1, a, b);
};

// Generates user name by selecting randomly from
// an array of adjectives and an array of nouns
export const generateUserName = () => {
  const adjIndex = Math.round(randNumBtw(0, nameAdjectives.length - 1));
  const nounIndex = Math.round(randNumBtw(0, nameNouns.length - 1));

  return `${nameAdjectives[adjIndex]} ${nameNouns[nounIndex]}`;
};

// Generates an id
export const generateId = () => nanoid();

// Selects a random avatar from the avatars array while exempting the specified ones
export const generateAvatar = (exempt: string[]) => {
  const availableAvatars = avatarArray.filter(
    (avatar) => !exempt.includes(avatar)
  );

  return availableAvatars[
    Math.round(randNumBtw(0, availableAvatars.length - 1))
  ];
};

export const generateExcerpt = () => {
  return excerpts[Math.round(randNumBtw(0, excerpts.length - 1))];
};
