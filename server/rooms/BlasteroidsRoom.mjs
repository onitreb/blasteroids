import { Room } from "@colyseus/core";
import { Encoder } from "@colyseus/schema";

import { createEngine } from "../../src/engine/createEngine.js";
import { BlasteroidsState, AsteroidState, GemState, PlayerState } from "../schema/BlasteroidsState.mjs";

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
      // LAN MVP core co-op only (no round loop hazards / saucer) to avoid invisible authoritative events.
      features: { roundLoop: false, saucer: false },
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

    // Remove the singleplayer placeholder player. Multiplayer server will populate real players on join.
    const placeholderId = this._engine.state.localPlayerId;
    if (placeholderId && this._engine.state.playersById?.[placeholderId]) {
      delete this._engine.state.playersById[placeholderId];
    }
    this._engine.state.localPlayerId = "";

    this.state.seed = seed || String(this._engine.state.round?.sessionSeed ?? "");
    this.state.tick = 0;
    this.state.simTimeMs = 0;

    this._fixedDt = 1 / 60;
    this._tickMs = Math.round(1000 * this._fixedDt);

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

    this.setSimulationInterval(() => {
      if (!this._hasStarted) return;
      this._engine.update(this._fixedDt);
      this.state.tick++;
      this.state.simTimeMs += this._tickMs;
      this._syncSchemaFromEngine();
    }, this._tickMs);
  }

  onJoin(client) {
    const pid = client.sessionId;

    this._engine.addPlayer(pid, { tierKey: "small", makeLocalIfFirst: false });

    if (!this._hasStarted) {
      this._engine.state.localPlayerId = pid;
      this._engine.startGame({ seed: this._engine.state.round?.sessionSeed });
      this._hasStarted = true;
    } else {
      const spawnPoints = this._engine.generateSpawnPoints(4, {
        margin: 200,
        minSeparation: 520,
        seed: (this._engine.state.round?.seed ?? 0) ^ 0x0ddc0ffe,
      });
      const pick = spawnPoints.length ? spawnPoints[this.clients.length % spawnPoints.length] : { x: 0, y: 0 };
      this._engine.spawnShipAtForPlayer(pid, pick);
      this._recomputeLocalPlayerId();
    }

    this._syncSchemaFromEngine();
  }

  onLeave(client) {
    const pid = client.sessionId;
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

  _recomputeLocalPlayerId() {
    const ids = sortedKeys(this._engine.state.playersById);
    this._engine.state.localPlayerId = ids[0] ?? "";
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
  }
}
