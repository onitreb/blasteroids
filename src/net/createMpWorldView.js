import { clamp, lerp } from "../util/math.js";
import { wrapAngle } from "../util/angle.js";
import { vec } from "../util/vec2.js";
import { SHIP_TIERS } from "../engine/createEngine.js";

function nowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
  return Date.now();
}

function lerpAngle(a, b, t) {
  const aa = Number(a) || 0;
  const bb = Number(b) || 0;
  const d = wrapAngle(bb - aa);
  return wrapAngle(aa + d * clamp(t, 0, 1));
}

function makeHistory() {
  return { a: null, b: null, c: null };
}

function pushHistory(hist, sample) {
  hist.a = hist.b;
  hist.b = hist.c;
  hist.c = sample;
}

function pickSpan(hist, targetT) {
  const a = hist.a;
  const b = hist.b;
  const c = hist.c;
  if (!c) return null;
  if (!b) return { p0: c, p1: c, t: 1 };
  if (!a) {
    const dt = Math.max(1e-6, c.t - b.t);
    const tt = clamp((targetT - b.t) / dt, 0, 1);
    return { p0: b, p1: c, t: tt };
  }
  if (targetT <= b.t) {
    const dt = Math.max(1e-6, b.t - a.t);
    const tt = clamp((targetT - a.t) / dt, 0, 1);
    return { p0: a, p1: b, t: tt };
  }
  const dt = Math.max(1e-6, c.t - b.t);
  const tt = clamp((targetT - b.t) / dt, 0, 1);
  return { p0: b, p1: c, t: tt };
}

function sortedStringKeys(obj) {
  return Object.keys(obj || {}).sort();
}

function mapSchemaKeys(map) {
  const keys = [];
  if (map && typeof map.forEach === "function") {
    map.forEach((_v, k) => keys.push(String(k)));
  }
  keys.sort();
  return keys;
}

function shipTierKey(raw) {
  if (raw === "medium" || raw === "large") return raw;
  return "small";
}

