# Multiplayer Implementation Plan — Blasteroids (Trackable)

Last updated: 2026-02-15  
Status: ACTIVE  
Owners: Engineering (Paul + Codex agents)  

Related docs:
- `multiplayer-prd.md` (scope + acceptance)
- `RUNBOOK.md` (build/test + smoke checklist)
- `docs/review-checklist.md` (refactor invariants)

---

## Official Docs Baseline (no-assumptions rule)

Before implementing any **SERVER/NET** steps, confirm we are following the *current* official docs for the exact versions we install. Record pinned versions + commands in MP-07 Notes.

### Colyseus (target: current stable at time of MP-07)
- Migration guide (0.17+): https://docs.colyseus.io/migrating/0.17
- Getting started (JavaScript SDK): https://docs.colyseus.io/getting-started/javascript
- Client SDK API reference: https://docs.colyseus.io/sdk
- Rooms API (`setSimulationInterval`, `patchRate` / `setPatchRate` deprecation, message handling): https://docs.colyseus.io/room
- State Sync overview (Schema-based patches): https://docs.colyseus.io/state
- Schema reference: https://docs.colyseus.io/state/schema
- WebSocket transport options: https://docs.colyseus.io/server/transport/ws
- Server API (listen, shutdown hooks, etc.): https://docs.colyseus.io/server

### Implementation choice that must be made explicitly (and documented in MP-07)
- **State transport strategy:** Colyseus Schema/patches for room state vs custom snapshot messages (`room.send` / `room.sendBytes`). Prefer the official “State Sync (Schema)” path unless profiling shows we need custom binary snapshots.

---

## How Fresh Agents Use This Doc (Required Workflow)

This file is the source of truth for multiplayer progress. Use it as an execution tracker, not a design scratchpad.

### Step picking (single-agent rule)
1. Read `multiplayer-prd.md` for scope and constraints.
2. In the **Work Plan** table:
   - If any step is `IN_PROGRESS`, **resume that step** (there must be only one).
   - Otherwise, pick the next `NOT_STARTED` step whose dependencies are `DONE`.
3. Before making code changes:
   - Mark your chosen step `IN_PROGRESS`
   - Set the `Owner` to yourself
   - Write a 1–3 bullet “Plan” in the step’s Notes (what you will change + what done means)

### Update discipline (mandatory)
After completing a step:
- Run the step’s validations.
- If runtime JS changed, run `npm run build` and ensure `dist/blasteroids.js` is updated.
- Update this doc:
  - Mark the step `DONE`
  - Add a **Session Log** entry: date, summary, validations + results
- Update `progress.md` with a short summary and any follow-up TODOs (recommended).

### Status constraints
- Only one `IN_PROGRESS` step at a time.
- Don’t mark a step `DONE` without passing its Validation.
- If blocked, mark `BLOCKED` and write:
  - what is blocked,
  - why,
  - what unblocks it.

---

## Status Legend
- `NOT_STARTED`
- `IN_PROGRESS`
- `BLOCKED`
- `DONE`

## Ownership Legend
- `ENGINE`: deterministic sim + state model (`src/engine/*`)
- `RENDER`: canvas renderer (`src/render/*`)
- `UI`: DOM bindings + menus (`src/ui/*`, `index.html`, `styles.css`)
- `NET`: client networking module (`src/net/*`)
- `SERVER`: Node server + Colyseus Rooms (`server/*`)
- `TEST`: automated tests + Playwright harness (`test/*`, scripts)
- `DOCS`: documentation updates

---

## Milestones (high-level)

### M0 — Multiplayer Foundations
Refactor engine/render boundaries so multiplayer is feasible without breaking singleplayer.

### M1 — LAN MVP (Core Co-op)
2–4 players on LAN with server-authoritative world + client interpolation.

### M2 — Online-Ready
Deployment checklist (DIY TLS/WSS) + baseline safety/perf instrumentation.

---

## Work Plan (single source of truth)

