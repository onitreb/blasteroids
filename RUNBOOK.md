# Blasteroids Runbook

This repo is intentionally **no-server** at runtime: you can play by opening `index.html` directly.

## Quick Start (Play)
- Open `index.html` (double-click in Finder / File Explorer).
- Controls are documented in `README.md`.

The repo includes a prebuilt `dist/blasteroids.js`, so you don’t need Node/npm just to play.

## Dev Setup (Build Tools)
Prereqs:
- Node.js + npm (tested recently with Node 24+)

Install dev deps:
- `npm install`
- If you hit an npm cache permissions error, use: `npm install --cache ./.npm-cache`

## Build
Build the committed no-server bundle:
- `npm run build`

Output:
- `dist/blasteroids.js` (this is what `index.html` loads)

## Watch (Dev Loop)
Rebuild on file changes (manual browser refresh):
- `npm run build:watch`

Workflow:
1. Run `npm run build:watch`
2. Edit files in `src/`
3. Refresh `index.html`

## Clean
- `npm run clean` (deletes `dist/`)

## Tests
- `npm test` (runs baseline Node tests via `node --test`)
- Current coverage includes:
  - utility modules under `src/util/*`
  - deterministic engine timeline checks + API surface checks in `test/engine.test.js`
  - debug menu metadata coverage check vs `index.html` in `test/debug-menu-metadata.test.js`

## Smoke Test Checklist (After Any Refactor)
Open `index.html` via `file://` and verify:
- No console errors on load
- Start → ship moves (W/A/D/S), bursts (Space/click), restart (R), fullscreen (F)
- Debug menu opens/closes (M), pause-on-open works
- `window.Blasteroids.renderGameToText()` returns a JSON string
- `window.Blasteroids.advanceTime(1000)` advances without throwing
- Legacy aliases still work: `render_game_to_text()`, `advanceTime(1000)`, `set_ship_svg_renderer(...)`
- Tier progression: ship grows at **500** and **1000** total score (default)
- Round loop telemetry present: `renderGameToText().round.star`, `.round.gate`, and `.round.tech_parts` are non-null after Start (visual markers exist but may be off-camera in the larger arena)

## Troubleshooting
### “Cannot use import statement outside a module”
This usually means the browser is loading a source file that contains ESM imports (like `src/main.js`) directly.

Fix:
- Ensure `index.html` is loading `./dist/blasteroids.js`, then run `npm run build`.

### npm cache permission errors
Use a repo-local npm cache:
- `npm install --cache ./.npm-cache`

## Notes On Repo Design
- Runtime is kept `file://`-friendly by bundling to a single **IIFE** script (`dist/blasteroids.js`).
- During refactors, we commit `dist/blasteroids.js` so anyone can run the game without installing tooling.

## Multiplayer (LAN) Server (MVP)
Run the LAN server (serves static client + Colyseus websocket on the same port):
- `npm run lan:server`

Options:
- `npm run lan:server -- --port 2567` (default port is 2567)
- `BLASTEROIDS_PATCH_RATE_MS=33 npm run lan:server` (override Colyseus Room `patchRate`; defaults to 100ms)
- `BLASTEROIDS_WORLD_SCALE=10 npm run lan:server` (override authoritative world scale; defaults to engine default)
- `BLASTEROIDS_ASTEROID_DENSITY_SCALE=0.45 npm run lan:server` (increase/decrease authoritative asteroid population target; default is engine `asteroidWorldDensityScale`)
- `BLASTEROIDS_ASTEROID_SPAWN_RATE_SCALE=1.5 npm run lan:server` (refill pacing; higher spawns faster; default is engine `asteroidSpawnRateScale`)
- Recommended for “big world + LAN feel” validation: `BLASTEROIDS_WORLD_SCALE=10 BLASTEROIDS_PATCH_RATE_MS=33 npm run lan:server`

Client join options (DevTools):
- `await window.Blasteroids.mpConnect({ endpoint: "ws://" + location.host, joinOptions: { worldScale: 10 } })`
  - Optional overrides (per room): `joinOptions: { asteroidDensityScale: 0.45, asteroidSpawnRateScale: 1.5 }`

Smoke scripts (Node / headless browser):
- Node join: `node scripts/mp-lan-smoke.mjs ws://localhost:2567`
- Browser connect + snapshots: `node scripts/mp-browser-smoke.mjs`
- Browser saucer + lasers sync: `node scripts/mp-browser-saucer-smoke.mjs`
- Browser prediction under simulated latency: `node scripts/mp-browser-prediction-smoke.mjs`
- Browser MP soak (2–4 players, longer): `BLASTEROIDS_PLAYERS=4 BLASTEROIDS_SOAK_MS=120000 node scripts/mp-browser-2p-soak-smoke.mjs`

### LAN access from another device
1) On the host machine, run: `npm run lan:server -- --port 2567`
2) On the other device, open the printed URL: `http://<host-lan-ip>:2567/`
3) In the in-game Multiplayer panel, set Endpoint to: `ws://<host-lan-ip>:2567` (not `localhost`)

If the other device can’t load the page at all, it’s almost always a network/firewall issue:
- macOS firewall: allow incoming connections for `node` when prompted, or temporarily disable the firewall for testing.
- Wi-Fi “client isolation” / guest networks can block device-to-device connections even on the same SSID.
