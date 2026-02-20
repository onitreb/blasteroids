import { Room } from "@colyseus/core";
import { Encoder, StateView } from "@colyseus/schema";

import { createEngine } from "../../src/engine/createEngine.js";
import { seededRng } from "../../src/util/rng.js";
import { BlasteroidsState, AsteroidState, GemState, PlayerState, RoundTechPartState } from "../schema/BlasteroidsState.mjs";

// Default BUFFER_SIZE can overflow quickly when syncing many entities.
// Keep this intentionally generous for LAN MVP; revisit with interest management.
Encoder.BUFFER_SIZE = 1024 * 1024; // 1MB

function clampNumber(n, min, max, fallback = 0) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, v));
}

function normalizeInput(message) {
  const m = message && typeof message === "object" ? message : {};
  return {
    left: !!m.left,
    right: !!m.right,
    up: !!m.up,
    down: !!m.down,
    burst: !!m.burst,
    ping: !!m.ping,
    turnAnalog: clampNumber(m.turnAnalog, -1, 1, 0),
    thrustAnalog: clampNumber(m.thrustAnalog, 0, 1, 0),
  };
}

function sortedKeys(obj) {
  return Object.keys(obj || {}).sort();
}

function hashStringToU32(str) {
  const s = String(str ?? "");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function normalizeViewRect(message, fallback) {
  const m = message && typeof message === "object" ? message : {};
  const fb = fallback && typeof fallback === "object" ? fallback : {};
  return {
    cx: clampNumber(m.cx, -1e9, 1e9, clampNumber(fb.cx, -1e9, 1e9, 0)),
    cy: clampNumber(m.cy, -1e9, 1e9, clampNumber(fb.cy, -1e9, 1e9, 0)),
    halfW: clampNumber(m.halfW, 40, 50_000, clampNumber(fb.halfW, 40, 50_000, 640)),
    halfH: clampNumber(m.halfH, 40, 50_000, clampNumber(fb.halfH, 40, 50_000, 360)),
    margin: clampNumber(m.margin, 0, 20_000, clampNumber(fb.margin, 0, 20_000, 240)),
  };
}

function readEngineNumberOption({ options, optionKey, envKey, clampMin, clampMax, fallback }) {
  const fromOpts =
    options &&
    typeof options === "object" &&
    Object.prototype.hasOwnProperty.call(options, optionKey) &&
    options[optionKey] !== undefined
      ? options[optionKey]
      : undefined;
  const raw = fromOpts ?? process.env[envKey];
  const v = Number(raw);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(clampMin, Math.min(clampMax, v));
}

function pickPaletteIdx({ sessionId, paletteCount, used, lastAssignedIdx }) {
  const count = Math.max(0, paletteCount | 0);
  if (count <= 0) return 0;

  const usedSet = used instanceof Set ? used : new Set();
  const available = [];
  for (let i = 0; i < count; i++) {
    if (!usedSet.has(i)) available.push(i);
  }
  if (!available.length) return hashStringToU32(sessionId) % count;

  const preferred = [];
  for (const idx of available) {
    if (idx !== lastAssignedIdx) preferred.push(idx);
  }
  const choices = preferred.length ? preferred : available;
  return choices[hashStringToU32(sessionId) % choices.length];
}

export class BlasteroidsRoom extends Room {
  maxClients = 4;
  patchRate = 100; // default 10Hz (can override via BLASTEROIDS_PATCH_RATE_MS)

  onCreate(options = {}) {
    // Allow tuning patch rate without code edits (useful for LAN profiling).
    // NOTE: higher patch rates increase CPU/bandwidth sharply with many entities.
    this.patchRate = clampNumber(process.env.BLASTEROIDS_PATCH_RATE_MS, 16, 500, this.patchRate);

    this.setState(new BlasteroidsState());

    const width = clampNumber(options.width, 200, 8192, 1280);
    const height = clampNumber(options.height, 200, 8192, 720);
    const seed = String(options.seed ?? "");

    this._engine = createEngine({
      role: "server",
      width,
      height,
      seed: seed ? Number(seed) : undefined,
      features: { roundLoop: true, saucer: false, mpSimScaling: true },
    });

    // IMPORTANT: createEngine initializes `state.world.scale` but does not apply it unless `setArenaConfig/resize`
    // runs. Ensure the authoritative world size is actually scaled for LAN MP runs.
    const worldScale = clampNumber(
      options.worldScale ?? process.env.BLASTEROIDS_WORLD_SCALE,
      1,
      10,
      this._engine.state.world?.scale ?? 3,
    );
    this._engine.setArenaConfig({ worldScale });

    // Server-only tuning knobs for stress testing large worlds.
    // NOTE: these affect authoritative spawn behavior (and therefore patch size/CPU).
    this._engine.state.params.asteroidWorldDensityScale = readEngineNumberOption({
      options,
      optionKey: "asteroidDensityScale",
      envKey: "BLASTEROIDS_ASTEROID_DENSITY_SCALE",
      clampMin: 0.08,
      clampMax: 2.5,
      fallback: this._engine.state.params.asteroidWorldDensityScale,
    });
    this._engine.state.params.asteroidSpawnRateScale = readEngineNumberOption({
      options,
      optionKey: "asteroidSpawnRateScale",
      envKey: "BLASTEROIDS_ASTEROID_SPAWN_RATE_SCALE",
      clampMin: 0.25,
      clampMax: 3,
      fallback: this._engine.state.params.asteroidSpawnRateScale,
    });

    // Remove the singleplayer placeholder player. Multiplayer server will populate real players on join.
    const placeholderId = this._engine.state.localPlayerId;
    if (placeholderId && this._engine.state.playersById?.[placeholderId]) {
      delete this._engine.state.playersById[placeholderId];
    }
    this._engine.state.localPlayerId = "";

    this.state.seed = seed || String(this._engine.state.round?.sessionSeed ?? "");
    this.state.tick = 0;
    this.state.simTimeMs = 0;

    // Interest management: per-client StateView membership for asteroids/gems.
    // Each entry: { rect, asteroidRefs: Map<id, AsteroidState>, gemRefs: Map<id, GemState> }
    this._interestBySessionId = new Map();
    this._interestAccumMs = 0;

    // MP cosmetic: server assigns per-player palette indices (unique among active players).
    this._paletteBySessionId = new Map(); // sessionId -> idx
    this._lastAssignedPaletteIdx = null;

    this._fixedDt = 1 / 60;
    this._tickMs = Math.round(1000 * this._fixedDt);
    this._roundResetDelayMs = 2000;
    this._roundResetAccumMs = 0;

    this.onMessage("input", (client, message) => {
      const pid = client.sessionId;
      const player = this._engine.state.playersById?.[pid];
      if (!player?.input) return;
      const next = normalizeInput(message);
      player.input.left = next.left;
      player.input.right = next.right;
      player.input.up = next.up;
      player.input.down = next.down;
      if (next.burst) player.input.burst = true;
      if (next.ping) player.input.ping = true;
      player.input.turnAnalog = next.turnAnalog;
      player.input.thrustAnalog = next.thrustAnalog;
    });

    this.onMessage("view", (client, message) => {
      const pid = client.sessionId;
      const info = this._interestBySessionId.get(pid);
      if (!info) return;
      info.rect = normalizeViewRect(message, info.rect);
      // Update immediately to avoid waiting until the next interest sweep.
      this._updateClientInterest(client);
    });

    this.setSimulationInterval(() => {
      if (!this._hasStarted) return;

      if (this._engine.state.mode === "playing") {
        this._roundResetAccumMs = 0;

        // Feed per-client view rects into the engine so server sim scaling can
        // prioritize only the union of player-visible regions (plus margin).
        const rects = [];
        for (const client of this.clients) {
          const info = this._interestBySessionId.get(client.sessionId);
          if (info?.rect) rects.push(info.rect);
        }
        this._engine.setMpViewRects?.(rects);

        this._engine.update(this._fixedDt);
        this.state.tick++;
        this.state.simTimeMs += this._tickMs;
        this._syncSchemaFromEngine();
      } else {
        // If the round ends (win/lose), automatically reset so the room stays playable.
        this._roundResetAccumMs += this._tickMs;
        if (this._roundResetAccumMs >= this._roundResetDelayMs) {
          this._roundResetAccumMs = 0;
          this._resetAuthoritativeRound();
        } else {
          this._syncSchemaFromEngine();
        }
      }

      // Update interest views at (roughly) patch rate to keep view membership fresh
      // without scanning entity lists every 60Hz tick.
      this._interestAccumMs += this._tickMs;
      if (this._interestAccumMs >= this.patchRate) {
        this._interestAccumMs = 0;
        this._updateAllClientInterest();
      }
    }, this._tickMs);
  }

  onJoin(client) {
    const pid = client.sessionId;
    client.view = new StateView();

    this._interestBySessionId.set(pid, {
      rect: null,
      asteroidRefs: new Map(),
      gemRefs: new Map(),
    });

    const player = this._engine.addPlayer(pid, { tierKey: "small", makeLocalIfFirst: false });

    // Assign a per-player palette index in a way that avoids duplicates among active players.
    const used = new Set();
    for (const idx of this._paletteBySessionId.values()) used.add(idx);
    const paletteIdx = pickPaletteIdx({
      sessionId: pid,
      paletteCount: 4,
      used,
      lastAssignedIdx: this._lastAssignedPaletteIdx,
    });
    this._paletteBySessionId.set(pid, paletteIdx);
    this._lastAssignedPaletteIdx = paletteIdx;
    if (player) player.paletteIdx = paletteIdx;

    if (!this._hasStarted) {
      this._engine.state.localPlayerId = pid;
      this._engine.startGame({ seed: this._engine.state.round?.sessionSeed });
      this._hasStarted = true;
    } else {
      // Co-op UX: spawn new joiners near an existing player so they appear on-screen
      // quickly (critical for LAN MP debugging and “jump in” feel).
      const pick =
        this._pickSpawnNearExistingPlayer({ joiningPlayerId: pid, maxDist: 320, minDist: 180, minSeparation: 280 }) ||
        { x: 0, y: 0 };
      this._engine.spawnShipAtForPlayer(pid, pick);
      this._recomputeLocalPlayerId();
    }

    this._syncSchemaFromEngine();
    this._ensureDefaultViewRect(pid);
    this._updateClientInterest(client, { force: true });
  }

  onLeave(client) {
    const pid = client.sessionId;

    this._paletteBySessionId.delete(pid);

    const info = this._interestBySessionId.get(pid);
    if (info?.asteroidRefs) {
      for (const ref of info.asteroidRefs.values()) client.view?.remove(ref);
    }
    if (info?.gemRefs) {
      for (const ref of info.gemRefs.values()) client.view?.remove(ref);
    }
    this._interestBySessionId.delete(pid);

    this._engine.removePlayer(pid);
    if (this.clients.length === 0) {
      this._hasStarted = false;
      this._engine.state.playersById = Object.create(null);
      this._engine.state.localPlayerId = "";
      this._engine.state.mode = "menu";
      this._engine.state.time = 0;
    } else {
      this._recomputeLocalPlayerId();
    }
    this._syncSchemaFromEngine();
  }

  _ensureDefaultViewRect(pid) {
    const info = this._interestBySessionId.get(pid);
    if (!info || info.rect) return;
    const p = this._engine.state.playersById?.[pid];
    const ship = p?.ship;
    const cx = ship?.pos?.x ?? 0;
    const cy = ship?.pos?.y ?? 0;
    const w = Number(this._engine.state.view?.w) || 1280;
    const h = Number(this._engine.state.view?.h) || 720;
    info.rect = { cx, cy, halfW: w * 0.5, halfH: h * 0.5, margin: 240 };
  }

  _updateAllClientInterest() {
    for (const client of this.clients) this._updateClientInterest(client);
  }

  _updateClientInterest(client, { force = false } = {}) {
    const pid = client?.sessionId;
    const view = client?.view;
    if (!pid || !view) return;

    const info = this._interestBySessionId.get(pid);
    if (!info) return;
    this._ensureDefaultViewRect(pid);
    const rect = info.rect;
    if (!rect) return;

    const cx = rect.cx;
    const cy = rect.cy;
    const halfW = rect.halfW;
    const halfH = rect.halfH;
    const margin = rect.margin;

    // Asteroids
    const nextAsteroidIds = new Set();
    for (const a of this._engine.state.asteroids || []) {
      if (!a?.id) continue;
      const r = (Number(a.radius) || 0) + margin;
      if (Math.abs(a.pos.x - cx) > halfW + r) continue;
      if (Math.abs(a.pos.y - cy) > halfH + r) continue;
      nextAsteroidIds.add(a.id);
      if (!info.asteroidRefs.has(a.id) || force) {
        const as = this.state.asteroids.get(a.id);
        if (!as) continue;
        view.add(as);
        info.asteroidRefs.set(a.id, as);
      }
    }
    const removeAsteroids = [];
    for (const id of info.asteroidRefs.keys()) {
      if (!nextAsteroidIds.has(id)) removeAsteroids.push(id);
    }
    for (const id of removeAsteroids) {
      const ref = info.asteroidRefs.get(id);
      if (ref) view.remove(ref);
      info.asteroidRefs.delete(id);
    }

    // Gems
    const nextGemIds = new Set();
    for (const g of this._engine.state.gems || []) {
      if (!g?.id) continue;
      const r = (Number(g.radius) || 0) + margin;
      if (Math.abs(g.pos.x - cx) > halfW + r) continue;
      if (Math.abs(g.pos.y - cy) > halfH + r) continue;
      nextGemIds.add(g.id);
      if (!info.gemRefs.has(g.id) || force) {
        const gs = this.state.gems.get(g.id);
        if (!gs) continue;
        view.add(gs);
        info.gemRefs.set(g.id, gs);
      }
    }
    const removeGems = [];
    for (const id of info.gemRefs.keys()) {
      if (!nextGemIds.has(id)) removeGems.push(id);
    }
    for (const id of removeGems) {
      const ref = info.gemRefs.get(id);
      if (ref) view.remove(ref);
      info.gemRefs.delete(id);
    }
  }

  _recomputeLocalPlayerId() {
    const ids = sortedKeys(this._engine.state.playersById);
    this._engine.state.localPlayerId = ids[0] ?? "";
  }

  _pickSpawnNearExistingPlayer({ joiningPlayerId, maxDist = 320, minDist = 180, minSeparation = 240 } = {}) {
    const pid = String(joiningPlayerId ?? "");
    const ids = sortedKeys(this._engine.state.playersById).filter((id) => id !== pid);
    if (!ids.length) return null;

    const focusId = ids[0];
    const focusShip = this._engine.state.playersById?.[focusId]?.ship;
    if (!focusShip) return null;

    const seedBase = (Number(this._engine.state.round?.seed) >>> 0) || 0xdecafbad;
    const seed = (seedBase ^ hashStringToU32(pid) ^ 0x9e3779b9) >>> 0 || 0x12345678;
    const rr = seededRng(seed);

    const halfW = Number(this._engine.state.world?.w) ? this._engine.state.world.w / 2 : 0;
    const halfH = Number(this._engine.state.world?.h) ? this._engine.state.world.h / 2 : 0;
    if (!(halfW > 0 && halfH > 0)) return { x: focusShip.pos.x, y: focusShip.pos.y };

    const ships = ids
      .map((id) => this._engine.state.playersById?.[id]?.ship)
      .filter((s) => s && s.pos && typeof s.pos.x === "number" && typeof s.pos.y === "number");

    const minSep = Math.max(0, Number(minSeparation) || 0);
    const minSep2 = minSep * minSep;

    const clampToWorld = (p, r = 0) => ({
      x: clampNumber(p.x, -halfW + r, halfW - r, 0),
      y: clampNumber(p.y, -halfH + r, halfH - r, 0),
    });

    for (let attempt = 0; attempt < 120; attempt++) {
      const ang = rr() * Math.PI * 2;
      const d = minDist + rr() * Math.max(0, maxDist - minDist);
      const cand = clampToWorld({ x: focusShip.pos.x + Math.cos(ang) * d, y: focusShip.pos.y + Math.sin(ang) * d }, 40);

      let ok = true;
      for (const s of ships) {
        const dx = cand.x - s.pos.x;
        const dy = cand.y - s.pos.y;
        if (dx * dx + dy * dy < minSep2) {
          ok = false;
          break;
        }
      }
      if (ok) return cand;
    }

    return clampToWorld({ x: focusShip.pos.x, y: focusShip.pos.y }, 40);
  }

  _syncSchemaFromEngine() {
    const state = this.state;
    const engineState = this._engine.state;

    const ids = sortedKeys(engineState.playersById);
    state.playerOrder.length = 0;
    for (const id of ids) state.playerOrder.push(id);

    // Players
    for (const id of ids) {
      const p = engineState.playersById[id];
      if (!p?.ship) continue;
      let ps = state.players.get(id);
      if (!ps) {
        ps = new PlayerState();
        ps.id = id;
        state.players.set(id, ps);
      }
      ps.x = p.ship.pos.x;
      ps.y = p.ship.pos.y;
      ps.vx = p.ship.vel.x;
      ps.vy = p.ship.vel.y;
      ps.angle = p.ship.angle;
      ps.tier = String(p.ship.tier ?? "small");
      ps.paletteIdx = Number.isFinite(Number(p.paletteIdx))
        ? (Number(p.paletteIdx) | 0)
        : Number.isFinite(Number(this._paletteBySessionId.get(id)))
          ? (Number(this._paletteBySessionId.get(id)) | 0)
          : -1;
      ps.score = Number(p.score) || 0;
      ps.gemScore = Number(p.progression?.gemScore) || 0;
    }
    for (const [id] of state.players) {
      if (!engineState.playersById[id]) state.players.delete(id);
    }

    // Asteroids
    const seenAsteroids = new Set();
    for (const a of engineState.asteroids || []) {
      if (!a?.id) continue;
      seenAsteroids.add(a.id);
      let as = state.asteroids.get(a.id);
      if (!as) {
        as = new AsteroidState();
        as.id = a.id;
        state.asteroids.set(a.id, as);
      }
      as.size = String(a.size ?? "");
      as.x = a.pos.x;
      as.y = a.pos.y;
      as.vx = a.vel.x;
      as.vy = a.vel.y;
      as.radius = Number(a.radius) || 0;
      as.rot = Number(a.rot) || 0;
      as.rotVel = Number(a.rotVel) || 0;
      as.attachedTo = String(a.attachedTo ?? "");
      as.pullOwnerId = String(a.pullOwnerId ?? "");
      as.shipLaunched = a.shipLaunched ? 1 : 0;
    }
    for (const [id] of state.asteroids) {
      if (!seenAsteroids.has(id)) state.asteroids.delete(id);
    }

    // Gems
    const seenGems = new Set();
    for (const g of engineState.gems || []) {
      if (!g?.id) continue;
      seenGems.add(g.id);
      let gs = state.gems.get(g.id);
      if (!gs) {
        gs = new GemState();
        gs.id = g.id;
        state.gems.set(g.id, gs);
      }
      gs.kind = String(g.kind ?? "");
      gs.x = g.pos.x;
      gs.y = g.pos.y;
      gs.vx = g.vel.x;
      gs.vy = g.vel.y;
      gs.radius = Number(g.radius) || 0;
    }
    for (const [id] of state.gems) {
      if (!seenGems.has(id)) state.gems.delete(id);
    }

    // Round loop (star/gate/tech parts)
    const round = state.round;
    const er = engineState.round && typeof engineState.round === "object" ? engineState.round : {};

    if (round) {
      round.durationSec = Number(er.durationSec) || 0;
      round.elapsedSec = Number(er.elapsedSec) || 0;
      round.carriedPartId = String(er.carriedPartId ?? "");
      round.escapeActive = er.escape?.active ? 1 : 0;

      const star = round.star;
      const es = er.star && typeof er.star === "object" ? er.star : null;
      if (star) {
        star.present = es ? 1 : 0;
        star.edge = es ? String(es.edge ?? "") : "";
        star.axis = es ? String(es.axis ?? "") : "";
        star.dir = es ? (Number(es.dir) || 0) : 0;
        star.t = es ? (Number(es.t) || 0) : 0;
        star.boundary = es ? (Number(es.boundary) || 0) : 0;
      }

      const gate = round.gate;
      const eg = er.gate && typeof er.gate === "object" ? er.gate : null;
      if (gate) {
        gate.present = eg ? 1 : 0;
        gate.id = eg ? String(eg.id ?? "") : "";
        gate.edge = eg ? String(eg.edge ?? "") : "";
        gate.x = eg ? (Number(eg.pos?.x) || 0) : 0;
        gate.y = eg ? (Number(eg.pos?.y) || 0) : 0;
        gate.radius = eg ? (Number(eg.radius) || 0) : 0;
        gate.active = eg?.active ? 1 : 0;
        gate.chargeSec = eg ? (Number(eg.chargeSec) || 0) : 0;
        gate.chargeElapsedSec = eg && eg.chargeElapsedSec != null ? (Number(eg.chargeElapsedSec) || 0) : -1;

        const slotsRaw = eg && Array.isArray(eg.slots) ? eg.slots : [];
        const slots = gate.slots;
        if (slots && typeof slots.push === "function" && typeof slots.pop === "function") {
          while (slots.length < slotsRaw.length) slots.push("");
          while (slots.length > slotsRaw.length) slots.pop();
          for (let i = 0; i < slotsRaw.length; i++) slots[i] = String(slotsRaw[i] ?? "");
        }
      }

      const parts = Array.isArray(er.techParts) ? er.techParts : [];
      if (round.techParts) {
        const arr = round.techParts;
        while (arr.length < parts.length) arr.push(new RoundTechPartState());
        while (arr.length > parts.length) arr.pop();
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i] && typeof parts[i] === "object" ? parts[i] : {};
          const ps = arr[i];
          ps.id = String(p.id ?? "");
          ps.state = String(p.state ?? "");
          ps.x = Number(p.pos?.x) || 0;
          ps.y = Number(p.pos?.y) || 0;
          ps.vx = Number(p.vel?.x) || 0;
          ps.vy = Number(p.vel?.y) || 0;
          ps.radius = Number(p.radius) || 0;
          ps.containerAsteroidId = String(p.containerAsteroidId ?? "");
          ps.carrierPlayerId = String(p.carrierPlayerId ?? "");
          ps.installedSlot = Number.isFinite(Number(p.installedSlot)) ? (Number(p.installedSlot) | 0) : -1;
          ps.respawnCount = Number(p.respawnCount) || 0;
        }
      }
    }
  }

  _resetAuthoritativeRound() {
    // Keep the room alive and deterministic: use the engine's built-in round seed advancement.
    this._engine.startGame();

    // Multiplayer: spawn ships at deterministic separated points for the current round seed.
    const ids = sortedKeys(this._engine.state.playersById);
    if (ids.length) {
      const points = this._engine.generateSpawnPoints(ids.length, {
        margin: 420,
        minSeparation: 600,
        seed: this._engine.state.round?.seed,
      });
      for (let i = 0; i < ids.length; i++) this._engine.spawnShipAtForPlayer(ids[i], points[i] || { x: 0, y: 0 });
    }

    this._syncSchemaFromEngine();
    for (const client of this.clients) this._updateClientInterest(client, { force: true });
  }
}