| ID | Milestone | Step | Owner | Status | Depends On | Validation | Notes |
|---|---|---|---|---|---|---|---|
| MP-00 | M0 | Add multiplayer PRD + this plan to repo; link from README | DOCS | DONE | — | n/a | Created `multiplayer-prd.md` + `multiplayer-implementation-plan.md`. |
| MP-01 | M0 | Define multiplayer engine data model (players, per-player score/progression, `attachedTo`) | ENGINE (Codex) | DONE | MP-00 | `npm test` | Plan:<br>- Add `playersById` + `localPlayerId` while keeping legacy `state.ship` + `state.score` aliases<br>- Move score/progression/cooldowns under player model (local player by default)<br>- Add `asteroid.attachedTo` (keep legacy `asteroid.attached` boolean for now) |
| MP-02 | M0 | Multi-ship update loop (updateShips, per-player tier/progression, per-player burst cooldowns) | ENGINE (Codex) | DONE | MP-01 | `npm test` | Plan:<br>- Add deterministic per-player update loop (`updatePlayers`) for cooldowns + tierShift timers + ship movement<br>- Make tier/progression logic player-aware (score thresholds per player; camera zoom only for local player)<br>- Keep singleplayer behavior + tests unchanged |
| MP-03 | M0 | Multi-ship entity interactions (asteroid influence ownership, gem pickup ownership, attachment rules) | ENGINE (Codex) | DONE | MP-02 | `npm test` | Plan:<br>- Pick a single “influence owner” per asteroid per tick (nearest eligible ship; deterministic tie-break by player id)<br>- Attached asteroids orbit their owner ship (`attachedTo`) and burst only affects owner’s attached rocks<br>- Gems award points/progression to the nearest colliding player (deterministic tie-break) |
| MP-04 | M0 | Decouple authoritative spawns from camera (spawn near players, avoid all players) | ENGINE (Codex) | DONE | MP-03 | `npm test` | Plan:<br>- Make spawn exclusion views derive from player ships (not camera)<br>- Spawn ambient asteroids near a selected player ship; keep minimum distance from all ships<br>- Keep tech part respawn avoidance based on player views (singleplayer behavior unchanged) |
| MP-05 | M0 | Add engine `role` option (`server` vs `client`) to skip VFX/camera on server | ENGINE (Codex) | DONE | MP-04 | `npm test` | Plan:<br>- Add `role` option to `createEngine` (`client` default, `server` skips camera + VFX updates)<br>- Ensure gameplay RNG is unaffected by VFX (split fx RNG stream; server skipping VFX must not change sim)<br>- Keep singleplayer hooks + tests unchanged |
| MP-06 | M0 | Renderer supports multiple ships + `attachedTo`; renders without requiring `shape` (derive render-only) | RENDER (Codex) | DONE | MP-03 | `npm test` + manual `file://` smoke | Render ships + forcefield rings for all `playersById` (local camera unchanged for now). Color attached asteroids by owner (`attachedTo`) and pull VFX by `pullOwnerId`. Derive asteroid shapes client-side when `shape` missing (cache by id). |
| MP-07 | M1 | Choose/lock Colyseus version + packages; record exact commands here | SERVER (Codex) | DONE | MP-00 | n/a | Notes:<br>- Docs baseline: migration guide (0.17+) + JS SDK getting started; client package is `@colyseus/sdk` (not legacy `colyseus.js`)<br>- Packages (pinned): `colyseus@0.17.8`, `@colyseus/core@0.17.32`, `@colyseus/ws-transport@0.17.9`, `@colyseus/schema@4.0.8`, `@colyseus/sdk@0.17.26`<br>- Install (exact): `npm install --save-exact colyseus@0.17.8 @colyseus/core@0.17.32 @colyseus/ws-transport@0.17.9 @colyseus/schema@4.0.8 @colyseus/sdk@0.17.26`<br>- State transport strategy (explicit): use Colyseus **State Sync (Schema patches)** for authoritative room state; clients send input via `onMessage`/`send` messages. Avoid custom snapshots/messages for authoritative state in the baseline; revisit only if profiling shows patch bandwidth/CPU is the bottleneck with many asteroids.<br>- Validation (after install): `npm test` (pass) |
| MP-08 | M1 | Node LAN server serves static client + hosts ws endpoint (same port) | SERVER (Codex) | DONE | MP-07 | manual LAN open | Notes:<br>- Entry: `server/lan-server.mjs` (serves `index.html`, `styles.css`, `dist/`, `assets/` and hosts Colyseus ws on the same port)<br>- Run: `npm run lan:server` (default `2567`) or `npm run lan:server -- --port 2567`<br>- On startup prints copy/paste URLs for `localhost` and detected LAN IPv4 addresses |
| MP-09 | M1 | Colyseus Room wrapper: authoritative tick, join/leave, player spawns, input apply, snapshot broadcast | SERVER/ENGINE (Codex) | DONE | MP-05, MP-08 | manual 2-client join | Notes:<br>- Room: `server/rooms/BlasteroidsRoom.mjs` (`blasteroids`) with 60Hz sim (`setSimulationInterval`) and 20Hz patches (`patchRate = 50ms`)<br>- Schema state: `server/schema/BlasteroidsState.mjs` (players + asteroids + gems)<br>- Engine helpers: `addPlayer`, `removePlayer`, `spawnShipAtForPlayer` added to `createEngine` for server use<br>- Input: clients send `\"input\"` messages; server applies per-player inputs and runs authoritative sim |
| MP-10 | M1 | Client net module: connect, Quick Play, input send loop, snapshot buffer | NET (Codex) | DONE | MP-09 | manual LAN join | Notes:<br>- Net module: `src/net/createMpClient.js` (opt-in; no behavior change unless connected)<br>- Runtime hooks: `window.Blasteroids.mpConnect/mpDisconnect/mpStatus/mpSnapshots/mpRoom` (wired from `src/main.js`)<br>- Input send loop: 30Hz (edge-trigger `burst`/`ping`, continuous movement + analog fields)<br>- Snapshot buffer: ring buffer (default 32) of server ticks + minimal player snapshots |
| MP-11 | M1 | Client render pipeline: snapshot interpolation + camera follow local player | NET/RENDER (Codex) | DONE | MP-10, MP-06 | manual LAN join | Notes:<br>- MP world view: `src/net/createMpWorldView.js` ingests Schema state (players/asteroids/gems) and applies interpolated poses into engine state for rendering<br>- While connected: `src/main.js` skips local `game.update()` and calls `mpWorld.applyInterpolatedState()` each frame; camera follows local player<br>- Opt-in hook (unchanged): connect via `window.Blasteroids.mpConnect({ endpoint })` |
| MP-12 | M1 | Multiplayer UI: name + server URL + Quick Play; disable gameplay tuning in MP | UI | NOT_STARTED | MP-10 | manual smoke | Singleplayer flow unchanged. |
| MP-13 | M1 | Automated tests for multiplayer engine invariants (2p determinism, ownership rules) | TEST | NOT_STARTED | MP-03 | `npm test` | Unit tests only (no network). |
| MP-14 | M1 | Optional Playwright LAN sanity: 2 sessions capture screenshots + state | TEST | NOT_STARTED | MP-11 | scripted run output | Don’t break existing harness. |
| MP-15 | M2 | Multiplayer perf HUD: snapshot Hz, bytes/sec, entities, tick drift | NET/UI | NOT_STARTED | MP-11 | manual | Keep minimal. |
| MP-16 | M2 | Online deployment doc: DIY TLS/WSS, env vars, ops checklist, rate limits | DOCS/SERVER | NOT_STARTED | MP-09 | n/a | Doc-only until LAN MVP stable. |

