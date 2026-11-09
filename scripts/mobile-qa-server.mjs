import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("apps/mobile/dist-web");
const types = {
  ".js": "text/javascript",
  ".json": "application/json",
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".css": "text/css",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://127.0.0.1").pathname,
    );
    let file = path.resolve(
      root,
      `.${pathname === "/" ? "/index.html" : pathname}`,
    );
    if (!file.startsWith(`${root}/`)) {
      response.writeHead(403);
      response.end();
      return;
    }
    let data;
    try {
      data = await readFile(file);
    } catch {
      file = path.join(root, "index.html");
      data = await readFile(file);
    }
    response.writeHead(200, {
      "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
    });
    response.end(data);
  } catch {
    response.writeHead(500);
    response.end("Preview unavailable");
  }
}).listen(3200, "127.0.0.1", () =>
  console.log("Native UI web renderer: http://127.0.0.1:3200"),
);
