# Multiplayer Implementation Plan — Blasteroids (Trackable)

Last updated: 2026-02-20  
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

### M3 — Parity (Staged)
Reintroduce singleplayer gameplay systems + visual parity in multiplayer, while keeping server-authoritative rules and client-side rendering/VFX.

---

## Current Multiplayer Simplifications (intentional)

The LAN MVP was built by first stabilizing correctness/perf, then layering UX and visuals. As a result, the current multiplayer build is not “full singleplayer parity” yet:

- Multiplayer rooms run with `features: { roundLoop: false, saucer: false }` (core co-op only; no star/gate loop).
- The server-authoritative engine may run in a mode that skips camera/VFX work.
- While MP is connected, the client renders interpolated authoritative state and **does not yet** reproduce all singleplayer visual-only effects (e.g. thrusters/exhaust, burst/pull explosion effects) because local sim is paused and these effects are not synced from the server.

This is expected, but should be tracked as follow-up work so multiplayer does not remain a “POC-only” experience. After the MVP foundations are stable, reintroduce singleplayer gameplay systems (round loop, saucer, etc.) and then restore visual parity, while keeping the server authoritative and effects client-side.

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
| MP-09 | M1 | Colyseus Room wrapper: authoritative tick, join/leave, player spawns, input apply, snapshot broadcast | SERVER/ENGINE (Codex) | DONE | MP-05, MP-08 | manual 2-client join | Notes:<br>- Room: `server/rooms/BlasteroidsRoom.mjs` (`blasteroids`) with 60Hz sim (`setSimulationInterval`) and 10Hz patches by default (`patchRate = 100ms`; tunable via `BLASTEROIDS_PATCH_RATE_MS`)<br>- Schema state: `server/schema/BlasteroidsState.mjs` (players + asteroids + gems)<br>- Engine helpers: `addPlayer`, `removePlayer`, `spawnShipAtForPlayer` added to `createEngine` for server use<br>- Input: clients send `\"input\"` messages; server applies per-player inputs and runs authoritative sim |
| MP-10 | M1 | Client net module: connect, Quick Play, input send loop, snapshot buffer | NET (Codex) | DONE | MP-09 | manual LAN join | Notes:<br>- Net module: `src/net/createMpClient.js` (opt-in; no behavior change unless connected)<br>- Runtime hooks: `window.Blasteroids.mpConnect/mpDisconnect/mpStatus/mpSnapshots/mpRoom` (wired from `src/main.js`)<br>- Input send loop: 30Hz (edge-trigger `burst`/`ping`, continuous movement + analog fields)<br>- Snapshot buffer: ring buffer (default 32) of server ticks + minimal player snapshots |
| MP-11 | M1 | Client render pipeline: snapshot interpolation + camera follow local player | NET/RENDER (Codex) | DONE | MP-10, MP-06 | manual LAN join | Notes:<br>- MP world view: `src/net/createMpWorldView.js` ingests Schema state (players/asteroids/gems) and applies interpolated poses into engine state for rendering<br>- While connected: `src/main.js` skips local `game.update()` and calls `mpWorld.applyInterpolatedState()` each frame; camera follows local player<br>- Opt-in hook (unchanged): connect via `window.Blasteroids.mpConnect({ endpoint })` |
| MP-12 | M1 | Multiplayer UI: name + server URL + Quick Play; disable gameplay tuning in MP | UI (Codex) | DONE | MP-10 | manual smoke | Notes:<br>- Added Multiplayer panel: server URL + world scale + (future) name + Quick Play/Disconnect + status<br>- While MP connected, gameplay-affecting tuning controls are disabled (server-authoritative) |
| MP-13 | M1 | Automated tests for multiplayer engine invariants (2p determinism, ownership rules) | TEST (Codex) | DONE | MP-03 | `npm test` | Notes:<br>- Added unit tests for 2p determinism (stable snapshot; add-order independent)<br>- Added tie-break tests for asteroid pull ownership and gem pickup at equal distance |
| MP-14 | M1 | Optional Playwright LAN sanity: 2 sessions capture screenshots + state | TEST (Codex) | DONE | MP-11 | scripted run output | Notes:<br>- Added 2-client Playwright smoke (`scripts/mp-browser-2p-smoke.mjs`) that joins via in-game UI and asserts 2p + movement<br>- Captures per-client screenshots + `renderGameToText()` dumps into `tmp/mp-14/` (gitignored) |
| MP-15 | M2 | Multiplayer perf HUD: snapshot Hz, bytes/sec, entities, tick drift | NET/UI (Codex) | DONE | MP-11 | manual | Notes:<br>- Added a minimal MP HUD line (client fps + snapshot Hz/interval + entity counts + server sim speed/tick Hz).<br>- Telemetry is derived from `onStateChange` timings (no extra deps). Singleplayer HUD unchanged when not connected.<br>- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`); `node scripts/mp-browser-smoke.mjs` (pass; prints MP HUD stats). |
| MP-17 | M1 | Renderer perf: cull offscreen asteroids/gems; avoid multi-pass counts | RENDER (Codex) | DONE | MP-11 | manual | Notes:<br>- Added world-space view culling for asteroids and gems (with margin) to reduce draw calls when many entities exist.<br>- Replaced multi-pass `filter().length` asteroid counts with a single pass in the HUD overlay.<br>- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`); `node scripts/mp-browser-smoke.mjs` (pass). |
| MP-18 | M1 | MP smoothing: advance remote sim clock between snapshots | NET (Codex) | DONE | MP-11 | manual | Notes:<br>- Interpolation target time now uses an estimated advancing remote sim clock (`latestSimTimeMs + ageMs * simSpeed`) so motion stays smooth even at 10Hz patches.<br>- Exposes `remoteSimTimeMs` and `renderSimTimeMs` under `state._mp` for debugging.<br>- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`); `node scripts/mp-browser-smoke.mjs` (pass). |
| MP-19 | M1 | LAN tuning knobs: patch rate override + adaptive interp delay | NET/SERVER (Codex) | DONE | MP-18 | manual | Notes:<br>- Server: allow overriding Room `patchRate` via `BLASTEROIDS_PATCH_RATE_MS` (default 100ms).<br>- Client: interpolation delay adapts to observed snapshot jitter (tracks `snapshotDtMaxMs`) so higher patch Hz reduces input lag automatically.<br>- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`); `node scripts/mp-browser-smoke.mjs` (pass). |
| MP-20 | M1 | Interest management: per-client asteroid/gem visibility (in-view + margin) | SERVER/NET (Codex) | DONE | MP-11 | manual (2p big arena) | Notes:<br>- Implemented Colyseus `StateView` filtering for `asteroids`/`gems` per-client (players remain fully visible via Schema).<br>- Client sends its world-space view rect (+ margin) at 10Hz; server updates `client.view` membership accordingly.<br>- Co-op UX: new joiners spawn near an existing player so they’re visible on-canvas immediately (helps validate interest management).<br>- Validation: `npm test` (pass), `npm run build` (pass), manual 2-tab test (worldScale=10, patchRate~30Hz) shows asteroid counts diverge when far apart and converge when together. |
| MP-21 | M1 | Server sim scaling: sleep far asteroids (simulate only near players) | ENGINE/SERVER (Codex) | DONE | MP-20 | manual (stress) | Notes:<br>- Engine: added server-only `features.mpSimScaling` + `setMpViewRects(rects)`; when enabled, far asteroids skip pull/attach work and asteroid broadphase buckets include only active asteroids.<br>- Server: Room now passes per-client view rects into the engine each tick; MP rooms enable `mpSimScaling`.<br>- Validation: `npm test` (pass), `npm run build` (pass), `node scripts/mp-lan-smoke.mjs` (pass), `node scripts/mp-browser-smoke.mjs` (pass), manual 4-player 10-minute LAN run (Paul) with no major issues. |
| MP-22 | M1 | Client prediction: local ship turn/thrust immediate + reconcile | NET/ENGINE | NOT_STARTED | MP-18 | manual | Notes (standards + refs):<br>- Colyseus does **not** provide built-in client prediction yet; implement app-side (FAQ section “Does Colyseus help me with client-prediction?”): https://docs.colyseus.io/faq<br>- Official references for predicted input + fixed tick (v0.17 Phaser tutorial):<br>  - https://docs.colyseus.io/tutorial/phaser/client-predicted-input (shows `server.simulateLatency(200)` for testing)<br>  - https://docs.colyseus.io/tutorial/phaser/fixed-tickrate<br>- Command Pattern best practice (queue/process commands deterministically): https://docs.colyseus.io/recommendations/command-pattern<br><br>Plan (implementation, mapped to repo files):<br>- Predict **local ship only** (turn/thrust). Remote ships + asteroids + gems stay server-authoritative and are rendered from interpolated snapshots (`src/net/createMpWorldView.js`).<br>- Client input commands: add `seq` to input payloads, send at 60Hz (fixed tick), and keep a ring buffer of unacked commands for replay (`src/net/createMpClient.js`).<br>- Authoritative ack: extend Schema `PlayerState` with `lastProcessedInputSeq` so the client can drop acknowledged inputs and reconcile (`server/schema/BlasteroidsState.mjs`).<br>- Server input queue: queue incoming input messages per client, apply in-order at the start of each 60Hz sim tick (ignore stale/out-of-order), set `lastProcessedInputSeq`, then run one authoritative engine tick (`server/rooms/BlasteroidsRoom.mjs`).<br>- Client reconciliation: on patch, read the authoritative local-player pose + `lastProcessedInputSeq`, rollback local predicted ship to server pose, replay remaining unacked commands using the same deterministic ship-step, then render predicted local ship + interpolated world (`src/net/createMpWorldView.js` + `src/main.js`).<br>- Drift minimization: extract ship kinematics into a deterministic helper used by both authoritative engine update and client prediction (DOM-free, no RNG, no gameplay side effects) so movement math matches (`src/engine/*`).<br>- Ensure `createMpWorldView.applyInterpolatedState` does **not** overwrite predicted local ship fields while prediction is enabled (keep authoritative local pose for reconciliation/debug).<br><br>Validation (reality-based):<br>- Manual: enable simulated latency (Colyseus `simulateLatency`) and confirm local ship responds immediately while server remains authoritative; observe bounded correction (no runaway rubber-banding).<br>- Automated: extend Playwright MP smoke to run with simulated latency + lower patch Hz, then assert local movement begins before the first server patch; keep `file://` singleplayer unchanged. |
| MP-23 | M3 | Gameplay parity: enable + sync round loop (star/gate/parts) in MP | ENGINE/SERVER/NET/RENDER | NOT_STARTED | MP-21 | manual + smokes | Ensure MP rooms can run the round loop server-authoritatively and clients render it correctly (no `file://` impact). |
| MP-24 | M3 | Gameplay parity: enable + sync saucer + lasers in MP | ENGINE/SERVER/NET/RENDER | NOT_STARTED | MP-23 | manual + smokes | Server authoritative saucer/laser behavior; clients render it. |
| MP-25 | M3 | Visual parity: client-side VFX while MP connected | RENDER/NET | NOT_STARTED | MP-24 | manual | Restore thrusters/exhaust, pull/burst FX, and other visuals in MP by deriving VFX from authoritative state changes (no gameplay side effects). |
| MP-26 | M3 | Mode switch: co-op vs versus (PvP) (design + wiring) | DOCS/UI/SERVER | NOT_STARTED | MP-25 | n/a | Define rules + UI switch; implementation can be split into smaller steps after design is locked. |
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