---

## Definition of Done (per milestone)

### M0 DONE when
- Engine supports multiple players without breaking singleplayer `file://`.
- `npm test` passes.
- `npm run build` passes for any runtime changes.

### M1 DONE when
- 2–4 clients can Quick Play into a room on LAN.
- Everyone sees consistent asteroids/gems and other players.
- No major desync observed in a 10-minute run.

### M2 DONE when
- Documented, repeatable path to online deployment exists.
- Baseline safety/perf instrumentation exists.

---

## Decision Log (append-only)

### 2026-02-15
- Authority model: server-authoritative (clients send input; server sim; clients render snapshots).
- MVP scope: core co-op only (movement + magnet/burst + shared asteroids/gems); skip round loop + PvP initially.
- Max players per room: 4.

---

## Session Log (append-only)

### 2026-02-15
- Added `multiplayer-prd.md` and `multiplayer-implementation-plan.md`.
- Validation: n/a (docs only).

### 2026-02-15 (MP-01)
- Implemented engine multiplayer data model: `state.playersById` + `state.localPlayerId`, with legacy top-level aliases to the local player to keep singleplayer behavior intact.
- Added `asteroid.attachedTo` (kept legacy `asteroid.attached` boolean for now).
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`).

### 2026-02-15 (MP-02)
- Implemented deterministic multi-player update scaffolding: per-player cooldowns + tierShift timers + ship movement iterate over `playersById` in sorted id order.
- Made tier/progression evaluation player-aware (thresholds based on each player's score); camera zoom transitions still apply only to the local player.
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`).

