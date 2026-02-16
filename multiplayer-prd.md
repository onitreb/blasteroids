# Multiplayer PRD — Blasteroids (LAN MVP → Online)

Last updated: 2026-02-16  
Status: DRAFT  
Owners: Product (Paul), Engineering (Paul + Codex agents)  

Related docs:
- `multiplayer-implementation-plan.md` (execution tracker; single source of truth for progress)
- `RUNBOOK.md` (build/test + smoke checklist)
- `docs/architecture.md` (module boundaries and invariants)
- `docs/review-checklist.md` (refactor acceptance checklist)
- `round-loop-prd.md` (future objective loop; **not in MVP**)

---

## 1) Problem Statement

Blasteroids is currently a deterministic, single-client authoritative arcade game. We want to evolve it into a fast “jump in” multiplayer web game (think snake.io / slither.io simplicity), starting with a **local LAN** build/test loop, then moving to real online play.

The first objective is not “perfect netcode” or “final progression,” but to prove:
- Multiple players can share one world at once.
- The sim remains stable and performant with lots of asteroids.
- The game is fun and readable with other ships present.

---

## 2) Goals (Success Criteria)

### MVP (LAN) goals
- 2–4 players can join the same match on a local network and play together.
- The world is **server-authoritative** (shared asteroids/gems behave consistently for everyone).
- Players see each other moving smoothly (snapshot interpolation on clients).
- Core gameplay works in multiplayer:
  - thrust/rotate/brake
  - magnet/attach
  - burst/fracture
  - gem collection + scoring
  - tier progression per player
- A match can run for **10+ minutes** without server crash, major desync, runaway bandwidth, or severe jitter.

### Online-ready goals (Phase 2+)
- Server can be deployed on the public internet (TLS/WSS, basic rate limits, predictable configuration).
- “Quick Play” matchmaking works (join-or-create a 4-player room).
- Minimal observability exists (tick rate, snapshot rate, entity counts).

---

## 3) Non-Goals (for MVP)

- Competitive mode / PvP damage / ship destruction.
- Friend system, invite codes, parties.
- Ranked matchmaking.
- Cross-region latency optimization.
- Full round loop (red giant + gate + tech parts) and saucer/lasers.
- Cheat-proofing beyond baseline sanity checks.

---

## 4) Constraints / Invariants (Do Not Break)

Singleplayer must remain unchanged in its core runtime constraints:
- Singleplayer remains playable by opening `index.html` via `file://` (offline/no server).
- `dist/blasteroids.js` remains a committed bundle used by `index.html`.
- Deterministic stepping + debug/test hooks remain available:
  - `window.Blasteroids.renderGameToText()`
  - `window.Blasteroids.advanceTime(ms)`
  - `window.Blasteroids.setShipSvgRenderer(...)`
  - Legacy aliases preserved (see `docs/architecture.md`).

Multiplayer adds an additional “served” mode:
- Multiplayer requires a server (LAN/online) and will be run via `http://...` / `https://...` (not `file://`).

---

## 5) Product Direction (Long-term)

- Web game: free-to-play, low friction (instant play, minimal signup).
- If validated, later package as a paid iOS/Android app.
- Design should stay input-flexible (keyboard + touch) and keep networking portable (same authoritative server).

---

## 6) MVP Multiplayer Scope (What the first playable build includes)

### Match size
- Max players per room: **4**

### Matchmaking
- “Quick Play”: join-or-create a room with available slots.
- Room is full at 4 players; additional users create/join a new room.

### Game mode
- **Co-op only** for MVP.
- No friendly fire.
- No ship-ship collision.

### World rules (MVP)
- One shared world: asteroids + gems are authoritative on the server.
- Each player has:
  - their own ship physics
  - their own score + progression
  - their own magnet ring behavior
- Asteroid attraction/attachment rule:
  - Each asteroid is influenced by **at most one ship at a time** (deterministic “nearest eligible ship wins”).
  - Attached asteroids are owned by a specific player (`attachedTo` / “ownership”).

---

## 7) Technical Approach (High level)

### Transport + orchestration
- Use Colyseus for Rooms + matchmaking.

### Authority model
- **Server-authoritative**
  - Server runs simulation.
  - Clients send input (intent).
  - Server broadcasts state snapshots (or patches + snapshots).
  - Clients render interpolated states; clients do not mutate authoritative world state.

### Tick + rates (initial targets; tune after profiling)
- Server sim tick: 60Hz fixed dt (with catch-up cap to avoid spiral of death).
- Snapshot broadcast: 20Hz.
- Client input send: 20–30Hz + immediate send on edge triggers.
- Client interpolation delay: 100ms initial default for smoothness on LAN.

### Debuggability
- Keep deterministic engine core (seeded spawns, fixed tick).
- Use `renderGameToText()` as a regression/debug snapshot in both modes.

---

## 8) UX Requirements (MVP)

### Start screen / menu
- Singleplayer: current flow remains unchanged.
- Multiplayer:
  - Name field (default: `Pilot-XYZ`).
  - Server address field (default derived from `window.location` when served).
  - “Quick Play (LAN)” button.

### In-match HUD (minimum)
- Show local score/tier as today.
- Optional: show players connected `N/4` and connection indicator.

### Debug menu behavior (MVP)
- In multiplayer mode, gameplay-affecting tuning controls must be disabled/hidden (server must own gameplay params).

---

## 9) Deployment Requirements (DIY first)

### LAN
- Run a Node server that:
  - serves the static client (`index.html`, `styles.css`, `dist/blasteroids.js`, `assets/*`)
  - hosts the multiplayer websocket endpoint on the same port

### Internet (Phase 2+)
- Host the same Node server behind TLS termination (reverse proxy) for `wss://`.
- Later: evaluate Colyseus Cloud if it reduces ops cost and improves scaling.

---

## 10) Risks / Open Questions

### Known risks
- Bandwidth blow-up if we snapshot too much asteroid state too frequently.
- Server CPU load if we do expensive multi-ship influence checks naively (mitigate with interest management + server sim scaling).
- Keeping the singleplayer `file://` experience intact while adding server code.

### Explicitly deferred decisions
- Competitive mode ruleset definition (damage, stealing, win condition).
- Round-loop multiplayer integration order.
- Whether to migrate asteroids/gems off Schema patches into custom snapshot messages if `StateView` filtering is still too heavy at very large entity counts.

---

## 11) Acceptance Criteria (MVP)

- Two machines on LAN can:
  - open the multiplayer URL,
  - Quick Play into the same match,
  - see consistent asteroid/gem behavior,
  - play for 10+ minutes without crashes or obvious desync.
- `npm test` passes.
- `npm run build` passes and `dist/blasteroids.js` is updated for any runtime changes.
- Singleplayer still runs via `file://` with no console errors.