### 2026-02-15 (MP-11 follow-up)
- Fixed multiplayer input wiring bug: `src/main.js` no longer captures a stale `input` object at startup (local player id changes in MP); key/mouse handlers now read `game.state.input` dynamically so the active local player can control their ship.
- Hardened `scripts/mp-browser-smoke.mjs` to assert the ship actually moves while connected.
- Stability/perf tweaks after manual testing:
  - Increased `@colyseus/schema` `Encoder.BUFFER_SIZE` to 1MB to avoid buffer overflows when syncing many entities.
  - Reduced server patch rate to 10Hz (`patchRate = 100ms`) to cut patch bandwidth/CPU.
  - Cleared impulse inputs (`burst`/`ping`) on the client after sending so repeated bursts keep working while local sim is paused.

### 2026-02-15 (MP-11 follow-up 2)
- Correctness: fixed ship-vs-asteroid collisions to run for **all players** (not just the local-player alias), in deterministic order.
- Stability: LAN server now starts the authoritative engine with `features: { roundLoop: false, saucer: false }` so MP rooms don’t end unexpectedly due to red giant / gate / saucer events (core co-op only for LAN MVP).
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`); `node scripts/mp-browser-smoke.mjs` (pass); `node scripts/mp-lan-smoke.mjs ws://localhost:<port>` (pass).

