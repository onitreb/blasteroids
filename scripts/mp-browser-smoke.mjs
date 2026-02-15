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
      const ok = await waitFor(() => /http:\/\/localhost:\d+\//.test(output), { timeoutMs: 8000 });
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

  await page.evaluate((endpoint) => window.Blasteroids.mpConnect({ endpoint }), wsUrl);

  const connected = await page.waitForFunction(
    () =>
      window.Blasteroids.mpStatus().connected &&
      window.Blasteroids.mpStatus().snapshots > 0 &&
      window.Blasteroids.getGame().state.asteroids.length > 0,
    null,
    { timeout: 8000 },
  );
  if (!connected) throw new Error("mpConnect did not produce snapshots");

  const status = await page.evaluate(() => window.Blasteroids.mpStatus());
  console.log("[mp-browser-smoke] ok", status);
} finally {
  await browser.close();
  await server.stop();
}
