// Minimal static file server for dist/, used by Playwright's webServer.
//
// `astro preview` in this Astro version always detaches into a managed background
// process (see `astro preview status/stop/logs`) rather than blocking in the
// foreground, which breaks Playwright's webServer contract (it expects the launched
// process to keep running until Playwright stops it). This tiny server sidesteps
// that by just serving the already-built dist/ folder in the foreground.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const port = Number(process.env.PORT ?? 4321);

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

async function resolveFile(pathname) {
  let filePath = join(root, pathname);
  try {
    const stats = await stat(filePath);
    if (stats.isDirectory()) filePath = join(filePath, "index.html");
  } catch {
    if (!extname(filePath)) filePath = `${filePath}.html`;
  }
  return filePath;
}

const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
    const filePath = await resolveFile(pathname);
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`Static preview server running at http://localhost:${port}`);
});
