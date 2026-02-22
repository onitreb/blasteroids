import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { chromium } from "playwright";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
        },
      }),
    wsUrl,
  );

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
  if (post.snapshots !== pre.snapshots) {
    throw new Error(
      `Prediction smoke expected no new snapshots during the short window (latency test). snapshots ${pre.snapshots} -> ${post.snapshots}`,
    );
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
  fs.writeFileSync(dumpPath, JSON.stringify({ httpUrl, wsUrl, pre, post, moved, dump }, null, 2));

  console.log("[mp-browser-prediction-smoke] ok", { httpUrl, wsUrl, moved: moved.toFixed(2), screenshot: shot, stateDump: dumpPath });
} finally {
  await browser.close();
  await server.stop();
}

