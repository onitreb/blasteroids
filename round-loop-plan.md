# Round Loop Plan — Red Giant + Jump Gate

Last updated: 2026-02-13  
Project: Blasteroids  
Scope: Implement the round-based loop described in `round-loop-prd.md`.

## How This Doc Is Used
- Keep this file as the “source of truth” for implementation progress across sessions.
- Update statuses and checkboxes as work completes.
- Add a short entry to the Session Log at the end of each work session.

## Status Legend
- `NOT_STARTED`: no implementation yet.
- `IN_PROGRESS`: active work in this stream.
- `BLOCKED`: waiting on a decision or dependency.
- `DONE`: implemented and verified.

## Global Definition of Done (All Streams)
- [ ] Round timer exists and is configurable (default 5:00).
- [x] Red giant hazard spawns on a random edge and traverses the world within the round duration.
- [x] Wormhole/jump gate spawns opposite the star.
- [x] 4 parts can always be obtained and installed (no unwinnable states).
- [x] Gate activates at 4/4; entering gate ends the round as a win.
- [x] Star contact ends the round as a loss; star reaching far edge ends round as a loss.
- [ ] Debug UI includes new controls (and stays covered by debug-menu metadata test).
- [x] `renderGameToText()` exposes round/star/gate/parts state (for deterministic validation).
- [x] `npm test` and `npm run build` pass.

## Workstreams

### RL-00 — Design Lock (Owner: TBD) — `IN_PROGRESS`
- [x] Resolve core PRD Open Questions (timer authority, gate placement, carry limit).
- [ ] Write explicit spawn safety invariants (“never behind star”, “respawn rule”).
- [ ] Decide gem drop rule (drop chance per size and/or tuning control).
- [ ] Decide remaining PRD questions (part loss respawn timing, containment sizes, saucer interaction).

### RL-FND — Foundations (Seed + Spawn Helpers) — `DONE`
- [x] Add per-round seed to engine state and RNG.
- [x] Export `round.seed` in `renderGameToText()` for deterministic telemetry.
- [x] Add deterministic spawn helpers for multiplayer-style spawns:
  - [x] `generateSpawnPoints(...)` with separation + seed option.
  - [x] `spawnShipAt(...)` helper for explicit spawn placement.
- [x] Add regression tests for seed + spawn helpers.
- [x] Playwright smoke validation for `file://` runtime.

### RL-01 — Round State + End Conditions (Engine) — `DONE`
- [x] Add round config to engine state (duration, elapsed, outcome).
- [x] Add lose end conditions: star contact; star reaches far edge.
- [x] Add win end condition: escape through active gate.
- [x] Add restart/start behaviors that reset round-specific state.

### RL-02 — Red Giant Hazard (Engine) — `IN_PROGRESS`
- [x] Deterministic edge spawn (left/right/top/bottom) and travel direction.
- [x] Star boundary math (progress `t`, boundary position, dead zone test).
- [x] Apply star destruction to entities (ship/asteroids/gems/parts/saucer per decision).
- [ ] Add star “danger zone” (optional MVP: keep off; implement later).

### RL-03 — Jump Gate Entity (Engine) — `DONE`
- [x] Gate spawn opposite the star (deterministic).
- [x] Gate state: inactive → active (when 4 installed).
- [x] Ship-gate collision check triggers win when active.

### RL-04 — Tech Parts System (Engine) — `DONE`
- [x] Represent 4 unique parts with stable IDs and state machine.
- [x] Seed parts into existing XL asteroids at round start (spawn XL asteroids if needed).
- [x] Drop part when containing asteroid is destroyed/fractures.
- [x] Pickup and carry one part (ship attachment).
- [x] Install into gate when in range; track 0/4 → 4/4.
- [x] Respawn part if lost/consumed (safe-zone respawn).

### RL-05 — Rendering MVP (Renderer) — `IN_PROGRESS`
- [x] Draw star boundary band (simple gradient, world-space, camera-aware).
- [x] Draw gate (simple ring + “inactive/active” color change).
- [x] Draw dropped parts + carried part.
- [x] Add lightweight HUD overlays (timer + gate progress) OR route through existing HUD.

### RL-06 — UI + Debug Controls (UI) — `NOT_STARTED`
- [ ] Add round duration control to debug menu (default 5:00).
- [ ] Add optional debug toggles: show star boundary, show gate marker, show part markers.
- [ ] Ensure defaults persistence matches existing patterns (if chosen).

### RL-07 — Balance / Tuning Pass (Engine/UI) — `NOT_STARTED`
- [ ] Adjust star speed/buffer values so parts remain obtainable.
- [ ] Adjust part spawn placement to avoid early star loss.
- [ ] Implement gem drop reduction (chance) and tune scoring feel.

### RL-08 — Tests + Regression Hooks (Test) — `IN_PROGRESS`
- [x] Engine test: deterministic star spawn and traversal for a fixed seed.
- [x] Engine test: no-unwinnable invariant (parts always present until installed).
- [x] Engine test: win condition triggers when ship enters active gate.
- [ ] Update `renderGameToText` snapshot expectations if necessary.

### RL-09 — Docs + Handoff — `IN_PROGRESS`
- [ ] Update `README.md` with new loop + controls.
- [x] Add a short entry in `progress.md` for the feature.
- [x] Add smoke checklist items to `RUNBOOK.md` (timer, star, gate, parts).

## Decision Log (Living)
- `D-RL-01`: Timer authority — RESOLVED (round duration drives star traversal)
- `D-RL-02`: Gate location — RESOLVED (random along opposite edge)
- `D-RL-03`: Carry capacity — RESOLVED (carry one part at a time)
- `D-RL-04`: Part containment sizes (XL only vs XL+XXL) — RESOLVED (MVP: XL only)
- `D-RL-05`: Star affects saucer/lasers? — RESOLVED (MVP: star deletes saucer + lasers)
- `D-RL-06`: On-screen timer — RESOLVED (no HUD timer required for MVP)

## Session Log

| Date | Notes |
| --- | --- |
| 2026-02-13 | Created PRD + implementation tracker for the new round loop. No gameplay code changes yet. |
| 2026-02-13 | Implemented seed + deterministic spawn helpers to prep for multiplayer and deterministic objective placement; added tests and Playwright smoke artifacts. |
| 2026-02-13 | RL-01..04 kickoff: added round state (duration/elapsed/outcome), deterministic red giant + opposite-edge gate, and seeded 4 tech parts into XL asteroids; red giant kills ship/entities + loss on far-edge; added engine tests + rebuilt dist; Playwright smoke artifacts in `output/web-game/round-loop-star-hazard-2/`. |
| 2026-02-13 | RL-03/04 mechanics: parts now drop on XL fracture/removal, can be picked up/carried (1 at a time), installed into the gate (4/4 activates), and entering the active gate wins; lost parts respawn deterministically in the star-safe region; added tests + rebuilt dist; Playwright artifacts in `output/web-game/round-loop-rendering-*/`. |
