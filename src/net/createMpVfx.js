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

  const fxRng = makeRng(0x51a7f00d);
  let lastUpdateAtMs = 0;
  let lastBurst = false;
  let lastPing = false;

  function reset() {
    motionById.clear();
    rngById.clear();
    pingAsteroids.clear();
    pingParts.clear();
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
      const remoteThrustAmt = clamp(forwardAccel / shipThrust, 0, 1);
      const thrustAmt = id === localId ? localThrustAmt : remoteThrustAmt;

      // Export a cheap “thrusting” hint for renderer jets.
      if (player) {
        if (!player._mpVfx || typeof player._mpVfx !== "object") player._mpVfx = {};
        const isThrusting = thrustAmt > 0.08;
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

  function updateBurstFx({ burstPressed }) {
    if (!burstPressed) return;
    if (state.mode !== "playing") return;
    const localId = String(state.localPlayerId ?? "");
    const ship = state.playersById?.[localId]?.ship || null;
    if (!ship?.pos) return;

    // Visual-only “burst” feedback in MP (authoritative gameplay happens on server).
    const pos = vec(Number(ship.pos.x) || 0, Number(ship.pos.y) || 0);
    spawnExplosion(state, fxRng, pos, { kind: "ring", rgb: [255, 221, 88], r0: 18, r1: 120, ttl: 0.18 });

    // A few wavelets around the ship, deterministic-ish by local id.
    const seedBase = hashStringToU32(`burst:${localId}:${Math.floor((Number(state.time) || 0) * 10)}`);
    const r = makeRng(seedBase ^ 0x85ebca6b);
    const n = 10;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + r() * 0.25;
      const speed = lerp(240, 420, r());
      spawnBurstWavelets(state, fxRng, { pos, angle: ang, speed, ttl: 0.48, rgb: [255, 221, 88] });
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

    // Edge-trigger impulses from local input.
    const input = state.input && typeof state.input === "object" ? state.input : {};
    const burstNow = !!input.burst;
    const pingNow = !!input.ping;
    const burstPressed = burstNow && !lastBurst;
    const pingPressed = pingNow && !lastPing;
    lastBurst = burstNow;
    lastPing = pingNow;

    updateBurstFx({ burstPressed });
    updateTechPing({ dt, pingPressed });
    updateExhaustAndThrusters({ dt });
  }

  return { update, reset };
}
