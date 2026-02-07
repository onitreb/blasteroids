# Large Arena Enhancement Plan

Last updated: 2026-02-06  
Project: Blasteroids  
Scope: Convert the current viewport-sized world into a larger arena with camera panning, arena edges, and scalable spawning.

## Goal
- Support a world much larger than the visible screen.
- Keep gameplay readable and smooth while moving across the arena.
- Prepare architecture for future multiplayer-style region/cell simulation.

## Status Legend
- `NOT_STARTED`: No implementation yet.
- `IN_PROGRESS`: Started but not complete.
- `BLOCKED`: Waiting on design decision or dependency.
- `DONE`: Implemented and verified.

## Current Baseline (Before Changes)
- World and viewport are currently coupled.
- Entity movement wraps at viewport bounds.
- Spawns are viewport-relative.
- Asteroid collision is all-pairs (`O(n^2)`), which will not scale well at larger counts.

## Implementation Plan and Step Status

| ID | Step | Status | Notes |
|---|---|---|---|
| LA-00 | Create persistent plan doc and tracking workflow | DONE | This file. |
| LA-01 | Add world model (`state.world`) and camera model (`state.camera`) | DONE | Added scaffolding in `src/main.js`; world currently mirrors view intentionally in this phase. |
| LA-02 | Replace viewport wrapping with arena-bound handling | DONE | Ship now clamps at arena bounds; asteroids/gems now despawn out-of-bounds (no wall bounce); saucer and laser bounds use `state.world`. |
| LA-03 | Add world->screen transform in render path | DONE | Render now applies camera offset (`translate(w/2 - camera.x, h/2 - camera.y)`). |
| LA-04 | Implement camera mode A: always-centered | DONE | Camera is synced to ship each update as baseline behavior. |
| LA-05 | Implement camera mode B: dead-zone panning | DONE | Added dead-zone camera mode logic with world clamping; centered remains default. |
| LA-06 | Draw arena boundary line and near-edge feedback | DONE | Added first-pass arena boundary line render in world space. |
| LA-07 | Refactor asteroid/gem/saucer spawn to world-aware utilities | DONE | Spawn/despawn bounds now rely on `state.world` and world-space camera context. |
| LA-08 | Add off-screen spawning relative to camera/player region | DONE | Added ambient asteroid spawning from off-screen sides around camera. |
| LA-09 | Replace fixed-count behavior with min/target/max density budget | DONE | Added dynamic asteroid population budget (`min/target/max`) with timed replenishment. |
| LA-10 | Add world cell/chunk index for spawning and bookkeeping | DONE | Added per-cell asteroid index and active camera-neighborhood cells; spawn logic now skips overcrowded/inactive cells. |
| LA-11 | Add broadphase collision partitioning (spatial hash/grid) | DONE | Replaced asteroid global pair scan with spatial-hash nearby-pair iteration (`forEachNearbyAsteroidPair`). |
| LA-12 | Update debug export (`render_game_to_text`) for world/camera metadata | DONE | Added `world` and `camera` metadata and corrected coordinate system text. |
| LA-13 | Playtest + tuning pass (camera feel, spawn rates, edge behavior) | IN_PROGRESS | Browser-validated camera mode toggle and world scale; further tuning still pending. |
| LA-14 | Documentation update (`README.md`, controls/behavior notes) | NOT_STARTED | Explain new arena/camera behavior and settings. |

## Decision Log (Open)
- `D-01`: Default camera mode on launch: always-centered vs dead-zone panning.
- `D-02`: Exact ship behavior at hard world edge: clamp-stop vs bounce.
- `D-03`: Initial world size and whether size should be tunable in debug menu.
- `D-04`: Spawn policy at game start: local active region only vs wider warm-start ring.

## Session Log

| Date | Session Notes |
|---|---|
| 2026-02-06 | Created long-lived implementation tracker for large-arena enhancement. No code changes to gameplay yet. |
| 2026-02-06 | Completed LA-01 scaffold: added `state.world`, `state.camera`, and `syncCameraToShip()` with no render transform changes yet. Validation: `node --check src/main.js` passed. |
| 2026-02-06 | Completed LA-02: removed viewport wrap behavior and introduced world-bound confinement (`confineShipToWorld`, `confineBodyToWorld`). Validation: `node --check src/main.js` passed. |
| 2026-02-06 | Completed LA-03 and LA-04: render now uses camera offset and centered camera mode is active. Added camera/world metadata to `render_game_to_text`. Validation: `node --check src/main.js` passed. |
| 2026-02-06 | Completed LA-05 through LA-09: dead-zone camera mode logic, arena boundary line, world-aware spawning, off-screen asteroid replenishment, and dynamic min/target/max asteroid budget. Validation: `node --check src/main.js` passed. |
| 2026-02-06 | Browser smoke validation completed via DevTools: game starts, movement/turn/brake work, ship clamps to arena edge, no console errors. Dead-zone mode is implemented but not yet user-switchable in UI, so centered mode remains the only tested runtime mode. |
| 2026-02-06 | Adjusted arena behavior per design direction: removed asteroid/gem wall-bounce and switched to out-of-bounds despawn. Validation: `node --check src/main.js` passed. |
| 2026-02-06 | Added menu controls for `centered` vs `deadzone` camera mode and world-size scaling (1x..4x), wired via new `setArenaConfig`/`applyWorldScale` path. Validation: `node --check src/main.js` passed. |
| 2026-02-06 | Browser validation for new controls: setting `Dead-zone pan` + `2.00x` correctly produced `camera.mode=deadzone` and doubled world dims. Movement confirmed dead-zone lag then camera pan. Switching to `centered` mode made camera track ship center (subject to world clamp). No console errors. |
| 2026-02-06 | Completed LA-10 small slice: added world cell index (`worldCells`) and active camera-neighborhood cell set; asteroid replenish now avoids inactive and already-dense cells. Validation: `node --check src/main.js` passed. |
| 2026-02-06 | Completed LA-11 small slice: added spatial-hash broadphase for asteroid-vs-asteroid collision candidate pairs. Validation: `node --check src/main.js` passed. |
| 2026-02-06 | Browser validation for LA-10/LA-11: dead-zone + 2x arena ran deterministic movement/simulation bursts without console errors. `world_cells` telemetry stayed populated/consistent, asteroid population remained stable under long simulation, and collision-heavy burst behavior remained functional (score/counts updated as expected). |
| 2026-02-06 | Added 3-layer parallax starfield with tuning controls (`Star density`, `Parallax strength`) and persisted defaults. Browser validation confirmed visible motion cue and clean console. |
| 2026-02-07 | LA-13 tuning slice: added subtle star accent colors + twinkle behavior and new debug tuning controls (`Accent star chance`, `Twinkle star chance`, `Twinkle strength`, `Twinkle speed`) with saved defaults + `render_game_to_text` background telemetry fields. Validation: `node --check src/main.js` passed. |

## Next Step
- Continue LA-13 tuning pass (camera feel + spawn rates) and update README docs (LA-14) after next browser validation window.