### 2026-02-15 (MP-15)
- Added a minimal MP HUD line (fps + snapshot Hz/interval + entity counts + server sim speed/tick Hz) to help diagnose “abysmal FPS” vs server lag.
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`); `node scripts/mp-browser-smoke.mjs` (pass; prints HUD stats).

### 2026-02-15 (MP-17)
- Renderer perf pass: added view culling for asteroids/gems and removed multi-pass asteroid count filters in the HUD overlay.
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`); `node scripts/mp-browser-smoke.mjs` (pass).

### 2026-02-15 (MP-18)
- MP smoothing: interpolation now advances a remote sim clock between snapshots so motion stays smooth at 10Hz patch rate.
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`); `node scripts/mp-browser-smoke.mjs` (pass).

### 2026-02-15 (MP-19)
- Added LAN tuning knobs:
  - Server `patchRate` override via `BLASTEROIDS_PATCH_RATE_MS` (try `50` for ~20Hz).
  - Client interpolation delay now adapts to observed snapshot jitter so higher patch Hz reduces input lag automatically.
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`); `node scripts/mp-browser-smoke.mjs` (pass).

### 2026-02-15 (LAN MP follow-up: world scale)
- Fixed authoritative arena sizing for multiplayer rooms: LAN server now applies `worldScale` on the server engine (`setArenaConfig`) and the client applies the same `worldScale` before attaching MP camera clamping.
- Run: `BLASTEROIDS_WORLD_SCALE=10 npm run lan:server` or pass `joinOptions.worldScale` in `window.Blasteroids.mpConnect(...)`.
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`).

### 2026-02-16 (MP-20)
- Added interest management for large worlds using Colyseus `StateView`:
  - Schema: `asteroids` + `gems` are `@view()` fields (per-client visibility filtering).
  - Server: clients maintain a `StateView` and the server updates view membership based on periodic client view rect messages.
  - Client: sends a world-space view rect (+ margin) at 10Hz derived from camera/view params.
- Co-op UX tweak: new joiners now spawn near an existing player (so “2nd player never appeared” due to off-screen spawn no longer happens).
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`); manual 2-tab LAN test using `BLASTEROIDS_WORLD_SCALE=10 BLASTEROIDS_PATCH_RATE_MS=33 npm run lan:server` (pass; far apart => different asteroid counts per client; together => counts converge).