### 2026-02-15 (MP-03)
- Implemented deterministic ownership rules for core interactions:
  - Each asteroid selects a single influence owner per tick (nearest eligible ship; deterministic tie-break by player id order).
  - Attached asteroids orbit their owner ship (`attachedTo`) and burst only affects the owner’s attached asteroids.
  - Gem attraction + pickup awards points/progression to the nearest colliding player (deterministic tie-break).
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`).

### 2026-02-15 (MP-04)
- Decoupled authoritative spawn avoidance from camera:
  - Spawn exclusion views now derive from player ships (per-player zoom estimate), not `state.camera`.
  - Ambient asteroid spawns choose a focus player and spawn near them while enforcing minimum distance from *all* ships.
  - Tech part respawn fallback scoring now maximizes distance from the nearest player view.
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`).

### 2026-02-15 (MP-05)
- Added `createEngine({ role })` option (`client` default, `server` for authoritative sim without render-only work).
- Decoupled VFX RNG from gameplay RNG (`fxRng`) and made server role skip camera + VFX/exhaust updates without affecting gameplay RNG.
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`).

### 2026-02-15 (MP-06)
- Updated renderer to support multiple players: draws ships + rings for all `playersById`, and renders asteroids using `attachedTo` / `pullOwnerId` ownership.
- Renderer no longer requires authoritative asteroid `shape`; derives a deterministic shape from asteroid id when missing (cached client-side).
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`); manual `file://` smoke (pass; 2 ships visible).

### 2026-02-15 (MP-07)
- Locked Colyseus 0.17+ package set + exact versions and recorded the pinned install command (see MP-07 Notes).
- Decision: baseline room state transport uses Schema patch-based State Sync; clients send input via messages (no custom authoritative snapshots initially).
- Commands: `npm install --save-exact colyseus@0.17.8 @colyseus/core@0.17.32 @colyseus/ws-transport@0.17.9 @colyseus/schema@4.0.8 @colyseus/sdk@0.17.26`; `npm test` (pass).
- Note: `npm install` reported 7 vulnerabilities (6 low, 1 moderate); no `npm audit fix` run as part of MP-07.

### 2026-02-15 (MP-08)
- Added LAN server entrypoint `server/lan-server.mjs` using Colyseus `WebSocketTransport` with Express routes to serve the static client and host websockets on the same port.
- Added npm script: `npm run lan:server` (prints copy/paste LAN URLs on startup).
- Validation: local smoke (start server on ephemeral port, `GET /healthz`, `GET /`, `GET /dist/blasteroids.js`) (pass).

### 2026-02-15 (MP-09)
- Implemented Colyseus Room wrapper (`blasteroids`) with authoritative server sim tick (60Hz) and Schema state sync (~20Hz patches).
- Join/leave now adds/removes players on the engine, spawns ships, and applies per-player input via `\"input\"` messages.
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`); local 2-client join smoke via `node scripts/mp-lan-smoke.mjs ws://localhost:<port>` (pass).

### 2026-02-15 (MP-10)
- Added opt-in browser net client (`src/net/createMpClient.js`) using `@colyseus/sdk` to join-or-create the `blasteroids` room, send input at 30Hz, and buffer recent snapshots.
- Exposed runtime hooks for manual testing without affecting default `file://` singleplayer: `window.Blasteroids.mpConnect/mpDisconnect/mpStatus/mpSnapshots/mpRoom`.
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`); browser smoke `node scripts/mp-browser-smoke.mjs` (pass).

### 2026-02-15 (MP-11)
- Client now renders the authoritative multiplayer world by applying interpolated Schema state into engine render state (`src/net/createMpWorldView.js`) and following the local player with the camera.
- While MP is connected, `src/main.js` skips local simulation (`game.update`) and renders from the interpolated world view (singleplayer `file://` unchanged unless MP is explicitly connected).
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`); browser smoke `node scripts/mp-browser-smoke.mjs` (pass; verifies snapshots + non-empty asteroids render state).
