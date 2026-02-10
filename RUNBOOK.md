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

## Smoke Test Checklist (After Any Refactor)
Open `index.html` via `file://` and verify:
- No console errors on load
- Start → ship moves (W/A/D/S), bursts (Space/click), restart (R), fullscreen (F)
- Debug menu opens/closes (M), pause-on-open works
- `window.Blasteroids.renderGameToText()` returns a JSON string
- `window.Blasteroids.advanceTime(1000)` advances without throwing
- Legacy aliases still work: `render_game_to_text()`, `advanceTime(1000)`, `set_ship_svg_renderer(...)`
- Tier progression: ship grows at **500** and **1000** total score (default)

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
