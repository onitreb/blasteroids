# Repo Refactor + "Officialization" Plan

Last updated: 2026-02-09  
Project: Blasteroids  
Scope: Re-organize the repo into a maintainable, standards-aligned structure while preserving the current “open `index.html`” (no-server) workflow.

## Goals
- Keep “double-click `index.html`” working (no server required to play).
- Make the codebase easy to review: smaller files, clearer responsibilities, fewer hidden couplings.
- Preserve determinism/testing hooks (`render_game_to_text`, `advanceTime`) and keep regressions unlikely during refactors.
- Set up a path to “real” hosting/server later without rewriting core gameplay.

## Non-goals (for this refactor)
- Major gameplay changes or balancing passes (only when required to keep behavior identical).
- Multiplayer/server authority implementation (we only prepare boundaries for it).
- Large tech stack migration (no framework, no heavy build system).

## Constraints / Invariants (Do Not Break)
- `index.html` must run under `file://` without browser flags.
- Built artifact is committed so non-devs can run without installing anything.
- Core sim remains deterministic under fixed-step updates (`advanceTime(ms)`).
- Debug/tuning UI remains functional and does not require a server.

## Target Architecture (Simple, Not Clever)
Separation of concerns (browser/UI becomes a thin layer):
- `engine/`: deterministic sim + state mutations (DOM-free)
- `render/`: canvas rendering from state (browser-specific, but side-effect isolated)
- `ui/`: menu/tuning/HUD bindings (DOM + localStorage)
- `platform/`: adapters (input, fullscreen, timing, persistence)
- `app`: composition root that wires everything together

Design rules:
- Engine must not access DOM, `document`, `window`, `localStorage`, or canvas.
- Rendering reads engine state and draws; it does not mutate game rules/state (except transient render caches).
- UI writes to engine via explicit APIs (apply tuning, toggle debug, set arena config).

## Proposed Repo Layout (After)
- `index.html` (thin shell; loads the committed build output)
- `public/` (optional; only if we want to separate static assets)
- `src/`
  - `app/` (bootstrap + main loop + window debug exports)
  - `engine/` (state, update loop, collisions, spawning, progression, camera)
  - `render/` (canvas render functions)
  - `ui/` (menu bindings + HUD)
  - `util/` (math/geometry/rng helpers)
- `dist/` (or `build/`): committed, browser-ready bundle (single IIFE script)
- `docs/` (later): plans, progress, architecture notes, screenshots

## Tooling Strategy (No-Server Friendly)
- Use a minimal bundler that outputs a single **IIFE** bundle (not ESM at runtime) for `file://` compatibility.
- Keep dev scripts simple:
  - `build`: generate `dist/blasteroids.js`
  - `build:watch`: rebuild on change (manual refresh)
  - `lint`/`format`: keep diffs reviewable
- Optional later: add Playwright regression that loads `file://.../index.html` (no server).

## Status Legend
- `NOT_STARTED`: no implementation yet.
- `IN_PROGRESS`: active work.
- `BLOCKED`: waiting on decision/dependency.
- `DONE`: implemented and validated.

## Implementation Plan and Step Status

| ID | Step | Status | Notes |
|---|---|---|---|
| RF-00 | Lock invariants and acceptance checks | DONE | No-server runtime; commit bundle; preserve deterministic hooks. |
| RF-01 | Repo hygiene: move/ignore artifacts | DONE | Removed tmp screenshots; added `.editorconfig`; expanded `.gitignore`; kept `.vscode/settings.json` (user preference). |
| RF-02 | Add minimal build tooling + committed bundle | DONE | Added `package.json` + `scripts/build.mjs` (esbuild IIFE); built `dist/blasteroids.js`; `index.html` now loads `dist/blasteroids.js`. |
| RF-03 | Thin `index.html` and extract CSS | IN_PROGRESS | Extracted CSS to `styles.css`; next: reduce inline styles/markup noise while preserving UI element IDs. |
| RF-04 | Create `src/app` composition root | NOT_STARTED | Centralize boot + loop + `window.*` exports in one place. |
| RF-05 | Extract `util/` modules | NOT_STARTED | `math`, `geom`, `rng` first (pure functions). |
| RF-06 | Split `engine/` (DOM-free) from current `createGame` | NOT_STARTED | Move state + update systems into `engine/` while keeping behavior identical. |
| RF-07 | Extract `render/` from engine | NOT_STARTED | Rendering becomes `renderGame(ctx, state)`; no rule logic in render. |
| RF-08 | Extract `ui/` bindings | NOT_STARTED | Menu bindings + tuning schema + localStorage persistence isolated from engine. |
| RF-09 | Stabilize public debug/test API | NOT_STARTED | Single `window.Blasteroids` namespace; keep legacy aliases temporarily. |
| RF-10 | Add regression checks | NOT_STARTED | Baseline unit tests for pure logic + optional Playwright file:// smoke. |
| RF-11 | Docs + reviewability pass | NOT_STARTED | `docs/architecture.md`, module map, “how to run/build”, checklist. |

## RF-01 Details (Hygiene)
- Decide what stays versioned:
  - Keep: product source + docs + intentionally captured screenshots (under `docs/images/`).
  - Remove: transient `tmp_*.png`, `firebase-debug.log` and other environment logs.
- Add standard repo files (minimal):
  - `.editorconfig` (optional), `LICENSE` (decision), `CONTRIBUTING.md` (how to build).

## RF-02 Details (Bundling)
- Bundle output format: `iife` with a stable global name (e.g. `Blasteroids`).
- Output file committed: `dist/blasteroids.js` (+ optional sourcemap if desired).
- Runtime rule: `index.html` loads only `dist/blasteroids.js` (no `type="module"`).

## RF-06/07 Boundary Definition (So “Server Later” Is Easy)
Engine API (example shape; keep simple):
- `createEngine({ width, height, seed? }) -> { state, update(dt), resize(w,h), applySettings(...), telemetry() }`

Server-ready design choices:
- Engine state is serializable (no DOM refs, no Path2D caches, no closures required for correctness).
- Randomness is injectable/seeded.
- “Input” is an explicit struct/events applied to engine.

## Acceptance Checklist (Per Step)
- No-server open: `index.html` runs under `file://` with no console errors.
- Gameplay feels identical for a fixed seed and scripted `advanceTime()` sequence.
- `render_game_to_text()` fields remain stable (or changes are intentional and documented).
- Bundled output is reproducible from source (no manual edits to `dist/`).
