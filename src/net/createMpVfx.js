import { clamp, lerp } from "../util/math.js";
import { vec } from "../util/vec2.js";
import { polygonHullRadius } from "../util/ship.js";
import { SHIP_TIERS } from "../engine/createEngine.js";

function shipTierByKey(key) {
  return SHIP_TIERS[key] || SHIP_TIERS.small;
}

function nowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
  return Date.now();
}

function xorshift32(seed) {
  let s = (seed >>> 0) || 0x12345678;
  s ^= s << 13;
  s >>>= 0;
  s ^= s >> 17;
  s >>>= 0;
  s ^= s << 5;
  s >>>= 0;
  return s >>> 0;
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

function makeRng(seedU32) {
  let s = (seedU32 >>> 0) || 0x12345678;
  return () => {
    s = xorshift32(s);
    return s / 0xffffffff;
  };
}

function exhaustShipScaleAndMirror(tier, ship) {
  const renderer = tier?.renderer || {};
  const shipRadius = Math.max(1, Number(ship?.radius) || Number(tier?.radius) || 1);
  if (renderer.type === "svg") {
    const baseScale = Number.isFinite(Number(renderer.svgScale)) ? Number(renderer.svgScale) : 1;
    const explicitHullRadius = Number(renderer.hullRadius);
    const autoScale = Number.isFinite(explicitHullRadius) && explicitHullRadius > 0 ? shipRadius / explicitHullRadius : 1;
    return { scale: baseScale * autoScale, mirrorX: renderer.mirrorX === true };
  }
  const points = Array.isArray(renderer.points) ? renderer.points : null;
  const hullRadius = points ? polygonHullRadius(points) : 0;
  const drawScale = hullRadius > 1e-6 ? shipRadius / hullRadius : 1;
  return { scale: drawScale, mirrorX: false };
}

function techPingMaxRadiusFromState(state) {
  const halfW = Number(state?.world?.w) ? state.world.w / 2 : 0;
  const halfH = Number(state?.world?.h) ? state.world.h / 2 : 0;
  return Math.sqrt(halfW * halfW + halfH * halfH) * 1.3;
}

function ensureEffectArrays(state) {
  if (!Array.isArray(state.effects)) state.effects = [];
  if (!Array.isArray(state.exhaust)) state.exhaust = [];
}

function stepEffects(state, dt) {
  if (!Array.isArray(state.effects) || state.effects.length === 0) return;
  let w = 0;
  for (let i = 0; i < state.effects.length; i++) {
    const e = state.effects[i];
    if (!e) continue;
    e.t = (Number(e.t) || 0) + dt;
    const ttl = Math.max(1e-6, Number(e.ttl) || 0.001);
    if (e.t < ttl) state.effects[w++] = e;
  }
  state.effects.length = w;
}

function stepExhaust(state, dt) {
  if (!Array.isArray(state.exhaust) || state.exhaust.length === 0) return;
  let w = 0;
  for (let i = 0; i < state.exhaust.length; i++) {
    const p = state.exhaust[i];
    if (!p) continue;
    p.age = (Number(p.age) || 0) + dt;
    const ttl = Math.max(1e-6, Number(p.ttl) || 0.001);
    if (p.age >= ttl) continue;

    const drag = p.kind === "spark" ? 3.8 : 2.4;
    const damp = Math.exp(-drag * dt);
    if (!p.vel) p.vel = vec(0, 0);
    if (!p.pos) p.pos = vec(0, 0);
    p.vel.x *= damp;
    p.vel.y *= damp;
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;
    state.exhaust[w++] = p;
  }
  state.exhaust.length = w;
}

function spawnExplosion(state, rng, pos, { rgb = [255, 255, 255], kind = "pop", r0 = 6, r1 = 26, ttl = 0.22 } = {}) {
  state.effects.push({
    kind,
    x: pos.x,
    y: pos.y,
    t: 0,
    ttl,
    r0,
    r1,
    rgb,
    seed: Math.floor(rng() * 1e9),
  });
}

function spawnBurstWavelets(state, rng, { pos, angle, speed, ttl = 0.55 * 1.1, rgb = [255, 221, 88] }) {
  state.effects.push({
    kind: "wavelets",
    x: pos.x,
    y: pos.y,
    angle,
    speed,
    t: 0,
    ttl,
    rgb,
    seed: Math.floor(rng() * 1e9),
  });
}

function spawnExhaustParticle(state, kind, x, y, vx, vy, { ttl, r, seed }) {
  state.exhaust.push({
    kind,
    pos: vec(x, y),
    vel: vec(vx, vy),
    age: 0,
    ttl,
    r,
    seed,
  });
}

export function createMpVfx({ engine } = {}) {
  if (!engine || !engine.state) throw new Error("createMpVfx requires { engine }");
  const state = engine.state;

  const motionById = new Map(); // id -> { vx, vy, thrusting }
  const rngById = new Map(); // id -> () => [0,1)
  const pingAsteroids = new Set();
  const pingParts = new Set();
  const prevAsteroidById = new Map(); // id -> { attachedTo, shipLaunched, x, y, size }
  const lastBurstFxAtMsByPlayerId = new Map(); // id -> ms
  const prevGemById = new Map(); // id -> { x, y, kind }
  const prevTechPartById = new Map(); // id -> { state, x, y }
  const prevSaucer = { present: false, x: 0, y: 0 };
  let ignoreEventsUntilMs = 0;

  const fxRng = makeRng(0x51a7f00d);
  let lastUpdateAtMs = 0;
  let lastBurst = false;
  let lastPing = false;

  function reset() {
    motionById.clear();
    rngById.clear();
    pingAsteroids.clear();
    pingParts.clear();
    prevAsteroidById.clear();
    lastBurstFxAtMsByPlayerId.clear();
    prevGemById.clear();
    prevTechPartById.clear();
    prevSaucer.present = false;
    prevSaucer.x = 0;
    prevSaucer.y = 0;
    ignoreEventsUntilMs = 0;
    lastUpdateAtMs = 0;
    lastBurst = false;
    lastPing = false;
  }

  function ensurePlayerMotion(id) {
    const pid = String(id ?? "");
    let m = motionById.get(pid);
    if (!m) {
      m = { vx: 0, vy: 0, thrusting: false };
      motionById.set(pid, m);
    }
    return m;
  }

  function ensurePlayerRng(id) {
    const pid = String(id ?? "");
    let r = rngById.get(pid);
    if (!r) {
      r = makeRng(hashStringToU32(`mpvfx:${pid}`) ^ 0x9e3779b9);
      rngById.set(pid, r);
    }
    return r;
  }

  function updateTechPing({ dt, pingPressed }) {
    // Decay any prior highlights even if a ping isn't currently active.
    for (const a of pingAsteroids) {
      if (!a) {
        pingAsteroids.delete(a);
        continue;
      }
      const next = Math.max(0, (Number(a.techPingFxT) || 0) - dt);
      if (next <= 1e-4) {
        a.techPingFxT = 0;
        pingAsteroids.delete(a);
      } else {
        a.techPingFxT = next;
      }
    }
    for (const p of pingParts) {
      if (!p) {
        pingParts.delete(p);
        continue;
      }
      const next = Math.max(0, (Number(p.techPingFxT) || 0) - dt);
      if (next <= 1e-4) {
        p.techPingFxT = 0;
        pingParts.delete(p);
      } else {
        p.techPingFxT = next;
      }
    }

    if (state.mode !== "playing") {
      if (state.round && typeof state.round === "object") {
        state.round.techPing = null;
        state.round.techPingCooldownSec = 0;
      }
      return;
    }

    if (!state.round || typeof state.round !== "object") return;
    state.round.techPingCooldownSec = Math.max(0, (Number(state.round.techPingCooldownSec) || 0) - dt);

    const localId = String(state.localPlayerId ?? "");
    const ship = state.playersById?.[localId]?.ship || null;
    if (pingPressed && ship && (Number(state.round.techPingCooldownSec) || 0) <= 0.001) {
      const speed = clamp(Number(state.params?.techPingSpeedPxPerSec ?? 2400), 200, 20000);
      state.round.techPing = {
        origin: vec(Number(ship.pos?.x) || 0, Number(ship.pos?.y) || 0),
        radius: 0,
        prevRadius: 0,
        speed,
        maxRadius: techPingMaxRadiusFromState(state),
      };
      state.round.techPingCooldownSec = clamp(Number(state.params?.techPingCooldownSec ?? 3), 0, 60);
    }

    const ping = state.round.techPing;
    if (!ping) return;
    const origin = ping.origin || vec(0, 0);
    const prevR = Math.max(0, Number(ping.radius) || 0);
    const nextR = prevR + Math.max(0, Number(ping.speed) || 0) * dt;
    ping.prevRadius = prevR;
    ping.radius = nextR;

    const thickness = clamp(Number(state.params?.techPingThicknessPx ?? 22), 4, 240);
    const glowSec = clamp(Number(state.params?.techPingGlowSec ?? 8), 0.25, 30);

    // Tech parts: use Schema-provided containerAsteroidId to highlight only relevant asteroids (avoid full scans).
    const parts = Array.isArray(state.round.techParts) ? state.round.techParts : [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      const px = Number(part.pos?.x);
      const py = Number(part.pos?.y);
      if (Number.isFinite(px) && Number.isFinite(py) && (part.state === "dropped" || part.state === "carried")) {
        const dx = px - origin.x;
        const dy = py - origin.y;
        const dist = Math.hypot(dx, dy);
        const pad = (Number(part.radius) || 0) + thickness;
        if (dist >= prevR - pad && dist <= nextR + pad) {
          part.techPingFxT = glowSec;
          pingParts.add(part);
        }
      }

      if (part.state !== "in_asteroid") continue;
      const aid = String(part.containerAsteroidId ?? "");
      if (!aid) continue;
      for (let j = 0; j < (state.asteroids?.length || 0); j++) {
        const a = state.asteroids[j];
        if (!a || String(a.id ?? "") !== aid) continue;
        const dx = (Number(a.pos?.x) || 0) - origin.x;
        const dy = (Number(a.pos?.y) || 0) - origin.y;
        const dist = Math.hypot(dx, dy);
        const pad = (Number(a.radius) || 0) + thickness;
        if (dist >= prevR - pad && dist <= nextR + pad) {
          a.techPingFxT = glowSec;
          pingAsteroids.add(a);
        }
        break;
      }
    }

    if (nextR >= (Number(ping.maxRadius) || techPingMaxRadiusFromState(state))) state.round.techPing = null;
  }

  function gemRgb(kind) {
    if (kind === "gold") return [255, 221, 88];
    if (kind === "diamond") return [86, 183, 255];
    if (kind === "ruby") return [255, 89, 100];
    return [84, 240, 165]; // emerald
  }

  function isPosInView(pos, margin = 220) {
    if (!pos) return false;
    const cam = state.camera || {};
    const view = state.view || {};
    const zoom = Math.max(0.1, Number(cam.zoom) || 1);
    const halfW = (Number(view.w) || 0) * 0.5 / zoom;
    const halfH = (Number(view.h) || 0) * 0.5 / zoom;
    const cx = Number(cam.x) || 0;
    const cy = Number(cam.y) || 0;
    const m = Math.max(0, Number(margin) || 0);
    return Math.abs(pos.x - cx) <= halfW + m && Math.abs(pos.y - cy) <= halfH + m;
  }

  function updateStarHeatVisuals() {
    const star = state.round?.star;
    if (!star) return;
    const axis = String(star.axis ?? "");
    const dir = Number(star.dir) === 1 ? 1 : -1;
    const boundary = Number(star.boundary) || 0;
    const heatBand = clamp(Number(state.params?.starSafeBufferPx ?? 320), 80, Math.min(state.world?.w || 1e9, state.world?.h || 1e9));

    // Ships
    const ids = Object.keys(state.playersById || {}).sort();
    for (let i = 0; i < ids.length; i++) {
      const ship = state.playersById?.[ids[i]]?.ship;
      if (!ship?.pos) continue;
      const axisPos = axis === "y" ? Number(ship.pos.y) || 0 : Number(ship.pos.x) || 0;
      const r = Math.max(0, Number(ship.radius) || 0);
      const signedDist = (axisPos - boundary) * dir - r;
      const heat = clamp(1 - signedDist / Math.max(1e-6, heatBand), 0, 1);
      ship.starHeat = heat;
    }

    // Asteroids
    for (let i = 0; i < (state.asteroids?.length || 0); i++) {
      const a = state.asteroids[i];
      if (!a?.pos) continue;
      const axisPos = axis === "y" ? Number(a.pos.y) || 0 : Number(a.pos.x) || 0;
      const r = Math.max(0, Number(a.radius) || 0);
      const signedDist = (axisPos - boundary) * dir - r;
      const heat = clamp(1 - signedDist / Math.max(1e-6, heatBand), 0, 1);
      a.starHeat = heat;
    }
  }

  function updateGemAmbient(dt) {
    const gems = state.gems;
    if (!Array.isArray(gems) || gems.length === 0) return;
    const ttlDefault = Math.max(0.1, Number(state.params?.gemTtlSec ?? 6) || 6);
    const maxHz = clamp(Number(state.params?.gemBlinkMaxHz ?? 5) || 5, 0.25, 12);
    for (let i = 0; i < gems.length; i++) {
      const g = gems[i];
      if (!g) continue;

      // Keep authoritative pos/vel as-is; only animate visuals.
      g.ageSec = (Number(g.ageSec) || 0) + dt;
      const ttl = g.kind === "gold" ? 18 : ttlDefault;
      g.ttlSec = Number.isFinite(Number(g.ttlSec)) ? Number(g.ttlSec) : ttl;

      const lifeT = clamp((Number(g.ageSec) || 0) / Math.max(0.001, Number(g.ttlSec) || ttlDefault), 0, 1);
      const throbHz = lerp(0.75, maxHz, lifeT * lifeT);

      if (!Number.isFinite(Number(g.pulsePhase))) g.pulsePhase = (hashStringToU32(`gem:${g.id}`) % 997) / 997;
      g.pulsePhase = (Number(g.pulsePhase) + dt * throbHz) % 1;
      const wave = 0.5 + 0.5 * Math.sin(Number(g.pulsePhase) * Math.PI * 2);
      const minAlpha = lerp(0.6, 0.3, lifeT);
      g.pulseAlpha = lerp(minAlpha, 1, wave);

      if (!Number.isFinite(Number(g.spinVel))) {
        const r = ensurePlayerRng(`gem:${g.id}`);
        g.spinVel = (r() * 2 - 1) * 2.8;
      }
      if (!Number.isFinite(Number(g.spin))) g.spin = (hashStringToU32(`gemspin:${g.id}`) % 1000) * 0.001 * Math.PI * 2;
      g.spin += Number(g.spinVel) * dt;
    }
  }

  function diffGems({ atMs }) {
    const added = [];
    const removed = [];
    const seen = new Set();
    const gems = state.gems;
    if (Array.isArray(gems)) {
      for (let i = 0; i < gems.length; i++) {
        const g = gems[i];
        const id = String(g?.id ?? "");
        if (!id) continue;
        seen.add(id);
        if (!prevGemById.has(id)) {
          added.push(g);
        }
        prevGemById.set(id, { x: Number(g.pos?.x) || 0, y: Number(g.pos?.y) || 0, kind: String(g.kind ?? "") });
      }
    }
    for (const [id, prev] of prevGemById.entries()) {
      if (seen.has(id)) continue;
      removed.push({ id, prev });
      prevGemById.delete(id);
    }

    if (!ignoreEventsUntilMs) ignoreEventsUntilMs = (Number(atMs) || nowMs()) + 600;

    const canEmit = (Number(atMs) || 0) >= ignoreEventsUntilMs;
    if (canEmit) {
      for (let i = 0; i < removed.length; i++) {
        const prev = removed[i].prev;
        const pos = vec(Number(prev.x) || 0, Number(prev.y) || 0);
        if (!isPosInView(pos, 240)) continue;
        spawnExplosion(state, fxRng, pos, { kind: "tiny", rgb: gemRgb(prev.kind), r0: 4, r1: 16, ttl: 0.14 });
      }
    }

    return { added, removed };
  }

  function diffTechParts({ atMs }) {
    const parts = state.round?.techParts;
    if (!Array.isArray(parts)) return;
    const seen = new Set();
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const id = String(p?.id ?? "");
      if (!id) continue;
      seen.add(id);
      const curState = String(p.state ?? "");
      const x = Number(p.pos?.x) || 0;
      const y = Number(p.pos?.y) || 0;
      const prev = prevTechPartById.get(id);
      prevTechPartById.set(id, { state: curState, x, y });
      if (!prev) continue;
      if (!ignoreEventsUntilMs) ignoreEventsUntilMs = (Number(atMs) || nowMs()) + 600;
      if ((Number(atMs) || 0) < ignoreEventsUntilMs) continue;
      if (prev.state !== curState && (curState === "carried" || curState === "installed")) {
        const pos = vec(x, y);
        if (!isPosInView(pos, 240)) continue;
        spawnExplosion(state, fxRng, pos, { kind: "ring", rgb: [215, 150, 255], r0: 10, r1: 52, ttl: 0.16 });
      }
    }
    for (const id of prevTechPartById.keys()) {
      if (!seen.has(id)) prevTechPartById.delete(id);
    }
  }

  function maybeSaucerDeathFx({ gemAdded, atMs }) {
    const s = state.saucer;
    const present = !!s;
    if (present) {
      prevSaucer.present = true;
      prevSaucer.x = Number(s.pos?.x) || 0;
      prevSaucer.y = Number(s.pos?.y) || 0;
      return;
    }
    if (!prevSaucer.present) return;
    prevSaucer.present = false;

    if (!ignoreEventsUntilMs) ignoreEventsUntilMs = (Number(atMs) || nowMs()) + 600;
    if ((Number(atMs) || 0) < ignoreEventsUntilMs) return;

    const pos = vec(prevSaucer.x, prevSaucer.y);
    if (!isPosInView(pos, 240)) return;

    // Heuristic: only play kill FX if a new gold gem spawned near where the saucer vanished.
    let killed = false;
    for (let i = 0; i < gemAdded.length; i++) {
      const g = gemAdded[i];
      if (!g || String(g.kind ?? "") !== "gold") continue;
      const dx = (Number(g.pos?.x) || 0) - pos.x;
      const dy = (Number(g.pos?.y) || 0) - pos.y;
      if (dx * dx + dy * dy <= 160 * 160) {
        killed = true;
        break;
      }
    }
    if (!killed) return;

    spawnExplosion(state, fxRng, pos, { kind: "pop", rgb: [255, 221, 88], r0: 14, r1: 56, ttl: 0.24 });
    spawnExplosion(state, fxRng, pos, { kind: "ring", rgb: [255, 221, 88], r0: 20, r1: 88, ttl: 0.2 });
  }

  function updateExhaustAndThrusters({ dt }) {
    const ids = Object.keys(state.playersById || {}).sort();
    const shipThrust = Math.max(1e-6, Number(state.params?.shipThrust) || 1);

    const localId = String(state.localPlayerId ?? "");
    const localInput = state.input && typeof state.input === "object" ? state.input : null;
    const localThrustAmt =
      localInput && localId
        ? Math.max(localInput.up ? 1 : 0, clamp(Number(localInput.thrustAnalog ?? 0), 0, 1))
        : 0;

    const intensityBase = clamp(Number(state.params?.exhaustIntensity ?? 1), 0, 2.5);
    const sparkBase = clamp(Number(state.params?.exhaustSparkScale ?? 1), 0, 3);
    const dtScale = clamp(dt * 60, 0.1, 4);

    // Keep this deliberately lower than singleplayer to avoid saturating MP clients in large worlds.
    const maxParticles = 520;
    const particles = state.exhaust;

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const player = state.playersById?.[id];
      const ship = player?.ship;
      if (!ship || !ship.pos || !ship.vel) continue;

      const mv = ensurePlayerMotion(id);
      const vx = Number(ship.vel.x) || 0;
      const vy = Number(ship.vel.y) || 0;
      const ax = (vx - mv.vx) / Math.max(1e-6, dt);
      const ay = (vy - mv.vy) / Math.max(1e-6, dt);
      mv.vx = vx;
      mv.vy = vy;

      const ang = Number(ship.angle) || 0;
      const fwdX = Math.cos(ang);
      const fwdY = Math.sin(ang);
      const forwardAccel = ax * fwdX + ay * fwdY;
      const remoteThrustAmtRaw = clamp(forwardAccel / shipThrust, 0, 1);
      if (!Number.isFinite(mv.thrustT)) mv.thrustT = 0;
      const smooth = 1 - Math.exp(-dt * 10);
      mv.thrustT = lerp(mv.thrustT, remoteThrustAmtRaw, smooth);
      const remoteThrustAmt = mv.thrustT;
      const thrustAmt = id === localId ? localThrustAmt : remoteThrustAmt;

      // Export a cheap “thrusting” hint for renderer jets.
      if (player) {
        if (!player._mpVfx || typeof player._mpVfx !== "object") player._mpVfx = {};
        const on = 0.12;
        const off = 0.06;
        const wasOn = !!mv.thrusting;
        const isThrusting = wasOn ? thrustAmt > off : thrustAmt > on;
        player._mpVfx.thrusting = isThrusting;
        mv.thrusting = isThrusting;
      }

      if (thrustAmt <= 1e-6) continue;
      const intensity = intensityBase * thrustAmt;
      const sparkScale = sparkBase * thrustAmt;
      if (intensity <= 1e-6 && sparkScale <= 1e-6) continue;

      const tier = shipTierByKey(ship.tier);
      const renderer = tier?.renderer || {};
      const engines = Array.isArray(renderer.engines) ? renderer.engines : [];
      if (engines.length === 0) continue;

      const tierScale = tier.key === "large" ? 1.2 : tier.key === "medium" ? 1.05 : 1;
      const flamesPerEngineBase = tier.key === "large" ? 2 : 1;
      const sparkChanceBase = tier.key === "large" ? 0.12 : tier.key === "medium" ? 0.1 : 0.09;

      const r = ensurePlayerRng(id);
      const { scale, mirrorX } = exhaustShipScaleAndMirror(tier, ship);

      const c = Math.cos(ang);
      const s = Math.sin(ang);
      const backX = -c;
      const backY = -s;
      const sideX = -s;
      const sideY = c;
      const baseVelX = vx;
      const baseVelY = vy;
      const shipX = Number(ship.pos.x) || 0;
      const shipY = Number(ship.pos.y) || 0;

      for (let ei = 0; ei < engines.length; ei++) {
        const e = engines[ei];
        let lx = (Number(e?.x) || 0) * scale;
        const ly = (Number(e?.y) || 0) * scale;
        if (mirrorX) lx = -lx;

        const nozzleOffset = 1.6 * scale;
        const localX = lx - nozzleOffset;
        const localY = ly;
        const nozzleX = shipX + localX * c - localY * s;
        const nozzleY = shipY + localX * s + localY * c;

        const flameCountF = flamesPerEngineBase * intensity * dtScale;
        const flameWhole = Math.floor(flameCountF);
        const flameFrac = flameCountF - flameWhole;
        const flameCount = flameWhole + (r() < flameFrac ? 1 : 0);
        for (let j = 0; j < flameCount; j++) {
          const seed = Math.floor(r() * 0xffffffff) >>> 0;
          const sideJitter = (r() * 2 - 1) * 50 * tierScale;
          const backJitter = (r() * 2 - 1) * 20 * tierScale;
          const speed = (170 + r() * 140) * tierScale;
          const pvx = baseVelX + backX * (speed + backJitter) + sideX * sideJitter;
          const pvy = baseVelY + backY * (speed + backJitter) + sideY * sideJitter;
          const ttl = 0.26 + r() * 0.24;
          const pr = (1.8 + r() * 1.9) * tierScale * (0.9 + 0.25 * intensity);
          const posX = nozzleX + sideX * ((r() * 2 - 1) * 2.0 * tierScale) + backX * (r() * 2.4);
          const posY = nozzleY + sideY * ((r() * 2 - 1) * 2.0 * tierScale) + backY * (r() * 2.4);
          spawnExhaustParticle(state, "flame", posX, posY, pvx, pvy, { ttl, r: pr, seed });
        }

        const sparkChance = clamp(sparkChanceBase * sparkScale * dtScale, 0, 1);
        if (sparkChance > 1e-6 && r() < sparkChance) {
          const seed = Math.floor(r() * 0xffffffff) >>> 0;
          const sideJitter = (r() * 2 - 1) * 110 * tierScale;
          const speed = (280 + r() * 210) * tierScale;
          const pvx = baseVelX + backX * speed + sideX * sideJitter;
          const pvy = baseVelY + backY * speed + sideY * sideJitter;
          const ttl = 0.11 + r() * 0.18;
          const pr = (0.9 + r() * 1.2) * tierScale;
          spawnExhaustParticle(state, "spark", nozzleX, nozzleY, pvx, pvy, { ttl, r: pr, seed });
        }
      }
    }

    if (particles.length > maxParticles) {
      particles.splice(0, particles.length - maxParticles);
    }
  }

  function decayBlastPulse(dt) {
    const ids = Object.keys(state.playersById || {}).sort();
    for (let i = 0; i < ids.length; i++) {
      const p = state.playersById?.[ids[i]];
      if (!p) continue;
      if (!Number.isFinite(p.blastPulseT)) p.blastPulseT = 0;
      if (p.blastPulseT > 0) p.blastPulseT = Math.max(0, p.blastPulseT - dt);
    }
  }

  function shouldTriggerBurstFx(playerId, atMs, cooldownMs = 250) {
    const id = String(playerId ?? "");
    const now = Number(atMs) || nowMs();
    const last = Number(lastBurstFxAtMsByPlayerId.get(id) || 0);
    if (last && now - last < cooldownMs) return false;
    lastBurstFxAtMsByPlayerId.set(id, now);
    return true;
  }

  function triggerBurstFx({ playerId, pos, vel, atMs }) {
    const pid = String(playerId ?? "");
    if (!pid) return;
    if (!shouldTriggerBurstFx(pid, atMs)) return;

    const p = state.playersById?.[pid];
    if (p) p.blastPulseT = 0.22;

    const usePos = pos && Number.isFinite(pos.x) && Number.isFinite(pos.y) ? pos : vec(0, 0);
    spawnExplosion(state, fxRng, usePos, { kind: "ring", rgb: [255, 221, 88], r0: 14, r1: 110, ttl: 0.18 });

    const seedBase = hashStringToU32(`burst:${pid}:${Math.floor((Number(state.time) || 0) * 10)}`);
    const r = makeRng(seedBase ^ 0x85ebca6b);
    const n = 10;
    const vv = vel && Number.isFinite(vel.x) && Number.isFinite(vel.y) ? vel : vec(0, 0);
    const baseAng = Math.atan2(vv.y, vv.x);
    for (let i = 0; i < n; i++) {
      const ang = baseAng + (i / n) * Math.PI * 2 + r() * 0.25;
      const speed = lerp(240, 420, r());
      spawnBurstWavelets(state, fxRng, { pos: usePos, angle: ang, speed, ttl: 0.48, rgb: [255, 221, 88] });
    }
  }

  function updateBurstFxFromInput({ burstPressed, atMs }) {
    if (!burstPressed) return;
    if (state.mode !== "playing") return;
    const localId = String(state.localPlayerId ?? "");
    const ship = state.playersById?.[localId]?.ship || null;
    if (!ship?.pos) return;
    // Avoid false positives when nothing is attached.
    let hasAttached = false;
    for (let i = 0; i < (state.asteroids?.length || 0); i++) {
      const a = state.asteroids[i];
      if (!a) continue;
      if (String(a.attachedTo ?? "") === localId) {
        hasAttached = true;
        break;
      }
    }
    if (!hasAttached) return;
    triggerBurstFx({
      playerId: localId,
      pos: vec(Number(ship.pos.x) || 0, Number(ship.pos.y) || 0),
      vel: vec(Number(ship.vel?.x) || 0, Number(ship.vel?.y) || 0),
      atMs,
    });
  }

  function updateBurstFxFromAuthoritative({ gemAdded, atMs }) {
    const seen = new Set();
    for (let i = 0; i < (state.asteroids?.length || 0); i++) {
      const a = state.asteroids[i];
      if (!a) continue;
      const id = String(a.id ?? "");
      if (!id) continue;
      seen.add(id);
      const attachedTo = a.attachedTo ? String(a.attachedTo) : "";
      const shipLaunched = !!a.shipLaunched;
      const prev = prevAsteroidById.get(id);
      if (prev && prev.attachedTo && !attachedTo && shipLaunched && !prev.shipLaunched) {
        const pid = prev.attachedTo;
        const p = state.playersById?.[pid];
        const ship = p?.ship || null;
        const pos = ship?.pos ? vec(Number(ship.pos.x) || 0, Number(ship.pos.y) || 0) : vec(Number(a.pos?.x) || 0, Number(a.pos?.y) || 0);
        const vel = a?.vel ? vec(Number(a.vel.x) || 0, Number(a.vel.y) || 0) : vec(0, 0);
        triggerBurstFx({ playerId: pid, pos, vel, atMs });
      }
      prevAsteroidById.set(id, {
        attachedTo,
        shipLaunched,
        x: Number(a.pos?.x) || 0,
        y: Number(a.pos?.y) || 0,
        size: String(a.size ?? ""),
      });
    }
    for (const [id, prev] of prevAsteroidById.entries()) {
      if (seen.has(id)) continue;
      prevAsteroidById.delete(id);

      if (!ignoreEventsUntilMs) ignoreEventsUntilMs = (Number(atMs) || nowMs()) + 600;
      if ((Number(atMs) || 0) < ignoreEventsUntilMs) continue;

      const pos = vec(Number(prev.x) || 0, Number(prev.y) || 0);
      if (!isPosInView(pos, 240)) continue;

      // Ship-launched projectile impact: small pop on disappearance (view-gated).
      if (prev.shipLaunched) {
        spawnExplosion(state, fxRng, pos, { kind: "tiny", rgb: [255, 255, 255], r0: 4, r1: 18, ttl: 0.16 });
      }

      // Medium fracture: if we saw new gems appear near where a medium asteroid vanished, show a larger pop.
      if (String(prev.size) === "med" && Array.isArray(gemAdded) && gemAdded.length) {
        let near = false;
        for (let i = 0; i < gemAdded.length; i++) {
          const g = gemAdded[i];
          if (!g) continue;
          const dx = (Number(g.pos?.x) || 0) - pos.x;
          const dy = (Number(g.pos?.y) || 0) - pos.y;
          if (dx * dx + dy * dy <= 90 * 90) {
            near = true;
            break;
          }
        }
        if (near) {
          spawnExplosion(state, fxRng, pos, { kind: "pop", rgb: [255, 255, 255], r0: 10, r1: 42, ttl: 0.22 });
        }
      }
    }
  }

  function update({ dtSec = 0, atMs = nowMs() } = {}) {
    const dt = clamp(Number(dtSec) || 0, 0, 0.050);
    if (!(dt > 0)) return;
    ensureEffectArrays(state);

    // If we were paused for a long time, avoid huge dt spikes in VFX.
    if (lastUpdateAtMs) {
      const wallDt = (Number(atMs) - Number(lastUpdateAtMs)) / 1000;
      if (Number.isFinite(wallDt) && wallDt > 0.25) {
        lastUpdateAtMs = Number(atMs);
      }
    }
    lastUpdateAtMs = Number(atMs) || lastUpdateAtMs || nowMs();

    stepEffects(state, dt);
    stepExhaust(state, dt);

    // Ambient visuals derived from authoritative state.
    updateStarHeatVisuals();
    updateGemAmbient(dt);

    // Event-ish visuals derived from authoritative state changes.
    const gemEvents = diffGems({ atMs });
    diffTechParts({ atMs });
    maybeSaucerDeathFx({ gemAdded: gemEvents.added, atMs });

    // Edge-trigger impulses from local input.
    const input = state.input && typeof state.input === "object" ? state.input : {};
    const burstNow = !!input.burst;
    const pingNow = !!input.ping;
    const burstPressed = burstNow && !lastBurst;
    const pingPressed = pingNow && !lastPing;
    lastBurst = burstNow;
    lastPing = pingNow;

    decayBlastPulse(dt);
    updateBurstFxFromInput({ burstPressed, atMs });
    updateBurstFxFromAuthoritative({ gemAdded: gemEvents.added, atMs });
    updateTechPing({ dt, pingPressed });
    updateExhaustAndThrusters({ dt });
  }

  return { update, reset };
}
