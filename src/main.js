(() => {
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function vec(x = 0, y = 0) {
    return { x, y };
  }

  function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y };
  }

  function sub(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
  }

  function mul(a, s) {
    return { x: a.x * s, y: a.y * s };
  }

  function dot(a, b) {
    return a.x * b.x + a.y * b.y;
  }

  function len2(a) {
    return a.x * a.x + a.y * a.y;
  }

  function len(a) {
    return Math.sqrt(len2(a));
  }

  function norm(a) {
    const l = len(a);
    if (l <= 1e-9) return { x: 0, y: 0 };
    return { x: a.x / l, y: a.y / l };
  }

  function rot(a, radians) {
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    return { x: a.x * c - a.y * s, y: a.x * s + a.y * c };
  }

  function angleToVec(radians) {
    return { x: Math.cos(radians), y: Math.sin(radians) };
  }

  function angleOf(v) {
    return Math.atan2(v.y, v.x);
  }

  function wrapAngle(a) {
    while (a <= -Math.PI) a += Math.PI * 2;
    while (a > Math.PI) a -= Math.PI * 2;
    return a;
  }

  function wrapPos(p, halfW, halfH) {
    let x = p.x;
    let y = p.y;
    if (x < -halfW) x += 2 * halfW;
    if (x > halfW) x -= 2 * halfW;
    if (y < -halfH) y += 2 * halfH;
    if (y > halfH) y -= 2 * halfH;
    return { x, y };
  }

  function seededRng(seed = 0x12345678) {
    let s = seed >>> 0;
    return () => {
      // xorshift32
      s ^= s << 13;
      s >>>= 0;
      s ^= s >> 17;
      s >>>= 0;
      s ^= s << 5;
      s >>>= 0;
      return (s >>> 0) / 0xffffffff;
    };
  }

  function makeAsteroidShape(rng, radius, verts = 10) {
    const pts = [];
    const step = (Math.PI * 2) / verts;
    for (let i = 0; i < verts; i++) {
      const a = i * step;
      const jitter = 0.62 + rng() * 0.54;
      pts.push({ a, r: radius * jitter });
    }
    return pts;
  }

  function drawPolyline(ctx, pts, x, y, angle, color, lineWidth = 2) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const px = Math.cos(p.a) * p.r;
      const py = Math.sin(p.a) * p.r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function makeShip() {
    return {
      pos: vec(0, 0),
      vel: vec(0, 0),
      angle: -Math.PI / 2,
      radius: 14,
      mass: 260,
    };
  }

  function shipForward(ship) {
    return angleToVec(ship.angle);
  }

  function circleHit(a, b) {
    const d2 = len2(sub(a.pos, b.pos));
    const r = a.radius + b.radius;
    return d2 <= r * r;
  }

  function circleCollide(a, b) {
    const delta = sub(b.pos, a.pos);
    const dist2 = len2(delta);
    const minDist = a.radius + b.radius;
    if (dist2 <= 1e-9 || dist2 >= minDist * minDist) return null;
    const dist = Math.sqrt(dist2);
    const n = mul(delta, 1 / dist);
    return { n, dist, penetration: minDist - dist };
  }

  function asteroidRadiusForSize(params, size) {
    if (size === "large") return params.largeRadius;
    if (size === "med") return params.medRadius;
    return params.smallRadius;
  }

  function asteroidMassForRadius(radius) {
    // 2D-ish: mass proportional to area.
    return Math.max(1, radius * radius);
  }

  function createGame({ width, height }) {
    const rng = seededRng(0xdecafbad);
    const state = {
      mode: "menu", // menu | playing | gameover
      time: 0,
      ship: makeShip(),
      asteroids: [],
      gems: [],
      effects: [],
      score: 0,
      gemsCollected: { diamond: 0, ruby: 0, emerald: 0 },
      burstCooldown: 0,
      blastPulseT: 0,
      settings: {
        showAttractRadius: true,
        shipExplodesOnImpact: false,
      },
      input: {
        left: false,
        right: false,
        up: false,
        down: false,
        burst: false,
      },
      view: {
        w: width,
        h: height,
      },
      params: {
        shipTurnRate: 3.6, // rad/s
        shipThrust: 260, // px/s^2
        shipBrake: 220,
        shipMaxSpeed: 420,
        shipLinearDamp: 0.15,

        attractRadius: 252, // +5%
        forceFieldRadius: 75,
        gravityK: 1200000, // gravity-well strength (tuned)
        gravitySoftening: 70,
        ringK: 6.5, // pulls smalls toward the ring surface
        ringRadialDamp: 6.5,
        captureSpeed: 360, // ring forces fade out by this speed
        attachBand: 14,
        attachSpeedMax: 220,
        attachPadding: 6,

        burstSpeed: 546, // +5%
        burstCooldownSec: 0.35,

        largeRadius: 54,
        medRadius: 30,
        smallRadius: 12,
        largeCount: 6,
        medCount: 10,
        smallCount: 22,

        restitution: 0.92,
        fractureImpactSpeed: 260,
        maxAsteroids: 120,

        // Damage model for fast smalls (velocity-based; no time limit).
        smallDamageSpeedMin: 420,
      },
    };

    function makeAsteroid(size, pos, vel) {
      const radius = asteroidRadiusForSize(state.params, size);
      const shape = makeAsteroidShape(rng, radius, size === "large" ? 12 : size === "med" ? 11 : 9);
      const rotVelMax = size === "large" ? 0.55 : size === "med" ? 0.9 : 1.2;
      return {
        id: `${size}-${Math.floor(rng() * 1e9)}`,
        size,
        pos,
        vel,
        radius,
        mass: asteroidMassForRadius(radius),
        rot: rng() * Math.PI * 2,
        rotVel: (rng() * 2 - 1) * rotVelMax,
        shape,
        attached: false,
        orbitA: 0, // ship-local angle (radians) when attached
        fractureCooldownT: 0,
        hitFxT: 0,
      };
    }

    function isDamagingSmall(a, impactSpeed) {
      if (a.size !== "small") return false;
      const spd = len(a.vel);
      const v = Math.max(spd, impactSpeed);
      return v >= state.params.smallDamageSpeedMin;
    }

    function spawnExplosion(pos, { rgb = [255, 255, 255], kind = "pop", r0 = 6, r1 = 26, ttl = 0.22 } = {}) {
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

    function rollGemKind() {
      const r = rng();
      if (r < 0.1) return "diamond"; // blue (rare)
      if (r < 0.5) return "ruby"; // red
      return "emerald"; // green
    }

    function gemRgb(kind) {
      if (kind === "diamond") return [86, 183, 255];
      if (kind === "ruby") return [255, 89, 100];
      return [84, 240, 165]; // emerald
    }

    function gemPoints(kind) {
      if (kind === "diamond") return 100;
      if (kind === "ruby") return 25;
      return 10;
    }

    function spawnGem(pos, velHint = vec(0, 0)) {
      const kind = rollGemKind();
      const radius = kind === "diamond" ? 8 : 7;
      const jitter = vec((rng() * 2 - 1) * 50, (rng() * 2 - 1) * 50);
      state.gems.push({
        id: `gem-${Math.floor(rng() * 1e9)}`,
        kind,
        pos: vec(pos.x, pos.y),
        vel: add(mul(velHint, 0.25), jitter),
        radius,
        spin: rng() * Math.PI * 2,
        spinVel: (rng() * 2 - 1) * 2.8,
      });
    }

    function breakSmallAsteroid(a, { velHint = vec(0, 0), removeSet = null } = {}) {
      if (!a || a.size !== "small") return;
      if (removeSet) {
        if (removeSet.has(a.id)) return;
        removeSet.add(a.id);
      }
      spawnExplosion(a.pos, { kind: "tiny", rgb: [255, 255, 255], r0: 4, r1: 18, ttl: 0.16 });
      spawnGem(a.pos, velHint);
    }

    function resetWorld() {
      state.time = 0;
      state.score = 0;
      state.burstCooldown = 0;
      state.blastPulseT = 0;
      state.effects = [];
      state.gems = [];
      state.gemsCollected = { diamond: 0, ruby: 0, emerald: 0 };
      state.input.left = false;
      state.input.right = false;
      state.input.up = false;
      state.input.down = false;
      state.input.burst = false;
      state.ship = makeShip();
      state.asteroids = [];
      const halfW = state.view.w / 2;
      const halfH = state.view.h / 2;

      const spawn = (size, count) => {
        for (let i = 0; i < count; i++) {
          const radius = asteroidRadiusForSize(state.params, size);
          const p = vec(0, 0);
          let placed = false;
          const tries = 80;
          for (let t = 0; t < tries && !placed; t++) {
            p.x = (rng() * 2 - 1) * halfW * 0.9;
            p.y = (rng() * 2 - 1) * halfH * 0.9;
            const shipClear = len2(sub(p, state.ship.pos)) > 240 * 240;
            if (!shipClear) continue;

            placed = true;
            for (const other of state.asteroids) {
              const min = radius + other.radius + 12;
              if (len2(sub(p, other.pos)) < min * min) {
                placed = false;
                break;
              }
            }
          }
          if (!placed) {
            // Fallback: shove outward to reduce immediate overlaps.
            const dir = norm(p.x || p.y ? p : vec(1, 0));
            p.x = dir.x * halfW * 0.75;
            p.y = dir.y * halfH * 0.75;
          }
          const maxV = size === "large" ? 38 : size === "med" ? 52 : 70;
          const v = vec((rng() * 2 - 1) * maxV, (rng() * 2 - 1) * maxV);
          state.asteroids.push(makeAsteroid(size, vec(p.x, p.y), v));
        }
      };

      spawn("large", state.params.largeCount);
      spawn("med", state.params.medCount);
      spawn("small", state.params.smallCount);
    }

    function startGame() {
      resetWorld();
      state.mode = "playing";
    }

    function orbitPosFor(a) {
      const r = state.params.forceFieldRadius;
      const wAngle = state.ship.angle + a.orbitA;
      return add(state.ship.pos, mul(angleToVec(wAngle), r));
    }

    function tryAttachSmall(a) {
      if (a.size !== "small" || a.attached) return false;
      const toShip = sub(a.pos, state.ship.pos);
      const d = len(toShip);
      const targetR = state.params.forceFieldRadius;
      const err = Math.abs(d - targetR);
      const spd = len(a.vel);
      if (err <= state.params.attachBand && spd <= state.params.attachSpeedMax) {
        a.attached = true;
        a.vel = vec(0, 0);
        a.orbitA = wrapAngle(angleOf(toShip) - state.ship.angle);
        a.pos = orbitPosFor(a);
        return true;
      }
      return false;
    }

    function burstAttached() {
      if (state.mode !== "playing") return;
      if (state.burstCooldown > 0) return;
      state.burstCooldown = state.params.burstCooldownSec;
      state.blastPulseT = 0.22;
      spawnExplosion(state.ship.pos, {
        kind: "ring",
        rgb: [255, 255, 255],
        r0: state.params.forceFieldRadius - 2,
        r1: state.params.forceFieldRadius + 26,
        ttl: 0.18,
      });

      const shipV = state.ship.vel;
      for (const a of state.asteroids) {
        if (!a.attached) continue;
        a.attached = false;
        a.pos = orbitPosFor(a);
        const dir = norm(sub(a.pos, state.ship.pos));
        const base = mul(dir, state.params.burstSpeed);
        a.vel = add(base, mul(shipV, 0.55));
        a.rotVel += (rng() * 2 - 1) * 1.8;
      }
    }

    function resize(w, h) {
      state.view.w = w;
      state.view.h = h;
    }

    function updateShip(dt) {
      const ship = state.ship;
      if (state.input.left) ship.angle -= state.params.shipTurnRate * dt;
      if (state.input.right) ship.angle += state.params.shipTurnRate * dt;

      const fwd = shipForward(ship);
      if (state.input.up) {
        ship.vel = add(ship.vel, mul(fwd, state.params.shipThrust * dt));
      }
      if (state.input.down) {
        const v = ship.vel;
        const vLen = len(v);
        if (vLen > 1e-6) {
          const brake = state.params.shipBrake * dt;
          const newLen = Math.max(0, vLen - brake);
          ship.vel = mul(v, newLen / vLen);
        }
      }

      ship.vel = mul(ship.vel, Math.max(0, 1 - state.params.shipLinearDamp * dt));

      const spd = len(ship.vel);
      if (spd > state.params.shipMaxSpeed) {
        ship.vel = mul(ship.vel, state.params.shipMaxSpeed / spd);
      }

      ship.pos = add(ship.pos, mul(ship.vel, dt));
      ship.pos = wrapPos(ship.pos, state.view.w / 2, state.view.h / 2);
    }

    function updateAsteroids(dt) {
      const halfW = state.view.w / 2;
      const halfH = state.view.h / 2;
      const ship = state.ship;

      // Keep attached small asteroids distributed around the ring.
      // Simple angular repulsion so they don't overlap.
      const attached = state.asteroids.filter((a) => a.attached);
      if (attached.length >= 2) {
        const r = Math.max(20, state.params.forceFieldRadius);
        const iters = 3;
        for (let it = 0; it < iters; it++) {
          for (let i = 0; i < attached.length; i++) {
            for (let j = i + 1; j < attached.length; j++) {
              const a = attached[i];
              const b = attached[j];
              const delta = wrapAngle(a.orbitA - b.orbitA);
              const minSep = (a.radius + b.radius + 6) / r;
              if (Math.abs(delta) >= minSep) continue;
              const push = (minSep - Math.abs(delta)) * 0.5;
              const sgn = delta >= 0 ? 1 : -1;
              a.orbitA = wrapAngle(a.orbitA + push * sgn);
              b.orbitA = wrapAngle(b.orbitA - push * sgn);
            }
          }
        }
      }

      for (const a of state.asteroids) {
        if (a.attached) {
          a.pos = orbitPosFor(a);
          a.rot += a.rotVel * dt;
          continue;
        }
        a.fractureCooldownT = Math.max(0, a.fractureCooldownT - dt);
        a.hitFxT = Math.max(0, a.hitFxT - dt);

        if (a.size === "small") {
          const toShip = sub(ship.pos, a.pos);
          const d2 = len2(toShip);
          const attractR2 = state.params.attractRadius * state.params.attractRadius;
          if (d2 < attractR2) {
            const d = Math.max(10, Math.sqrt(d2));
            const dirIn = mul(toShip, 1 / d); // toward ship

            // Gravity well: stronger as you get closer (1 / (d^2 + soft^2)).
            const soft = state.params.gravitySoftening;
            const grav = state.params.gravityK / (d2 + soft * soft);
            a.vel = add(a.vel, mul(dirIn, grav * dt));

            // Forcefield surface: pull toward r = forceFieldRadius and repel inside it.
            const err = d - state.params.forceFieldRadius; // + outside, - inside
            const spd = len(a.vel);
            const capV = Math.max(1, state.params.captureSpeed);
            const captureFactor = clamp(1 - spd / capV, 0, 1);
            const ring = clamp(err, -140, 140) * state.params.ringK * captureFactor;
            a.vel = add(a.vel, mul(dirIn, ring * dt));

            // Radial damping near the ring so captured rocks settle instead of oscillating forever.
            if (Math.abs(err) < 70 && captureFactor > 0) {
              const vRad = dot(a.vel, dirIn);
              a.vel = sub(a.vel, mul(dirIn, vRad * state.params.ringRadialDamp * captureFactor * dt));
            }
          }

          tryAttachSmall(a);
        }

        a.pos = add(a.pos, mul(a.vel, dt));
        a.pos = wrapPos(a.pos, halfW, halfH);
        a.rot += a.rotVel * dt;
      }
    }

    function updateGems(dt) {
      const halfW = state.view.w / 2;
      const halfH = state.view.h / 2;
      const ship = state.ship;
      const attractR2 = state.params.attractRadius * state.params.attractRadius;
      const fieldR = state.params.forceFieldRadius;
      const fieldR2 = fieldR * fieldR;

      for (const g of state.gems) {
        const toShip = sub(ship.pos, g.pos);
        const d2 = len2(toShip);
        if (d2 < attractR2) {
          const d = Math.max(8, Math.sqrt(d2));
          const dirIn = mul(toShip, 1 / d);
          const soft = state.params.gravitySoftening;
          const grav = state.params.gravityK / (d2 + soft * soft);
          g.vel = add(g.vel, mul(dirIn, grav * dt));

          if (d2 < fieldR2) {
            // Extra "suck" and damping inside the forcefield ring so gems reliably get absorbed.
            g.vel = add(g.vel, mul(dirIn, grav * dt * 0.85));
            g.vel = mul(g.vel, Math.max(0, 1 - 3.2 * dt));
          }
        }

        const spd = len(g.vel);
        if (spd > 900) g.vel = mul(g.vel, 900 / spd);

        g.pos = add(g.pos, mul(g.vel, dt));
        g.pos = wrapPos(g.pos, halfW, halfH);
        g.spin += g.spinVel * dt;
      }
    }

    function handleGemShipCollisions() {
      if (state.mode !== "playing") return;
      for (let i = state.gems.length - 1; i >= 0; i--) {
        const g = state.gems[i];
        if (!circleHit(g, state.ship)) continue;
        state.gems.splice(i, 1);
        state.gemsCollected[g.kind] = (state.gemsCollected[g.kind] || 0) + 1;
        state.score += gemPoints(g.kind);
        spawnExplosion(state.ship.pos, { kind: "tiny", rgb: gemRgb(g.kind), r0: 4, r1: 16, ttl: 0.14 });
      }
    }

    function fractureAsteroid(target, impactDir, impactSpeed) {
      if (target.fractureCooldownT > 0) return null;
      const next = target.size === "large" ? "med" : target.size === "med" ? "small" : null;
      if (!next) return null;

      // KISS fracture: large -> 2 med, med -> 2 small.
      const pieces = [];
      const count = 2;
      const baseR = asteroidRadiusForSize(state.params, next);
      const sep = baseR * 1.1;
      const axis = rot(impactDir, Math.PI / 2);
      const baseVel = add(target.vel, mul(impactDir, Math.min(150, impactSpeed * 0.35)));

      for (let i = 0; i < count; i++) {
        const side = i === 0 ? 1 : -1;
        const p = add(target.pos, mul(axis, sep * side));
        const v = add(baseVel, mul(axis, (70 + rng() * 80) * side));
        const frag = makeAsteroid(next, p, v);
        frag.fractureCooldownT = 0.65;
        pieces.push(frag);
      }

      spawnExplosion(target.pos, {
        kind: "pop",
        rgb: [255, 255, 255],
        r0: 10,
        r1: next === "med" ? 42 : 34,
        ttl: 0.22,
      });

      state.score += next === "med" ? 10 : 6;
      return pieces;
    }

    function resolveElasticCollision(a, b, n, penetration) {
      const invA = a.mass > 0 ? 1 / a.mass : 0;
      const invB = b.mass > 0 ? 1 / b.mass : 0;
      const invSum = invA + invB;
      if (invSum <= 0) return;

      // Positional correction.
      const slop = 0.5;
      const corr = Math.max(0, penetration - slop);
      if (corr > 0) {
        const percent = 0.85;
        const move = mul(n, (corr * percent) / invSum);
        a.pos = sub(a.pos, mul(move, invA));
        b.pos = add(b.pos, mul(move, invB));
      }

      const rv = sub(b.vel, a.vel);
      const velAlongNormal = dot(rv, n);
      if (velAlongNormal >= 0) return;

      const e = state.params.restitution;
      const j = (-(1 + e) * velAlongNormal) / invSum;
      const impulse = mul(n, j);
      a.vel = sub(a.vel, mul(impulse, invA));
      b.vel = add(b.vel, mul(impulse, invB));
    }

    function handleCollisions() {
      if (state.mode !== "playing") return;

      // Ship vs med/large.
      const shipRemovals = new Set();
      for (const a of state.asteroids) {
        if (a.attached) continue;
        if (a.size === "small") {
          if (isDamagingSmall(a, len(a.vel)) && circleHit(state.ship, a)) {
            breakSmallAsteroid(a, { velHint: a.vel, removeSet: shipRemovals });
          }
          continue;
        }
        const hit = circleCollide(state.ship, a);
        if (!hit) continue;
        if (state.settings.shipExplodesOnImpact) {
          state.mode = "gameover";
          return;
        }
        resolveElasticCollision(state.ship, a, hit.n, hit.penetration);
      }
      if (shipRemovals.size) {
        state.asteroids = state.asteroids.filter((a) => !shipRemovals.has(a.id));
      }

      // Asteroid vs asteroid.
      const toRemove = new Set();
      const toAdd = [];
      const count = state.asteroids.length;
      for (let i = 0; i < count; i++) {
        const a = state.asteroids[i];
        if (a.attached || toRemove.has(a.id)) continue;
        for (let j = i + 1; j < count; j++) {
          const b = state.asteroids[j];
          if (b.attached || toRemove.has(b.id)) continue;
          const hit = circleCollide(a, b);
          if (!hit) continue;

          const rv = sub(b.vel, a.vel);
          const velAlongNormal = dot(rv, hit.n);
          const impactSpeed = -velAlongNormal;
          const relSpeed = len(rv);

          const aDamaging = isDamagingSmall(a, relSpeed);
          const bDamaging = isDamagingSmall(b, relSpeed);
          if (aDamaging || bDamaging) {
            const damagingSmall = aDamaging ? a : b;
            const other = damagingSmall === a ? b : a;

            // The fast small self-destructs on any impact.
            breakSmallAsteroid(damagingSmall, { velHint: damagingSmall.vel, removeSet: toRemove });

            if (other.size === "small") {
              // At blast speeds: annihilate both smalls.
              breakSmallAsteroid(other, { velHint: other.vel, removeSet: toRemove });
              state.score += 1;
            } else if (relSpeed >= state.params.fractureImpactSpeed) {
              // Break med/large into two pieces (large->2 med, med->2 small).
              const impactDir = damagingSmall === a ? hit.n : mul(hit.n, -1);
              const frags = fractureAsteroid(other, impactDir, relSpeed);
              if (frags) {
                toRemove.add(other.id);
                const room = Math.max(
                  0,
                  state.params.maxAsteroids - (state.asteroids.length + toAdd.length - toRemove.size),
                );
                toAdd.push(...frags.slice(0, room));
              }
            } else {
              // Not enough energy to fracture: just a visible hit + shove.
              spawnExplosion(other.pos, { kind: "tiny", rgb: [255, 89, 100], r0: 4, r1: 14, ttl: 0.14 });
              other.vel = add(other.vel, mul(hit.n, Math.min(180, relSpeed * 0.5)));
            }
            continue;
          }

          if (relSpeed > 190 && (a.hitFxT <= 0 || b.hitFxT <= 0)) {
            const mid = mul(add(a.pos, b.pos), 0.5);
            spawnExplosion(mid, { kind: "tiny", rgb: [255, 255, 255], r0: 4, r1: 16, ttl: 0.12 });
            a.hitFxT = 0.08;
            b.hitFxT = 0.08;
          }
          resolveElasticCollision(a, b, hit.n, hit.penetration);
        }
      }

      if (toRemove.size) {
        state.asteroids = state.asteroids.filter((a) => !toRemove.has(a.id));
      }
      if (toAdd.length) state.asteroids.push(...toAdd);
    }

    function update(dt) {
      if (state.mode !== "playing") return;
      state.time += dt;
      state.burstCooldown = Math.max(0, state.burstCooldown - dt);
      state.blastPulseT = Math.max(0, state.blastPulseT - dt);
      for (let i = state.effects.length - 1; i >= 0; i--) {
        const e = state.effects[i];
        e.t += dt;
        if (e.t >= e.ttl) state.effects.splice(i, 1);
      }
      if (state.input.burst) {
        state.input.burst = false;
        burstAttached();
      }
      updateShip(dt);
      updateAsteroids(dt);
      updateGems(dt);
      handleGemShipCollisions();
      handleCollisions();
    }

    function render(ctx) {
      const w = state.view.w;
      const h = state.view.h;
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = "rgba(231,240,255,0.55)";
      for (let i = 0; i < 70; i++) {
        const x = ((i * 97) % 997) / 997;
        const y = ((i * 241) % 863) / 863;
        ctx.fillRect(x * w, y * h, 1, 1);
      }
      ctx.restore();

      ctx.save();
      ctx.translate(w / 2, h / 2);

      if (state.mode === "playing") {
        // Force field ring (where collected small asteroids stick).
        const pulse = clamp(state.blastPulseT / 0.22, 0, 1);
        ctx.save();
        ctx.strokeStyle = "rgba(255,221,88,0.40)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(state.ship.pos.x, state.ship.pos.y, state.params.forceFieldRadius, 0, Math.PI * 2);
        ctx.stroke();

        if (pulse > 0) {
          // Quick KISS blast feedback: white-hot ring + faint red ring.
          ctx.strokeStyle = `rgba(255,255,255,${lerp(0.0, 0.85, pulse).toFixed(3)})`;
          ctx.lineWidth = lerp(2, 6, pulse);
          ctx.beginPath();
          ctx.arc(state.ship.pos.x, state.ship.pos.y, state.params.forceFieldRadius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = `rgba(255,89,100,${lerp(0.0, 0.55, pulse).toFixed(3)})`;
          ctx.lineWidth = lerp(1, 4, pulse);
          ctx.beginPath();
          ctx.arc(state.ship.pos.x, state.ship.pos.y, state.params.forceFieldRadius + lerp(0, 10, pulse), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        // Debug-only attraction radius.
        if (state.settings.showAttractRadius) {
          ctx.save();
          ctx.strokeStyle = "rgba(86,183,255,0.12)";
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 10]);
          ctx.lineDashOffset = 0;
          ctx.beginPath();
          ctx.arc(state.ship.pos.x, state.ship.pos.y, state.params.attractRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      for (const a of state.asteroids) {
        const base =
          a.size === "large"
            ? "rgba(231,240,255,0.72)"
            : a.size === "med"
              ? "rgba(231,240,255,0.80)"
              : "rgba(231,240,255,0.88)";
        const color = a.attached ? "rgba(255,221,88,0.95)" : base;
        drawPolyline(ctx, a.shape, a.pos.x, a.pos.y, a.rot, color, 2);
      }

      // Gems (dropped from broken small asteroids).
      for (const g of state.gems) {
        const [rr, gg, bb] = gemRgb(g.kind);
        const r = g.radius;
        ctx.save();
        ctx.translate(g.pos.x, g.pos.y);

        // Glow
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(${rr},${gg},${bb},0.20)`;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${rr},${gg},${bb},0.14)`;
        ctx.beginPath();
        ctx.arc(0, 0, r * 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";

        // Core
        ctx.fillStyle = `rgba(${rr},${gg},${bb},0.95)`;
        if (g.kind === "diamond") {
          ctx.rotate(g.spin);
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(r, 0);
          ctx.lineTo(0, r);
          ctx.lineTo(-r, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.45)";
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.22)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Effects (KISS explosions).
      for (const e of state.effects) {
        const t = clamp(e.t / e.ttl, 0, 1);
        const r = lerp(e.r0, e.r1, t);
        const alpha = (1 - t) * 0.9;
        const [rr, gg, bb] = e.rgb;
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `rgb(${rr},${gg},${bb})`;
        ctx.lineWidth = e.kind === "ring" ? lerp(6, 1, t) : lerp(3, 1, t);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        if (e.kind === "ring" || e.kind === "pop") {
          const rays = e.kind === "ring" ? 10 : 6;
          ctx.lineWidth = 1;
          ctx.globalAlpha = alpha * 0.6;
          for (let i = 0; i < rays; i++) {
            const ang = ((i + (e.seed % 10) * 0.1) / rays) * Math.PI * 2;
            const r0 = e.kind === "ring" ? r * 1.0 : r * 0.55;
            const r1 = e.kind === "ring" ? r + 26 : r * 1.05;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
            ctx.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      const ship = state.ship;
      ctx.save();
      ctx.translate(ship.pos.x, ship.pos.y);
      ctx.rotate(ship.angle);
      ctx.strokeStyle = "rgba(231,240,255,0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-12, -10);
      ctx.lineTo(-7, 0);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.stroke();

      if (state.mode === "playing" && state.input.up) {
        ctx.strokeStyle = "rgba(255, 89, 100, 0.9)";
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-20 - (Math.sin(state.time * 30) * 3 + 2), 0);
        ctx.stroke();
      }
      ctx.restore();

      ctx.restore();

      ctx.save();
      ctx.fillStyle = "rgba(231,240,255,0.85)";
      ctx.font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      const attached = state.asteroids.filter((a) => a.attached).length;
      const large = state.asteroids.filter((a) => a.size === "large").length;
      const med = state.asteroids.filter((a) => a.size === "med").length;
      const small = state.asteroids.filter((a) => a.size === "small").length;
      if (state.mode === "playing") {
        ctx.fillText(
          `Attached: ${attached}   Small: ${small}   Med: ${med}   Large: ${large}   Score: ${state.score}`,
          14,
          18,
        );
      } else if (state.mode === "gameover") {
        ctx.fillStyle = "rgba(255,89,100,0.92)";
        ctx.font = "16px ui-sans-serif, system-ui";
        ctx.fillText("Impact with a medium/large asteroid. Press R to restart.", 14, 28);
      }
      ctx.restore();
    }

    function renderGameToText() {
      const ship = state.ship;
      const attached = state.asteroids.filter((a) => a.attached).length;
      const counts = state.asteroids.reduce(
        (acc, a) => {
          acc[a.size] = (acc[a.size] || 0) + 1;
          return acc;
        },
        { small: 0, med: 0, large: 0 },
      );
      const gemsOnField = state.gems.reduce(
        (acc, g) => {
          acc[g.kind] = (acc[g.kind] || 0) + 1;
          return acc;
        },
        { diamond: 0, ruby: 0, emerald: 0 },
      );
      const sample = state.asteroids.slice(0, 10).map((a) => ({
        size: a.size,
        attached: a.attached,
        x: Math.round(a.pos.x),
        y: Math.round(a.pos.y),
        r: Math.round(a.radius),
      }));
      return JSON.stringify({
        coordinate_system: "World coords are pixels with origin at canvas center. +x right, +y down.",
        mode: state.mode,
        view: { w: state.view.w, h: state.view.h },
        ship: {
          x: Math.round(ship.pos.x),
          y: Math.round(ship.pos.y),
          vx: Math.round(ship.vel.x),
          vy: Math.round(ship.vel.y),
          angle: +ship.angle.toFixed(3),
        },
        field: { radius: state.params.forceFieldRadius },
        attract: { radius: state.params.attractRadius, debug: state.settings.showAttractRadius },
        counts: { ...counts, attached, score: state.score },
        gems_on_field: gemsOnField,
        gems_collected: { ...state.gemsCollected },
        sample_asteroids: sample,
      });
    }

    return {
      state,
      startGame,
      resetWorld,
      resize,
      update,
      render,
      renderGameToText,
    };
  }

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const menu = document.getElementById("menu");
  const hudScore = document.getElementById("hud-score");
  const startBtn = document.getElementById("start-btn");
  const dbgAttract = document.getElementById("dbg-attract");
  const shipExplode = document.getElementById("ship-explode");
  const tuneAttract = document.getElementById("tune-attract");
  const tuneAttractOut = document.getElementById("tune-attract-out");
  const tuneAttractSave = document.getElementById("tune-attract-save");
  const tuneAttractDefault = document.getElementById("tune-attract-default");
  const tuneField = document.getElementById("tune-field");
  const tuneFieldOut = document.getElementById("tune-field-out");
  const tuneFieldSave = document.getElementById("tune-field-save");
  const tuneFieldDefault = document.getElementById("tune-field-default");
  const tuneGravity = document.getElementById("tune-gravity");
  const tuneGravityOut = document.getElementById("tune-gravity-out");
  const tuneGravitySave = document.getElementById("tune-gravity-save");
  const tuneGravityDefault = document.getElementById("tune-gravity-default");
  const tuneCapture = document.getElementById("tune-capture");
  const tuneCaptureOut = document.getElementById("tune-capture-out");
  const tuneCaptureSave = document.getElementById("tune-capture-save");
  const tuneCaptureDefault = document.getElementById("tune-capture-default");
  const tuneBurst = document.getElementById("tune-burst");
  const tuneBurstOut = document.getElementById("tune-burst-out");
  const tuneBurstSave = document.getElementById("tune-burst-save");
  const tuneBurstDefault = document.getElementById("tune-burst-default");
  const tuneDmg = document.getElementById("tune-dmg");
  const tuneDmgOut = document.getElementById("tune-dmg-out");
  const tuneDmgSave = document.getElementById("tune-dmg-save");
  const tuneDmgDefault = document.getElementById("tune-dmg-default");
  const tuneFracture = document.getElementById("tune-fracture");
  const tuneFractureOut = document.getElementById("tune-fracture-out");
  const tuneFractureSave = document.getElementById("tune-fracture-save");
  const tuneFractureDefault = document.getElementById("tune-fracture-default");

  const game = createGame({ width: canvas.width, height: canvas.height });

  const nf = new Intl.NumberFormat();
  function setOut(outEl, value, suffix = "") {
    if (!outEl) return;
    outEl.textContent = `${nf.format(Math.round(value))}${suffix}`;
  }

  function readNum(el, fallback) {
    const v = el ? Number(el.value) : Number.NaN;
    return Number.isFinite(v) ? v : fallback;
  }

  const TUNING_DEFAULTS_STORAGE_KEY = "blasteroids.tuningDefaults.v1";
  const TUNING_FIELDS = [
    {
      key: "attractRadius",
      input: tuneAttract,
      saveBtn: tuneAttractSave,
      savedOut: tuneAttractDefault,
      suffix: " px",
    },
    {
      key: "forceFieldRadius",
      input: tuneField,
      saveBtn: tuneFieldSave,
      savedOut: tuneFieldDefault,
      suffix: " px",
    },
    {
      key: "gravityK",
      input: tuneGravity,
      saveBtn: tuneGravitySave,
      savedOut: tuneGravityDefault,
      suffix: "",
    },
    {
      key: "captureSpeed",
      input: tuneCapture,
      saveBtn: tuneCaptureSave,
      savedOut: tuneCaptureDefault,
      suffix: " px/s",
    },
    {
      key: "burstSpeed",
      input: tuneBurst,
      saveBtn: tuneBurstSave,
      savedOut: tuneBurstDefault,
      suffix: " px/s",
    },
    {
      key: "smallDamageSpeedMin",
      input: tuneDmg,
      saveBtn: tuneDmgSave,
      savedOut: tuneDmgDefault,
      suffix: " px/s",
    },
    {
      key: "fractureImpactSpeed",
      input: tuneFracture,
      saveBtn: tuneFractureSave,
      savedOut: tuneFractureDefault,
      suffix: " px/s",
    },
  ];

  function readTuningDefaultsFromStorage() {
    try {
      const raw = localStorage.getItem(TUNING_DEFAULTS_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      const out = {};
      for (const f of TUNING_FIELDS) {
        const v = parsed[f.key];
        if (Number.isFinite(Number(v))) out[f.key] = Number(v);
      }
      return out;
    } catch {
      return null;
    }
  }

  function writeTuningDefaultsToStorage(obj) {
    try {
      localStorage.setItem(TUNING_DEFAULTS_STORAGE_KEY, JSON.stringify(obj));
    } catch {
      // ignore (private mode / blocked storage)
    }
  }

  function setTuningDefault(key, value) {
    const next = { ...(readTuningDefaultsFromStorage() || {}) };
    next[key] = value;
    writeTuningDefaultsToStorage(next);
    return next;
  }

  function applyTuningDefaultsToParams() {
    const defaults = readTuningDefaultsFromStorage();
    if (!defaults) return;
    const p = game.state.params;
    for (const f of TUNING_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(defaults, f.key)) continue;
      p[f.key] = defaults[f.key];
    }

    // Normalize and keep storage sane if an old combo is invalid.
    const before = {
      attractRadius: p.attractRadius,
      forceFieldRadius: p.forceFieldRadius,
    };
    p.forceFieldRadius = clamp(p.forceFieldRadius, 40, Math.max(60, p.attractRadius - 40));
    if (
      Object.prototype.hasOwnProperty.call(defaults, "forceFieldRadius") &&
      before.forceFieldRadius !== p.forceFieldRadius
    ) {
      defaults.forceFieldRadius = p.forceFieldRadius;
      writeTuningDefaultsToStorage(defaults);
    }
    if (Object.prototype.hasOwnProperty.call(defaults, "attractRadius") && before.attractRadius !== p.attractRadius) {
      defaults.attractRadius = p.attractRadius;
      writeTuningDefaultsToStorage(defaults);
    }
  }

  function syncTuningDefaultLabels() {
    const defaults = readTuningDefaultsFromStorage() || {};
    for (const f of TUNING_FIELDS) {
      const v = defaults[f.key];
      if (Number.isFinite(v)) setOut(f.savedOut, v, f.suffix);
      else if (f.savedOut) f.savedOut.textContent = "—";
    }
  }

  function syncTuningUiFromParams() {
    const p = game.state.params;
    if (tuneAttract) tuneAttract.value = String(Math.round(p.attractRadius));
    if (tuneField) tuneField.value = String(Math.round(p.forceFieldRadius));
    if (tuneGravity) tuneGravity.value = String(Math.round(p.gravityK));
    if (tuneCapture) tuneCapture.value = String(Math.round(p.captureSpeed));
    if (tuneBurst) tuneBurst.value = String(Math.round(p.burstSpeed));
    if (tuneDmg) tuneDmg.value = String(Math.round(p.smallDamageSpeedMin));
    if (tuneFracture) tuneFracture.value = String(Math.round(p.fractureImpactSpeed));
    syncTuningUiLabels();
  }

  function syncTuningUiLabels() {
    const p = game.state.params;
    setOut(tuneAttractOut, readNum(tuneAttract, p.attractRadius), " px");
    setOut(tuneFieldOut, readNum(tuneField, p.forceFieldRadius), " px");
    setOut(tuneGravityOut, readNum(tuneGravity, p.gravityK));
    setOut(tuneCaptureOut, readNum(tuneCapture, p.captureSpeed), " px/s");
    setOut(tuneBurstOut, readNum(tuneBurst, p.burstSpeed), " px/s");
    setOut(tuneDmgOut, readNum(tuneDmg, p.smallDamageSpeedMin), " px/s");
    setOut(tuneFractureOut, readNum(tuneFracture, p.fractureImpactSpeed), " px/s");
  }

  function bindTuneInput(el) {
    if (!el) return;
    el.addEventListener("input", () => syncTuningUiLabels());
  }
  bindTuneInput(tuneAttract);
  bindTuneInput(tuneField);
  bindTuneInput(tuneGravity);
  bindTuneInput(tuneCapture);
  bindTuneInput(tuneBurst);
  bindTuneInput(tuneDmg);
  bindTuneInput(tuneFracture);

  function applyTuningFromMenu() {
    const p = game.state.params;
    p.attractRadius = readNum(tuneAttract, p.attractRadius);
    p.forceFieldRadius = readNum(tuneField, p.forceFieldRadius);
    // Ensure the inner forcefield ring stays inside the outer gravity radius.
    p.forceFieldRadius = clamp(p.forceFieldRadius, 40, Math.max(60, p.attractRadius - 40));
    p.gravityK = readNum(tuneGravity, p.gravityK);
    p.captureSpeed = readNum(tuneCapture, p.captureSpeed);
    p.burstSpeed = readNum(tuneBurst, p.burstSpeed);
    p.smallDamageSpeedMin = readNum(tuneDmg, p.smallDamageSpeedMin);
    p.fractureImpactSpeed = readNum(tuneFracture, p.fractureImpactSpeed);
    syncTuningUiFromParams();
  }

  function setMenuVisible(visible) {
    menu.style.display = visible ? "grid" : "none";
  }

  function start() {
    applyTuningFromMenu();
    setMenuVisible(false);
    game.state.settings.showAttractRadius = !!dbgAttract?.checked;
    game.state.settings.shipExplodesOnImpact = !!shipExplode?.checked;
    game.startGame();
  }

  startBtn.addEventListener("click", () => start());
  applyTuningDefaultsToParams();
  syncTuningUiFromParams();
  applyTuningFromMenu();
  syncTuningDefaultLabels();

  for (const f of TUNING_FIELDS) {
    if (!f.saveBtn || !f.input) continue;
    f.saveBtn.addEventListener("click", () => {
      const p = game.state.params;
      const v = readNum(f.input, p[f.key]);
      setTuningDefault(f.key, v);
      syncTuningDefaultLabels();
      const prev = f.saveBtn.textContent;
      f.saveBtn.textContent = "Saved";
      window.setTimeout(() => {
        f.saveBtn.textContent = prev;
      }, 800);
    });
  }

  function resizeCanvasToCss() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = Math.max(2, Math.floor(rect.width * dpr));
    const h = Math.max(2, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      game.resize(w, h);
    }
  }

  window.addEventListener("resize", () => resizeCanvasToCss());
  resizeCanvasToCss();

  const input = game.state.input;
  function setKey(e, isDown) {
    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        input.left = isDown;
        e.preventDefault();
        break;
      case "ArrowRight":
      case "KeyD":
        input.right = isDown;
        e.preventDefault();
        break;
      case "ArrowUp":
      case "KeyW":
        input.up = isDown;
        e.preventDefault();
        break;
      case "ArrowDown":
      case "KeyS":
        input.down = isDown;
        e.preventDefault();
        break;
      case "Space":
        if (isDown) input.burst = true;
        e.preventDefault();
        break;
      case "KeyR":
        if (isDown) {
          game.resetWorld();
          game.state.mode = "playing";
          setMenuVisible(false);
        }
        break;
      case "KeyF":
        if (isDown) toggleFullscreen();
        break;
    }
  }

  window.addEventListener("keydown", (e) => setKey(e, true));
  window.addEventListener("keyup", (e) => setKey(e, false));

  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0 && game.state.mode === "playing") input.burst = true;
  });

  function toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  document.addEventListener("fullscreenchange", () => resizeCanvasToCss());

  let externalStepping = false;
  let last = performance.now();
  let accumulator = 0;
  const fixedDt = 1 / 60;

  function stepRealTime(ts) {
    const dtMs = Math.min(50, ts - last);
    last = ts;
    accumulator += dtMs / 1000;

    if (!externalStepping) {
      while (accumulator >= fixedDt) {
        game.update(fixedDt);
        accumulator -= fixedDt;
      }
    } else {
      accumulator = 0;
    }

    game.render(ctx);
    if (hudScore) hudScore.textContent = `Score: ${nf.format(game.state.score)}`;
    requestAnimationFrame(stepRealTime);
  }
  requestAnimationFrame(stepRealTime);

  window.render_game_to_text = () => game.renderGameToText();
  window.advanceTime = (ms) => {
    externalStepping = true;
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let i = 0; i < steps; i++) game.update(1 / 60);
    game.render(ctx);
    if (hudScore) hudScore.textContent = `Score: ${nf.format(game.state.score)}`;
  };

  canvas.addEventListener("click", () => {
    if (game.state.mode === "menu") start();
  });
})();
