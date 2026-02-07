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

  function posMod(v, m) {
    const r = v % m;
    return r < 0 ? r + m : r;
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

  function drawPolyline(ctx, pts, x, y, angle, color, lineWidth = 2, fillColor = null) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const px = Math.cos(p.a) * p.r;
      const py = Math.sin(p.a) * p.r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
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
    const starRng = seededRng(0x51a7f00d);
    const state = {
      mode: "menu", // menu | playing | gameover
      time: 0,
      ship: makeShip(),
      asteroids: [],
      gems: [],
      effects: [],
      saucer: null,
      saucerLasers: [],
      saucerSpawnT: 0,
      asteroidSpawnT: 0,
      score: 0,
      gemsCollected: { diamond: 0, ruby: 0, emerald: 0, gold: 0 },
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
      // Large-arena scaffold (phase LA-01). Kept equal to view for now.
      world: {
        scale: 3,
        w: width,
        h: height,
      },
      worldCells: {
        sizePx: 320,
        asteroidCounts: new Map(),
        activeKeys: new Set(),
      },
      background: {
        tilePx: 1024,
        layers: [],
      },
      // Camera scaffold (phase LA-01). Render transform changes come later.
      camera: {
        x: 0,
        y: 0,
        mode: "deadzone", // centered | deadzone
        deadZoneFracX: 0.35,
        deadZoneFracY: 0.3,
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
        innerGravityMult: 1.5, // extra gravity inside the forcefield ring
        innerDrag: 4.0, // damp velocity inside ring to reduce "slingshot" escapes
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
        asteroidSpawnMinSec: 0.18,
        asteroidSpawnMaxSec: 0.45,
        asteroidSpawnUrgentMinSec: 0.05,
        asteroidSpawnUrgentMaxSec: 0.12,

        // Damage model for fast smalls (velocity-based; no time limit).
        smallDamageSpeedMin: 420,

        gemTtlSec: 6,
        gemBlinkMaxHz: 5,
        starDensityScale: 1,
        starParallaxStrength: 1,
        starAccentChance: 0.06,
        starTwinkleChance: 0.18,
        starTwinkleStrength: 0.45,
        starTwinkleSpeed: 1.2,

        // Flying saucer (enemy) — occasional, non-wrapping pass across the playfield.
        saucerSpawnMinSec: 14,
        saucerSpawnMaxSec: 26,
        saucerRadius: 36,
        saucerSpeed: 145,
        saucerFirstShotMinSec: 0.7,
        saucerFirstShotMaxSec: 1.3,
        saucerBurstShotMin: 1,
        saucerBurstShotMax: 2,
        saucerBurstGapMinSec: 0.12,
        saucerBurstGapMaxSec: 0.28,
        saucerBurstPauseMinSec: 1.0,
        saucerBurstPauseMaxSec: 3.0,
        saucerLaserSpeed: 520,
        saucerLaserRadius: 4,
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
        shipLaunched: false,
        orbitA: 0, // ship-local angle (radians) when attached
        fractureCooldownT: 0,
        hitFxT: 0,
      };
    }

    function scheduleNextSaucerSpawn() {
      state.saucerSpawnT = lerp(state.params.saucerSpawnMinSec, state.params.saucerSpawnMaxSec, rng());
    }

    function asteroidSeedCount() {
      return Math.max(1, state.params.largeCount + state.params.medCount + state.params.smallCount);
    }

    function rebuildStarfield() {
      const density = clamp(state.params.starDensityScale || 1, 0.4, 2.2);
      const accentChance = clamp(state.params.starAccentChance || 0, 0, 0.35);
      const twinkleChance = clamp(state.params.starTwinkleChance || 0, 0, 1);
      const tile = state.background.tilePx;
      const accentPalette = [
        [255, 226, 150], // gold
        [255, 176, 185], // red accent
        [142, 198, 255], // blue accent
      ];
      const layerSpecs = [
        { baseCount: 95, parallax: 0.14, radius: 0.9, alpha: 0.42 },
        { baseCount: 70, parallax: 0.36, radius: 1.25, alpha: 0.56 },
        { baseCount: 48, parallax: 0.68, radius: 1.8, alpha: 0.78 },
      ];
      state.background.layers = layerSpecs.map((spec, li) => {
        const count = Math.max(24, Math.round(spec.baseCount * density));
        const stars = [];
        for (let i = 0; i < count; i++) {
          const isAccent = starRng() < accentChance;
          let color;
          if (isAccent) {
            const pick = accentPalette[Math.floor(starRng() * accentPalette.length)];
            color = { r: pick[0], g: pick[1], b: pick[2] };
          } else {
            const tintJitter = li === 0 ? starRng() * 18 : starRng() * 12;
            color = { r: 231 + Math.round(tintJitter), g: 240, b: 255 };
          }
          const twinkles = starRng() < twinkleChance;
          stars.push({
            x: starRng() * tile,
            y: starRng() * tile,
            r: spec.radius * (0.8 + starRng() * 0.6),
            a: spec.alpha * (0.82 + starRng() * 0.36),
            color,
            twinklePhase: starRng() * Math.PI * 2,
            twinkleFreqHz: lerp(0.45, 1.35, starRng()),
            twinkleAmp: twinkles ? 0.55 + starRng() * 0.45 : 0,
          });
        }
        return { ...spec, stars };
      });
    }

    function worldCellCoordsForPos(pos) {
      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;
      const s = Math.max(64, state.worldCells.sizePx || 320);
      const cx = Math.floor((pos.x + halfW) / s);
      const cy = Math.floor((pos.y + halfH) / s);
      return { cx, cy };
    }

    function worldCellKey(cx, cy) {
      return `${cx},${cy}`;
    }

    function rebuildWorldCellIndex() {
      const counts = state.worldCells.asteroidCounts;
      counts.clear();
      for (const a of state.asteroids) {
        const { cx, cy } = worldCellCoordsForPos(a.pos);
        const key = worldCellKey(cx, cy);
        counts.set(key, (counts.get(key) || 0) + 1);
      }

      const s = Math.max(64, state.worldCells.sizePx || 320);
      const radiusX = Math.ceil((state.view.w * 0.5) / s) + 1;
      const radiusY = Math.ceil((state.view.h * 0.5) / s) + 1;
      const center = worldCellCoordsForPos(vec(state.camera.x, state.camera.y));
      const active = new Set();
      for (let dy = -radiusY; dy <= radiusY; dy++) {
        for (let dx = -radiusX; dx <= radiusX; dx++) {
          active.add(worldCellKey(center.cx + dx, center.cy + dy));
        }
      }
      state.worldCells.activeKeys = active;
    }

    function asteroidPopulationBudget() {
      const seed = asteroidSeedCount();
      const viewArea = Math.max(1, state.view.w * state.view.h);
      const worldArea = Math.max(1, state.world.w * state.world.h);
      const scaledTarget = Math.round(seed * (worldArea / viewArea));
      const max = Math.max(1, Math.floor(state.params.maxAsteroids));
      const target = clamp(scaledTarget, Math.min(seed, max), max);
      const min = clamp(Math.floor(target * 0.8), 8, target);
      return { min, target, max };
    }

    function scheduleNextAsteroidSpawn(urgent = false) {
      const lo = urgent ? state.params.asteroidSpawnUrgentMinSec : state.params.asteroidSpawnMinSec;
      const hi = urgent ? state.params.asteroidSpawnUrgentMaxSec : state.params.asteroidSpawnMaxSec;
      state.asteroidSpawnT = lerp(lo, hi, rng());
    }

    function pickSpawnAsteroidSize() {
      const wl = Math.max(1, state.params.largeCount);
      const wm = Math.max(1, state.params.medCount);
      const ws = Math.max(1, state.params.smallCount);
      const sum = wl + wm + ws;
      const r = rng() * sum;
      if (r < wl) return "large";
      if (r < wl + wm) return "med";
      return "small";
    }

    function trySpawnAmbientAsteroid() {
      const size = pickSpawnAsteroidSize();
      const radius = asteroidRadiusForSize(state.params, size);
      const halfViewW = state.view.w / 2;
      const halfViewH = state.view.h / 2;
      const spawnPad = radius + 44;
      const p = vec(0, 0);
      const cameraPos = vec(state.camera.x, state.camera.y);

      for (let t = 0; t < 24; t++) {
        const side = Math.floor(rng() * 4); // 0 left, 1 right, 2 top, 3 bottom
        if (side === 0) {
          p.x = state.camera.x - halfViewW - spawnPad;
          p.y = state.camera.y + (rng() * 2 - 1) * halfViewH * 0.95;
        } else if (side === 1) {
          p.x = state.camera.x + halfViewW + spawnPad;
          p.y = state.camera.y + (rng() * 2 - 1) * halfViewH * 0.95;
        } else if (side === 2) {
          p.x = state.camera.x + (rng() * 2 - 1) * halfViewW * 0.95;
          p.y = state.camera.y - halfViewH - spawnPad;
        } else {
          p.x = state.camera.x + (rng() * 2 - 1) * halfViewW * 0.95;
          p.y = state.camera.y + halfViewH + spawnPad;
        }

        // Keep spawns inside world bounds.
        const halfWorldW = state.world.w / 2;
        const halfWorldH = state.world.h / 2;
        p.x = clamp(p.x, -halfWorldW + radius, halfWorldW - radius);
        p.y = clamp(p.y, -halfWorldH + radius, halfWorldH - radius);

        const cell = worldCellCoordsForPos(p);
        const cellKey = worldCellKey(cell.cx, cell.cy);
        if (!state.worldCells.activeKeys.has(cellKey)) continue;
        const cellCount = state.worldCells.asteroidCounts.get(cellKey) || 0;
        if (cellCount >= 10) continue;

        const shipClear = len2(sub(p, state.ship.pos)) > 260 * 260;
        if (!shipClear) continue;

        let overlap = false;
        for (const other of state.asteroids) {
          const min = radius + other.radius + 8;
          if (len2(sub(p, other.pos)) < min * min) {
            overlap = true;
            break;
          }
        }
        if (overlap) continue;

        const toCam = norm(sub(cameraPos, p));
        const drift = vec((rng() * 2 - 1) * 0.7, (rng() * 2 - 1) * 0.7);
        const dirRaw = add(toCam, drift);
        const dir = len2(dirRaw) <= 1e-9 ? angleToVec(rng() * Math.PI * 2) : norm(dirRaw);
        const speedBase = size === "large" ? 36 : size === "med" ? 50 : 68;
        const speed = speedBase * (0.85 + rng() * 0.35);
        const v = mul(dir, speed);
        state.asteroids.push(makeAsteroid(size, vec(p.x, p.y), v));
        state.worldCells.asteroidCounts.set(cellKey, cellCount + 1);
        return true;
      }

      return false;
    }

    function maintainAsteroidPopulation(dt) {
      const { min, target, max } = asteroidPopulationBudget();
      const count = state.asteroids.length;
      if (count >= target) return;
      if (count >= max) return;

      state.asteroidSpawnT -= dt;
      if (state.asteroidSpawnT > 0) return;

      const urgent = count < min;
      const spawned = trySpawnAmbientAsteroid();
      scheduleNextAsteroidSpawn(urgent);
      if (!spawned && urgent) {
        // Retry soon when urgent and blocked by local crowding.
        state.asteroidSpawnT = Math.min(state.asteroidSpawnT, 0.04);
      }
    }

    function randIntInclusive(min, max) {
      const lo = Math.floor(Math.min(min, max));
      const hi = Math.floor(Math.max(min, max));
      return lo + Math.floor(rng() * (hi - lo + 1));
    }

    function spawnSaucer() {
      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;
      const spawnPad = 56;

      const side = Math.floor(rng() * 4); // 0 left, 1 right, 2 top, 3 bottom
      const speed = state.params.saucerSpeed * (0.85 + rng() * 0.35);
      const drift = (rng() * 2 - 1) * speed * 0.22;

      let pos = vec(0, 0);
      let vel = vec(0, 0);
      if (side === 0) {
        pos = vec(-halfW - spawnPad, (rng() * 2 - 1) * halfH * 0.85);
        vel = vec(speed, drift);
      } else if (side === 1) {
        pos = vec(halfW + spawnPad, (rng() * 2 - 1) * halfH * 0.85);
        vel = vec(-speed, drift);
      } else if (side === 2) {
        pos = vec((rng() * 2 - 1) * halfW * 0.85, -halfH - spawnPad);
        vel = vec(drift, speed);
      } else {
        pos = vec((rng() * 2 - 1) * halfW * 0.85, halfH + spawnPad);
        vel = vec(drift, -speed);
      }

      const baseVel = vec(vel.x, vel.y);
      const forward = norm(baseVel);
      const swayDir = len2(forward) <= 1e-9 ? vec(0, 1) : vec(-forward.y, forward.x);
      const burstMin = Math.max(1, Math.floor(state.params.saucerBurstShotMin || 1));
      const burstMax = Math.max(burstMin, Math.floor(state.params.saucerBurstShotMax || 2));

      state.saucer = {
        id: `saucer-${Math.floor(rng() * 1e9)}`,
        pos,
        vel,
        radius: Math.max(10, state.params.saucerRadius || 18),
        seenInside: false,
        lifeSec: 0,
        baseVel,
        swayDir,
        swayFreqHz: lerp(0.22, 0.46, rng()),
        swaySpeed: speed * lerp(0.15, 0.32, rng()),
        burstShotsRemaining: randIntInclusive(burstMin, burstMax),
        shotCooldown: lerp(state.params.saucerFirstShotMinSec, state.params.saucerFirstShotMaxSec, rng()),
      };
    }

    function fireSaucerLaser(saucer) {
      if (!saucer) return;
      const ship = state.ship;
      const dir = norm(sub(ship.pos, saucer.pos));
      const useDir = len2(dir) <= 1e-9 ? angleToVec(rng() * Math.PI * 2) : dir;
      const r = Math.max(1, state.params.saucerLaserRadius || 4);
      const muzzle = add(saucer.pos, mul(useDir, saucer.radius + r + 3));
      state.saucerLasers.push({
        id: `saucerLaser-${Math.floor(rng() * 1e9)}`,
        pos: vec(muzzle.x, muzzle.y),
        vel: mul(useDir, Math.max(50, state.params.saucerLaserSpeed || 520)),
        radius: r,
        ageSec: 0,
        bornAtSec: state.time,
      });
      spawnExplosion(muzzle, { kind: "tiny", rgb: [255, 221, 88], r0: 3, r1: 14, ttl: 0.12 });
    }

    function updateSaucer(dt) {
      if (!state.saucer) {
        state.saucerSpawnT -= dt;
        if (state.saucerSpawnT <= 0) spawnSaucer();
        return;
      }

      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;
      const s = state.saucer;
      s.lifeSec += dt;
      const swayPhase = s.lifeSec * Math.PI * 2 * s.swayFreqHz;
      const swayVel = mul(s.swayDir, Math.sin(swayPhase) * s.swaySpeed);
      s.vel = add(s.baseVel, swayVel);
      s.pos = add(s.pos, mul(s.vel, dt));

      const inside = Math.abs(s.pos.x) <= halfW && Math.abs(s.pos.y) <= halfH;
      if (inside) s.seenInside = true;

      if (s.seenInside) {
        const burstMin = Math.max(1, Math.floor(state.params.saucerBurstShotMin || 1));
        const burstMax = Math.max(burstMin, Math.floor(state.params.saucerBurstShotMax || 2));
        s.shotCooldown = Math.max(0, s.shotCooldown - dt);
        if (s.shotCooldown <= 0) {
          fireSaucerLaser(s);
          s.burstShotsRemaining = Math.max(0, s.burstShotsRemaining - 1);
          if (s.burstShotsRemaining > 0) {
            s.shotCooldown = lerp(state.params.saucerBurstGapMinSec, state.params.saucerBurstGapMaxSec, rng());
          } else {
            s.burstShotsRemaining = randIntInclusive(burstMin, burstMax);
            s.shotCooldown = lerp(state.params.saucerBurstPauseMinSec, state.params.saucerBurstPauseMaxSec, rng());
          }
        }
      }

      const despawnPad = 120;
      const outside =
        s.pos.x < -halfW - despawnPad ||
        s.pos.x > halfW + despawnPad ||
        s.pos.y < -halfH - despawnPad ||
        s.pos.y > halfH + despawnPad;
      if ((s.seenInside && outside) || s.lifeSec > 30) {
        state.saucer = null;
        scheduleNextSaucerSpawn();
      }
    }

    function updateSaucerLasers(dt) {
      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;
      for (let i = state.saucerLasers.length - 1; i >= 0; i--) {
        const b = state.saucerLasers[i];
        b.ageSec += dt;
        b.pos = add(b.pos, mul(b.vel, dt));
        const outside = b.pos.x <= -halfW || b.pos.x >= halfW || b.pos.y <= -halfH || b.pos.y >= halfH;
        if (outside) state.saucerLasers.splice(i, 1);
      }
    }

    function handleSaucerLaserShipCollisions() {
      if (state.mode !== "playing") return;
      for (let i = state.saucerLasers.length - 1; i >= 0; i--) {
        const b = state.saucerLasers[i];
        if (!circleHit(b, state.ship)) continue;
        state.saucerLasers.splice(i, 1);
        spawnExplosion(state.ship.pos, { kind: "pop", rgb: [255, 221, 88], r0: 6, r1: 30, ttl: 0.18 });
        if (state.settings.shipExplodesOnImpact) {
          state.mode = "gameover";
          return;
        }
        const pushDir = norm(b.vel);
        state.ship.vel = add(state.ship.vel, mul(pushDir, 170));
      }
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
      if (kind === "gold") return [255, 221, 88];
      if (kind === "diamond") return [86, 183, 255];
      if (kind === "ruby") return [255, 89, 100];
      return [84, 240, 165]; // emerald
    }

    function gemPoints(kind) {
      if (kind === "gold") return 250;
      if (kind === "diamond") return 100;
      if (kind === "ruby") return 25;
      return 10;
    }

    function gemRadius(kind) {
      // Baseline size is emerald. Ruby is ~15% larger; diamond is ~30% larger.
      if (kind === "gold") return 10;
      if (kind === "emerald") return 7;
      if (kind === "ruby") return 8;
      return 9; // diamond
    }

    function spawnGem(pos, velHint = vec(0, 0), options = {}) {
      const kind = options.kind || rollGemKind();
      const radiusScale = Number.isFinite(options.radiusScale) ? options.radiusScale : 1;
      const radius = gemRadius(kind) * radiusScale;
      const jitterMag = Number.isFinite(options.jitterMag) ? options.jitterMag : 50;
      const jitter = vec((rng() * 2 - 1) * jitterMag, (rng() * 2 - 1) * jitterMag);
      const ttlSec = Number.isFinite(options.ttlSec) ? options.ttlSec : Math.max(0.1, state.params.gemTtlSec || 6);
      state.gems.push({
        id: `gem-${Math.floor(rng() * 1e9)}`,
        kind,
        pos: vec(pos.x, pos.y),
        vel: add(mul(velHint, 0.25), jitter),
        radius,
        spin: rng() * Math.PI * 2,
        spinVel: (rng() * 2 - 1) * 2.8,
        ageSec: 0,
        ttlSec,
        pulsePhase: rng(), // [0,1)
        pulseAlpha: 1,
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
      state.saucer = null;
      state.saucerLasers = [];
      scheduleNextSaucerSpawn();
      scheduleNextAsteroidSpawn(false);
      state.gemsCollected = { diamond: 0, ruby: 0, emerald: 0, gold: 0 };
      state.input.left = false;
      state.input.right = false;
      state.input.up = false;
      state.input.down = false;
      state.input.burst = false;
      state.ship = makeShip();
      syncCameraToShip();
      state.asteroids = [];
      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;

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
      rebuildWorldCellIndex();
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
        a.shipLaunched = false;
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
        a.shipLaunched = true;
        a.pos = orbitPosFor(a);
        const dir = norm(sub(a.pos, state.ship.pos));
        const base = mul(dir, state.params.burstSpeed);
        a.vel = add(base, mul(shipV, 0.55));
        a.rotVel += (rng() * 2 - 1) * 1.8;
      }
    }

    function clampCameraToWorld() {
      const halfWorldW = state.world.w / 2;
      const halfWorldH = state.world.h / 2;
      const halfViewW = state.view.w / 2;
      const halfViewH = state.view.h / 2;

      const minCamX = halfViewW - halfWorldW;
      const maxCamX = halfWorldW - halfViewW;
      const minCamY = halfViewH - halfWorldH;
      const maxCamY = halfWorldH - halfViewH;

      if (minCamX <= maxCamX) state.camera.x = clamp(state.camera.x, minCamX, maxCamX);
      else state.camera.x = 0;
      if (minCamY <= maxCamY) state.camera.y = clamp(state.camera.y, minCamY, maxCamY);
      else state.camera.y = 0;
    }

    function syncCameraToShip() {
      if (state.camera.mode === "deadzone") {
        const ship = state.ship;
        const dzHalfW = Math.max(0, (state.view.w * state.camera.deadZoneFracX) / 2);
        const dzHalfH = Math.max(0, (state.view.h * state.camera.deadZoneFracY) / 2);
        const dx = ship.pos.x - state.camera.x;
        const dy = ship.pos.y - state.camera.y;

        if (dx > dzHalfW) state.camera.x = ship.pos.x - dzHalfW;
        else if (dx < -dzHalfW) state.camera.x = ship.pos.x + dzHalfW;

        if (dy > dzHalfH) state.camera.y = ship.pos.y - dzHalfH;
        else if (dy < -dzHalfH) state.camera.y = ship.pos.y + dzHalfH;
      } else {
        // Baseline camera behavior.
        state.camera.x = state.ship.pos.x;
        state.camera.y = state.ship.pos.y;
      }

      clampCameraToWorld();
    }

    function confineShipToWorld() {
      const ship = state.ship;
      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;
      const minX = -halfW + ship.radius;
      const maxX = halfW - ship.radius;
      const minY = -halfH + ship.radius;
      const maxY = halfH - ship.radius;

      if (ship.pos.x < minX) {
        ship.pos.x = minX;
        if (ship.vel.x < 0) ship.vel.x = 0;
      } else if (ship.pos.x > maxX) {
        ship.pos.x = maxX;
        if (ship.vel.x > 0) ship.vel.x = 0;
      }

      if (ship.pos.y < minY) {
        ship.pos.y = minY;
        if (ship.vel.y < 0) ship.vel.y = 0;
      } else if (ship.pos.y > maxY) {
        ship.pos.y = maxY;
        if (ship.vel.y > 0) ship.vel.y = 0;
      }
    }

    function isOutsideWorld(body, pad = 0) {
      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;
      const r = Math.max(0, body.radius || 0);
      return (
        body.pos.x < -halfW - r - pad ||
        body.pos.x > halfW + r + pad ||
        body.pos.y < -halfH - r - pad ||
        body.pos.y > halfH + r + pad
      );
    }

    function applyWorldScale(scale) {
      const s = clamp(Number(scale) || 1, 1, 4);
      state.world.scale = s;
      state.world.w = state.view.w * s;
      state.world.h = state.view.h * s;
      confineShipToWorld();
      clampCameraToWorld();
    }

    function setArenaConfig({ cameraMode, worldScale } = {}) {
      if (cameraMode === "centered" || cameraMode === "deadzone") {
        state.camera.mode = cameraMode;
      }
      if (Number.isFinite(Number(worldScale))) {
        applyWorldScale(Number(worldScale));
      } else {
        clampCameraToWorld();
      }
    }

    function refreshBackground() {
      rebuildStarfield();
    }

    function resize(w, h) {
      state.view.w = w;
      state.view.h = h;
      applyWorldScale(state.world.scale);
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
      confineShipToWorld();
    }

    function updateAsteroids(dt) {
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

      for (let i = state.asteroids.length - 1; i >= 0; i--) {
        const a = state.asteroids[i];
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
            const insideRing = d < state.params.forceFieldRadius;
            const innerMult = insideRing ? state.params.innerGravityMult : 1;
            const innerT = insideRing ? clamp(1 - d / Math.max(1, state.params.forceFieldRadius), 0, 1) : 0;
            a.vel = add(a.vel, mul(dirIn, grav * innerMult * dt));

            // Extra damping inside the ring to help captures settle and reduce slingshot escapes.
            if (innerT > 0) {
              a.vel = mul(a.vel, Math.max(0, 1 - state.params.innerDrag * innerT * dt));
            }

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
        if (isOutsideWorld(a, 8)) {
          state.asteroids.splice(i, 1);
          continue;
        }
        a.rot += a.rotVel * dt;
      }
    }

    function updateGems(dt) {
      const ship = state.ship;

      for (let i = state.gems.length - 1; i >= 0; i--) {
        const g = state.gems[i];
        g.ageSec += dt;
        if (g.ageSec >= g.ttlSec) {
          state.gems.splice(i, 1);
          continue;
        }

        // Throb instead of blink: gems fade bright<->dim and never fully disappear.
        const ttl = Math.max(0.001, g.ttlSec || 6);
        const lifeT = clamp(g.ageSec / ttl, 0, 1);
        const maxHz = clamp(state.params.gemBlinkMaxHz || 5, 0.25, 12);
        const throbHz = lerp(0.75, maxHz, lifeT * lifeT);
        g.pulsePhase = (g.pulsePhase + dt * throbHz) % 1;
        const wave = 0.5 + 0.5 * Math.sin(g.pulsePhase * Math.PI * 2);
        const minAlpha = lerp(0.6, 0.3, lifeT);
        g.pulseAlpha = lerp(minAlpha, 1, wave);

        const toShip = sub(ship.pos, g.pos);
        const d2 = len2(toShip);
        const d = Math.max(8, Math.sqrt(d2));
        const dirIn = mul(toShip, 1 / d);
        const soft = Math.max(16, state.params.gravitySoftening * 0.55);
        const core = Math.max(1, state.ship.radius + g.radius + 30);
        const coreBoost = 1 + (core * core) / (d2 + core * core);
        const grav = (state.params.gravityK * coreBoost) / (d2 + soft * soft);
        g.vel = add(g.vel, mul(dirIn, grav * dt));
        g.vel = mul(g.vel, Math.max(0, 1 - 0.08 * dt));

        const spd = len(g.vel);
        if (spd > 900) g.vel = mul(g.vel, 900 / spd);

        g.pos = add(g.pos, mul(g.vel, dt));
        if (isOutsideWorld(g, 18)) {
          state.gems.splice(i, 1);
          continue;
        }
        g.spin += g.spinVel * dt;
      }
    }

    function handleGemShipCollisions() {
      if (state.mode !== "playing") return;
      for (let i = state.gems.length - 1; i >= 0; i--) {
        const g = state.gems[i];
        const pickR = state.ship.radius + g.radius + 20;
        if (len2(sub(g.pos, state.ship.pos)) > pickR * pickR) continue;
        state.gems.splice(i, 1);
        state.gemsCollected[g.kind] = (state.gemsCollected[g.kind] || 0) + 1;
        state.score += gemPoints(g.kind);
        spawnExplosion(state.ship.pos, { kind: "tiny", rgb: gemRgb(g.kind), r0: 4, r1: 16, ttl: 0.14 });
      }
    }

    function handleSaucerAsteroidCollisions() {
      if (state.mode !== "playing" || !state.saucer) return;
      const saucer = state.saucer;
      for (const a of state.asteroids) {
        if (a.attached) continue;
        if (!a.shipLaunched) continue;
        if (!circleHit(saucer, a)) continue;
        const dropVel = add(mul(a.vel, 0.7), mul(saucer.vel, 0.3));
        spawnExplosion(saucer.pos, { kind: "pop", rgb: [255, 221, 88], r0: 14, r1: 56, ttl: 0.24 });
        spawnExplosion(saucer.pos, { kind: "ring", rgb: [255, 221, 88], r0: 20, r1: 88, ttl: 0.2 });
        spawnGem(saucer.pos, dropVel, { kind: "gold", radiusScale: 1.0, jitterMag: 20, ttlSec: 18 });
        state.score += 125;
        state.saucer = null;
        scheduleNextSaucerSpawn();
        return;
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

    function forEachNearbyAsteroidPair(fn) {
      const cellSize = 180;
      const buckets = new Map();
      const asteroids = state.asteroids;
      for (let i = 0; i < asteroids.length; i++) {
        const a = asteroids[i];
        if (a.attached) continue;
        const cx = Math.floor(a.pos.x / cellSize);
        const cy = Math.floor(a.pos.y / cellSize);
        const key = `${cx},${cy}`;
        const list = buckets.get(key);
        if (list) list.push(i);
        else buckets.set(key, [i]);
      }

      const offsets = [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
        [1, -1],
      ];

      for (const [key, listA] of buckets) {
        const parts = key.split(",");
        const cx = Number(parts[0]);
        const cy = Number(parts[1]);
        for (const [dx, dy] of offsets) {
          const nk = `${cx + dx},${cy + dy}`;
          const listB = buckets.get(nk);
          if (!listB) continue;
          if (dx === 0 && dy === 0) {
            for (let ia = 0; ia < listA.length; ia++) {
              for (let ib = ia + 1; ib < listA.length; ib++) {
                fn(listA[ia], listA[ib]);
              }
            }
          } else {
            for (let ia = 0; ia < listA.length; ia++) {
              for (let ib = 0; ib < listB.length; ib++) {
                fn(listA[ia], listB[ib]);
              }
            }
          }
        }
      }
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
      forEachNearbyAsteroidPair((i, j) => {
        const a = state.asteroids[i];
        const b = state.asteroids[j];
        if (!a || !b) return;
        if (a.attached || b.attached) return;
        if (toRemove.has(a.id) || toRemove.has(b.id)) return;

        const hit = circleCollide(a, b);
        if (!hit) return;

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
              const room = Math.max(0, state.params.maxAsteroids - (state.asteroids.length + toAdd.length - toRemove.size));
              toAdd.push(...frags.slice(0, room));
            }
          } else {
            // Not enough energy to fracture: just a visible hit + shove.
            spawnExplosion(other.pos, { kind: "tiny", rgb: [255, 89, 100], r0: 4, r1: 14, ttl: 0.14 });
            other.vel = add(other.vel, mul(hit.n, Math.min(180, relSpeed * 0.5)));
          }
          return;
        }

        if (relSpeed > 190 && (a.hitFxT <= 0 || b.hitFxT <= 0)) {
          const mid = mul(add(a.pos, b.pos), 0.5);
          spawnExplosion(mid, { kind: "tiny", rgb: [255, 255, 255], r0: 4, r1: 16, ttl: 0.12 });
          a.hitFxT = 0.08;
          b.hitFxT = 0.08;
        }
        resolveElasticCollision(a, b, hit.n, hit.penetration);
      });

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
      syncCameraToShip();
      updateAsteroids(dt);
      updateGems(dt);
      updateSaucer(dt);
      updateSaucerLasers(dt);
      handleSaucerAsteroidCollisions();
      handleGemShipCollisions();
      handleSaucerLaserShipCollisions();
      handleCollisions();
      rebuildWorldCellIndex();
      maintainAsteroidPopulation(dt);
    }

    function render(ctx) {
      const w = state.view.w;
      const h = state.view.h;
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      const strength = clamp(state.params.starParallaxStrength || 1, 0, 1.8);
      const twinkleStrength = clamp(state.params.starTwinkleStrength || 0, 0, 0.8);
      const twinkleSpeed = clamp(state.params.starTwinkleSpeed || 1, 0.2, 3);
      const twinkleTime = state.mode === "playing" ? state.time : performance.now() / 1000;
      const tile = state.background.tilePx;
      for (const layer of state.background.layers) {
        const p = layer.parallax * strength;
        const ox = posMod(-state.camera.x * p, tile);
        const oy = posMod(-state.camera.y * p, tile);
        for (let by = oy - tile; by < h + tile; by += tile) {
          for (let bx = ox - tile; bx < w + tile; bx += tile) {
            for (const s of layer.stars) {
              const px = bx + s.x;
              const py = by + s.y;
              if (px < -6 || px > w + 6 || py < -6 || py > h + 6) continue;
              let starAlpha = s.a;
              let starRadius = s.r;
              if (s.twinkleAmp > 0 && twinkleStrength > 0) {
                const phase = twinkleTime * Math.PI * 2 * s.twinkleFreqHz * twinkleSpeed + s.twinklePhase;
                const wave = 0.5 + 0.5 * Math.sin(phase);
                const amp = clamp(s.twinkleAmp * twinkleStrength, 0, 0.8);
                const alphaScale = 1 - amp * 0.7 + wave * amp * 1.4;
                const radiusScale = 1 + (wave - 0.5) * amp * 0.52;
                starAlpha = clamp(starAlpha * alphaScale, 0.04, 1);
                starRadius = clamp(starRadius * radiusScale, 0.45, 3.2);
              }
              ctx.fillStyle = `rgba(${s.color.r},${s.color.g},${s.color.b},${starAlpha.toFixed(3)})`;
              ctx.beginPath();
              ctx.arc(px, py, starRadius, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
      ctx.restore();

      ctx.save();
      // World-space rendering: camera position maps to screen center.
      ctx.translate(w / 2 - state.camera.x, h / 2 - state.camera.y);

      // Arena edge (phase LA-06 first pass): simple boundary line.
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.26)";
      ctx.lineWidth = 2;
      ctx.strokeRect(-state.world.w / 2, -state.world.h / 2, state.world.w, state.world.h);
      ctx.restore();

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
        drawPolyline(ctx, a.shape, a.pos.x, a.pos.y, a.rot, color, 2, "rgba(0,0,0,0.92)");
      }

      // Gems (dropped from broken small asteroids).
      for (const g of state.gems) {
        const [rr, gg, bb] = gemRgb(g.kind);
        const r = g.radius;
        const pulseA = clamp(g.pulseAlpha ?? 1, 0.25, 1);
        ctx.save();
        ctx.translate(g.pos.x, g.pos.y);

        // Glow
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(${rr},${gg},${bb},${(0.14 + pulseA * 0.18).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${rr},${gg},${bb},${(0.1 + pulseA * 0.11).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(0, 0, r * 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";

        // Core
        ctx.fillStyle = `rgba(${rr},${gg},${bb},${(0.4 + pulseA * 0.58).toFixed(3)})`;
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
          ctx.strokeStyle = `rgba(255,255,255,${(0.16 + pulseA * 0.2).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Flying saucer + lasers (no wrap).
      if (state.saucer) {
        const s = state.saucer;
        ctx.save();
        ctx.translate(s.pos.x, s.pos.y);

        // Glow
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "rgba(86,183,255,0.14)";
        ctx.beginPath();
        ctx.ellipse(0, 0, s.radius * 1.6, s.radius * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";

        // Body
        ctx.strokeStyle = "rgba(86,183,255,0.92)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 3, s.radius * 1.25, s.radius * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, -3, s.radius * 0.55, s.radius * 0.42, 0, Math.PI, 0);
        ctx.stroke();

        // Windows
        ctx.fillStyle = "rgba(231,240,255,0.78)";
        const winY = 2;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.arc(i * (s.radius * 0.42), winY, 2.1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      for (const b of state.saucerLasers) {
        const lifeT = clamp(b.ageSec / 1.2, 0, 1);
        const alpha = lerp(0.95, 0.72, lifeT);
        const ang = angleOf(b.vel);
        const lenPx = 24;
        ctx.save();
        ctx.translate(b.pos.x, b.pos.y);
        ctx.rotate(ang);
        ctx.lineCap = "round";

        // Outer soft glow.
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = `rgba(255,221,88,${(alpha * 0.6).toFixed(3)})`;
        ctx.lineWidth = 9;
        ctx.shadowColor = "rgba(255,221,88,0.95)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(-lenPx * 0.5, 0);
        ctx.lineTo(lenPx * 0.5, 0);
        ctx.stroke();

        // Bright core beam.
        ctx.globalCompositeOperation = "source-over";
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255,250,190,${alpha.toFixed(3)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-lenPx * 0.5, 0);
        ctx.lineTo(lenPx * 0.5, 0);
        ctx.stroke();
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
        { diamond: 0, ruby: 0, emerald: 0, gold: 0 },
      );
      const sample = state.asteroids.slice(0, 10).map((a) => ({
        size: a.size,
        attached: a.attached,
        x: Math.round(a.pos.x),
        y: Math.round(a.pos.y),
        r: Math.round(a.radius),
      }));
      return JSON.stringify({
        coordinate_system:
          "World coords are pixels with origin at world center; screen center follows camera. +x right, +y down.",
        mode: state.mode,
        view: { w: state.view.w, h: state.view.h },
        world: { w: state.world.w, h: state.world.h },
        world_cells: {
          size_px: state.worldCells.sizePx,
          active_count: state.worldCells.activeKeys.size,
          indexed_asteroid_cells: state.worldCells.asteroidCounts.size,
        },
        background: {
          star_density: +state.params.starDensityScale.toFixed(2),
          parallax_strength: +state.params.starParallaxStrength.toFixed(2),
          accent_star_chance: +state.params.starAccentChance.toFixed(2),
          twinkle_star_chance: +state.params.starTwinkleChance.toFixed(2),
          twinkle_strength: +state.params.starTwinkleStrength.toFixed(2),
          twinkle_speed: +state.params.starTwinkleSpeed.toFixed(2),
          layers: state.background.layers.length,
        },
        camera: {
          x: Math.round(state.camera.x),
          y: Math.round(state.camera.y),
          mode: state.camera.mode,
        },
        ship: {
          x: Math.round(ship.pos.x),
          y: Math.round(ship.pos.y),
          vx: Math.round(ship.vel.x),
          vy: Math.round(ship.vel.y),
          angle: +ship.angle.toFixed(3),
        },
        saucer: state.saucer
          ? {
              x: Math.round(state.saucer.pos.x),
              y: Math.round(state.saucer.pos.y),
              shots_remaining: state.saucer.burstShotsRemaining,
              lasers: state.saucerLasers.length,
            }
          : null,
        field: { radius: state.params.forceFieldRadius },
        attract: { radius: state.params.attractRadius, debug: state.settings.showAttractRadius },
        counts: { ...counts, attached, score: state.score },
        gems_on_field: gemsOnField,
        gems_collected: { ...state.gemsCollected },
        sample_asteroids: sample,
      });
    }

    rebuildStarfield();

    return {
      state,
      startGame,
      resetWorld,
      resize,
      setArenaConfig,
      refreshBackground,
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
  const dbgCameraMode = document.getElementById("dbg-camera-mode");
  const dbgWorldScale = document.getElementById("dbg-world-scale");
  const dbgWorldScaleOut = document.getElementById("dbg-world-scale-out");
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
  const tuneInnerGrav = document.getElementById("tune-inner-grav");
  const tuneInnerGravOut = document.getElementById("tune-inner-grav-out");
  const tuneInnerGravSave = document.getElementById("tune-inner-grav-save");
  const tuneInnerGravDefault = document.getElementById("tune-inner-grav-default");
  const tuneGemTtl = document.getElementById("tune-gem-ttl");
  const tuneGemTtlOut = document.getElementById("tune-gem-ttl-out");
  const tuneGemTtlSave = document.getElementById("tune-gem-ttl-save");
  const tuneGemTtlDefault = document.getElementById("tune-gem-ttl-default");
  const tuneGemBlink = document.getElementById("tune-gem-blink");
  const tuneGemBlinkOut = document.getElementById("tune-gem-blink-out");
  const tuneGemBlinkSave = document.getElementById("tune-gem-blink-save");
  const tuneGemBlinkDefault = document.getElementById("tune-gem-blink-default");
  const tuneCapture = document.getElementById("tune-capture");
  const tuneCaptureOut = document.getElementById("tune-capture-out");
  const tuneCaptureSave = document.getElementById("tune-capture-save");
  const tuneCaptureDefault = document.getElementById("tune-capture-default");
  const tuneBurst = document.getElementById("tune-burst");
  const tuneBurstOut = document.getElementById("tune-burst-out");
  const tuneBurstSave = document.getElementById("tune-burst-save");
  const tuneBurstDefault = document.getElementById("tune-burst-default");
  const tuneThrust = document.getElementById("tune-thrust");
  const tuneThrustOut = document.getElementById("tune-thrust-out");
  const tuneThrustSave = document.getElementById("tune-thrust-save");
  const tuneThrustDefault = document.getElementById("tune-thrust-default");
  const tuneDmg = document.getElementById("tune-dmg");
  const tuneDmgOut = document.getElementById("tune-dmg-out");
  const tuneDmgSave = document.getElementById("tune-dmg-save");
  const tuneDmgDefault = document.getElementById("tune-dmg-default");
  const tuneFracture = document.getElementById("tune-fracture");
  const tuneFractureOut = document.getElementById("tune-fracture-out");
  const tuneFractureSave = document.getElementById("tune-fracture-save");
  const tuneFractureDefault = document.getElementById("tune-fracture-default");
  const tuneStarDensity = document.getElementById("tune-star-density");
  const tuneStarDensityOut = document.getElementById("tune-star-density-out");
  const tuneStarDensitySave = document.getElementById("tune-star-density-save");
  const tuneStarDensityDefault = document.getElementById("tune-star-density-default");
  const tuneParallax = document.getElementById("tune-parallax");
  const tuneParallaxOut = document.getElementById("tune-parallax-out");
  const tuneParallaxSave = document.getElementById("tune-parallax-save");
  const tuneParallaxDefault = document.getElementById("tune-parallax-default");
  const tuneStarAccentChance = document.getElementById("tune-star-accent-chance");
  const tuneStarAccentChanceOut = document.getElementById("tune-star-accent-chance-out");
  const tuneStarAccentChanceSave = document.getElementById("tune-star-accent-chance-save");
  const tuneStarAccentChanceDefault = document.getElementById("tune-star-accent-chance-default");
  const tuneTwinkleChance = document.getElementById("tune-twinkle-chance");
  const tuneTwinkleChanceOut = document.getElementById("tune-twinkle-chance-out");
  const tuneTwinkleChanceSave = document.getElementById("tune-twinkle-chance-save");
  const tuneTwinkleChanceDefault = document.getElementById("tune-twinkle-chance-default");
  const tuneTwinkleStrength = document.getElementById("tune-twinkle-strength");
  const tuneTwinkleStrengthOut = document.getElementById("tune-twinkle-strength-out");
  const tuneTwinkleStrengthSave = document.getElementById("tune-twinkle-strength-save");
  const tuneTwinkleStrengthDefault = document.getElementById("tune-twinkle-strength-default");
  const tuneTwinkleSpeed = document.getElementById("tune-twinkle-speed");
  const tuneTwinkleSpeedOut = document.getElementById("tune-twinkle-speed-out");
  const tuneTwinkleSpeedSave = document.getElementById("tune-twinkle-speed-save");
  const tuneTwinkleSpeedDefault = document.getElementById("tune-twinkle-speed-default");

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
      key: "innerGravityMult",
      input: tuneInnerGrav,
      saveBtn: tuneInnerGravSave,
      savedOut: tuneInnerGravDefault,
      suffix: "",
      format: (v) => `x${Number(v).toFixed(2)}`,
    },
    {
      key: "gemTtlSec",
      input: tuneGemTtl,
      saveBtn: tuneGemTtlSave,
      savedOut: tuneGemTtlDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(1)} s`,
    },
    {
      key: "gemBlinkMaxHz",
      input: tuneGemBlink,
      saveBtn: tuneGemBlinkSave,
      savedOut: tuneGemBlinkDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(1)} /s`,
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
      key: "shipThrust",
      input: tuneThrust,
      saveBtn: tuneThrustSave,
      savedOut: tuneThrustDefault,
      suffix: " px/s^2",
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
    {
      key: "starDensityScale",
      input: tuneStarDensity,
      saveBtn: tuneStarDensitySave,
      savedOut: tuneStarDensityDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "starParallaxStrength",
      input: tuneParallax,
      saveBtn: tuneParallaxSave,
      savedOut: tuneParallaxDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "starAccentChance",
      input: tuneStarAccentChance,
      saveBtn: tuneStarAccentChanceSave,
      savedOut: tuneStarAccentChanceDefault,
      suffix: "",
      format: (v) => `${(Number(v) * 100).toFixed(0)}%`,
    },
    {
      key: "starTwinkleChance",
      input: tuneTwinkleChance,
      saveBtn: tuneTwinkleChanceSave,
      savedOut: tuneTwinkleChanceDefault,
      suffix: "",
      format: (v) => `${(Number(v) * 100).toFixed(0)}%`,
    },
    {
      key: "starTwinkleStrength",
      input: tuneTwinkleStrength,
      saveBtn: tuneTwinkleStrengthSave,
      savedOut: tuneTwinkleStrengthDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "starTwinkleSpeed",
      input: tuneTwinkleSpeed,
      saveBtn: tuneTwinkleSpeedSave,
      savedOut: tuneTwinkleSpeedDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
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
      if (Number.isFinite(v)) {
        if (f.format && f.savedOut) f.savedOut.textContent = f.format(v);
        else setOut(f.savedOut, v, f.suffix);
      }
      else if (f.savedOut) f.savedOut.textContent = "—";
    }
  }

  function syncTuningUiFromParams() {
    const p = game.state.params;
    if (tuneAttract) tuneAttract.value = String(Math.round(p.attractRadius));
    if (tuneField) tuneField.value = String(Math.round(p.forceFieldRadius));
    if (tuneGravity) tuneGravity.value = String(Math.round(p.gravityK));
    if (tuneInnerGrav) tuneInnerGrav.value = String(p.innerGravityMult);
    if (tuneGemTtl) tuneGemTtl.value = String(p.gemTtlSec);
    if (tuneGemBlink) tuneGemBlink.value = String(p.gemBlinkMaxHz);
    if (tuneCapture) tuneCapture.value = String(Math.round(p.captureSpeed));
    if (tuneBurst) tuneBurst.value = String(Math.round(p.burstSpeed));
    if (tuneThrust) tuneThrust.value = String(Math.round(p.shipThrust));
    if (tuneDmg) tuneDmg.value = String(Math.round(p.smallDamageSpeedMin));
    if (tuneFracture) tuneFracture.value = String(Math.round(p.fractureImpactSpeed));
    if (tuneStarDensity) tuneStarDensity.value = String(p.starDensityScale);
    if (tuneParallax) tuneParallax.value = String(p.starParallaxStrength);
    if (tuneStarAccentChance) tuneStarAccentChance.value = String(p.starAccentChance);
    if (tuneTwinkleChance) tuneTwinkleChance.value = String(p.starTwinkleChance);
    if (tuneTwinkleStrength) tuneTwinkleStrength.value = String(p.starTwinkleStrength);
    if (tuneTwinkleSpeed) tuneTwinkleSpeed.value = String(p.starTwinkleSpeed);
    syncTuningUiLabels();
  }

  function syncTuningUiLabels() {
    const p = game.state.params;
    setOut(tuneAttractOut, readNum(tuneAttract, p.attractRadius), " px");
    setOut(tuneFieldOut, readNum(tuneField, p.forceFieldRadius), " px");
    setOut(tuneGravityOut, readNum(tuneGravity, p.gravityK));
    if (tuneInnerGravOut) tuneInnerGravOut.textContent = `x${readNum(tuneInnerGrav, p.innerGravityMult).toFixed(2)}`;
    if (tuneGemTtlOut) tuneGemTtlOut.textContent = `${readNum(tuneGemTtl, p.gemTtlSec).toFixed(1)} s`;
    if (tuneGemBlinkOut) tuneGemBlinkOut.textContent = `${readNum(tuneGemBlink, p.gemBlinkMaxHz).toFixed(1)} /s`;
    setOut(tuneCaptureOut, readNum(tuneCapture, p.captureSpeed), " px/s");
    setOut(tuneBurstOut, readNum(tuneBurst, p.burstSpeed), " px/s");
    setOut(tuneThrustOut, readNum(tuneThrust, p.shipThrust), " px/s^2");
    setOut(tuneDmgOut, readNum(tuneDmg, p.smallDamageSpeedMin), " px/s");
    setOut(tuneFractureOut, readNum(tuneFracture, p.fractureImpactSpeed), " px/s");
    if (tuneStarDensityOut) tuneStarDensityOut.textContent = `${readNum(tuneStarDensity, p.starDensityScale).toFixed(2)}x`;
    if (tuneParallaxOut) tuneParallaxOut.textContent = `${readNum(tuneParallax, p.starParallaxStrength).toFixed(2)}x`;
    if (tuneStarAccentChanceOut) {
      tuneStarAccentChanceOut.textContent = `${(readNum(tuneStarAccentChance, p.starAccentChance) * 100).toFixed(0)}%`;
    }
    if (tuneTwinkleChanceOut) {
      tuneTwinkleChanceOut.textContent = `${(readNum(tuneTwinkleChance, p.starTwinkleChance) * 100).toFixed(0)}%`;
    }
    if (tuneTwinkleStrengthOut) {
      tuneTwinkleStrengthOut.textContent = `${readNum(tuneTwinkleStrength, p.starTwinkleStrength).toFixed(2)}x`;
    }
    if (tuneTwinkleSpeedOut) {
      tuneTwinkleSpeedOut.textContent = `${readNum(tuneTwinkleSpeed, p.starTwinkleSpeed).toFixed(2)}x`;
    }
  }

  function bindTuneInput(el) {
    if (!el) return;
    el.addEventListener("input", () => syncTuningUiLabels());
  }
  bindTuneInput(tuneAttract);
  bindTuneInput(tuneField);
  bindTuneInput(tuneGravity);
  bindTuneInput(tuneInnerGrav);
  bindTuneInput(tuneGemTtl);
  bindTuneInput(tuneGemBlink);
  bindTuneInput(tuneCapture);
  bindTuneInput(tuneBurst);
  bindTuneInput(tuneThrust);
  bindTuneInput(tuneDmg);
  bindTuneInput(tuneFracture);
  bindTuneInput(tuneStarDensity);
  bindTuneInput(tuneParallax);
  bindTuneInput(tuneStarAccentChance);
  bindTuneInput(tuneTwinkleChance);
  bindTuneInput(tuneTwinkleStrength);
  bindTuneInput(tuneTwinkleSpeed);

  function applyTuningFromMenu() {
    const p = game.state.params;
    p.attractRadius = readNum(tuneAttract, p.attractRadius);
    p.forceFieldRadius = readNum(tuneField, p.forceFieldRadius);
    // Ensure the inner forcefield ring stays inside the outer gravity radius.
    p.forceFieldRadius = clamp(p.forceFieldRadius, 40, Math.max(60, p.attractRadius - 40));
    p.gravityK = readNum(tuneGravity, p.gravityK);
    p.innerGravityMult = clamp(readNum(tuneInnerGrav, p.innerGravityMult), 1, 8);
    p.gemTtlSec = clamp(readNum(tuneGemTtl, p.gemTtlSec), 0.5, 60);
    p.gemBlinkMaxHz = clamp(readNum(tuneGemBlink, p.gemBlinkMaxHz), 0.25, 12);
    p.captureSpeed = readNum(tuneCapture, p.captureSpeed);
    p.burstSpeed = readNum(tuneBurst, p.burstSpeed);
    p.shipThrust = readNum(tuneThrust, p.shipThrust);
    p.smallDamageSpeedMin = readNum(tuneDmg, p.smallDamageSpeedMin);
    p.fractureImpactSpeed = readNum(tuneFracture, p.fractureImpactSpeed);
    p.starDensityScale = clamp(readNum(tuneStarDensity, p.starDensityScale), 0.4, 2.2);
    p.starParallaxStrength = clamp(readNum(tuneParallax, p.starParallaxStrength), 0, 1.8);
    p.starAccentChance = clamp(readNum(tuneStarAccentChance, p.starAccentChance), 0, 0.35);
    p.starTwinkleChance = clamp(readNum(tuneTwinkleChance, p.starTwinkleChance), 0, 1);
    p.starTwinkleStrength = clamp(readNum(tuneTwinkleStrength, p.starTwinkleStrength), 0, 0.8);
    p.starTwinkleSpeed = clamp(readNum(tuneTwinkleSpeed, p.starTwinkleSpeed), 0.2, 3);
    game.refreshBackground();
    syncTuningUiFromParams();
  }

  function syncArenaUi() {
    if (dbgCameraMode) dbgCameraMode.value = game.state.camera.mode || "centered";
    if (dbgWorldScale) dbgWorldScale.value = String(game.state.world.scale || 1);
    if (dbgWorldScaleOut) dbgWorldScaleOut.textContent = `${Number(game.state.world.scale || 1).toFixed(2)}x`;
  }

  function applyArenaFromMenu() {
    const mode = dbgCameraMode?.value === "deadzone" ? "deadzone" : "centered";
    const scale = clamp(readNum(dbgWorldScale, game.state.world.scale || 1), 1, 4);
    game.setArenaConfig({ cameraMode: mode, worldScale: scale });
    if (dbgWorldScale) dbgWorldScale.value = String(scale);
    if (dbgWorldScaleOut) dbgWorldScaleOut.textContent = `${scale.toFixed(2)}x`;
  }

  function setMenuVisible(visible) {
    menu.style.display = visible ? "grid" : "none";
  }

  function start() {
    applyTuningFromMenu();
    applyArenaFromMenu();
    setMenuVisible(false);
    game.state.settings.showAttractRadius = !!dbgAttract?.checked;
    game.state.settings.shipExplodesOnImpact = !!shipExplode?.checked;
    game.startGame();
  }

  startBtn.addEventListener("click", () => start());
  applyTuningDefaultsToParams();
  syncTuningUiFromParams();
  applyTuningFromMenu();
  syncArenaUi();
  applyArenaFromMenu();
  syncTuningDefaultLabels();

  if (dbgCameraMode) dbgCameraMode.addEventListener("change", () => applyArenaFromMenu());
  if (dbgWorldScale) dbgWorldScale.addEventListener("input", () => applyArenaFromMenu());

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
          applyArenaFromMenu();
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
