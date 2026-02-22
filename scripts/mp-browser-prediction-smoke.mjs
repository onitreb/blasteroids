import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { chromium } from "playwright";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function wrapAngle(a) {
  const x = Number(a) || 0;
  const tau = Math.PI * 2;
  return ((x + Math.PI) % tau + tau) % tau - Math.PI;
}

async function waitFor(predicate, { timeoutMs = 15000, intervalMs = 50 } = {}) {
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
    env: {
      ...process.env,
      // Make patches infrequent so "no prediction" would feel clearly laggy.
      BLASTEROIDS_PATCH_RATE_MS: String(process.env.BLASTEROIDS_PATCH_RATE_MS ?? "250"),
      BLASTEROIDS_ALLOW_DEBUG_JOIN_OPTIONS: "1",
    },
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
      const ok = await waitFor(() => /http:\/\/localhost:\d+\//.test(output), { timeoutMs: 15000 });
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
  const dir = path.join(process.cwd(), "tmp", "mp-22");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const tmpDir = ensureTmpDir();
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

const server = startLanServer();
const { httpUrl, wsUrl } = await server.getUrl();

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(httpUrl, { waitUntil: "domcontentloaded" });

  // Connect with high simulated latency; prediction should make movement immediate anyway.
  await page.waitForFunction(() => !!window.Blasteroids && typeof window.Blasteroids.mpConnect === "function");
  await page.evaluate(
    (endpoint) =>
      window.Blasteroids.mpConnect({
        endpoint,
        joinOptions: {
          simulateLatencyMs: 400,
          debugStartAttachedCount: 8,
        },
      }),
    wsUrl,
  );
  await page.waitForFunction(() => typeof window.Blasteroids.mpSetPredictionEnabled === "function");
  await page.evaluate(() => window.Blasteroids.mpSetPredictionEnabled(true));

  const connected = await page.waitForFunction(
    () => window.Blasteroids.mpStatus().connected && window.Blasteroids.mpStatus().snapshots > 0,
    null,
    { timeout: 20000 },
  );
  if (!connected) throw new Error("mpConnect did not produce connected state");

  // Snapshot count should not change during this short window (because of the simulated latency),
  // but local movement should still occur due to prediction.
  await page.click("#game");
  const pre = await page.evaluate(() => {
    const g = window.Blasteroids.getGame();
    const pid = g.state.localPlayerId;
    const ship = g.state.playersById?.[pid]?.ship;
    return {
      snapshots: window.Blasteroids.mpStatus().snapshots,
      pid,
      x: ship?.pos?.x ?? 0,
      y: ship?.pos?.y ?? 0,
    };
  });

  await page.keyboard.down("w");
  await page.waitForTimeout(120);
  await page.keyboard.up("w");
  await page.waitForTimeout(60);

  const post = await page.evaluate(() => {
    const g = window.Blasteroids.getGame();
    const pid = g.state.localPlayerId;
    const ship = g.state.playersById?.[pid]?.ship;
    return {
      snapshots: window.Blasteroids.mpStatus().snapshots,
      pid,
      x: ship?.pos?.x ?? 0,
      y: ship?.pos?.y ?? 0,
    };
  });

  const moved = Math.hypot(post.x - pre.x, post.y - pre.y);
  if (!(moved > 0.5)) {
    throw new Error(`Expected predicted movement under simulated latency. moved=${moved.toFixed(3)} pre=${JSON.stringify(pre)} post=${JSON.stringify(post)}`);
  }
  // Under simulated latency, snapshots may still arrive (depending on patch timing), but local movement should
  // begin immediately via prediction. The primary correctness check is `moved > 0`.

  // Exercise the main "quirky" case: attached asteroids should visually remain attached to the predicted local ship.
  const attachedReady = await page.waitForFunction(() => {
    const g = window.Blasteroids.getGame();
    const pid = g.state.localPlayerId;
    return (g.state.asteroids || []).some((a) => a && a.attached && a.attachedTo === pid);
  });
  if (!attachedReady) throw new Error("Expected debug attached asteroids to be present");

  // Allow the authoritative sim a moment to settle any initial attachment placement.
  await page.waitForTimeout(300);

  const orbit0 = await page.evaluate(() => {
    const g = window.Blasteroids.getGame();
    const pid = g.state.localPlayerId;
    const ship = g.state.playersById?.[pid]?.ship;
    const sx = ship?.pos?.x ?? 0;
    const sy = ship?.pos?.y ?? 0;
    const sa = ship?.angle ?? 0;
    const out = {};
    for (const a of g.state.asteroids || []) {
      if (!a || !a.attached || a.attachedTo !== pid) continue;
      const dx = (a.pos?.x ?? 0) - sx;
      const dy = (a.pos?.y ?? 0) - sy;
      out[a.id] = { r: Math.hypot(dx, dy), aLocal: Math.atan2(dy, dx) - sa };
    }
    return out;
  });

  // Move for long enough that, without visual compensation, attached asteroids would appear left behind.
  await page.keyboard.down("w");
  await page.keyboard.down("d");
  await page.waitForTimeout(900);
  await page.keyboard.up("w");
  await page.keyboard.up("d");
  await page.waitForTimeout(50);

  const attachCheck = await page.evaluate(() => {
    const g = window.Blasteroids.getGame();
    const pid = g.state.localPlayerId;
    const ship = g.state.playersById?.[pid]?.ship;
    const sx = ship?.pos?.x ?? 0;
    const sy = ship?.pos?.y ?? 0;
    const attached = (g.state.asteroids || []).filter((a) => a && a.attached && a.attachedTo === pid);
    const dists = attached.map((a) => Math.hypot((a.pos?.x ?? 0) - sx, (a.pos?.y ?? 0) - sy));
    dists.sort((a, b) => a - b);
    return { pid, sx, sy, attachedCount: attached.length, minDist: dists[0] ?? null, maxDist: dists[dists.length - 1] ?? null };
  });
  if (!(attachCheck.attachedCount >= 1)) throw new Error(`Expected attached asteroids >= 1, got ${attachCheck.attachedCount}`);
  if (!(attachCheck.maxDist != null && attachCheck.maxDist < 220)) {
    throw new Error(`Attached asteroids drifted too far from predicted ship. attachCheck=${JSON.stringify(attachCheck)}`);
  }

  const orbit1 = await page.evaluate(() => {
    const g = window.Blasteroids.getGame();
    const pid = g.state.localPlayerId;
    const ship = g.state.playersById?.[pid]?.ship;
    const sx = ship?.pos?.x ?? 0;
    const sy = ship?.pos?.y ?? 0;
    const sa = ship?.angle ?? 0;
    const out = {};
    for (const a of g.state.asteroids || []) {
      if (!a || !a.attached || a.attachedTo !== pid) continue;
      const dx = (a.pos?.x ?? 0) - sx;
      const dy = (a.pos?.y ?? 0) - sy;
      out[a.id] = { r: Math.hypot(dx, dy), aLocal: Math.atan2(dy, dx) - sa };
    }
    return out;
  });

  const orbitDrift = Object.keys(orbit0).reduce(
    (acc, id) => {
      const a0 = orbit0[id];
      const a1 = orbit1[id];
      if (!a0 || !a1) return acc;
      const dr = Math.abs((a1.r ?? 0) - (a0.r ?? 0));
      const da = wrapAngle((a1.aLocal ?? 0) - (a0.aLocal ?? 0));
      acc.count++;
      acc.drMax = Math.max(acc.drMax, dr);
      acc.daMax = Math.max(acc.daMax, Math.abs(da));
      return acc;
    },
    { count: 0, drMax: 0, daMax: 0 },
  );
  // If attachments are visually coherent with prediction, their ship-local polar coords should remain stable.
  if (orbitDrift.count > 0) {
    if (orbitDrift.drMax > 30 || orbitDrift.daMax > 0.9) {
      throw new Error(`Attached asteroid orbit drift too large: ${JSON.stringify(orbitDrift)}`);
    }
  }

  const shot = path.join(tmpDir, `mp-22-${stamp}.png`);
  await page.screenshot({ path: shot, fullPage: true });

  const dumpPath = path.join(tmpDir, `mp-22-${stamp}-state.json`);
  const dump = await page.evaluate(() => {
    return {
      status: window.Blasteroids.mpStatus(),
      mpHud: window.Blasteroids.getGame().state._mp || null,
      payload: JSON.parse(window.Blasteroids.renderGameToText()),
    };
  });
  fs.writeFileSync(dumpPath, JSON.stringify({ httpUrl, wsUrl, pre, post, moved, attachCheck, orbitDrift, dump }, null, 2));

  console.log("[mp-browser-prediction-smoke] ok", { httpUrl, wsUrl, moved: moved.toFixed(2), screenshot: shot, stateDump: dumpPath });
} finally {
  await browser.close();
  await server.stop();
}
