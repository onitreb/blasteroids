import { spawn } from "node:child_process";
import process from "node:process";

import { chromium } from "playwright";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(predicate, { timeoutMs = 8000, intervalMs = 50 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await predicate()) return true;
    await sleep(intervalMs);
  }
  return false;
}

function startLanServer() {
  const child = spawn("node", ["server/lan-server.mjs", "--port", "0"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  let output = "";
  child.stdout.on("data", (buf) => {
    output += buf.toString("utf8");
  });
  child.stderr.on("data", (buf) => {
    output += buf.toString("utf8");
  });

  return {
    child,
    async getUrl() {
      const ok = await waitFor(() => /http:\/\/localhost:\d+\//.test(output), { timeoutMs: 10000 });
      if (!ok) throw new Error(`LAN server did not print URL. Output:\n${output}`);
      const match = output.match(/http:\/\/localhost:(\d+)\//);
      if (!match) throw new Error(`Failed to parse LAN URL. Output:\n${output}`);
      const port = Number(match[1]);
      return { httpUrl: `http://localhost:${port}/`, wsUrl: `ws://localhost:${port}` };
    },
    async stop() {
      if (child.killed) return;
      child.kill("SIGTERM");
      await waitFor(() => child.exitCode !== null, { timeoutMs: 2000, intervalMs: 50 });
      if (child.exitCode === null) child.kill("SIGKILL");
    },
  };
}

const server = startLanServer();
const { httpUrl, wsUrl } = await server.getUrl();

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(httpUrl, { waitUntil: "domcontentloaded" });

  await page.click("#multiplayer > summary");
  await page.fill("#mp-endpoint", wsUrl);
  await page.click("#mp-quickplay");

  const connected = await page.waitForFunction(() => window.Blasteroids.mpStatus().connected && window.Blasteroids.mpStatus().snapshots > 0, null, {
    timeout: 10000,
  });
  if (!connected) throw new Error("mpConnect did not produce snapshots");

  // Saucer spawns on a 14–26s timer by default; allow enough time to observe at least one spawn and shot.
  const sawSaucer = await page.waitForFunction(() => !!window.Blasteroids.getGame().state.saucer, null, { timeout: 40000 });
  if (!sawSaucer) throw new Error("Expected saucer to spawn while connected (timeout)");

  const sawLaser = await page.waitForFunction(() => (window.Blasteroids.getGame().state.saucerLasers || []).length > 0, null, { timeout: 20000 });
  if (!sawLaser) throw new Error("Expected saucer lasers to fire while connected (timeout)");

  const snap = await page.evaluate(() => {
    const g = window.Blasteroids.getGame();
    const s = g.state.saucer;
    const lasers = g.state.saucerLasers || [];
    return {
      saucer: s ? { id: s.id, x: s.pos?.x ?? 0, y: s.pos?.y ?? 0, r: s.radius ?? 0 } : null,
      lasers: lasers.length,
    };
  });

  console.log("[mp-browser-saucer-smoke] ok", { httpUrl, wsUrl, snap });
} finally {
  await browser.close();
  await server.stop();
}

