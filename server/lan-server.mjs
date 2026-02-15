import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import express from "express";

import { defineRoom, defineServer } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";

import { BlasteroidsRoom } from "./rooms/BlasteroidsRoom.mjs";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    args[key] = value;
  }
  return args;
}

function getLanIpv4Addresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family !== "IPv4") continue;
      if (entry.internal) continue;
      addresses.push(entry.address);
    }
  }
  return [...new Set(addresses)].sort();
}

const args = parseArgs(process.argv.slice(2));
const port = Number(args.port ?? process.env.PORT ?? 2567);
if (!Number.isFinite(port) || port < 0) {
  throw new Error(`Invalid port: ${args.port ?? process.env.PORT}`);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const gameServer = defineServer({
  rooms: {
    blasteroids: defineRoom(BlasteroidsRoom),
  },
  transport: new WebSocketTransport(),
  express: (app) => {
    app.disable("x-powered-by");

    app.get("/healthz", (_req, res) => res.status(200).type("text/plain").send("ok"));

    app.use("/dist", express.static(path.join(repoRoot, "dist")));
    app.use("/assets", express.static(path.join(repoRoot, "assets")));

    app.get("/styles.css", (_req, res) => res.sendFile(path.join(repoRoot, "styles.css")));
    app.get(["/", "/index.html"], (_req, res) => res.sendFile(path.join(repoRoot, "index.html")));
  },
});

await gameServer.listen(port);

let actualPort = port;
const addr = gameServer.transport?.server?.address?.();
if (addr && typeof addr === "object" && "port" in addr) {
  actualPort = addr.port;
}

const lanIps = getLanIpv4Addresses();
const urls = [
  `http://localhost:${actualPort}/`,
  ...lanIps.map((ip) => `http://${ip}:${actualPort}/`),
];

console.log(`[LAN] Blasteroids server listening on port ${actualPort}`);
console.log(`[LAN] Open in browser:`);
for (const url of urls) {
  console.log(`  ${url}`);
}
