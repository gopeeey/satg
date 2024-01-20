import { Logger } from "@lib/logger";
import http from "http";
import config from "src/config";
import * as controllers from "src/controllers";
import { StringDecoder } from "string_decoder";
import url from "url";

const logger = new Logger("server");

// Routes supported by the http server
const routes: { [key: string]: controllers.ControllerType } = {
  "": controllers.index,
  public: controllers.publicController,
};

// Handles incoming http and https requests
const reqListener: http.RequestListener = (req, res) => {
  if (!req.url || !req.method || req.method.toLowerCase() !== "get")
    return res.end("");

  // Parse the url and extract the path
  const parsedUrl = url.parse(req.url, true);
  if (!parsedUrl.path) return res.end("");
  const trimmedPath = parsedUrl.path.replace(/^\/+|\/+$/g, "");

  // Get request payload if any (useless though)
  const decoder = new StringDecoder("utf-8");
  let buffer = "";

  req.on("data", (chunk) => {
    buffer += decoder.write(chunk);
  });

  req.on("end", async () => {
    buffer += decoder.end();

    // Find the appropriate controller (default to notFound)
    const rootPath = trimmedPath.split("/")[0];
    let selectedController = routes[rootPath];
    if (!selectedController) selectedController = controllers.notFound;

    // Determine the content type of the resource based on response from selected controller
    let statusCode: number, contentType: string, payload: unknown;
    try {
      const response = await selectedController(trimmedPath);
      const contentTypeMap: {
        [key in controllers.ControllerResponseType["contentType"]]: string;
      } = {
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
    } catch (err) {
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
    logger.debug(
      `${statusCode} - ${req.method?.toUpperCase()} ${parsedUrl.path}`
    );
  });
};

const httpServer = http.createServer(reqListener);

export default {
  httpServer,
  start: () => {
    httpServer.listen(config.server.port, () => {
      logger.console(
        `Server is listening on port ${config.server.port}`,
        "green"
      );
    });
  },
};
