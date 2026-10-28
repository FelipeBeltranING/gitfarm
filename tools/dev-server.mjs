#!/usr/bin/env node
// Local preview of the web generator: npm run dev → http://localhost:3000
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import handler from "../api/farm.js";

const PORT = Number(process.env.PORT ?? 3000);
const page = new URL("../public/index.html", import.meta.url);

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === "/api/farm") return handler(req, res);
  if (url.pathname === "/" || url.pathname === "/index.html") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(await readFile(page));
  }
  res.statusCode = 404;
  res.end("Not found");
}).listen(PORT, () => console.log(`🌻 GitFarm web on http://localhost:${PORT}`));