export function createMpWorldView({
  engine,
  interpolationDelayMs = 40,
  historySize = 3, // fixed at 3 for now (a,b,c)
} = {}) {
  if (!engine || !engine.state) throw new Error("createMpWorldView requires { engine }");
  if (historySize !== 3) throw new Error("createMpWorldView currently supports historySize=3 only");

  const state = engine.state;

  let room = null;
  let localSessionId = "";
  let onStateChangeHandler = null;

  let latestSimTimeMs = 0;
  let latestReceivedAtMs = 0;

  const recvSamples = []; // recent onStateChange arrivals (for telemetry)
  const recvSampleCap = 64;

  const playerTracks = new Map(); // id -> { hist, tier, score, gemScore }
  const asteroidTracks = new Map(); // id -> { hist, static }
  const gemTracks = new Map(); // id -> { hist, static }

  const asteroidObjectsById = new Map();
  const gemObjectsById = new Map();

  let asteroidIdsSorted = [];
  let gemIdsSorted = [];

  function attach({ room: nextRoom, localSessionId: nextLocalSessionId } = {}) {
    detach();
    room = nextRoom;
    localSessionId = String(nextLocalSessionId ?? "");
    if (!room) throw new Error("attach requires { room }");

    onStateChangeHandler = (schemaState) => ingest(schemaState);
    room.onStateChange(onStateChangeHandler);
  }

  function detach() {
    if (room && onStateChangeHandler && typeof room.onStateChange?.remove === "function") {
      room.onStateChange.remove(onStateChangeHandler);
    }
    room = null;
    onStateChangeHandler = null;

    latestSimTimeMs = 0;
    latestReceivedAtMs = 0;

    playerTracks.clear();
    asteroidTracks.clear();
    gemTracks.clear();
    asteroidObjectsById.clear();
    gemObjectsById.clear();
    asteroidIdsSorted = [];
    gemIdsSorted = [];
  }

  function isAttached() {
    return !!room;
  }

  function setLocalSessionId(nextId) {
    localSessionId = String(nextId ?? "");
  }

  function ingest(schemaState) {
    if (!schemaState) return;
    latestReceivedAtMs = nowMs();
    latestSimTimeMs = Number(schemaState.simTimeMs) || latestSimTimeMs || 0;
    const tick = Number(schemaState.tick) || 0;

    recvSamples.push({ receivedAtMs: latestReceivedAtMs, simTimeMs: latestSimTimeMs, tick });
    if (recvSamples.length > recvSampleCap) recvSamples.splice(0, recvSamples.length - recvSampleCap);

    // Players
    const seenPlayers = new Set();
    const players = schemaState.players;
    if (players && typeof players.forEach === "function") {
      players.forEach((p, id) => {
        const pid = String(p?.id ?? id ?? "");
        if (!pid) return;
        seenPlayers.add(pid);
        let track = playerTracks.get(pid);
        if (!track) {
          track = { hist: makeHistory(), tier: "small", score: 0, gemScore: 0 };
          playerTracks.set(pid, track);
        }
        const tier = shipTierKey(p?.tier);
        track.tier = tier;
        track.score = Number(p?.score) || 0;
        track.gemScore = Number(p?.gemScore) || 0;
        pushHistory(track.hist, {
          t: latestSimTimeMs,
          x: Number(p?.x) || 0,
          y: Number(p?.y) || 0,
          vx: Number(p?.vx) || 0,
          vy: Number(p?.vy) || 0,
          angle: Number(p?.angle) || 0,
        });
      });
    }
    for (const id of playerTracks.keys()) {
      if (!seenPlayers.has(id)) playerTracks.delete(id);
    }

    // Asteroids
    const seenAsteroids = new Set();
    const asteroids = schemaState.asteroids;
    if (asteroids && typeof asteroids.forEach === "function") {
      asteroids.forEach((a, id) => {
        const aid = String(a?.id ?? id ?? "");
        if (!aid) return;
        seenAsteroids.add(aid);
        let track = asteroidTracks.get(aid);
        if (!track) {
          track = {
            hist: makeHistory(),
            static: {
              id: aid,
              size: String(a?.size ?? "small"),
              radius: Number(a?.radius) || 0,
            },
          };
          asteroidTracks.set(aid, track);
        }
        track.static.size = String(a?.size ?? track.static.size ?? "small");
        track.static.radius = Number(a?.radius) || track.static.radius || 0;
        track.static.attachedTo = String(a?.attachedTo ?? "");
        track.static.pullOwnerId = String(a?.pullOwnerId ?? "");
        track.static.shipLaunched = Number(a?.shipLaunched) ? 1 : 0;
        pushHistory(track.hist, {
          t: latestSimTimeMs,
          x: Number(a?.x) || 0,
          y: Number(a?.y) || 0,
          vx: Number(a?.vx) || 0,
          vy: Number(a?.vy) || 0,
          rot: Number(a?.rot) || 0,
          rotVel: Number(a?.rotVel) || 0,
        });
      });
    }
    for (const id of asteroidTracks.keys()) {
      if (!seenAsteroids.has(id)) asteroidTracks.delete(id);
    }

    // Gems
    const seenGems = new Set();
    const gems = schemaState.gems;
    if (gems && typeof gems.forEach === "function") {
      gems.forEach((g, id) => {
        const gid = String(g?.id ?? id ?? "");
        if (!gid) return;
        seenGems.add(gid);
        let track = gemTracks.get(gid);
        if (!track) {
          track = {
            hist: makeHistory(),
            static: {
              id: gid,
              kind: String(g?.kind ?? ""),
              radius: Number(g?.radius) || 0,
            },
          };
          gemTracks.set(gid, track);
        }
        track.static.kind = String(g?.kind ?? track.static.kind ?? "");
        track.static.radius = Number(g?.radius) || track.static.radius || 0;
        pushHistory(track.hist, {
          t: latestSimTimeMs,
          x: Number(g?.x) || 0,
          y: Number(g?.y) || 0,
          vx: Number(g?.vx) || 0,
          vy: Number(g?.vy) || 0,
        });
      });
    }
    for (const id of gemTracks.keys()) {
      if (!seenGems.has(id)) gemTracks.delete(id);
    }

    // Cache stable order arrays for rendering (deterministic).
    asteroidIdsSorted = Array.from(asteroidTracks.keys()).sort();
    gemIdsSorted = Array.from(gemTracks.keys()).sort();
  }

  function computeRecvStats(atMs, windowMs = 2000) {
    const nTotal = recvSamples.length;
    if (nTotal < 2) return null;

    const now = Number(atMs) || nowMs();
    let start = nTotal - 1;
    while (start > 0 && now - recvSamples[start - 1].receivedAtMs <= windowMs) start--;
    const n = nTotal - start;
    if (n < 2) return null;

    const first = recvSamples[start];
    const last = recvSamples[nTotal - 1];
    const dtMs = last.receivedAtMs - first.receivedAtMs;
    if (!(dtMs > 0)) return null;

    let dtMinMs = Infinity;
    let dtMaxMs = 0;
    let prev = first.receivedAtMs;
    for (let i = start + 1; i < nTotal; i++) {
      const cur = recvSamples[i].receivedAtMs;
      const d = cur - prev;
      if (d < dtMinMs) dtMinMs = d;
      if (d > dtMaxMs) dtMaxMs = d;
      prev = cur;
    }

    const hz = ((n - 1) * 1000) / dtMs;
    const dtAvgMs = dtMs / (n - 1);
    const simSpeed = (last.simTimeMs - first.simTimeMs) / dtMs;
    const tickHz = ((last.tick - first.tick) * 1000) / dtMs;

    return { hz, dtAvgMs, dtMinMs, dtMaxMs, simSpeed, tickHz };
  }

  function ensureEnginePlayers() {
    if (!state.playersById || typeof state.playersById !== "object") state.playersById = Object.create(null);

    const ids = Array.from(playerTracks.keys()).sort();
    const allowed = new Set(ids);

    for (const id of sortedStringKeys(state.playersById)) {
      if (!allowed.has(id)) delete state.playersById[id];
    }

    for (const id of ids) {
      if (!state.playersById[id]) engine.addPlayer(id, { makeLocalIfFirst: false });
    }

    const local = localSessionId && state.playersById[localSessionId] ? localSessionId : ids[0] ?? "";
    state.localPlayerId = local;
  }

  function clampCameraToWorld() {
    const halfWorldW = state.world?.w ? state.world.w / 2 : 0;
    const halfWorldH = state.world?.h ? state.world.h / 2 : 0;
    const zoom = Math.max(0.1, state.camera?.zoom || 1);
    const halfViewW = (state.view?.w || 0) / (2 * zoom);
    const halfViewH = (state.view?.h || 0) / (2 * zoom);
    const minCamX = -halfWorldW + halfViewW;
    const maxCamX = halfWorldW - halfViewW;
    const minCamY = -halfWorldH + halfViewH;
    const maxCamY = halfWorldH - halfViewH;

    if (minCamX <= maxCamX) state.camera.x = clamp(state.camera.x, minCamX, maxCamX);
    else state.camera.x = 0;
    if (minCamY <= maxCamY) state.camera.y = clamp(state.camera.y, minCamY, maxCamY);
    else state.camera.y = 0;
  }

  function applyInterpolatedState({ atMs = nowMs(), delayMs = interpolationDelayMs } = {}) {
    if (!latestSimTimeMs) return false;
    ensureEnginePlayers();

    const targetSimTime = latestSimTimeMs - clamp(Number(delayMs) || 0, 0, 500);
    const recvStats = computeRecvStats(atMs, 2000);

    // Players
    for (const [id, track] of playerTracks) {
      const player = state.playersById[id];
      if (!player?.ship) continue;

      const span = pickSpan(track.hist, targetSimTime);
      if (!span) continue;
      const { p0, p1, t } = span;

      const ship = player.ship;
      ship.pos.x = lerp(p0.x, p1.x, t);
      ship.pos.y = lerp(p0.y, p1.y, t);
      ship.vel.x = lerp(p0.vx, p1.vx, t);
      ship.vel.y = lerp(p0.vy, p1.vy, t);
      ship.angle = lerpAngle(p0.angle, p1.angle, t);

      const tierKey = shipTierKey(track.tier);
      const tier = SHIP_TIERS[tierKey] || SHIP_TIERS.small;
      ship.tier = tierKey;
      ship.radius = Number(tier.radius) || ship.radius || 14;
      ship.mass = Number(tier.mass) || ship.mass || 1;
      ship.escapeScale = 1;

      player.score = track.score;
      if (!player.progression) player.progression = { gemScore: 0, currentTier: tierKey, tierShiftT: 0 };
      player.progression.gemScore = track.gemScore;
      player.progression.currentTier = tierKey;
    }

    // Follow local player camera (centered for now).
    const localPlayer = state.playersById[state.localPlayerId];
    if (localPlayer?.ship && state.camera) {
      state.camera.x = localPlayer.ship.pos.x;
      state.camera.y = localPlayer.ship.pos.y;
      clampCameraToWorld();
    }

    // Asteroids (array + objects)
    if (!Array.isArray(state.asteroids)) state.asteroids = [];
    state.asteroids.length = 0;
    for (const id of asteroidIdsSorted) {
      const track = asteroidTracks.get(id);
      if (!track) continue;
      let obj = asteroidObjectsById.get(id);
      if (!obj) {
        obj = {
          id,
          size: track.static.size,
          pos: vec(0, 0),
          vel: vec(0, 0),
          radius: track.static.radius,
          mass: 1,
          rot: 0,
          rotVel: 0,
          shape: null,
          attached: false,
          attachedTo: null,
          shipLaunched: false,
          pullOwnerId: null,
          orbitA: 0,
          fractureCooldownT: 0,
          fractureDamage: 0,
          hitFxT: 0,
          starBurnSec: 0,
          techPartId: null,
        };
        asteroidObjectsById.set(id, obj);
      }

      const span = pickSpan(track.hist, targetSimTime);
      if (!span) continue;
      const { p0, p1, t } = span;

      obj.size = track.static.size;
      obj.radius = track.static.radius;
      obj.pos.x = lerp(p0.x, p1.x, t);
      obj.pos.y = lerp(p0.y, p1.y, t);
      obj.vel.x = lerp(p0.vx, p1.vx, t);
      obj.vel.y = lerp(p0.vy, p1.vy, t);
      obj.rot = lerpAngle(p0.rot, p1.rot, t);
      obj.rotVel = lerp(p0.rotVel, p1.rotVel, t);
      obj.attachedTo = track.static.attachedTo ? track.static.attachedTo : null;
      obj.attached = !!obj.attachedTo;
      obj.pullOwnerId = track.static.pullOwnerId ? track.static.pullOwnerId : null;
      obj.shipLaunched = !!track.static.shipLaunched;

      state.asteroids.push(obj);
    }

    // Gems
    if (!Array.isArray(state.gems)) state.gems = [];
    state.gems.length = 0;
    for (const id of gemIdsSorted) {
      const track = gemTracks.get(id);
      if (!track) continue;
      let obj = gemObjectsById.get(id);
      if (!obj) {
        obj = {
          id,
          kind: track.static.kind,
          pos: vec(0, 0),
          vel: vec(0, 0),
          radius: track.static.radius,
          spin: 0,
          spinVel: 0,
          ageSec: 0,
          ttlSec: 999,
          pulsePhase: 0,
          pulseAlpha: 1,
        };
        gemObjectsById.set(id, obj);
      }
      const span = pickSpan(track.hist, targetSimTime);
      if (!span) continue;
      const { p0, p1, t } = span;
      obj.kind = track.static.kind;
      obj.radius = track.static.radius;
      obj.pos.x = lerp(p0.x, p1.x, t);
      obj.pos.y = lerp(p0.y, p1.y, t);
      obj.vel.x = lerp(p0.vx, p1.vx, t);
      obj.vel.y = lerp(p0.vy, p1.vy, t);
      state.gems.push(obj);
    }

    // Expose some timing on state for HUD/debug if needed.
    state.time = targetSimTime / 1000;
    state._mp = {
      connected: true,
      latestSimTimeMs,
      latestReceivedAtMs,
      latestAgeMs: Math.max(0, Number(atMs) - latestReceivedAtMs),
      interpDelayMs: delayMs,
      asteroidCount: state.asteroids.length,
      gemCount: state.gems.length,
      playerCount: playerTracks.size,
      snapshotHz: recvStats ? recvStats.hz : 0,
      snapshotDtAvgMs: recvStats ? recvStats.dtAvgMs : null,
      snapshotDtMinMs: recvStats ? recvStats.dtMinMs : null,
      snapshotDtMaxMs: recvStats ? recvStats.dtMaxMs : null,
      serverSimSpeed: recvStats ? recvStats.simSpeed : null, // 1.0 ~= real-time sim
      serverTickHz: recvStats ? recvStats.tickHz : null, // ~=60Hz when sim keeps up
    };
    return true;
  }

  return {
    attach,
    detach,
    isAttached,
    setLocalSessionId,
    ingest,
    applyInterpolatedState,
    getDebug: () => ({
      localSessionId,
      latestSimTimeMs,
      latestReceivedAtMs,
      players: playerTracks.size,
      asteroids: asteroidTracks.size,
      gems: gemTracks.size,
    }),
  };
}
