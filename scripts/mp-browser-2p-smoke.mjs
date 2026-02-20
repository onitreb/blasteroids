import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { chromium } from "playwright";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(predicate, { timeoutMs = 10000, intervalMs = 50 } = {}) {
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

function ensureTmpDir() {
  const dir = path.join(process.cwd(), "tmp", "mp-14");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function connectViaUi(page, wsUrl) {
  await page.waitForFunction(() => !!window.Blasteroids && typeof window.Blasteroids.mpStatus === "function");
  await page.click("#multiplayer > summary");
  await page.fill("#mp-endpoint", wsUrl);
  await page.click("#mp-quickplay");
}

async function waitForConnected(page, expectedPlayers = 2) {
  const ok = await page.waitForFunction(
    (n) => {
      const st = window.Blasteroids.mpStatus();
      const g = window.Blasteroids.getGame();
      const mp = g?.state?._mp;
      const pc = mp && typeof mp.playerCount === "number" ? mp.playerCount : 0;
      return !!st?.connected && pc >= n && st.snapshots > 0;
    },
    expectedPlayers,
    { timeout: 10000 },
  );
  if (!ok) throw new Error("mpConnect did not produce expected connected state");
}

async function dumpState(page) {
  return await page.evaluate(() => {
    const status = window.Blasteroids.mpStatus();
    const payload = JSON.parse(window.Blasteroids.renderGameToText());
    const mp = window.Blasteroids.getGame().state._mp || null;
    return { status, mp, payload };
  });
}

async function nudgeMovement(page) {
  const p0 = await page.evaluate(() => {
    const g = window.Blasteroids.getGame();
    const pid = g.state.localPlayerId;
    const ship = g.state.playersById?.[pid]?.ship;
    return { pid, x: ship?.pos?.x ?? 0, y: ship?.pos?.y ?? 0 };
  });
  await page.keyboard.down("w");
  await page.waitForTimeout(200);
  await page.keyboard.up("w");
  await page.waitForTimeout(200);
  const p1 = await page.evaluate(() => {
    const g = window.Blasteroids.getGame();
    const pid = g.state.localPlayerId;
    const ship = g.state.playersById?.[pid]?.ship;
    return { pid, x: ship?.pos?.x ?? 0, y: ship?.pos?.y ?? 0 };
  });
  const moved = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  if (!(moved > 0.5)) throw new Error(`Expected ship to move while connected. moved=${moved.toFixed(3)} p0=${JSON.stringify(p0)} p1=${JSON.stringify(p1)}`);
  return moved;
}

const tmpDir = ensureTmpDir();
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

const server = startLanServer();
const { httpUrl, wsUrl } = await server.getUrl();

const browser = await chromium.launch();
try {
  const pageA = await browser.newPage();
  const pageB = await browser.newPage();

  const consoleLines = [];
  for (const [label, page] of [
    ["A", pageA],
    ["B", pageB],
  ]) {
    page.on("console", (msg) => {
      consoleLines.push(`[${label}] ${msg.type()}: ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      consoleLines.push(`[${label}] pageerror: ${String(err?.message || err)}`);
    });
  }

  await Promise.all([
    pageA.goto(httpUrl, { waitUntil: "domcontentloaded" }),
    pageB.goto(httpUrl, { waitUntil: "domcontentloaded" }),
  ]);

  await Promise.all([connectViaUi(pageA, wsUrl), connectViaUi(pageB, wsUrl)]);
  await Promise.all([waitForConnected(pageA, 2), waitForConnected(pageB, 2)]);

  // Basic movement sanity on both clients.
  const [movedA, movedB] = await Promise.all([nudgeMovement(pageA), nudgeMovement(pageB)]);

  // Capture screenshots + state dumps.
  const shotA = path.join(tmpDir, `mp-14-${stamp}-A.png`);
  const shotB = path.join(tmpDir, `mp-14-${stamp}-B.png`);
  await Promise.all([pageA.screenshot({ path: shotA, fullPage: true }), pageB.screenshot({ path: shotB, fullPage: true })]);

  const dumpA = await dumpState(pageA);
  const dumpB = await dumpState(pageB);
  const dumpPath = path.join(tmpDir, `mp-14-${stamp}-state.json`);
  fs.writeFileSync(dumpPath, JSON.stringify({ httpUrl, wsUrl, movedA, movedB, a: dumpA, b: dumpB, console: consoleLines }, null, 2));

  // Print a compact summary.
  console.log("[mp-browser-2p-smoke] ok", {
    httpUrl,
    wsUrl,
    movedA: movedA.toFixed(2),
    movedB: movedB.toFixed(2),
    playersA: dumpA?.mp?.playerCount,
    playersB: dumpB?.mp?.playerCount,
    screenshots: [shotA, shotB],
    stateDump: dumpPath,
  });
} finally {
  await browser.close();
  await server.stop();
}

