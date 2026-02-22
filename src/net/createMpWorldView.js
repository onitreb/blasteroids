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

function rotate2(x, y, ang) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return { x: x * c - y * s, y: x * s + y * c };
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

  const playerTracks = new Map(); // id -> { hist, tier, score, gemScore, paletteIdx, lastProcessedInputSeq }
  const asteroidTracks = new Map(); // id -> { hist, static }
  const gemTracks = new Map(); // id -> { hist, static }

  const asteroidObjectsById = new Map();
  const gemObjectsById = new Map();
  const techPartTracks = new Map(); // id -> { hist, static }
  const techPartObjectsById = new Map();

  let asteroidIdsSorted = [];
  let gemIdsSorted = [];
  let techPartIdsSorted = [];

  let roundSnapshot = null; // latest non-interpolated round fields (duration/elapsed/escape, gate slots, etc.)
  let starTrack = null; // { hist, static, present }
  let gateSnapshot = null; // non-interpolated (small) gate snapshot for slots/charge/active
  let saucerTrack = null; // { hist, static }
  const saucerLaserTracks = new Map(); // id -> { hist, static }
  const saucerLaserObjectsById = new Map();
  let saucerLaserIdsSorted = [];

  function attach({ room: nextRoom, localSessionId: nextLocalSessionId } = {}) {
    detach();
    room = nextRoom;
    localSessionId = String(nextLocalSessionId ?? "");
    if (!room) throw new Error("attach requires { room }");

    onStateChangeHandler = (schemaState) => ingest(schemaState);
    room.onStateChange(onStateChangeHandler);
    // If the room already has a current state (e.g. first patch arrived before we attached),
    // ingest it immediately so interpolation/prediction can seed without waiting for the next patch.
    try {
      if (room.state) ingest(room.state);
    } catch {
      // ignore
    }
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
    techPartTracks.clear();
    asteroidObjectsById.clear();
    gemObjectsById.clear();
    techPartObjectsById.clear();
    asteroidIdsSorted = [];
    gemIdsSorted = [];
    techPartIdsSorted = [];
    roundSnapshot = null;
    starTrack = null;
    gateSnapshot = null;
    saucerTrack = null;
    saucerLaserTracks.clear();
    saucerLaserObjectsById.clear();
    saucerLaserIdsSorted = [];
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
          track = { hist: makeHistory(), tier: "small", score: 0, gemScore: 0, paletteIdx: null, lastProcessedInputSeq: 0 };
          playerTracks.set(pid, track);
        }
        const tier = shipTierKey(p?.tier);
        track.tier = tier;
        track.score = Number(p?.score) || 0;
        track.gemScore = Number(p?.gemScore) || 0;
        const paletteRaw = Number(p?.paletteIdx);
        track.paletteIdx = Number.isFinite(paletteRaw) && paletteRaw >= 0 ? (paletteRaw | 0) : null;
        track.lastProcessedInputSeq = (Number(p?.lastProcessedInputSeq) | 0) || 0;
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

    // Saucer + lasers (gameplay entities; no wrap)
    const saucer = schemaState.saucer && typeof schemaState.saucer === "object" ? schemaState.saucer : null;
    const saucerPresent = !!(saucer && Number(saucer.present));
    if (!saucerPresent) {
      saucerTrack = null;
    } else {
      if (!saucerTrack) saucerTrack = { hist: makeHistory(), static: { id: "", radius: 0 } };
      saucerTrack.static.id = String(saucer.id ?? "");
      saucerTrack.static.radius = Number(saucer.radius) || saucerTrack.static.radius || 0;
      pushHistory(saucerTrack.hist, {
        t: latestSimTimeMs,
        x: Number(saucer.x) || 0,
        y: Number(saucer.y) || 0,
        vx: Number(saucer.vx) || 0,
        vy: Number(saucer.vy) || 0,
      });
    }

    const seenLasers = new Set();
    const lasers = schemaState.saucerLasers;
    if (lasers && typeof lasers.forEach === "function") {
      lasers.forEach((b, id) => {
        const lid = String(b?.id ?? id ?? "");
        if (!lid) return;
        seenLasers.add(lid);
        let track = saucerLaserTracks.get(lid);
        if (!track) {
          track = { hist: makeHistory(), static: { id: lid, radius: 0, bornAtSec: 0 } };
          saucerLaserTracks.set(lid, track);
        }
        track.static.radius = Number(b?.radius) || track.static.radius || 0;
        track.static.bornAtSec = Number(b?.bornAtSec) || 0;
        pushHistory(track.hist, {
          t: latestSimTimeMs,
          x: Number(b?.x) || 0,
          y: Number(b?.y) || 0,
          vx: Number(b?.vx) || 0,
          vy: Number(b?.vy) || 0,
          ageSec: Number(b?.ageSec) || 0,
        });
      });
    }
    for (const id of saucerLaserTracks.keys()) {
      if (!seenLasers.has(id)) {
        saucerLaserTracks.delete(id);
        saucerLaserObjectsById.delete(id);
      }
    }
    saucerLaserIdsSorted = Array.from(saucerLaserTracks.keys()).sort();

    // Cache stable order arrays for rendering (deterministic).
    asteroidIdsSorted = Array.from(asteroidTracks.keys()).sort();
    gemIdsSorted = Array.from(gemTracks.keys()).sort();

    // Round loop (star/gate/tech parts)
    const round = schemaState.round && typeof schemaState.round === "object" ? schemaState.round : null;
    if (!round) {
      roundSnapshot = null;
      starTrack = null;
      gateSnapshot = null;
      techPartTracks.clear();
      techPartIdsSorted = [];
      return;
    }

    roundSnapshot = {
      durationSec: Number(round.durationSec) || 0,
      elapsedSec: Number(round.elapsedSec) || 0,
      carriedPartId: String(round.carriedPartId ?? ""),
      escapeActive: !!Number(round.escapeActive),
    };

    // Star (scalar interpolation via history)
    const star = round.star && typeof round.star === "object" ? round.star : null;
    const starPresent = !!(star && Number(star.present));
    if (!starPresent) {
      starTrack = null;
    } else {
      if (!starTrack) starTrack = { hist: makeHistory(), static: {} };
      starTrack.static.edge = String(star.edge ?? "");
      starTrack.static.axis = String(star.axis ?? "");
      starTrack.static.dir = Number(star.dir) || 0;
      pushHistory(starTrack.hist, {
        t: latestSimTimeMs,
        boundary: Number(star.boundary) || 0,
        prog: Number(star.t) || 0,
      });
    }

    // Gate (mostly static; position is interpolated like other entities)
    const gate = round.gate && typeof round.gate === "object" ? round.gate : null;
    const gatePresent = !!(gate && Number(gate.present));
    const slots = [];
    if (gatePresent) {
      const rawSlots = gate?.slots;
      const n = rawSlots && typeof rawSlots.length === "number" ? Math.max(0, rawSlots.length | 0) : 0;
      for (let i = 0; i < n; i++) slots.push(String(rawSlots[i] ?? ""));
    }
    gateSnapshot = gatePresent
      ? {
          id: String(gate.id ?? ""),
          edge: String(gate.edge ?? ""),
          x: Number(gate.x) || 0,
          y: Number(gate.y) || 0,
          radius: Number(gate.radius) || 0,
          active: !!Number(gate.active),
          chargeSec: Number(gate.chargeSec) || 0,
          chargeElapsedSec:
            gate.chargeElapsedSec != null && Number.isFinite(Number(gate.chargeElapsedSec)) && Number(gate.chargeElapsedSec) >= 0
              ? Number(gate.chargeElapsedSec) || 0
              : null,
          slots,
        }
      : null;

    // Tech parts (entity interpolation)
    const seenParts = new Set();
    const parts = round.techParts;
    if (parts && typeof parts.length === "number") {
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (!p) continue;
        const pid = String(p.id ?? "");
        if (!pid) continue;
        seenParts.add(pid);
        let track = techPartTracks.get(pid);
        if (!track) {
          track = {
            hist: makeHistory(),
            static: {
              id: pid,
              state: "",
              radius: 0,
              containerAsteroidId: "",
              carrierPlayerId: "",
              installedSlot: -1,
              respawnCount: 0,
            },
          };
          techPartTracks.set(pid, track);
        }
        track.static.state = String(p.state ?? "");
        track.static.radius = Number(p.radius) || track.static.radius || 0;
        track.static.containerAsteroidId = String(p.containerAsteroidId ?? "");
        track.static.carrierPlayerId = String(p.carrierPlayerId ?? "");
        track.static.installedSlot = Number.isFinite(Number(p.installedSlot)) ? (Number(p.installedSlot) | 0) : -1;
        track.static.respawnCount = Number(p.respawnCount) || 0;
        pushHistory(track.hist, {
          t: latestSimTimeMs,
          x: Number(p.x) || 0,
          y: Number(p.y) || 0,
          vx: Number(p.vx) || 0,
          vy: Number(p.vy) || 0,
        });
      }
    }
    for (const id of techPartTracks.keys()) {
      if (!seenParts.has(id)) techPartTracks.delete(id);
    }
    techPartIdsSorted = Array.from(techPartTracks.keys()).sort();
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

  function estimateRemoteSimTimeMs({ atMs, recvStats } = {}) {
    if (!latestSimTimeMs) return 0;
    const now = Number.isFinite(Number(atMs)) ? Number(atMs) : nowMs();
    const ageMsRaw = now - (Number(latestReceivedAtMs) || 0);
    const ageMs = clamp(ageMsRaw, 0, 250); // prevent runaway on tab stalls
    const speed = recvStats && Number.isFinite(recvStats.simSpeed) ? recvStats.simSpeed : 1;
    const remote = latestSimTimeMs + ageMs * clamp(speed, 0, 2);
    // allow a small lead so render time stays behind even at low patch rates
    return Math.min(latestSimTimeMs + 250, remote);
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

  function applyInterpolatedState({ atMs = nowMs(), delayMs = interpolationDelayMs, skipLocalPlayerPose = false } = {}) {
    if (!latestSimTimeMs) return false;
    ensureEnginePlayers();

    const recvStats = computeRecvStats(atMs, 2000);
    const remoteSimTimeMs = estimateRemoteSimTimeMs({ atMs, recvStats });
    const targetSimTime = remoteSimTimeMs - clamp(Number(delayMs) || 0, 0, 500);

    let localAuthPose = null;

    // Players
    for (const [id, track] of playerTracks) {
      const player = state.playersById[id];
      if (!player?.ship) continue;

      const span = pickSpan(track.hist, targetSimTime);
      if (!span) continue;
      const { p0, p1, t } = span;

      const authX = lerp(p0.x, p1.x, t);
      const authY = lerp(p0.y, p1.y, t);
      const authVx = lerp(p0.vx, p1.vx, t);
      const authVy = lerp(p0.vy, p1.vy, t);
      const authAngle = lerpAngle(p0.angle, p1.angle, t);

      const ship = player.ship;
      const isLocal = skipLocalPlayerPose && id === state.localPlayerId;
      if (!isLocal) {
        ship.pos.x = authX;
        ship.pos.y = authY;
        ship.vel.x = authVx;
        ship.vel.y = authVy;
        ship.angle = authAngle;
      } else {
        localAuthPose = { x: authX, y: authY, vx: authVx, vy: authVy, angle: authAngle };
      }

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
      player.paletteIdx = track.paletteIdx;
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

    // If we are predicting the local ship pose, visually re-anchor any *locally attached* entities
    // so they don't appear "stuck in world-space" relative to the predicted ship.
    if (skipLocalPlayerPose && localAuthPose) {
      const localId = state.localPlayerId;
      const localPlayer = localId ? state.playersById?.[localId] : null;
      const ship = localPlayer?.ship;
      if (ship) {
        const dx = (Number(ship.pos?.x) || 0) - localAuthPose.x;
        const dy = (Number(ship.pos?.y) || 0) - localAuthPose.y;
        const dPos = Math.hypot(dx, dy);
        const dAng = wrapAngle((Number(ship.angle) || 0) - localAuthPose.angle);

        // Always visually re-anchor local attachments while prediction is active. If prediction diverges badly,
        // showing the attachments "stuck in world-space" is worse UX than keeping them locked to the ship.
        if (dPos < 50_000 && Math.abs(dAng) < Math.PI * 4) {
          const dvx = (Number(ship.vel?.x) || 0) - localAuthPose.vx;
          const dvy = (Number(ship.vel?.y) || 0) - localAuthPose.vy;

          for (let i = 0; i < state.asteroids.length; i++) {
            const a = state.asteroids[i];
            if (!a?.attached || a.attachedTo !== localId) continue;
            const rx = (Number(a.pos?.x) || 0) - localAuthPose.x;
            const ry = (Number(a.pos?.y) || 0) - localAuthPose.y;
            const r = rotate2(rx, ry, dAng);
            a.pos.x = (Number(ship.pos?.x) || 0) + r.x;
            a.pos.y = (Number(ship.pos?.y) || 0) + r.y;
            a.vel.x = (Number(a.vel?.x) || 0) + dvx;
            a.vel.y = (Number(a.vel?.y) || 0) + dvy;
          }

          // Carried tech part(s): keep them visually attached to the predicted ship too.
          const parts = state.round?.techParts;
          if (Array.isArray(parts)) {
            for (let i = 0; i < parts.length; i++) {
              const p = parts[i];
              if (!p) continue;
              if (p.state !== "carried") continue;
              if (p.carrierPlayerId !== localId) continue;
              const rx = (Number(p.pos?.x) || 0) - localAuthPose.x;
              const ry = (Number(p.pos?.y) || 0) - localAuthPose.y;
              const r = rotate2(rx, ry, dAng);
              p.pos.x = (Number(ship.pos?.x) || 0) + r.x;
              p.pos.y = (Number(ship.pos?.y) || 0) + r.y;
              p.vel.x = (Number(p.vel?.x) || 0) + dvx;
              p.vel.y = (Number(p.vel?.y) || 0) + dvy;
            }
          }
        }
      }
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

    // Saucer (interpolated)
    if (saucerTrack && saucerTrack.hist) {
      const span = pickSpan(saucerTrack.hist, targetSimTime);
      if (span) {
        const { p0, p1, t } = span;
        if (!state.saucer) {
          state.saucer = {
            id: saucerTrack.static.id || "saucer-0",
            pos: vec(0, 0),
            vel: vec(0, 0),
            radius: saucerTrack.static.radius || 0,
          };
        }
        const s = state.saucer;
        s.id = saucerTrack.static.id || s.id || "saucer-0";
        if (!s.pos) s.pos = vec(0, 0);
        if (!s.vel) s.vel = vec(0, 0);
        s.radius = saucerTrack.static.radius || s.radius || 0;
        s.pos.x = lerp(p0.x, p1.x, t);
        s.pos.y = lerp(p0.y, p1.y, t);
        s.vel.x = lerp(p0.vx, p1.vx, t);
        s.vel.y = lerp(p0.vy, p1.vy, t);
      } else {
        state.saucer = null;
      }
    } else {
      state.saucer = null;
    }

    // Saucer lasers (interpolated)
    if (!Array.isArray(state.saucerLasers)) state.saucerLasers = [];
    state.saucerLasers.length = 0;
    for (const id of saucerLaserIdsSorted) {
      const track = saucerLaserTracks.get(id);
      if (!track) continue;
      const span = pickSpan(track.hist, targetSimTime);
      if (!span) continue;
      const { p0, p1, t } = span;

      let obj = saucerLaserObjectsById.get(id);
      if (!obj) {
        obj = {
          id,
          pos: vec(0, 0),
          vel: vec(0, 0),
          radius: track.static.radius || 0,
          ageSec: 0,
          bornAtSec: track.static.bornAtSec || 0,
        };
        saucerLaserObjectsById.set(id, obj);
      }

      obj.radius = track.static.radius || obj.radius || 0;
      obj.bornAtSec = track.static.bornAtSec || 0;
      obj.pos.x = lerp(p0.x, p1.x, t);
      obj.pos.y = lerp(p0.y, p1.y, t);
      obj.vel.x = lerp(p0.vx, p1.vx, t);
      obj.vel.y = lerp(p0.vy, p1.vy, t);
      obj.ageSec = lerp(Number(p0.ageSec) || 0, Number(p1.ageSec) || 0, t);

      state.saucerLasers.push(obj);
    }

    // Expose some timing on state for HUD/debug if needed.
    state.time = targetSimTime / 1000;

    // Round loop state (derived from Schema)
    if (!state.round || typeof state.round !== "object") {
      state.round = {
        durationSec: 0,
        elapsedSec: 0,
        outcome: null,
        star: null,
        gate: null,
        techParts: [],
        carriedPartId: null,
        techPing: null,
        techPingCooldownSec: 0,
        starExposureSec: 0,
        escape: null,
      };
    }
    if (roundSnapshot) {
      state.round.durationSec = roundSnapshot.durationSec;
      state.round.elapsedSec = roundSnapshot.elapsedSec;
      state.round.carriedPartId = roundSnapshot.carriedPartId || null;
      state.round.escape = roundSnapshot.escapeActive ? { active: true } : null;
    } else {
      state.round.durationSec = 0;
      state.round.elapsedSec = 0;
      state.round.carriedPartId = null;
      state.round.escape = null;
    }

    // Star (interpolate boundary)
    if (starTrack && starTrack.hist) {
      const span = pickSpan(starTrack.hist, targetSimTime);
      if (span) {
        const { p0, p1, t } = span;
        const boundary = lerp(Number(p0.boundary) || 0, Number(p1.boundary) || 0, t);
        const prog = lerp(Number(p0.prog) || 0, Number(p1.prog) || 0, t);
        if (!state.round.star) state.round.star = { id: "red-giant-0" };
        state.round.star.edge = starTrack.static.edge;
        state.round.star.axis = starTrack.static.axis;
        state.round.star.dir = starTrack.static.dir;
        state.round.star.boundary = boundary;
        state.round.star.t = prog;
      }
    } else {
      state.round.star = null;
    }

    // Gate (no interpolation needed, but keep shape stable)
    if (gateSnapshot) {
      if (!state.round.gate) state.round.gate = { id: gateSnapshot.id || "jump-gate-0", pos: vec(0, 0), slots: [] };
      const g = state.round.gate;
      g.id = gateSnapshot.id || "jump-gate-0";
      g.edge = gateSnapshot.edge;
      if (!g.pos) g.pos = vec(0, 0);
      g.pos.x = gateSnapshot.x;
      g.pos.y = gateSnapshot.y;
      g.radius = gateSnapshot.radius;
      g.active = !!gateSnapshot.active;
      g.chargeSec = gateSnapshot.chargeSec;
      g.chargeElapsedSec = gateSnapshot.chargeElapsedSec;
      const rawSlots = Array.isArray(gateSnapshot.slots) ? gateSnapshot.slots : [];
      if (!Array.isArray(g.slots)) g.slots = [];
      g.slots.length = rawSlots.length;
      for (let i = 0; i < rawSlots.length; i++) g.slots[i] = rawSlots[i] ? rawSlots[i] : null;
    } else {
      state.round.gate = null;
    }

    // Tech parts (interpolated)
    if (!Array.isArray(state.round.techParts)) state.round.techParts = [];
    state.round.techParts.length = 0;
    for (const id of techPartIdsSorted) {
      const track = techPartTracks.get(id);
      if (!track) continue;
      const span = pickSpan(track.hist, targetSimTime);
      if (!span) continue;
      const { p0, p1, t } = span;

      let obj = techPartObjectsById.get(id);
      if (!obj) {
        obj = {
          id,
          state: track.static.state,
          pos: vec(0, 0),
          vel: vec(0, 0),
          radius: track.static.radius,
          containerAsteroidId: null,
          installedSlot: null,
          respawnCount: 0,
          carrierPlayerId: null,
        };
        techPartObjectsById.set(id, obj);
      }

      obj.state = track.static.state;
      obj.radius = track.static.radius;
      obj.pos.x = lerp(p0.x, p1.x, t);
      obj.pos.y = lerp(p0.y, p1.y, t);
      obj.vel.x = lerp(p0.vx, p1.vx, t);
      obj.vel.y = lerp(p0.vy, p1.vy, t);
      obj.containerAsteroidId = track.static.containerAsteroidId ? track.static.containerAsteroidId : null;
      obj.carrierPlayerId = track.static.carrierPlayerId ? track.static.carrierPlayerId : null;
      obj.installedSlot = track.static.installedSlot >= 0 ? track.static.installedSlot : null;
      obj.respawnCount = track.static.respawnCount | 0;

      state.round.techParts.push(obj);
    }

    const net = state._mpNet && typeof state._mpNet === "object" ? state._mpNet : null;
    state._mp = {
      connected: true,
      latestSimTimeMs,
      latestReceivedAtMs,
      latestAgeMs: Math.max(0, Number(atMs) - latestReceivedAtMs),
      remoteSimTimeMs,
      renderSimTimeMs: targetSimTime,
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
      rxBps: net && Number.isFinite(Number(net.rxBps)) ? Number(net.rxBps) : null,
      txBps: net && Number.isFinite(Number(net.txBps)) ? Number(net.txBps) : null,
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
    getLatestPlayerSample: (id) => {
      const pid = String(id ?? "");
      const track = playerTracks.get(pid);
      const c = track?.hist?.c;
      if (!track || !c) return null;
      return {
        ...c,
        tier: track.tier,
        score: track.score,
        gemScore: track.gemScore,
        paletteIdx: track.paletteIdx,
        lastProcessedInputSeq: (Number(track.lastProcessedInputSeq) | 0) || 0,
      };
    },
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
