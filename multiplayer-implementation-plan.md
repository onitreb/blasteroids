# Multiplayer Implementation Plan — Blasteroids (Trackable)

Last updated: 2026-02-15  
Status: ACTIVE  
Owners: Engineering (Paul + Codex agents)  

Related docs:
- `multiplayer-prd.md` (scope + acceptance)
- `RUNBOOK.md` (build/test + smoke checklist)
- `docs/review-checklist.md` (refactor invariants)

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
| MP-01 | M0 | Define multiplayer engine data model (players, per-player score/progression, `attachedTo`) | ENGINE | NOT_STARTED | MP-00 | `npm test` | Keep singleplayer default player. |
| MP-02 | M0 | Multi-ship update loop (updateShips, per-player tier/progression, per-player burst cooldowns) | ENGINE | NOT_STARTED | MP-01 | `npm test` | Preserve determinism. |
| MP-03 | M0 | Multi-ship entity interactions (asteroid influence ownership, gem pickup ownership, attachment rules) | ENGINE | NOT_STARTED | MP-02 | `npm test` | Deterministic “nearest eligible ship wins.” |
| MP-04 | M0 | Decouple authoritative spawns from camera (spawn near players, avoid all players) | ENGINE | NOT_STARTED | MP-03 | `npm test` | Remove camera-based authority bias. |
| MP-05 | M0 | Add engine `role` option (`server` vs `client`) to skip VFX/camera on server | ENGINE | NOT_STARTED | MP-04 | `npm test` | Physics identical; perf-only skips. |
| MP-06 | M0 | Renderer supports multiple ships + `attachedTo`; renders without requiring `shape` (derive render-only) | RENDER | NOT_STARTED | MP-03 | `npm test` + manual `file://` smoke | Ensure singleplayer visuals remain correct. |
| MP-07 | M1 | Choose/lock Colyseus version + packages; record exact commands here | SERVER | NOT_STARTED | MP-00 | n/a | Update Notes with chosen versions. |
| MP-08 | M1 | Node LAN server serves static client + hosts ws endpoint (same port) | SERVER | NOT_STARTED | MP-07 | manual LAN open | Provide “copy/paste LAN URL” output. |
| MP-09 | M1 | Colyseus Room wrapper: authoritative tick, join/leave, player spawns, input apply, snapshot broadcast | SERVER/ENGINE | NOT_STARTED | MP-05, MP-08 | manual 2-client join | Max clients = 4. |
| MP-10 | M1 | Client net module: connect, Quick Play, input send loop, snapshot buffer | NET | NOT_STARTED | MP-09 | manual LAN join | Keep it small and observable. |
| MP-11 | M1 | Client render pipeline: snapshot interpolation + camera follow local player | NET/RENDER | NOT_STARTED | MP-10, MP-06 | manual LAN join | Engine should not drive sim in multiplayer mode. |
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

