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
- [ ] Red giant hazard spawns on a random edge and traverses the world within the round duration.
- [ ] Wormhole/jump gate spawns opposite the star.
- [ ] 4 parts can always be obtained and installed (no unwinnable states).
- [ ] Gate activates at 4/4; entering gate ends the round as a win.
- [ ] Star contact ends the round as a loss; star reaching far edge ends round as a loss.
- [ ] Debug UI includes new controls (and stays covered by debug-menu metadata test).
- [ ] `renderGameToText()` exposes round/star/gate/parts state (for deterministic validation).
- [ ] `npm test` and `npm run build` pass.

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

### RL-01 — Round State + End Conditions (Engine) — `NOT_STARTED`
- [ ] Add round config to engine state (duration, elapsed, remaining).
- [ ] Add end conditions: win (escape), lose (star contact), lose (star reaches far edge).
- [ ] Add restart/start behaviors that reset round-specific state.

### RL-02 — Red Giant Hazard (Engine) — `NOT_STARTED`
- [ ] Deterministic edge spawn (left/right/top/bottom) and travel direction.
- [ ] Star boundary math (progress `t`, boundary position, dead zone test).
- [ ] Apply star destruction to entities (ship/asteroids/gems/parts/saucer per decision).
- [ ] Add star “danger zone” (optional MVP: keep off; implement later).

### RL-03 — Jump Gate Entity (Engine) — `NOT_STARTED`
- [ ] Gate spawn opposite the star (deterministic).
- [ ] Gate state: inactive → active (when 4 installed).
- [ ] Ship-gate collision check triggers win when active.

### RL-04 — Tech Parts System (Engine) — `NOT_STARTED`
- [ ] Represent 4 unique parts with stable IDs and state machine.
- [ ] Seed parts into existing XL asteroids at round start (spawn XL asteroids if needed).
- [ ] Drop part when containing asteroid is destroyed/fractures.
- [ ] Pickup and carry one part (ship attachment).
- [ ] Install into gate when in range; track 0/4 → 4/4.
- [ ] Respawn part if lost/consumed (safe-zone respawn).

### RL-05 — Rendering MVP (Renderer) — `NOT_STARTED`
- [ ] Draw star boundary band (simple gradient, world-space, camera-aware).
- [ ] Draw gate (simple ring + “inactive/active” color change).
- [ ] Draw dropped parts + carried part.
- [ ] Add lightweight HUD overlays (timer + gate progress) OR route through existing HUD.

### RL-06 — UI + Debug Controls (UI) — `NOT_STARTED`
- [ ] Add round duration control to debug menu (default 5:00).
- [ ] Add optional debug toggles: show star boundary, show gate marker, show part markers.
- [ ] Ensure defaults persistence matches existing patterns (if chosen).

### RL-07 — Balance / Tuning Pass (Engine/UI) — `NOT_STARTED`
- [ ] Adjust star speed/buffer values so parts remain obtainable.
- [ ] Adjust part spawn placement to avoid early star loss.
- [ ] Implement gem drop reduction (chance) and tune scoring feel.

### RL-08 — Tests + Regression Hooks (Test) — `NOT_STARTED`
- [ ] Engine test: deterministic star spawn and traversal for a fixed seed.
- [ ] Engine test: no-unwinnable invariant (parts always present until installed).
- [ ] Engine test: win condition triggers when ship enters active gate.
- [ ] Update `renderGameToText` snapshot expectations if necessary.

### RL-09 — Docs + Handoff — `NOT_STARTED`
- [ ] Update `README.md` with new loop + controls.
- [ ] Add a short entry in `progress.md` for the feature.
- [ ] Add smoke checklist items to `RUNBOOK.md` (timer, star, gate, parts).

## Decision Log (Living)
- `D-RL-01`: Timer authority — RESOLVED (round duration drives star traversal)
- `D-RL-02`: Gate location — RESOLVED (random along opposite edge)
- `D-RL-03`: Carry capacity — RESOLVED (carry one part at a time)
- `D-RL-04`: Part containment sizes (XL only vs XL+XXL) — OPEN
- `D-RL-05`: Star affects saucer/lasers? — OPEN
- `D-RL-06`: On-screen timer — RESOLVED (no HUD timer required for MVP)

## Session Log

| Date | Notes |
| --- | --- |
| 2026-02-13 | Created PRD + implementation tracker for the new round loop. No gameplay code changes yet. |
| 2026-02-13 | Implemented seed + deterministic spawn helpers to prep for multiplayer and deterministic objective placement; added tests and Playwright smoke artifacts. |