### 2026-02-16 (MP-21 progress)
- Started server sim scaling using the same per-client view rects:
  - Server feeds view rects into the engine each tick (`setMpViewRects(...)`).
  - Engine can skip expensive pull/attach + collision broadphase work for far asteroids outside the union of view rects (+ margin).
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`); `node scripts/mp-lan-smoke.mjs ...` (pass); `node scripts/mp-browser-smoke.mjs` (pass).

### 2026-02-16 (MP-21)
- Manual stress validation (Paul): 4 players on LAN for ~10 minutes with no major desync, disconnects, or server “sim” slowdown observed.
- Note: Chrome may log occasional `[Violation] 'requestAnimationFrame' handler took …ms` warnings under load; treat these as perf signals (watch MP HUD `sim/tickHz`, `age`, and `net rx/tx`).

### 2026-02-16 (MP UX: player palettes)
- Multiplayer visuals now apply a pastel palette per player (ship outline + forcefield ring + owned asteroid tint):
  - Server assigns `paletteIdx` on join to avoid duplicates among active players.
  - Client/renderer uses `paletteIdx` when present (falls back to id-hash only as a legacy/default).
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`); manual 2-tab check (pass).

### 2026-02-16 (MP tuning: asteroid scaling + net HUD)
- Added LAN server knobs to tune asteroid population and refill pacing: `BLASTEROIDS_ASTEROID_DENSITY_SCALE` and `BLASTEROIDS_ASTEROID_SPAWN_RATE_SCALE` (also supported as `joinOptions.asteroidDensityScale` / `joinOptions.asteroidSpawnRateScale`).
- MP HUD now shows a rough per-client network estimate (`rx/tx` bytes/sec) to help tune patch rate/entity counts.

### 2026-02-16 (MP-12)
- Added an in-game Multiplayer panel in the main menu: server URL (file:// safe default), world scale (must match server), (future) name field, Quick Play + Disconnect buttons, and a connection status readout (room/session/players).
- In multiplayer mode, disabled gameplay-affecting tuning controls (world scale + tuning sliders) to avoid diverging from the server-authoritative simulation.
- Validation: `npm test` (pass); `npm run build` (pass; updated `dist/blasteroids.js`); `node scripts/mp-browser-smoke.mjs` (pass; exercises UI Quick Play); Playwright `file://` singleplayer smoke (pass).

### 2026-02-20 (MP-13)
- Added unit tests for multiplayer engine invariants:
  - 2-player determinism is stable regardless of player add order (sorted iteration).
  - Equal-distance tie-breaks are deterministic: asteroid `pullOwnerId` and gem pickup award the lower player id.
- Validation: `npm test` (pass).

### 2026-02-20 (MP-14)
- Added a 2-client Playwright smoke that exercises the in-game Multiplayer UI Quick Play path and asserts both sessions see `2` players and can move.
- Captures screenshots + a combined JSON dump (`mpStatus`, `state._mp`, and `renderGameToText()`) under `tmp/mp-14/`.
- Validation: `node scripts/mp-browser-2p-smoke.mjs` (pass).

### 2026-02-20 (MP-22 planning)
- Researched Colyseus v0.17 official guidance for client-predicted input, fixed tick-rate loops, and command-queue patterns.
- Updated MP-22 Notes with concrete implementation + validation plan aligned to current repo architecture (server-authoritative; predict local ship only; reconcile via seq ack).
