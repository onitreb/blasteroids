import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const REPO_ROOT = process.cwd();
const PRESETS_PATH = path.join(REPO_ROOT, "assets/ships/presets.json");
const OUT_DIR = path.join(REPO_ROOT, "output/ship-gallery");
const URL = `file://${path.join(REPO_ROOT, "index.html")}`;

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function safeName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function tierIndex(tier) {
  if (tier === "large") return 3;
  if (tier === "medium") return 2;
  return 1;
}

async function main() {
  const { presets } = readJson(PRESETS_PATH);
  ensureDir(OUT_DIR);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 980, height: 619 } });
  await page.goto(URL);
  await page.click("#start-btn");

  // Put the game into a quiet "studio" mode for screenshots.
  await page.evaluate(() => {
    const game = window.Blasteroids?.getGame?.();
    if (!game) return;
    game.state.params.maxAsteroids = 0;
    game.state.params.asteroidSpawnRateScale = 0;
    game.state.asteroidSpawnT = 999;
    game.state.asteroids = [];
    game.state.gems = [];
    game.state.saucer = null;
    game.state.saucerLasers = [];
    game.state.settings.showAttractRadius = false;
    game.state.input.left = false;
    game.state.input.right = false;
    game.state.input.up = false;
    game.state.input.down = false;
    game.state.input.burst = false;
    window.Blasteroids.advanceTime(16);
  });

  for (const p of presets) {
    const tier = p.tier;
    const base = `${tier}-${safeName(p.id || p.label)}`;
    const outPng = path.join(OUT_DIR, `${base}.png`);

    await page.evaluate((preset) => {
      const game = window.Blasteroids?.getGame?.();
      if (!game) return;
      game.state.settings.tierOverrideEnabled = true;
      game.state.settings.tierOverrideIndex = preset.__tierIndex;
      game.refreshProgression({ animateZoom: false });
      window.Blasteroids.setShipSvgRenderer(preset.tier, preset.path, preset.svgScale ?? 1, preset.hullRadius ?? null);
      game.state.asteroids = [];
      game.state.gems = [];
      window.Blasteroids.advanceTime(16);
    }, { ...p, __tierIndex: tierIndex(tier) });

    const canvas = await page.$("#game");
    if (!canvas) throw new Error("Canvas #game not found");
    await canvas.screenshot({ path: outPng });
  }

  await browser.close();
  console.log(`[ship-gallery] wrote ${presets.length} screenshots to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

