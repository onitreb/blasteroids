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
  const dir = path.join(process.cwd(), "tmp", "mp-soak");
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

async function pressBurst(page) {
  await page.click("#game");
  await page.keyboard.press("Space");
}

async function pressPing(page) {
  await page.click("#game");
  await page.keyboard.press("q");
}

async function thrustTurn(page, { ms = 160, dir = 1 } = {}) {
  await page.click("#game");
  await page.keyboard.down("w");
  await page.keyboard.down(dir >= 0 ? "d" : "a");
  await page.waitForTimeout(ms);
  await page.keyboard.up("w");
  await page.keyboard.up(dir >= 0 ? "d" : "a");
}

const tmpDir = ensureTmpDir();
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const soakMs = Number(process.env.BLASTEROIDS_SOAK_MS) || 45_000;

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
    page.on("console", (msg) => consoleLines.push(`[${label}] ${msg.type()}: ${msg.text()}`));
    page.on("pageerror", (err) => consoleLines.push(`[${label}] pageerror: ${String(err?.stack || err?.message || err)}`));
  }

  await Promise.all([
    pageA.goto(httpUrl, { waitUntil: "domcontentloaded" }),
    pageB.goto(httpUrl, { waitUntil: "domcontentloaded" }),
  ]);

  await Promise.all([connectViaUi(pageA, wsUrl), connectViaUi(pageB, wsUrl)]);
  await Promise.all([waitForConnected(pageA, 2), waitForConnected(pageB, 2)]);

  const startAt = Date.now();
  let step = 0;
  while (Date.now() - startAt < soakMs) {
    step++;
    // Alternate some inputs to exercise VFX + state diffs.
    await Promise.all([
      thrustTurn(pageA, { ms: 140, dir: step % 2 === 0 ? 1 : -1 }),
      thrustTurn(pageB, { ms: 140, dir: step % 3 === 0 ? -1 : 1 }),
    ]);
    if (step % 3 === 0) await Promise.all([pressPing(pageA), pressPing(pageB)]);
    if (step % 2 === 0) await Promise.all([pressBurst(pageA), pressBurst(pageB)]);
    await pageA.waitForTimeout(120);

    // Assert still connected.
    const ok = await pageA.evaluate(() => window.Blasteroids.mpStatus().connected);
    if (!ok) throw new Error("Page A disconnected during soak");
  }

  const shotA = path.join(tmpDir, `mp-soak-${stamp}-A.png`);
  const shotB = path.join(tmpDir, `mp-soak-${stamp}-B.png`);
  await Promise.all([pageA.screenshot({ path: shotA, fullPage: true }), pageB.screenshot({ path: shotB, fullPage: true })]);

  const dumpA = await dumpState(pageA);
  const dumpB = await dumpState(pageB);
  const dumpPath = path.join(tmpDir, `mp-soak-${stamp}-state.json`);
  fs.writeFileSync(dumpPath, JSON.stringify({ httpUrl, wsUrl, soakMs, a: dumpA, b: dumpB, console: consoleLines }, null, 2));

  const pageErrors = consoleLines.filter((l) => l.includes("pageerror"));
  if (pageErrors.length) throw new Error(`Soak saw page errors (${pageErrors.length}). See ${dumpPath}`);

  console.log("[mp-browser-2p-soak-smoke] ok", { httpUrl, wsUrl, soakMs, screenshots: [shotA, shotB], stateDump: dumpPath });
} finally {
  await browser.close();
  await server.stop();
}

