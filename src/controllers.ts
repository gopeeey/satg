import * as helpers from "@lib/helpers";

export type ControllerResponseType = {
  payload: unknown;
  contentType: "plain" | "html" | "css" | "jpg" | "png" | "ico" | "svg" | "js";
  statusCode: number;
};

export type ControllerType = (path: string) => Promise<ControllerResponseType>;

export const index: ControllerType = async (path) => {
  const template = await helpers.getTemplate("base");
  return {
    payload: template,
    contentType: "html",
    statusCode: 200,
  };
};

export const publicController: ControllerType = async (path) => {
  const filename = path.replace("public/", "");
  const asset = await helpers.getStaticAsset(filename);
  const extension = filename.split(".")[1];

  let contentType: ControllerResponseType["contentType"] = "plain";

  if (extension === "js") contentType = "js";
  if (extension === "css") contentType = "css";
  if (extension === "html") contentType = "html";
  if (extension === "ico") contentType = "ico";
  if (extension === "png") contentType = "png";
  if (extension === "jpg") contentType = "jpg";
  if (extension === "jpeg") contentType = "jpg";
  if (extension === "svg") contentType = "svg";

  return {
    payload: asset,
    contentType,
    statusCode: 200,
  };
};

export const notFound: ControllerType = async (path) => {
  return {
    payload: "Not found",
    contentType: "html",
    statusCode: 404,
  };
};
