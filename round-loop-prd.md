# Round Loop PRD — Red Giant Encroachment + Jump Gate Escape

Last updated: 2026-02-13  
Project: Blasteroids  
Scope: Introduce a round-based win/lose loop driven by a moving “red giant” hazard and an escape objective (assemble/activate a jump gate).

## Problem Statement
The current game is an open-ended sandbox: it’s fun moment-to-moment, but it lacks a clear round arc (pressure → decision → climax) and a primary objective beyond score farming.

## Goals
- Add a **real round loop** with a clear win condition and fail conditions.
- Add a macro-pressure system (“battle royale” style shrinking/encroaching safe zone) that forces movement and creates escalating urgency.
- Add an objective loop that makes asteroids “mean something” beyond gems: **find 4 alien tech parts**, assemble a gate, escape.
- Keep the implementation deterministic and future-multiplayer-friendly (single-client authority today, clear authority boundaries for later).

## Non-Goals (MVP)
- Final VFX (fiery crescent star, full wormhole shader, etc.).
- Multiplayer networking / server authority.
- Deep balancing pass (we’ll expose tuning/debug controls and iterate later).
- Full narrative/tutorialization.

## Current Map/Arena Model (As Implemented)
The “map” is not a discrete tile grid. It’s a bounded rectangular world in continuous pixel coordinates:
- World origin is at the center (`0,0`), `+x` right, `+y` down.  
  (See `/Users/paul/Documents/GameDev/Blasteroids/src/engine/createEngine.js:2038`.)
- World dimensions are `view.w * worldScale` and `view.h * worldScale`.  
  (See `/Users/paul/Documents/GameDev/Blasteroids/src/engine/createEngine.js:1332`.)
- The ship is clamped to world bounds; asteroids/gems despawn when out-of-bounds.  
  (See `/Users/paul/Documents/GameDev/Blasteroids/src/engine/createEngine.js:1294` and `/Users/paul/Documents/GameDev/Blasteroids/src/engine/createEngine.js:1320`.)
- A “world cells” grid exists, but it’s for spawning distribution / bookkeeping, not terrain.  
  (See `/Users/paul/Documents/GameDev/Blasteroids/src/engine/createEngine.js:308` and `/Users/paul/Documents/GameDev/Blasteroids/src/engine/createEngine.js:689`.)

Foundations added (2026-02-13) to support multiplayer-style spawns and deterministic “random” placements:
- Engine supports a per-round seed (`state.round.seed`) and exports it in `renderGameToText()`.
- Engine exposes deterministic spawn helpers:
  - `generateSpawnPoints(n, { margin, minSeparation, seed })`
  - `spawnShipAt({ x, y })`

## High-Level Round Loop
1. Round starts; player spawns as normal.
2. A **red giant** spawns on a random world edge and begins moving across the world, steadily consuming space.
3. A **wormhole/jump gate** spawns on the opposite side of the world.
4. Four **alien tech parts** are hidden inside **XL asteroids** (initially “inside” the asteroid).
5. Player cracks XL asteroids, retrieves a part, carries it to the gate, and installs it.
6. Once all four parts are installed, the gate activates.
7. Player wins by entering the active gate.
8. Player loses if killed by hazards (star contact) or if the star reaches the far edge before escape.

## Implementation Status (As Of 2026-02-13)
- Engine: round state, deterministic star + opposite-edge gate placement, deterministic seeding of 4 tech parts into XL asteroids, plus drop → pickup/carry → install → activate → escape win loop.
- Invariants: if an uninstalled part is lost/consumed it respawns deterministically inside a new XL asteroid in the star-safe region.
- Rendering MVP: star boundary band, gate ring (inactive/active), and dropped/carried part markers are now visible in-canvas.

## Mechanics Spec (MVP)

### Round Timer (Configurable)
- Default round duration: **5:00 (300s)**.
- Adjustable in menu/debug UI (persist default like other tunables if desired).
- Star traversal time should be derived from the same duration so we don’t have “two competing clocks”:
  - **Preferred**: star progress is `t = elapsed / roundDuration`, and end-of-round is when `t >= 1`.

### Red Giant (Encroaching Hazard)
**Concept:** a massive crescent at an edge that moves across the map, like a battle royale storm.

**MVP representation (gameplay):**
- Treat as a moving **kill-wall** (half-plane) with:
  - **Dead zone**: instant destruction on contact/inside.
  - **Danger zone**: optional “pull/heat” zone in front of the wall (tuning later).
- Spawns on one of the 4 edges at round start (random, deterministic by seed).
- Moves along one axis across the entire world over the round duration.

