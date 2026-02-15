# Blasteroids Architecture

This document describes the current runtime architecture and the boundaries that should stay stable during refactors.

## Runtime Constraints

- The game must run by opening `index.html` via `file://` (no local web server).
- `dist/blasteroids.js` is committed and is the only runtime script loaded by `index.html`.
- Deterministic stepping and test/debug hooks must remain available:
  - `window.Blasteroids.renderGameToText`
  - `window.Blasteroids.advanceTime`
  - `window.Blasteroids.setShipSvgRenderer`
  - Legacy aliases: `window.render_game_to_text`, `window.advanceTime`, `window.set_ship_svg_renderer`

## Composition Flow

Runtime wiring starts in `src/app/index.js`, which imports `src/main.js`.

`src/main.js` composes the runtime:

1. Create engine (`createEngine`) with initial canvas dimensions.
2. Create renderer (`createRenderer`) with engine state access.
3. Create UI bindings (`createUiBindings`) with `game`, `canvas`, and browser refs.
4. Attach browser input/fullscreen handlers.
5. Run fixed-step simulation/render loop.
6. Export debug/test hooks on `window.Blasteroids` and legacy aliases.

## Module Boundaries

### Engine (`src/engine/createEngine.js`)

- Owns deterministic simulation state and updates.
- Contains game rules: movement, collisions, spawning, progression, camera state, scoring.
- Exposes APIs used by composition/UI/tests:
  - `startGame`, `update`, `resize`, `resetWorld`
  - `setArenaConfig`, `setShipSvgRenderer`
  - `renderGameToText`
  - helpers for renderer/UI (`getCurrentShipTier`, forcefield/attract helpers)
- Must remain DOM-free (no direct `document`/`window`/canvas access).
- Multiplayer foundations:
  - Canonical per-player state lives under `state.playersById` with `state.localPlayerId`.
  - Legacy top-level fields (`state.ship`, `state.input`, `state.score`, etc.) are maintained as aliases to the local player for singleplayer/back-compat.
  - `createEngine({ role })` supports `client` (default) vs `server` (skip camera/VFX work; gameplay RNG remains deterministic).

### Renderer (`src/render/renderGame.js`)

- Reads engine state and draws to canvas.
- Handles visuals only (background, ship, asteroids, effects, HUD overlays on canvas).
- Must not change gameplay rules/state.
- Uses renderer-local cache (for parsed SVG paths) only.

### UI Bindings (`src/ui/createUiBindings.js`)

- Owns DOM interactions and menu/debug control wiring.
- Reads/writes engine state through explicit game APIs.
- Owns tuning default persistence via `localStorage`.
- Depends on stable DOM IDs in `index.html`.

### Utilities (`src/util/*`)

- Pure reusable helpers (`math`, `vec2`, `angle`, `rng`, `collision`, `asteroid`, `ship`).
- Safe extraction target for shared logic currently duplicated in feature modules.

## Build and Runtime Packaging

- Build script: `scripts/build.mjs` (esbuild, browser IIFE output).
- Entry point: `src/app/index.js`.
- Bundle output: `dist/blasteroids.js`.
- Runtime HTML shell: `index.html` loads `styles.css` and `dist/blasteroids.js`.

## Testing and Validation

- Automated tests: `npm test` (`node --test`), currently covering util helpers and deterministic engine behavior.
- Runtime smoke: open `index.html` via `file://` and verify controls, debug menu behavior, and both hook surfaces.

## Known Technical Debt

- `src/app/index.js` is intentionally thin and currently imports `src/main.js` for side effects.
- `src/main.js` still contains loop/input/composition logic that could be split further into smaller app/platform modules if needed.
