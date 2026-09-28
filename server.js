// Minimal static dev server — no dependencies.
//   node server.js [port]
// Serves this folder, disables caching, and maps unknown paths to 404.html.
const http = require("http"), fs = require("fs"), path = require("path"), url = require("url");

const ROOT = __dirname;
const PORT = Number(process.argv[2] || process.env.PORT || 8080);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  let pathname = decodeURIComponent(url.parse(req.url).pathname);
  if (pathname.endsWith("/")) pathname += "index.html";

  // Resolve inside ROOT only — refuse anything that escapes it
  const file = path.join(ROOT, pathname);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end("Forbidden"); return; }

  fs.readFile(file, (err, data) => {
    if (err) {
      // Allow extensionless URLs (/about -> about.html), else serve 404 page
      if (!path.extname(file) && fs.existsSync(file + ".html")) {
        const body = fs.readFileSync(file + ".html");
        res.writeHead(200, { "Content-Type": TYPES[".html"], "Cache-Control": "no-store" }).end(body);
        return;
      }
      const notFound = path.join(ROOT, "404.html");
      const body = fs.existsSync(notFound) ? fs.readFileSync(notFound) : "404 Not Found";
      res.writeHead(404, { "Content-Type": TYPES[".html"], "Cache-Control": "no-store" }).end(body);
      console.log("404", pathname);
      return;
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" }).end(data);
  });
});

server.on("error", e => {
  if (e.code === "EADDRINUSE") console.error(`Port ${PORT} is already in use. Try: node server.js 8081`);
  else console.error(e.message);
  process.exit(1);
});

server.listen(PORT, () => console.log(`Dementia Companions site: http://localhost:${PORT}/  (Ctrl+C to stop)`));