**Interactions (MVP):**
- Ship: entering dead zone ends the run (gameover).
- Asteroids/gems/parts: destroyed when consumed by the star (with respawn rules for parts to prevent unwinnable states).
- Saucer/lasers: decide explicitly (MVP: star destroys them too; keep rules consistent).

**Rendering (MVP):**
- We do not need the final fiery crescent yet.
- Render a thick gradient band at the encroaching boundary (red/orange) plus a subtle heat haze overlay later.

### Wormhole / Jump Gate (Escape Objective)
**Spawn:**
- Spawns on the opposite edge from the star.
- Location: either centered on that edge or random along it with margins.

**Behavior:**
- Starts inert (inactive).
- Has 4 “slots” (initially invisible; reveal when player carries a part or when close).
- Activates when all 4 parts are installed.
- Winning condition: player enters the gate area after activation.

### Alien Tech Parts (4 Interlocking Pieces)
**States:**
- `in_asteroid` (hidden inside an XL asteroid)
- `dropped` (floating pickup in world)
- `carried` (attached to ship nose)
- `installed` (in a gate slot)

**Spawn rules (anti-unwinnable invariants):**
- For each uninstalled part, there must always be exactly one authoritative instance in the world in one of the above states.
- If a part is destroyed (eaten by star / despawn / otherwise lost), it **respawns** in a new XL asteroid **in the safe region** (ahead of the star boundary by a buffer).
- Parts should never be initially placed behind the star or inside its guaranteed near-future path (spawn safety buffer).

**Containment:**
- Parts are hidden inside XL (or XL/XXL) asteroids.
- When the containing asteroid fractures below XL (or is destroyed), the part becomes a floating pickup at that position.

**Carrying (MVP):**
- Only one carried part at a time (simpler). If we want multi-part trains later, revisit.
- Carried part is attached to ship nose (simple positional offset). Optional: slight handling penalty later (turn rate / damp / max speed).

**Installation:**
- If ship carrying a part enters a gate “install radius”, it auto-installs into the next open slot.
- Installation consumes the carried state and marks the part as installed.

### Gem Drops (Small Change)
Current behavior: every broken small asteroid drops a gem.

Proposed MVP change:
- Make gem drops **probabilistic** (e.g., small asteroid drop chance < 100%).
- Keep score economy readable (if drops get rarer, either increase gem value or increase asteroid count).

Exact drop rates are a tuning decision; capture the goal as “reduce gem spam; keep score progression fun”.

## UX / UI (MVP)
- Menu/debug controls:
  - Round duration (seconds or minutes).
  - Optional toggles: show star boundary / danger zone, show gate marker, show part markers (debug only).
- HUD:
  - Gate progress (0/4 installed) and “Gate Active” indicator.
  - (Per decision) No on-screen round timer required for MVP.

## Multiplayer / Authority Notes (Design-Forward)
- Star/gate/parts should be modeled as **world entities with stable IDs** and state that can be serialized.
- Part assignment to asteroids should be deterministic (seeded) or explicitly server-authoritative later.
- Avoid “search locally, spawn locally” logic that would diverge across clients.
- Prefer an explicit **per-round seed** (server-provided later) so “random edge/placements” are reproducible and debuggable.
- Treat camera as client-only: gameplay spawning/authority should not depend on a single client’s camera position in multiplayer.

Implementation note:
- Use `round.seed` (or server-provided seed later) to drive star-edge selection, gate placement, and part seeding so clients can reproduce identical “random” layouts.
- Use `generateSpawnPoints(...)` for player spawns to guarantee minimum separation and deterministic outcomes under the same seed.

## Acceptance Criteria / Definition of Done (Feature-Level)
- A round starts and ends with a clear outcome:
  - Win: activate gate and enter it.
  - Lose: star consumes the ship OR star reaches the far edge.
- Star always spawns on a random edge and moves across the world within the configured duration.
- Gate spawns on the opposite edge.
- 4 unique parts can always be completed within the round (no unwinnable RNG states).
- All new controls (duration, debug toggles) appear in the debug menu metadata coverage test patterns.
- `render_game_to_text()`/`window.Blasteroids.renderGameToText()` exposes round/star/gate/parts state for deterministic testing.
- `npm test` and `npm run build` pass after implementation work.

## Open Questions (Decide Before Coding the First Slice)
1. **Round end clock**: RESOLVED — round duration drives star traversal.
2. **Gate spawn**: RESOLVED — random along opposite edge.
3. **Part carrying**: RESOLVED — carry one part at a time (MVP).
4. **Part loss**: if a part is dropped and then consumed by the star, respawn immediately or after delay?
5. **Asteroid containment rule**: RESOLVED — XL only (MVP).
6. **Saucer interaction**: RESOLVED — star deletes saucer + lasers (MVP).
