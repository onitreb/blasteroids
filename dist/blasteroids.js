(() => {
  // src/util/math.js
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function posMod(value, modulus) {
    const r = value % modulus;
    return r < 0 ? r + modulus : r;
  }

  // src/util/angle.js
  function angleToVec(radians) {
    return { x: Math.cos(radians), y: Math.sin(radians) };
  }
  function angleOf(v) {
    return Math.atan2(v.y, v.x);
  }
  function wrapAngle(a) {
    while (a <= -Math.PI)
      a += Math.PI * 2;
    while (a > Math.PI)
      a -= Math.PI * 2;
    return a;
  }

  // src/util/rng.js
  function seededRng(seed = 305419896) {
    let s = seed >>> 0;
    return () => {
      s ^= s << 13;
      s >>>= 0;
      s ^= s >> 17;
      s >>>= 0;
      s ^= s << 5;
      s >>>= 0;
      return (s >>> 0) / 4294967295;
    };
  }

  // src/util/vec2.js
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
    if (l <= 1e-9)
      return { x: 0, y: 0 };
    return { x: a.x / l, y: a.y / l };
  }
  function rot(a, radians) {
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    return { x: a.x * c - a.y * s, y: a.x * s + a.y * c };
  }

  // src/util/collision.js
  function circleHit(a, b) {
    const d2 = len2(sub(a.pos, b.pos));
    const r = a.radius + b.radius;
    return d2 <= r * r;
  }
  function circleCollide(a, b) {
    const delta = sub(b.pos, a.pos);
    const dist2 = len2(delta);
    const minDist = a.radius + b.radius;
    if (dist2 <= 1e-9 || dist2 >= minDist * minDist)
      return null;
    const dist = Math.sqrt(dist2);
    const n = mul(delta, 1 / dist);
    return { n, dist, penetration: minDist - dist };
  }

  // src/util/asteroid.js
  var ASTEROID_SPLIT_NEXT = {
    small: null,
    med: "small",
    large: "med",
    xlarge: "large",
    xxlarge: "xlarge"
  };
  var ASTEROID_SIZE_INDEX = {
    small: 0,
    med: 1,
    large: 2,
    xlarge: 3,
    xxlarge: 4
  };
  function asteroidSizeRank(size) {
    return ASTEROID_SIZE_INDEX[size] ?? 0;
  }
  function asteroidNextSize(size) {
    return ASTEROID_SPLIT_NEXT[size] || null;
  }
  function sizeSetHas(sizeSet, size) {
    return Array.isArray(sizeSet) ? sizeSet.includes(size) : false;
  }
  function asteroidCanBreakTarget(projectileSize, targetSize) {
    const projectileRank = ASTEROID_SIZE_INDEX[projectileSize];
    const targetRank = ASTEROID_SIZE_INDEX[targetSize];
    if (!Number.isFinite(projectileRank) || !Number.isFinite(targetRank))
      return false;
    return targetRank <= projectileRank + 1;
  }
  function asteroidRadiusForSize(params, size) {
    if (size === "xxlarge")
      return params.xxlargeRadius;
    if (size === "xlarge")
      return params.xlargeRadius;
    if (size === "large")
      return params.largeRadius;
    if (size === "med")
      return params.medRadius;
    return params.smallRadius;
  }
  function asteroidMassForRadius(radius) {
    return Math.max(1, radius * radius);
  }
  function asteroidSpawnWeightForSize(params, size) {
    if (size === "xxlarge")
      return Math.max(0, params.xxlargeCount);
    if (size === "xlarge")
      return Math.max(0, params.xlargeCount);
    if (size === "large")
      return Math.max(0, params.largeCount);
    if (size === "med")
      return Math.max(0, params.medCount);
    return Math.max(0, params.smallCount);
  }
  function asteroidDamageSpeedForSize(params, size) {
    if (size === "xxlarge")
      return params.xxlargeDamageSpeedMin;
    if (size === "xlarge")
      return params.xlargeDamageSpeedMin;
    if (size === "large")
      return params.largeDamageSpeedMin;
    if (size === "med")
      return params.medDamageSpeedMin;
    return params.smallDamageSpeedMin;
  }

  // src/util/ship.js
  function polygonHullRadius(points) {
    if (!Array.isArray(points) || points.length === 0)
      return 0;
    let max2 = 0;
    for (const p of points) {
      const d2 = p.x * p.x + p.y * p.y;
      if (d2 > max2)
        max2 = d2;
    }
    return Math.sqrt(max2);
  }

  // src/engine/createEngine.js
  function makeAsteroidShape(rng, radius, verts = 10) {
    const pts = [];
    const step = Math.PI * 2 / verts;
    for (let i = 0; i < verts; i++) {
      const a = i * step;
      const jitter = 0.62 + rng() * 0.54;
      pts.push({ a, r: radius * jitter });
    }
    return pts;
  }
  var ASTEROID_SIZE_ORDER = ["small", "med", "large", "xlarge", "xxlarge"];
  var ASTEROID_BASE_SPEED = {
    small: 68,
    med: 50,
    large: 36,
    xlarge: 30,
    xxlarge: 24
  };
  var ASTEROID_VERTS = {
    small: 9,
    med: 11,
    large: 12,
    xlarge: 13,
    xxlarge: 14
  };
  var ASTEROID_ROT_VEL_MAX = {
    small: 1.2,
    med: 0.9,
    large: 0.55,
    xlarge: 0.38,
    xxlarge: 0.25
  };
  var DEFAULT_SHIP_RENDERERS = {
    small: {
      type: "polygon",
      points: [
        { x: 16, y: 0 },
        { x: -12, y: -10 },
        { x: -7, y: 0 },
        { x: -12, y: 10 }
      ],
      engines: [{ x: -12, y: 0, len: 11 }]
    },
    medium: {
      type: "polygon",
      points: [
        { x: 22, y: -14 },
        { x: 26, y: -6 },
        { x: 26, y: 6 },
        { x: 22, y: 14 },
        { x: -18, y: 14 },
        { x: -24, y: 8 },
        { x: -24, y: -8 },
        { x: -18, y: -14 }
      ],
      engines: [
        { x: -24, y: -7, len: 12 },
        { x: -24, y: 7, len: 12 }
      ]
    },
    large: {
      type: "polygon",
      points: [
        { x: 34, y: 0 },
        { x: 12, y: -24 },
        { x: -16, y: -18 },
        { x: -32, y: -8 },
        { x: -36, y: 0 },
        { x: -32, y: 8 },
        { x: -16, y: 18 },
        { x: 12, y: 24 }
      ],
      engines: [
        { x: -34, y: -12, len: 14 },
        { x: -36, y: 0, len: 16 },
        { x: -34, y: 12, len: 14 }
      ]
    }
  };
  function cloneRenderer(renderer) {
    return {
      type: renderer.type,
      points: Array.isArray(renderer.points) ? renderer.points.map((p) => ({ x: p.x, y: p.y })) : void 0,
      engines: Array.isArray(renderer.engines) ? renderer.engines.map((e) => ({ x: e.x, y: e.y, len: e.len })) : void 0
    };
  }
  var SHIP_TIERS = {
    small: {
      key: "small",
      label: "Small",
      scale: 1,
      radius: 14,
      mass: 260,
      forcefieldScale: 1,
      attractScale: 1,
      ringRgb: [255, 221, 88],
      ringColor: "rgba(255,221,88,0.40)",
      attractSizes: ["small"],
      renderer: cloneRenderer(DEFAULT_SHIP_RENDERERS.small)
    },
    medium: {
      key: "medium",
      label: "Medium",
      scale: 2.7,
      radius: 38,
      mass: 1920,
      forcefieldScale: 1.28,
      attractScale: 1.2,
      ringRgb: [92, 235, 255],
      ringColor: "rgba(92,235,255,0.42)",
      attractSizes: ["small", "med"],
      renderer: cloneRenderer(DEFAULT_SHIP_RENDERERS.medium)
    },
    large: {
      key: "large",
      label: "Large",
      scale: 8,
      radius: 112,
      mass: 16640,
      forcefieldScale: 1.62,
      attractScale: 1.42,
      ringRgb: [255, 112, 127],
      ringColor: "rgba(255,112,127,0.42)",
      attractSizes: ["small", "med", "large"],
      renderer: cloneRenderer(DEFAULT_SHIP_RENDERERS.large)
    }
  };
  var SHIP_TIER_ORDER = ["small", "medium", "large"];
  var SHIP_BASE_BY_TIER_INDEX = ["small", "medium", "large"];
  function shipTierByKey(key) {
    return SHIP_TIERS[key] || SHIP_TIERS.small;
  }
  function forceFieldScaleForTierKey(params, tierKey) {
    if (tierKey === "large")
      return clamp(Number(params?.tier3ForceFieldScale ?? SHIP_TIERS.large.forcefieldScale), 0.2, 6);
    if (tierKey === "medium")
      return clamp(Number(params?.tier2ForceFieldScale ?? SHIP_TIERS.medium.forcefieldScale), 0.2, 6);
    return clamp(Number(params?.tier1ForceFieldScale ?? SHIP_TIERS.small.forcefieldScale), 0.2, 6);
  }
  function shipHullRadiusForTierKey(tierKey) {
    const tier = shipTierByKey(tierKey);
    const renderer = tier.renderer || {};
    if (renderer.type === "svg") {
      const hullR = Number(renderer.hullRadius);
      const svgScale = Number.isFinite(Number(renderer.svgScale)) ? Number(renderer.svgScale) : 1;
      if (Number.isFinite(hullR) && hullR > 0)
        return Math.max(tier.radius, hullR * svgScale);
    }
    const points = Array.isArray(renderer.points) ? renderer.points : DEFAULT_SHIP_RENDERERS[tier.key]?.points;
    const baseR = polygonHullRadius(points);
    return Math.max(tier.radius, baseR);
  }
  function requiredForceFieldRadiusForTier(params, tierKey) {
    const base = Number(params?.forceFieldRadius ?? 0);
    const scale = forceFieldScaleForTierKey(params, tierKey);
    const desired = base * scale;
    const gap = clamp(Number(params?.forceFieldHullGap ?? 14), 0, 200);
    const hullR = shipHullRadiusForTierKey(tierKey);
    return Math.max(desired, hullR + gap);
  }
  function ensureAttractRadiusCoversForcefield(params) {
    if (!params)
      return;
    const margin = 40;
    let requiredBaseAttract = Number(params.attractRadius ?? 0);
    for (const tierKey of SHIP_TIER_ORDER) {
      const tier = shipTierByKey(tierKey);
      const attractScale = Number(tier.attractScale || 1);
      const fieldR = requiredForceFieldRadiusForTier(params, tierKey);
      const need = (fieldR + margin) / Math.max(0.1, attractScale);
      if (need > requiredBaseAttract)
        requiredBaseAttract = need;
    }
    params.attractRadius = requiredBaseAttract;
  }
  function makeShip(tierKey = "small") {
    const tier = shipTierByKey(tierKey);
    return {
      pos: vec(0, 0),
      vel: vec(0, 0),
      angle: -Math.PI / 2,
      radius: tier.radius,
      mass: tier.mass,
      tier: tier.key
    };
  }
  function shipForward(ship) {
    return angleToVec(ship.angle);
  }
  function createEngine({ width, height }) {
    const rng = seededRng(3737844653);
    const starRng = seededRng(1369960461);
    const state = {
      mode: "menu",
      // menu | playing | gameover
      time: 0,
      ship: makeShip("small"),
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
        pauseOnMenuOpen: true,
        tierOverrideEnabled: false,
        tierOverrideIndex: 1
      },
      progression: {
        gemScore: 0,
        currentTier: "small",
        tierShiftT: 0
      },
      input: {
        left: false,
        right: false,
        up: false,
        down: false,
        burst: false
      },
      view: {
        w: width,
        h: height
      },
      // Large-arena scaffold (phase LA-01). Kept equal to view for now.
      world: {
        scale: 3,
        w: width,
        h: height
      },
      worldCells: {
        sizePx: 320,
        indexedAsteroidCells: 0,
        activeCount: 0
      },
      background: {
        tilePx: 1024,
        layers: []
      },
      // Camera scaffold (phase LA-01). Render transform changes come later.
      camera: {
        x: 0,
        y: 0,
        mode: "deadzone",
        // centered | deadzone
        deadZoneFracX: 0.35,
        deadZoneFracY: 0.3,
        zoom: 1,
        zoomFrom: 1,
        zoomTo: 1,
        zoomAnimElapsed: 0,
        zoomAnimDur: 0
      },
      params: {
        shipTurnRate: 3.6,
        // rad/s
        shipThrust: 260,
        // px/s^2
        shipBrake: 220,
        shipMaxSpeed: 420,
        shipLinearDamp: 0.15,
        attractRadius: 252,
        // +5%
        forceFieldRadius: 75,
        tier1ForceFieldScale: SHIP_TIERS.small.forcefieldScale,
        tier2ForceFieldScale: SHIP_TIERS.medium.forcefieldScale,
        tier3ForceFieldScale: SHIP_TIERS.large.forcefieldScale,
        forceFieldHullGap: 14,
        gravityK: 12e5,
        // gravity-well strength (tuned)
        gravitySoftening: 70,
        innerGravityMult: 1.5,
        // extra gravity inside the forcefield ring
        innerDrag: 4,
        // damp velocity inside ring to reduce "slingshot" escapes
        ringK: 6.5,
        // pulls smalls toward the ring surface
        ringRadialDamp: 6.5,
        captureSpeed: 360,
        // ring forces fade out by this speed
        attachBand: 14,
        attachSpeedMax: 220,
        attachPadding: 6,
        burstSpeed: 546,
        // +5%
        burstCooldownSec: 0.35,
        xxlargeRadius: 150,
        xlargeRadius: 90,
        largeRadius: 54,
        medRadius: 30,
        smallRadius: 12,
        xxlargeCount: 1,
        xlargeCount: 3,
        largeCount: 6,
        medCount: 10,
        smallCount: 22,
        restitution: 0.92,
        fractureImpactSpeed: 260,
        maxAsteroids: 4e3,
        asteroidWorldDensityScale: 0.32,
        asteroidSpawnMinSec: 0.18,
        asteroidSpawnMaxSec: 0.45,
        asteroidSpawnUrgentMinSec: 0.05,
        asteroidSpawnUrgentMaxSec: 0.12,
        // Damage model for fast smalls (velocity-based; no time limit).
        smallDamageSpeedMin: 420,
        medDamageSpeedMin: 360,
        largeDamageSpeedMin: 310,
        xlargeDamageSpeedMin: 280,
        xxlargeDamageSpeedMin: 250,
        tier2UnlockGemScore: 500,
        tier3UnlockGemScore: 1e3,
        tier1Zoom: 1,
        tier2Zoom: 0.78,
        tier3Zoom: 0.58,
        tierZoomTweenSec: 0.45,
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
        saucerBurstPauseMinSec: 1,
        saucerBurstPauseMaxSec: 3,
        saucerLaserSpeed: 520,
        saucerLaserRadius: 4
      }
    };
    const worldCellAsteroidCounts = /* @__PURE__ */ new Map();
    const worldCellActiveKeys = /* @__PURE__ */ new Set();
    ensureAttractRadiusCoversForcefield(state.params);
    function shipTierForProgression() {
      if (state.settings.tierOverrideEnabled) {
        const idx = clamp(Math.round(state.settings.tierOverrideIndex || 1), 1, SHIP_BASE_BY_TIER_INDEX.length);
        return SHIP_BASE_BY_TIER_INDEX[idx - 1];
      }
      if (state.score >= state.params.tier3UnlockGemScore)
        return "large";
      if (state.score >= state.params.tier2UnlockGemScore)
        return "medium";
      return "small";
    }
    function currentShipTier() {
      return shipTierByKey(state.ship.tier);
    }
    function currentForceFieldRadius() {
      const tier = currentShipTier();
      return requiredForceFieldRadiusForTier(state.params, tier.key);
    }
    function currentAttractRadius() {
      const tier = currentShipTier();
      return state.params.attractRadius * tier.attractScale;
    }
    function currentShipAttractSizes() {
      return currentShipTier().attractSizes;
    }
    function shipCanAttractSize(size) {
      return sizeSetHas(currentShipAttractSizes(), size);
    }
    function cameraZoomForTier(tierKey) {
      if (tierKey === "large")
        return clamp(state.params.tier3Zoom, 0.35, 1.2);
      if (tierKey === "medium")
        return clamp(state.params.tier2Zoom, 0.35, 1.2);
      return clamp(state.params.tier1Zoom, 0.35, 1.2);
    }
    function beginCameraZoomTo(targetZoom, animate = true) {
      const z = clamp(targetZoom, 0.35, 1.25);
      if (!animate) {
        state.camera.zoom = z;
        state.camera.zoomFrom = z;
        state.camera.zoomTo = z;
        state.camera.zoomAnimElapsed = 0;
        state.camera.zoomAnimDur = 0;
        return;
      }
      state.camera.zoomFrom = state.camera.zoom;
      state.camera.zoomTo = z;
      state.camera.zoomAnimElapsed = 0;
      state.camera.zoomAnimDur = Math.max(0.05, state.params.tierZoomTweenSec || 0.45);
    }
    function updateCameraZoom(dt) {
      if (state.camera.zoomAnimDur <= 0)
        return;
      state.camera.zoomAnimElapsed += dt;
      const t = clamp(state.camera.zoomAnimElapsed / state.camera.zoomAnimDur, 0, 1);
      const easeOut = 1 - (1 - t) * (1 - t);
      state.camera.zoom = lerp(state.camera.zoomFrom, state.camera.zoomTo, easeOut);
      if (t >= 1) {
        state.camera.zoom = state.camera.zoomTo;
        state.camera.zoomAnimDur = 0;
      }
    }
    function applyShipTier(nextTierKey, { animateZoom = true } = {}) {
      const next = shipTierByKey(nextTierKey);
      if (state.ship.tier === next.key && state.progression.currentTier === next.key)
        return false;
      state.ship.tier = next.key;
      state.progression.currentTier = next.key;
      state.ship.radius = next.radius;
      state.ship.mass = next.mass;
      state.progression.tierShiftT = 0.7;
      beginCameraZoomTo(cameraZoomForTier(next.key), animateZoom);
      return true;
    }
    function refreshShipTierProgression(options = {}) {
      const desired = shipTierForProgression();
      const changed = applyShipTier(desired, options);
      for (const a of state.asteroids) {
        if (!a.attached)
          continue;
        if (shipCanAttractSize(a.size))
          continue;
        a.attached = false;
        a.shipLaunched = false;
      }
      return changed;
    }
    function makeAsteroid(size, pos, vel) {
      const radius = asteroidRadiusForSize(state.params, size);
      const verts = ASTEROID_VERTS[size] || ASTEROID_VERTS.small;
      const rotVelMax = ASTEROID_ROT_VEL_MAX[size] || ASTEROID_ROT_VEL_MAX.small;
      const shape = makeAsteroidShape(rng, radius, verts);
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
        orbitA: 0,
        // ship-local angle (radians) when attached
        fractureCooldownT: 0,
        hitFxT: 0
      };
    }
    function scheduleNextSaucerSpawn() {
      state.saucerSpawnT = lerp(state.params.saucerSpawnMinSec, state.params.saucerSpawnMaxSec, rng());
    }
    function asteroidSeedCount() {
      const total = ASTEROID_SIZE_ORDER.reduce((n, size) => n + asteroidSpawnWeightForSize(state.params, size), 0);
      return Math.max(1, Math.round(total));
    }
    function rebuildStarfield() {
      const density = clamp(state.params.starDensityScale || 1, 0.4, 2.2);
      const accentChance = clamp(state.params.starAccentChance || 0, 0, 0.35);
      const twinkleChance = clamp(state.params.starTwinkleChance || 0, 0, 1);
      const tile = state.background.tilePx;
      const accentPalette = [
        [255, 226, 150],
        // gold
        [255, 176, 185],
        // red accent
        [142, 198, 255]
        // blue accent
      ];
      const layerSpecs = [
        { baseCount: 95, parallax: 0.14, radius: 0.9, alpha: 0.42 },
        { baseCount: 70, parallax: 0.36, radius: 1.25, alpha: 0.56 },
        { baseCount: 48, parallax: 0.68, radius: 1.8, alpha: 0.78 }
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
            twinkleAmp: twinkles ? 0.55 + starRng() * 0.45 : 0
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
      const counts = worldCellAsteroidCounts;
      counts.clear();
      for (const a of state.asteroids) {
        const { cx, cy } = worldCellCoordsForPos(a.pos);
        const key = worldCellKey(cx, cy);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      const s = Math.max(64, state.worldCells.sizePx || 320);
      const zoom = Math.max(0.1, state.camera.zoom || 1);
      const radiusX = Math.ceil(state.view.w * 0.5 / (s * zoom)) + 1;
      const radiusY = Math.ceil(state.view.h * 0.5 / (s * zoom)) + 1;
      const center = worldCellCoordsForPos(vec(state.camera.x, state.camera.y));
      worldCellActiveKeys.clear();
      for (let dy = -radiusY; dy <= radiusY; dy++) {
        for (let dx = -radiusX; dx <= radiusX; dx++) {
          worldCellActiveKeys.add(worldCellKey(center.cx + dx, center.cy + dy));
        }
      }
      state.worldCells.indexedAsteroidCells = counts.size;
      state.worldCells.activeCount = worldCellActiveKeys.size;
    }
    function asteroidPopulationBudget() {
      const seed = asteroidSeedCount();
      const viewArea = Math.max(1, state.view.w * state.view.h);
      const worldArea = Math.max(1, state.world.w * state.world.h);
      const densityScale = clamp(state.params.asteroidWorldDensityScale || 0.32, 0.08, 2.5);
      const scaledTarget = Math.round(seed * (worldArea / viewArea) * densityScale);
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
    function isInsideViewRect(pos, radius, view, margin = 0) {
      const halfW = view.halfW + radius + margin;
      const halfH = view.halfH + radius + margin;
      return Math.abs(pos.x - view.x) <= halfW && Math.abs(pos.y - view.y) <= halfH;
    }
    function currentSpawnExclusionViews() {
      const zoom = Math.max(0.1, state.camera.zoom || 1);
      return [
        {
          x: state.camera.x,
          y: state.camera.y,
          halfW: state.view.w * 0.5 / zoom,
          halfH: state.view.h * 0.5 / zoom
        }
      ];
    }
    function pickSpawnAsteroidSize() {
      const weights = ASTEROID_SIZE_ORDER.map((size) => ({
        size,
        w: Math.max(0, asteroidSpawnWeightForSize(state.params, size))
      }));
      const sum = weights.reduce((acc, it) => acc + it.w, 0);
      if (sum <= 0)
        return "small";
      const r = rng() * sum;
      let accum = 0;
      for (const it of weights) {
        accum += it.w;
        if (r <= accum)
          return it.size;
      }
      return weights[weights.length - 1].size;
    }
    function trySpawnAmbientAsteroid({
      nearPos = null,
      nearRadius = null,
      minDistFromShip = 260,
      maxCellCount = 10,
      excludeViews = []
    } = {}) {
      const size = pickSpawnAsteroidSize();
      const radius = asteroidRadiusForSize(state.params, size);
      const p = vec(0, 0);
      const halfWorldW = state.world.w / 2;
      const halfWorldH = state.world.h / 2;
      const cellSize = Math.max(64, state.worldCells.sizePx || 320);
      const cols = Math.max(1, Math.ceil(state.world.w / cellSize));
      const rows = Math.max(1, Math.ceil(state.world.h / cellSize));
      for (let t = 0; t < 24; t++) {
        if (nearPos && Number.isFinite(nearRadius) && nearRadius > radius + 60) {
          const angle = rng() * Math.PI * 2;
          const minR = Math.max(radius + 70, minDistFromShip);
          const maxR = Math.max(minR + 8, nearRadius - radius);
          const dist = lerp(minR, maxR, rng());
          p.x = nearPos.x + Math.cos(angle) * dist;
          p.y = nearPos.y + Math.sin(angle) * dist;
        } else {
          const cx = Math.floor(rng() * cols);
          const cy = Math.floor(rng() * rows);
          const minX = -halfWorldW + cx * cellSize + radius;
          const maxX = Math.min(-halfWorldW + (cx + 1) * cellSize - radius, halfWorldW - radius);
          const minY = -halfWorldH + cy * cellSize + radius;
          const maxY = Math.min(-halfWorldH + (cy + 1) * cellSize - radius, halfWorldH - radius);
          if (minX > maxX || minY > maxY)
            continue;
          p.x = lerp(minX, maxX, rng());
          p.y = lerp(minY, maxY, rng());
        }
        p.x = clamp(p.x, -halfWorldW + radius, halfWorldW - radius);
        p.y = clamp(p.y, -halfWorldH + radius, halfWorldH - radius);
        let blockedByView = false;
        for (const view of excludeViews) {
          if (isInsideViewRect(p, radius, view, 80)) {
            blockedByView = true;
            break;
          }
        }
        if (blockedByView)
          continue;
        const cell = worldCellCoordsForPos(p);
        const cellKey = worldCellKey(cell.cx, cell.cy);
        const cellCount = worldCellAsteroidCounts.get(cellKey) || 0;
        if (cellCount >= maxCellCount)
          continue;
        const shipClear = len2(sub(p, state.ship.pos)) > minDistFromShip * minDistFromShip;
        if (!shipClear)
          continue;
        let overlap = false;
        for (const other of state.asteroids) {
          const dx = Math.abs(other.pos.x - p.x);
          const dy = Math.abs(other.pos.y - p.y);
          const min = radius + other.radius + 8;
          if (dx > min || dy > min)
            continue;
          if (dx * dx + dy * dy < min * min) {
            overlap = true;
            break;
          }
        }
        if (overlap)
          continue;
        const dir = angleToVec(rng() * Math.PI * 2);
        const speedBase = ASTEROID_BASE_SPEED[size] || ASTEROID_BASE_SPEED.small;
        const speed = speedBase * (0.85 + rng() * 0.35);
        const v = mul(dir, speed);
        state.asteroids.push(makeAsteroid(size, vec(p.x, p.y), v));
        worldCellAsteroidCounts.set(cellKey, cellCount + 1);
        return true;
      }
      return false;
    }
    function maintainAsteroidPopulation(dt) {
      const { min, target, max } = asteroidPopulationBudget();
      const count = state.asteroids.length;
      if (count >= target)
        return;
      if (count >= max)
        return;
      state.asteroidSpawnT -= dt;
      if (state.asteroidSpawnT > 0)
        return;
      const urgent = count < min;
      const deficit = Math.max(1, target - count);
      const burst = clamp(Math.ceil(deficit / 120), 1, urgent ? 56 : 20);
      const excludeViews = currentSpawnExclusionViews();
      let spawned = false;
      for (let i = 0; i < burst && state.asteroids.length < max; i++) {
        if (!trySpawnAmbientAsteroid({ excludeViews }))
          break;
        spawned = true;
      }
      scheduleNextAsteroidSpawn(urgent);
      if (!spawned && urgent) {
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
      const side = Math.floor(rng() * 4);
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
        shotCooldown: lerp(state.params.saucerFirstShotMinSec, state.params.saucerFirstShotMaxSec, rng())
      };
    }
    function fireSaucerLaser(saucer) {
      if (!saucer)
        return;
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
        bornAtSec: state.time
      });
      spawnExplosion(muzzle, { kind: "tiny", rgb: [255, 221, 88], r0: 3, r1: 14, ttl: 0.12 });
    }
    function updateSaucer(dt) {
      if (!state.saucer) {
        state.saucerSpawnT -= dt;
        if (state.saucerSpawnT <= 0)
          spawnSaucer();
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
      if (inside)
        s.seenInside = true;
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
      const outside = s.pos.x < -halfW - despawnPad || s.pos.x > halfW + despawnPad || s.pos.y < -halfH - despawnPad || s.pos.y > halfH + despawnPad;
      if (s.seenInside && outside || s.lifeSec > 30) {
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
        if (outside)
          state.saucerLasers.splice(i, 1);
      }
    }
    function handleSaucerLaserShipCollisions() {
      if (state.mode !== "playing")
        return;
      for (let i = state.saucerLasers.length - 1; i >= 0; i--) {
        const b = state.saucerLasers[i];
        if (!circleHit(b, state.ship))
          continue;
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
    function isDamagingProjectile(a, impactSpeed) {
      if (!a?.shipLaunched)
        return false;
      const spd = len(a.vel);
      const v = Math.max(spd, impactSpeed);
      return v >= asteroidDamageSpeedForSize(state.params, a.size);
    }
    function fractureSpeedRequired(projectile, target) {
      const projMass = Math.max(1, Number(projectile?.mass) || 1);
      const targetMass = Math.max(1, Number(target?.mass) || 1);
      const base = Math.max(1, Number(state.params.fractureImpactSpeed) || 0);
      const massRatio = Math.sqrt(targetMass / projMass);
      return base * massRatio;
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
        seed: Math.floor(rng() * 1e9)
      });
    }
    function rollGemKind() {
      const r = rng();
      if (r < 0.1)
        return "diamond";
      if (r < 0.5)
        return "ruby";
      return "emerald";
    }
    function gemRgb2(kind) {
      if (kind === "gold")
        return [255, 221, 88];
      if (kind === "diamond")
        return [86, 183, 255];
      if (kind === "ruby")
        return [255, 89, 100];
      return [84, 240, 165];
    }
    function gemPoints(kind) {
      if (kind === "gold")
        return 250;
      if (kind === "diamond")
        return 100;
      if (kind === "ruby")
        return 25;
      return 10;
    }
    function gemRadius(kind) {
      if (kind === "gold")
        return 10;
      if (kind === "emerald")
        return 7;
      if (kind === "ruby")
        return 8;
      return 9;
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
        pulsePhase: rng(),
        // [0,1)
        pulseAlpha: 1
      });
    }
    function breakSmallAsteroid(a, { velHint = vec(0, 0), removeSet = null } = {}) {
      if (!a || a.size !== "small")
        return;
      if (removeSet) {
        if (removeSet.has(a.id))
          return;
        removeSet.add(a.id);
      }
      spawnExplosion(a.pos, { kind: "tiny", rgb: [255, 255, 255], r0: 4, r1: 18, ttl: 0.16 });
      spawnGem(a.pos, vec(0, 0), { jitterMag: 0 });
    }
    function resetWorld() {
      state.time = 0;
      state.score = 0;
      state.progression.gemScore = 0;
      state.progression.currentTier = "small";
      state.progression.tierShiftT = 0;
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
      state.ship = makeShip("small");
      state.camera.zoom = cameraZoomForTier("small");
      state.camera.zoomFrom = state.camera.zoom;
      state.camera.zoomTo = state.camera.zoom;
      state.camera.zoomAnimDur = 0;
      state.camera.zoomAnimElapsed = 0;
      refreshShipTierProgression({ animateZoom: false });
      syncCameraToShip();
      state.asteroids = [];
      worldCellAsteroidCounts.clear();
      worldCellActiveKeys.clear();
      state.worldCells.indexedAsteroidCells = 0;
      state.worldCells.activeCount = 0;
      const budget = asteroidPopulationBudget();
      const initialTarget = clamp(Math.round(budget.target * 0.7), asteroidSeedCount(), Math.min(budget.max, 2400));
      let attempts = 0;
      const maxAttempts = Math.max(120, initialTarget * 20);
      while (state.asteroids.length < initialTarget && attempts < maxAttempts) {
        trySpawnAmbientAsteroid();
        attempts++;
      }
      const nearRadius = Math.min(state.view.w, state.view.h) * 0.5 / Math.max(0.1, state.camera.zoom || 1);
      const minOnscreenAtStart = 12;
      let localAttempts = 0;
      while (localAttempts < 160) {
        const halfW = state.view.w * 0.52 / Math.max(0.1, state.camera.zoom || 1);
        const halfH = state.view.h * 0.52 / Math.max(0.1, state.camera.zoom || 1);
        const onScreenNow = state.asteroids.reduce((n, a) => {
          const inX = Math.abs(a.pos.x - state.ship.pos.x) <= halfW + a.radius;
          const inY = Math.abs(a.pos.y - state.ship.pos.y) <= halfH + a.radius;
          return n + (inX && inY ? 1 : 0);
        }, 0);
        if (onScreenNow >= minOnscreenAtStart)
          break;
        trySpawnAmbientAsteroid({
          nearPos: state.ship.pos,
          nearRadius,
          minDistFromShip: 210,
          maxCellCount: 12
        });
        localAttempts++;
      }
      rebuildWorldCellIndex();
    }
    function startGame() {
      resetWorld();
      state.mode = "playing";
    }
    function orbitRadiusForAsteroid(a) {
      const base = currentForceFieldRadius();
      return base + Math.max(0, a.radius - state.params.smallRadius * 0.7) + state.params.attachPadding;
    }
    function orbitPosFor(a) {
      const r = orbitRadiusForAsteroid(a);
      const wAngle = state.ship.angle + a.orbitA;
      return add(state.ship.pos, mul(angleToVec(wAngle), r));
    }
    function tryAttachAsteroid(a) {
      if (!shipCanAttractSize(a.size) || a.attached)
        return false;
      const toShip = sub(a.pos, state.ship.pos);
      const d = len(toShip);
      const targetR = orbitRadiusForAsteroid(a);
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
      if (state.mode !== "playing")
        return;
      if (state.burstCooldown > 0)
        return;
      state.burstCooldown = state.params.burstCooldownSec;
      state.blastPulseT = 0.22;
      const fieldR = currentForceFieldRadius();
      spawnExplosion(state.ship.pos, {
        kind: "ring",
        rgb: [255, 255, 255],
        r0: fieldR - 2,
        r1: fieldR + 26,
        ttl: 0.18
      });
      const shipV = state.ship.vel;
      for (const a of state.asteroids) {
        if (!a.attached)
          continue;
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
      const zoom = Math.max(0.1, state.camera.zoom || 1);
      const halfViewW = state.view.w / (2 * zoom);
      const halfViewH = state.view.h / (2 * zoom);
      const minCamX = halfViewW - halfWorldW;
      const maxCamX = halfWorldW - halfViewW;
      const minCamY = halfViewH - halfWorldH;
      const maxCamY = halfWorldH - halfViewH;
      if (minCamX <= maxCamX)
        state.camera.x = clamp(state.camera.x, minCamX, maxCamX);
      else
        state.camera.x = 0;
      if (minCamY <= maxCamY)
        state.camera.y = clamp(state.camera.y, minCamY, maxCamY);
      else
        state.camera.y = 0;
    }
    function syncCameraToShip() {
      const zoom = Math.max(0.1, state.camera.zoom || 1);
      if (state.camera.mode === "deadzone") {
        const ship = state.ship;
        const dzHalfW = Math.max(0, state.view.w * state.camera.deadZoneFracX / (2 * zoom));
        const dzHalfH = Math.max(0, state.view.h * state.camera.deadZoneFracY / (2 * zoom));
        const dx = ship.pos.x - state.camera.x;
        const dy = ship.pos.y - state.camera.y;
        if (dx > dzHalfW)
          state.camera.x = ship.pos.x - dzHalfW;
        else if (dx < -dzHalfW)
          state.camera.x = ship.pos.x + dzHalfW;
        if (dy > dzHalfH)
          state.camera.y = ship.pos.y - dzHalfH;
        else if (dy < -dzHalfH)
          state.camera.y = ship.pos.y + dzHalfH;
      } else {
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
        if (ship.vel.x < 0)
          ship.vel.x = 0;
      } else if (ship.pos.x > maxX) {
        ship.pos.x = maxX;
        if (ship.vel.x > 0)
          ship.vel.x = 0;
      }
      if (ship.pos.y < minY) {
        ship.pos.y = minY;
        if (ship.vel.y < 0)
          ship.vel.y = 0;
      } else if (ship.pos.y > maxY) {
        ship.pos.y = maxY;
        if (ship.vel.y > 0)
          ship.vel.y = 0;
      }
    }
    function isOutsideWorld(body, pad = 0) {
      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;
      const r = Math.max(0, body.radius || 0);
      return body.pos.x < -halfW - r - pad || body.pos.x > halfW + r + pad || body.pos.y < -halfH - r - pad || body.pos.y > halfH + r + pad;
    }
    function applyWorldScale(scale) {
      const s = clamp(Number(scale) || 1, 1, 10);
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
      if (state.input.left)
        ship.angle -= state.params.shipTurnRate * dt;
      if (state.input.right)
        ship.angle += state.params.shipTurnRate * dt;
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
      const tier = currentShipTier();
      const attractRadius = currentAttractRadius();
      const forceFieldRadius = currentForceFieldRadius();
      const attractRadius2 = attractRadius * attractRadius;
      const attached = state.asteroids.filter((a) => a.attached);
      if (attached.length >= 2) {
        const iters = 3;
        for (let it = 0; it < iters; it++) {
          for (let i = 0; i < attached.length; i++) {
            for (let j = i + 1; j < attached.length; j++) {
              const a = attached[i];
              const b = attached[j];
              const r = Math.max(20, Math.min(orbitRadiusForAsteroid(a), orbitRadiusForAsteroid(b)));
              const delta = wrapAngle(a.orbitA - b.orbitA);
              const minSep = (a.radius + b.radius + 6) / r;
              if (Math.abs(delta) >= minSep)
                continue;
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
        if (!Number.isFinite(a.pullFx))
          a.pullFx = 0;
        const pullEaseIn = 1 - Math.exp(-dt * 10);
        const pullEaseOut = 1 - Math.exp(-dt * 6);
        let pullTarget = 0;
        if (shipCanAttractSize(a.size)) {
          const toShip = sub(ship.pos, a.pos);
          const d2 = len2(toShip);
          if (d2 < attractRadius2) {
            const d = Math.max(10, Math.sqrt(d2));
            const dirIn = mul(toShip, 1 / d);
            const soft = state.params.gravitySoftening;
            const grav = state.params.gravityK / (d2 + soft * soft);
            const insideRing = d < forceFieldRadius;
            const innerMult = insideRing ? state.params.innerGravityMult : 1;
            const innerT = insideRing ? clamp(1 - d / Math.max(1, forceFieldRadius), 0, 1) : 0;
            a.vel = add(a.vel, mul(dirIn, grav * innerMult * dt));
            if (innerT > 0) {
              a.vel = mul(a.vel, Math.max(0, 1 - state.params.innerDrag * innerT * dt));
            }
            const targetRingRadius = orbitRadiusForAsteroid(a);
            const err = d - targetRingRadius;
            const spd = len(a.vel);
            const capV = Math.max(1, state.params.captureSpeed);
            const captureFactor = clamp(1 - spd / capV, 0, 1);
            const ring = clamp(err, -140, 140) * state.params.ringK * captureFactor;
            a.vel = add(a.vel, mul(dirIn, ring * dt));
            if (Math.abs(err) < 70 && captureFactor > 0) {
              const vRad = dot(a.vel, dirIn);
              a.vel = sub(a.vel, mul(dirIn, vRad * state.params.ringRadialDamp * captureFactor * dt));
            }
            if (tier.key === "small" && a.size === "small") {
              const denom = Math.max(1, attractRadius - forceFieldRadius);
              pullTarget = clamp(1 - (d - forceFieldRadius) / denom, 0, 1);
              if (d < forceFieldRadius)
                pullTarget = 1;
            }
          }
          tryAttachAsteroid(a);
        }
        const blend = pullTarget > a.pullFx ? pullEaseIn : pullEaseOut;
        a.pullFx = lerp(a.pullFx, pullTarget, blend);
        if (a.pullFx < 1e-4)
          a.pullFx = 0;
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
        const ttl = Math.max(1e-3, g.ttlSec || 6);
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
        const coreBoost = 1 + core * core / (d2 + core * core);
        const grav = state.params.gravityK * coreBoost / (d2 + soft * soft);
        g.vel = add(g.vel, mul(dirIn, grav * dt));
        g.vel = mul(g.vel, Math.max(0, 1 - 0.08 * dt));
        const spd = len(g.vel);
        if (spd > 900)
          g.vel = mul(g.vel, 900 / spd);
        g.pos = add(g.pos, mul(g.vel, dt));
        if (isOutsideWorld(g, 18)) {
          state.gems.splice(i, 1);
          continue;
        }
        g.spin += g.spinVel * dt;
      }
    }
    function handleGemShipCollisions() {
      if (state.mode !== "playing")
        return;
      for (let i = state.gems.length - 1; i >= 0; i--) {
        const g = state.gems[i];
        const pickR = state.ship.radius + g.radius + 20;
        if (len2(sub(g.pos, state.ship.pos)) > pickR * pickR)
          continue;
        state.gems.splice(i, 1);
        state.gemsCollected[g.kind] = (state.gemsCollected[g.kind] || 0) + 1;
        const pts = gemPoints(g.kind);
        state.score += pts;
        state.progression.gemScore += pts;
        refreshShipTierProgression({ animateZoom: true });
        spawnExplosion(state.ship.pos, { kind: "tiny", rgb: gemRgb2(g.kind), r0: 4, r1: 16, ttl: 0.14 });
      }
    }
    function handleSaucerAsteroidCollisions() {
      if (state.mode !== "playing" || !state.saucer)
        return;
      const saucer = state.saucer;
      for (const a of state.asteroids) {
        if (a.attached)
          continue;
        if (!a.shipLaunched)
          continue;
        if (!circleHit(saucer, a))
          continue;
        const dropVel = add(mul(a.vel, 0.7), mul(saucer.vel, 0.3));
        spawnExplosion(saucer.pos, { kind: "pop", rgb: [255, 221, 88], r0: 14, r1: 56, ttl: 0.24 });
        spawnExplosion(saucer.pos, { kind: "ring", rgb: [255, 221, 88], r0: 20, r1: 88, ttl: 0.2 });
        spawnGem(saucer.pos, dropVel, { kind: "gold", radiusScale: 1, jitterMag: 20, ttlSec: 18 });
        state.score += 125;
        state.saucer = null;
        scheduleNextSaucerSpawn();
        return;
      }
    }
    function fractureAsteroid(target, impactDir, impactSpeed) {
      if (target.fractureCooldownT > 0)
        return null;
      const next = asteroidNextSize(target.size);
      if (!next)
        return null;
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
        r1: Math.max(26, baseR * 1.45),
        ttl: 0.22
      });
      const rankGain = Math.max(1, asteroidSizeRank(target.size));
      state.score += 4 + rankGain * 3;
      return pieces;
    }
    function resolveElasticCollision(a, b, n, penetration) {
      const invA = a.mass > 0 ? 1 / a.mass : 0;
      const invB = b.mass > 0 ? 1 / b.mass : 0;
      const invSum = invA + invB;
      if (invSum <= 0)
        return;
      const slop = 0.5;
      const corr = Math.max(0, penetration - slop);
      if (corr > 0) {
        const percent = 0.85;
        const move = mul(n, corr * percent / invSum);
        a.pos = sub(a.pos, mul(move, invA));
        b.pos = add(b.pos, mul(move, invB));
      }
      const rv = sub(b.vel, a.vel);
      const velAlongNormal = dot(rv, n);
      if (velAlongNormal >= 0)
        return;
      const e = state.params.restitution;
      const j = -(1 + e) * velAlongNormal / invSum;
      const impulse = mul(n, j);
      a.vel = sub(a.vel, mul(impulse, invA));
      b.vel = add(b.vel, mul(impulse, invB));
    }
    function forEachNearbyAsteroidPair(fn) {
      const cellSize = Math.max(180, Math.round((state.params.xxlargeRadius || 150) * 2.2));
      const buckets = /* @__PURE__ */ new Map();
      const asteroids = state.asteroids;
      for (let i = 0; i < asteroids.length; i++) {
        const a = asteroids[i];
        if (a.attached)
          continue;
        const cx = Math.floor(a.pos.x / cellSize);
        const cy = Math.floor(a.pos.y / cellSize);
        const key = `${cx},${cy}`;
        const list = buckets.get(key);
        if (list)
          list.push(i);
        else
          buckets.set(key, [i]);
      }
      const offsets = [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
        [1, -1]
      ];
      for (const [key, listA] of buckets) {
        const parts = key.split(",");
        const cx = Number(parts[0]);
        const cy = Number(parts[1]);
        for (const [dx, dy] of offsets) {
          const nk = `${cx + dx},${cy + dy}`;
          const listB = buckets.get(nk);
          if (!listB)
            continue;
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
      if (state.mode !== "playing")
        return;
      const shipRemovals = /* @__PURE__ */ new Set();
      const shipAdds = [];
      const smallBreakSpeed = asteroidDamageSpeedForSize(state.params, "small");
      for (const a of state.asteroids) {
        if (a.attached)
          continue;
        const impactSpeed = len(a.vel);
        if (!a.shipLaunched && a.size === "small" && impactSpeed >= smallBreakSpeed && circleHit(state.ship, a)) {
          breakSmallAsteroid(a, { velHint: a.vel, removeSet: shipRemovals });
          continue;
        }
        if (isDamagingProjectile(a, impactSpeed) && circleHit(state.ship, a)) {
          if (a.size === "small") {
            breakSmallAsteroid(a, { velHint: a.vel, removeSet: shipRemovals });
          } else if (impactSpeed >= fractureSpeedRequired(a, a)) {
            const frags = fractureAsteroid(a, norm(a.vel), impactSpeed);
            if (frags) {
              shipRemovals.add(a.id);
              const room = Math.max(0, state.params.maxAsteroids - (state.asteroids.length + shipAdds.length - shipRemovals.size));
              shipAdds.push(...frags.slice(0, room));
            }
          } else {
            shipRemovals.add(a.id);
            spawnExplosion(a.pos, { kind: "tiny", rgb: [255, 89, 100], r0: 5, r1: 18, ttl: 0.14 });
          }
          continue;
        }
        if (a.size === "small")
          continue;
        const hit = circleCollide(state.ship, a);
        if (!hit)
          continue;
        if (state.settings.shipExplodesOnImpact) {
          state.mode = "gameover";
          return;
        }
        resolveElasticCollision(state.ship, a, hit.n, hit.penetration);
      }
      if (shipRemovals.size) {
        state.asteroids = state.asteroids.filter((a) => !shipRemovals.has(a.id));
      }
      if (shipAdds.length)
        state.asteroids.push(...shipAdds);
      const toRemove = /* @__PURE__ */ new Set();
      const toAdd = [];
      forEachNearbyAsteroidPair((i, j) => {
        const a = state.asteroids[i];
        const b = state.asteroids[j];
        if (!a || !b)
          return;
        if (a.attached || b.attached)
          return;
        if (toRemove.has(a.id) || toRemove.has(b.id))
          return;
        const hit = circleCollide(a, b);
        if (!hit)
          return;
        const rv = sub(b.vel, a.vel);
        const velAlongNormal = dot(rv, hit.n);
        const impactSpeed = -velAlongNormal;
        const relSpeed = len(rv);
        const aFastAmbientSmall = !a.shipLaunched && a.size === "small" && relSpeed >= smallBreakSpeed;
        const bFastAmbientSmall = !b.shipLaunched && b.size === "small" && relSpeed >= smallBreakSpeed;
        if (aFastAmbientSmall || bFastAmbientSmall) {
          if (aFastAmbientSmall)
            breakSmallAsteroid(a, { velHint: a.vel, removeSet: toRemove });
          if (bFastAmbientSmall)
            breakSmallAsteroid(b, { velHint: b.vel, removeSet: toRemove });
          return;
        }
        const aDamaging = isDamagingProjectile(a, relSpeed);
        const bDamaging = isDamagingProjectile(b, relSpeed);
        if (aDamaging || bDamaging) {
          const interactions = [];
          if (aDamaging)
            interactions.push({ projectile: a, target: b, impactDir: hit.n });
          if (bDamaging)
            interactions.push({ projectile: b, target: a, impactDir: mul(hit.n, -1) });
          for (const it of interactions) {
            const projectile = it.projectile;
            const target = it.target;
            if (!projectile || !target)
              continue;
            if (toRemove.has(projectile.id) || toRemove.has(target.id))
              continue;
            if (projectile.size === "small") {
              breakSmallAsteroid(projectile, { velHint: projectile.vel, removeSet: toRemove });
            } else {
              projectile.shipLaunched = false;
              projectile.hitFxT = 0.18;
            }
            if (target.size === "small") {
              breakSmallAsteroid(target, { velHint: target.vel, removeSet: toRemove });
              state.score += 1;
              continue;
            }
            const requiredSpeed = fractureSpeedRequired(projectile, target);
            if (asteroidCanBreakTarget(projectile.size, target.size) && relSpeed >= requiredSpeed) {
              const frags = fractureAsteroid(target, it.impactDir, relSpeed);
              if (frags) {
                toRemove.add(target.id);
                const room = Math.max(0, state.params.maxAsteroids - (state.asteroids.length + toAdd.length - toRemove.size));
                toAdd.push(...frags.slice(0, room));
                continue;
              }
            }
            spawnExplosion(target.pos, { kind: "tiny", rgb: [255, 89, 100], r0: 4, r1: 14, ttl: 0.14 });
            const massRatio = projectile.mass > 0 && target.mass > 0 ? projectile.mass / target.mass : 1;
            const shoveScale = Math.min(1, Math.max(0, massRatio));
            const shove = Math.min(180, relSpeed * 0.5 * shoveScale);
            target.vel = add(target.vel, mul(it.impactDir, shove));
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
      if (toAdd.length)
        state.asteroids.push(...toAdd);
    }
    function update(dt) {
      if (state.mode !== "playing")
        return;
      state.time += dt;
      state.burstCooldown = Math.max(0, state.burstCooldown - dt);
      state.blastPulseT = Math.max(0, state.blastPulseT - dt);
      state.progression.tierShiftT = Math.max(0, state.progression.tierShiftT - dt);
      refreshShipTierProgression({ animateZoom: true });
      updateCameraZoom(dt);
      for (let i = state.effects.length - 1; i >= 0; i--) {
        const e = state.effects[i];
        e.t += dt;
        if (e.t >= e.ttl)
          state.effects.splice(i, 1);
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
    function renderGameToText() {
      const ship = state.ship;
      const attached = state.asteroids.filter((a) => a.attached).length;
      const zoom = Math.max(0.1, state.camera.zoom || 1);
      const counts = state.asteroids.reduce(
        (acc, a) => {
          acc[a.size] = (acc[a.size] || 0) + 1;
          return acc;
        },
        { small: 0, med: 0, large: 0, xlarge: 0, xxlarge: 0 }
      );
      const gemsOnField = state.gems.reduce(
        (acc, g) => {
          acc[g.kind] = (acc[g.kind] || 0) + 1;
          return acc;
        },
        { diamond: 0, ruby: 0, emerald: 0, gold: 0 }
      );
      const sample = state.asteroids.slice(0, 10).map((a) => ({
        size: a.size,
        attached: a.attached,
        x: Math.round(a.pos.x),
        y: Math.round(a.pos.y),
        r: Math.round(a.radius)
      }));
      const asteroidsOnScreen = state.asteroids.reduce((n, a) => {
        const inX = Math.abs(a.pos.x - state.camera.x) <= state.view.w * 0.5 / zoom + a.radius;
        const inY = Math.abs(a.pos.y - state.camera.y) <= state.view.h * 0.5 / zoom + a.radius;
        return n + (inX && inY ? 1 : 0);
      }, 0);
      return JSON.stringify({
        coordinate_system: "World coords are pixels with origin at world center; screen center follows camera. +x right, +y down.",
        mode: state.mode,
        view: { w: state.view.w, h: state.view.h },
        world: { w: state.world.w, h: state.world.h },
        world_cells: {
          size_px: state.worldCells.sizePx,
          active_count: state.worldCells.activeCount,
          indexed_asteroid_cells: state.worldCells.indexedAsteroidCells
        },
        background: {
          star_density: +state.params.starDensityScale.toFixed(2),
          parallax_strength: +state.params.starParallaxStrength.toFixed(2),
          accent_star_chance: +state.params.starAccentChance.toFixed(2),
          twinkle_star_chance: +state.params.starTwinkleChance.toFixed(2),
          twinkle_strength: +state.params.starTwinkleStrength.toFixed(2),
          twinkle_speed: +state.params.starTwinkleSpeed.toFixed(2),
          layers: state.background.layers.length
        },
        camera: {
          x: Math.round(state.camera.x),
          y: Math.round(state.camera.y),
          mode: state.camera.mode,
          zoom: +zoom.toFixed(3)
        },
        ship: {
          x: Math.round(ship.pos.x),
          y: Math.round(ship.pos.y),
          vx: Math.round(ship.vel.x),
          vy: Math.round(ship.vel.y),
          angle: +ship.angle.toFixed(3),
          tier: ship.tier,
          radius: +ship.radius.toFixed(2)
        },
        saucer: state.saucer ? {
          x: Math.round(state.saucer.pos.x),
          y: Math.round(state.saucer.pos.y),
          shots_remaining: state.saucer.burstShotsRemaining,
          lasers: state.saucerLasers.length
        } : null,
        field: { radius: +currentForceFieldRadius().toFixed(2) },
        attract: { radius: +currentAttractRadius().toFixed(2), debug: state.settings.showAttractRadius },
        progression: {
          gem_score: state.progression.gemScore,
          current_tier: state.progression.currentTier,
          tier2_unlock: state.params.tier2UnlockGemScore,
          tier3_unlock: state.params.tier3UnlockGemScore,
          override: state.settings.tierOverrideEnabled ? clamp(Math.round(state.settings.tierOverrideIndex), 1, 3) : 0
        },
        counts: { ...counts, attached, score: state.score, asteroids_on_screen: asteroidsOnScreen },
        gems_on_field: gemsOnField,
        gems_collected: { ...state.gemsCollected },
        sample_asteroids: sample
      });
    }
    function setShipSvgRenderer(tierKey, pathData, svgScale = 1) {
      const key = tierKey === "medium" || tierKey === "large" ? tierKey : "small";
      const tier = shipTierByKey(key);
      if (!pathData || typeof pathData !== "string") {
        tier.renderer = cloneRenderer(DEFAULT_SHIP_RENDERERS[key]);
        return false;
      }
      tier.renderer = {
        type: "svg",
        path: pathData,
        svgScale: Number.isFinite(Number(svgScale)) ? Number(svgScale) : 1
      };
      return true;
    }
    rebuildStarfield();
    return {
      state,
      startGame,
      resetWorld,
      resize,
      setArenaConfig,
      refreshBackground,
      refreshProgression: (options = {}) => refreshShipTierProgression(options),
      setShipSvgRenderer,
      update,
      renderGameToText,
      getCurrentShipTier: () => currentShipTier(),
      getCurrentForceFieldRadius: () => currentForceFieldRadius(),
      getCurrentAttractRadius: () => currentAttractRadius()
    };
  }

  // src/render/renderGame.js
  function drawPolyline(ctx, pts, x, y, angle, color, lineWidth = 2, fillColor = null) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const px = Math.cos(p.a) * p.r;
      const py = Math.sin(p.a) * p.r;
      if (i === 0)
        ctx.moveTo(px, py);
      else
        ctx.lineTo(px, py);
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
  function rgbToRgba(rgb, a) {
    const r = rgb?.[0] ?? 255;
    const g = rgb?.[1] ?? 255;
    const b = rgb?.[2] ?? 255;
    return `rgba(${r},${g},${b},${clamp(a, 0, 1).toFixed(3)})`;
  }
  function lerpRgb(a, b, t) {
    const tt = clamp(t, 0, 1);
    return [
      Math.round(lerp(a[0], b[0], tt)),
      Math.round(lerp(a[1], b[1], tt)),
      Math.round(lerp(a[2], b[2], tt))
    ];
  }
  function fnv1aSeed(str) {
    const s = String(str ?? "");
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function xorshift32(seed) {
    let s = seed >>> 0;
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s >>>= 0;
    s ^= s << 5;
    s >>>= 0;
    return s >>> 0;
  }
  function randSigned(seed) {
    const s = xorshift32(seed);
    return s / 4294967295 * 2 - 1;
  }
  function drawElectricTether(ctx, from, to, rgb, intensity, timeSec, seedBase) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (!Number.isFinite(dist) || dist < 2)
      return;
    const inv = 1 / dist;
    const nx = -dy * inv;
    const ny = dx * inv;
    const segs = clamp(Math.round(dist / 22), 4, 12);
    const amp = lerp(1.5, 9, intensity);
    const phase = timeSec * 18;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.strokeStyle = rgbToRgba(rgb, lerp(0.02, 0.22, intensity));
    ctx.lineWidth = lerp(2, 7, intensity);
    ctx.shadowColor = rgbToRgba(rgb, 0.95);
    ctx.shadowBlur = lerp(4, 14, intensity);
    ctx.beginPath();
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      let px = from.x + dx * t;
      let py = from.y + dy * t;
      if (i !== 0 && i !== segs) {
        const wobble = Math.sin(phase + t * Math.PI * 4);
        const r = randSigned(seedBase + i * 1013 + Math.floor(timeSec * 60) * 17);
        const off = (wobble * 0.45 + r * 0.55) * amp * (1 - Math.abs(0.5 - t) * 1.4);
        px += nx * off;
        py += ny * off;
      }
      if (i === 0)
        ctx.moveTo(px, py);
      else
        ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([8, 12]);
    ctx.lineDashOffset = -timeSec * lerp(40, 110, intensity);
    ctx.strokeStyle = rgbToRgba(rgb, lerp(0.05, 0.9, intensity));
    ctx.lineWidth = lerp(1, 2.5, intensity);
    ctx.stroke();
    ctx.restore();
  }
  function gemRgb(kind) {
    if (kind === "gold")
      return [255, 221, 88];
    if (kind === "diamond")
      return [86, 183, 255];
    if (kind === "ruby")
      return [255, 89, 100];
    return [84, 240, 165];
  }
  function createRenderer(engine) {
    const state = engine.state;
    const currentShipTier = () => engine.getCurrentShipTier();
    const currentForceFieldRadius = () => engine.getCurrentForceFieldRadius();
    const currentAttractRadius = () => engine.getCurrentAttractRadius();
    const svgPathCache = /* @__PURE__ */ new Map();
    function drawShipModel(ctx, ship, thrusting) {
      const tier = currentShipTier();
      const renderer = tier.renderer || {};
      const shipRadius = Math.max(1, Number(ship.radius) || Number(tier.radius) || 1);
      ctx.save();
      ctx.translate(ship.pos.x, ship.pos.y);
      ctx.rotate(ship.angle);
      ctx.strokeStyle = "rgba(231,240,255,0.95)";
      ctx.lineWidth = 2;
      const engines = Array.isArray(renderer.engines) ? renderer.engines : SHIP_TIERS.small.renderer.engines;
      let drawScale = 1;
      if (renderer.type === "svg" && renderer.path) {
        const cacheKey = `${tier.key}:${renderer.path}`;
        let path = svgPathCache.get(cacheKey);
        if (!path) {
          path = new Path2D(renderer.path);
          svgPathCache.set(cacheKey, path);
        }
        const baseScale = Number.isFinite(renderer.svgScale) ? renderer.svgScale : 1;
        const explicitHullRadius = Number(renderer.hullRadius);
        const autoScale = Number.isFinite(explicitHullRadius) && explicitHullRadius > 0 ? shipRadius / explicitHullRadius : 1;
        drawScale = baseScale * autoScale;
        ctx.save();
        ctx.scale(drawScale, drawScale);
        ctx.stroke(path);
        if (thrusting) {
          ctx.strokeStyle = "rgba(255, 89, 100, 0.92)";
          for (const e of engines) {
            const flameLen = e.len + (Math.sin(state.time * 30 + e.y * 0.1) * 3 + 2);
            ctx.beginPath();
            ctx.moveTo(e.x, e.y);
            ctx.lineTo(e.x - flameLen, e.y);
            ctx.stroke();
          }
        }
        ctx.restore();
      } else {
        const points = Array.isArray(renderer.points) ? renderer.points : SHIP_TIERS.small.renderer.points;
        const hullRadius = polygonHullRadius(points);
        if (hullRadius > 1e-6)
          drawScale = shipRadius / hullRadius;
        ctx.save();
        ctx.scale(drawScale, drawScale);
        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
          const p = points[i];
          if (i === 0)
            ctx.moveTo(p.x, p.y);
          else
            ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();
        if (thrusting) {
          ctx.strokeStyle = "rgba(255, 89, 100, 0.92)";
          for (const e of engines) {
            const flameLen = e.len + (Math.sin(state.time * 30 + e.y * 0.1) * 3 + 2);
            ctx.beginPath();
            ctx.moveTo(e.x, e.y);
            ctx.lineTo(e.x - flameLen, e.y);
            ctx.stroke();
          }
        }
        ctx.restore();
      }
      ctx.restore();
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
      const twinkleTime = state.mode === "playing" ? state.time : performance.now() / 1e3;
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
              if (px < -6 || px > w + 6 || py < -6 || py > h + 6)
                continue;
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
      const zoom = Math.max(0.1, state.camera.zoom || 1);
      ctx.translate(w * 0.5, h * 0.5);
      ctx.scale(zoom, zoom);
      ctx.translate(-state.camera.x, -state.camera.y);
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.26)";
      ctx.lineWidth = 2;
      ctx.strokeRect(-state.world.w / 2, -state.world.h / 2, state.world.w, state.world.h);
      ctx.restore();
      if (state.mode === "playing") {
        const tier = currentShipTier();
        const fieldR = currentForceFieldRadius();
        const attractR = currentAttractRadius();
        const pulse = clamp(state.blastPulseT / 0.22, 0, 1);
        const tierShift = clamp(state.progression.tierShiftT / 0.7, 0, 1);
        ctx.save();
        ctx.strokeStyle = tier.ringColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(state.ship.pos.x, state.ship.pos.y, fieldR, 0, Math.PI * 2);
        ctx.stroke();
        if (pulse > 0) {
          ctx.strokeStyle = `rgba(255,255,255,${lerp(0, 0.85, pulse).toFixed(3)})`;
          ctx.lineWidth = lerp(2, 6, pulse);
          ctx.beginPath();
          ctx.arc(state.ship.pos.x, state.ship.pos.y, fieldR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = `rgba(255,89,100,${lerp(0, 0.55, pulse).toFixed(3)})`;
          ctx.lineWidth = lerp(1, 4, pulse);
          ctx.beginPath();
          ctx.arc(state.ship.pos.x, state.ship.pos.y, fieldR + lerp(0, 10, pulse), 0, Math.PI * 2);
          ctx.stroke();
        }
        if (tierShift > 0) {
          ctx.strokeStyle = `rgba(255,255,255,${(tierShift * 0.9).toFixed(3)})`;
          ctx.lineWidth = lerp(2, 8, tierShift);
          ctx.beginPath();
          ctx.arc(state.ship.pos.x, state.ship.pos.y, fieldR + lerp(0, 34, 1 - tierShift), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        if (state.settings.showAttractRadius) {
          ctx.save();
          ctx.strokeStyle = "rgba(86,183,255,0.12)";
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 10]);
          ctx.lineDashOffset = 0;
          ctx.beginPath();
          ctx.arc(state.ship.pos.x, state.ship.pos.y, attractR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
      for (const a of state.asteroids) {
        const tier = currentShipTier();
        const ship = state.ship;
        const showPullFx = state.mode === "playing" && tier.key === "small" && a.size === "small" && !a.attached;
        const pullFx = showPullFx ? clamp(a.pullFx ?? 0, 0, 1) : 0;
        if (pullFx > 0.01) {
          const fieldR = currentForceFieldRadius();
          const outward = sub(a.pos, ship.pos);
          const outwardLen = Math.max(1e-6, len(outward));
          const ringPoint = add(ship.pos, mul(outward, fieldR / outwardLen));
          const seed = fnv1aSeed(a.id);
          drawElectricTether(ctx, a.pos, ringPoint, tier.ringRgb, pullFx, state.time, seed);
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = rgbToRgba(tier.ringRgb, lerp(0.05, 0.35, pullFx));
          ctx.lineWidth = lerp(2, 7, pullFx);
          ctx.shadowColor = rgbToRgba(tier.ringRgb, 0.9);
          ctx.shadowBlur = lerp(3, 14, pullFx);
          drawPolyline(ctx, a.shape, a.pos.x, a.pos.y, a.rot, ctx.strokeStyle, ctx.lineWidth);
          ctx.restore();
        }
        const base = a.size === "xxlarge" ? "rgba(231,240,255,0.62)" : a.size === "xlarge" ? "rgba(231,240,255,0.68)" : a.size === "large" ? "rgba(231,240,255,0.74)" : a.size === "med" ? "rgba(231,240,255,0.80)" : "rgba(231,240,255,0.88)";
        let color = a.attached ? "rgba(255,221,88,0.95)" : base;
        if (pullFx > 0.01) {
          const baseRgb = [231, 240, 255];
          const mixed = lerpRgb(baseRgb, tier.ringRgb, pullFx);
          const aAlpha = lerp(0.78, 0.98, pullFx);
          color = rgbToRgba(mixed, aAlpha);
        }
        drawPolyline(ctx, a.shape, a.pos.x, a.pos.y, a.rot, color, 2, "rgba(0,0,0,0.92)");
      }
      for (const g of state.gems) {
        const [rr, gg, bb] = gemRgb(g.kind);
        const r = g.radius;
        const pulseA = clamp(g.pulseAlpha ?? 1, 0.25, 1);
        ctx.save();
        ctx.translate(g.pos.x, g.pos.y);
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
      if (state.saucer) {
        const s = state.saucer;
        ctx.save();
        ctx.translate(s.pos.x, s.pos.y);
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "rgba(86,183,255,0.14)";
        ctx.beginPath();
        ctx.ellipse(0, 0, s.radius * 1.6, s.radius * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = "rgba(86,183,255,0.92)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 3, s.radius * 1.25, s.radius * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, -3, s.radius * 0.55, s.radius * 0.42, 0, Math.PI, 0);
        ctx.stroke();
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
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = `rgba(255,221,88,${(alpha * 0.6).toFixed(3)})`;
        ctx.lineWidth = 9;
        ctx.shadowColor = "rgba(255,221,88,0.95)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(-lenPx * 0.5, 0);
        ctx.lineTo(lenPx * 0.5, 0);
        ctx.stroke();
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
            const ang = (i + e.seed % 10 * 0.1) / rays * Math.PI * 2;
            const r0 = e.kind === "ring" ? r * 1 : r * 0.55;
            const r1 = e.kind === "ring" ? r + 26 : r * 1.05;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
            ctx.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
            ctx.stroke();
          }
        }
        ctx.restore();
      }
      drawShipModel(ctx, state.ship, state.mode === "playing" && state.input.up);
      ctx.restore();
      ctx.save();
      ctx.fillStyle = "rgba(231,240,255,0.85)";
      ctx.font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      const attached = state.asteroids.filter((a) => a.attached).length;
      const xxlarge = state.asteroids.filter((a) => a.size === "xxlarge").length;
      const xlarge = state.asteroids.filter((a) => a.size === "xlarge").length;
      const large = state.asteroids.filter((a) => a.size === "large").length;
      const med = state.asteroids.filter((a) => a.size === "med").length;
      const small = state.asteroids.filter((a) => a.size === "small").length;
      if (state.mode === "playing") {
        ctx.fillText(
          `Tier: ${currentShipTier().label}   Attached: ${attached}   S:${small} M:${med} L:${large} XL:${xlarge} XXL:${xxlarge}   Gems: ${state.progression.gemScore}   Score: ${state.score}`,
          14,
          18
        );
      } else if (state.mode === "gameover") {
        ctx.fillStyle = "rgba(255,89,100,0.92)";
        ctx.font = "16px ui-sans-serif, system-ui";
        ctx.fillText("Impact with a heavy asteroid. Press R to restart.", 14, 28);
      }
      ctx.restore();
    }
    return {
      render
    };
  }

  // src/ui/createUiBindings.js
  function createUiBindings({ game, canvas, documentRef = document, windowRef = window }) {
    const menu = documentRef.getElementById("menu");
    const hudScore = documentRef.getElementById("hud-score");
    const debugToggleBtn = documentRef.getElementById("debug-toggle");
    const startBtn = documentRef.getElementById("start-btn");
    const dbgAttract = documentRef.getElementById("dbg-attract");
    const shipExplode = documentRef.getElementById("ship-explode");
    const dbgCameraMode = documentRef.getElementById("dbg-camera-mode");
    const dbgWorldScale = documentRef.getElementById("dbg-world-scale");
    const dbgWorldScaleOut = documentRef.getElementById("dbg-world-scale-out");
    const dbgPauseOnOpen = documentRef.getElementById("dbg-pause-on-open");
    const dbgTierOverride = documentRef.getElementById("dbg-tier-override");
    const dbgTierOverrideLevel = documentRef.getElementById("dbg-tier-override-level");
    const dbgTierOverrideOut = documentRef.getElementById("dbg-tier-override-out");
    const dbgGemScore = documentRef.getElementById("dbg-gem-score");
    const dbgGemScoreOut = documentRef.getElementById("dbg-gem-score-out");
    const dbgCurrentTierOut = documentRef.getElementById("dbg-current-tier-out");
    const tuneAttract = documentRef.getElementById("tune-attract");
    const tuneAttractOut = documentRef.getElementById("tune-attract-out");
    const tuneAttractSave = documentRef.getElementById("tune-attract-save");
    const tuneAttractDefault = documentRef.getElementById("tune-attract-default");
    const tuneField = documentRef.getElementById("tune-field");
    const tuneFieldOut = documentRef.getElementById("tune-field-out");
    const tuneFieldSave = documentRef.getElementById("tune-field-save");
    const tuneFieldDefault = documentRef.getElementById("tune-field-default");
    const tuneFieldScale1 = documentRef.getElementById("tune-field-scale1");
    const tuneFieldScale1Out = documentRef.getElementById("tune-field-scale1-out");
    const tuneFieldScale1Save = documentRef.getElementById("tune-field-scale1-save");
    const tuneFieldScale1Default = documentRef.getElementById("tune-field-scale1-default");
    const tuneFieldScale2 = documentRef.getElementById("tune-field-scale2");
    const tuneFieldScale2Out = documentRef.getElementById("tune-field-scale2-out");
    const tuneFieldScale2Save = documentRef.getElementById("tune-field-scale2-save");
    const tuneFieldScale2Default = documentRef.getElementById("tune-field-scale2-default");
    const tuneFieldScale3 = documentRef.getElementById("tune-field-scale3");
    const tuneFieldScale3Out = documentRef.getElementById("tune-field-scale3-out");
    const tuneFieldScale3Save = documentRef.getElementById("tune-field-scale3-save");
    const tuneFieldScale3Default = documentRef.getElementById("tune-field-scale3-default");
    const tuneFieldGap = documentRef.getElementById("tune-field-gap");
    const tuneFieldGapOut = documentRef.getElementById("tune-field-gap-out");
    const tuneFieldGapSave = documentRef.getElementById("tune-field-gap-save");
    const tuneFieldGapDefault = documentRef.getElementById("tune-field-gap-default");
    const tuneGravity = documentRef.getElementById("tune-gravity");
    const tuneGravityOut = documentRef.getElementById("tune-gravity-out");
    const tuneGravitySave = documentRef.getElementById("tune-gravity-save");
    const tuneGravityDefault = documentRef.getElementById("tune-gravity-default");
    const tuneInnerGrav = documentRef.getElementById("tune-inner-grav");
    const tuneInnerGravOut = documentRef.getElementById("tune-inner-grav-out");
    const tuneInnerGravSave = documentRef.getElementById("tune-inner-grav-save");
    const tuneInnerGravDefault = documentRef.getElementById("tune-inner-grav-default");
    const tuneGemTtl = documentRef.getElementById("tune-gem-ttl");
    const tuneGemTtlOut = documentRef.getElementById("tune-gem-ttl-out");
    const tuneGemTtlSave = documentRef.getElementById("tune-gem-ttl-save");
    const tuneGemTtlDefault = documentRef.getElementById("tune-gem-ttl-default");
    const tuneGemBlink = documentRef.getElementById("tune-gem-blink");
    const tuneGemBlinkOut = documentRef.getElementById("tune-gem-blink-out");
    const tuneGemBlinkSave = documentRef.getElementById("tune-gem-blink-save");
    const tuneGemBlinkDefault = documentRef.getElementById("tune-gem-blink-default");
    const tuneCapture = documentRef.getElementById("tune-capture");
    const tuneCaptureOut = documentRef.getElementById("tune-capture-out");
    const tuneCaptureSave = documentRef.getElementById("tune-capture-save");
    const tuneCaptureDefault = documentRef.getElementById("tune-capture-default");
    const tuneBurst = documentRef.getElementById("tune-burst");
    const tuneBurstOut = documentRef.getElementById("tune-burst-out");
    const tuneBurstSave = documentRef.getElementById("tune-burst-save");
    const tuneBurstDefault = documentRef.getElementById("tune-burst-default");
    const tuneThrust = documentRef.getElementById("tune-thrust");
    const tuneThrustOut = documentRef.getElementById("tune-thrust-out");
    const tuneThrustSave = documentRef.getElementById("tune-thrust-save");
    const tuneThrustDefault = documentRef.getElementById("tune-thrust-default");
    const tuneDmg = documentRef.getElementById("tune-dmg");
    const tuneDmgOut = documentRef.getElementById("tune-dmg-out");
    const tuneDmgSave = documentRef.getElementById("tune-dmg-save");
    const tuneDmgDefault = documentRef.getElementById("tune-dmg-default");
    const tuneFracture = documentRef.getElementById("tune-fracture");
    const tuneFractureOut = documentRef.getElementById("tune-fracture-out");
    const tuneFractureSave = documentRef.getElementById("tune-fracture-save");
    const tuneFractureDefault = documentRef.getElementById("tune-fracture-default");
    const tuneWorldDensity = documentRef.getElementById("tune-world-density");
    const tuneWorldDensityOut = documentRef.getElementById("tune-world-density-out");
    const tuneWorldDensitySave = documentRef.getElementById("tune-world-density-save");
    const tuneWorldDensityDefault = documentRef.getElementById("tune-world-density-default");
    const tuneXlRadius = documentRef.getElementById("tune-xl-radius");
    const tuneXlRadiusOut = documentRef.getElementById("tune-xl-radius-out");
    const tuneXlRadiusSave = documentRef.getElementById("tune-xl-radius-save");
    const tuneXlRadiusDefault = documentRef.getElementById("tune-xl-radius-default");
    const tuneXxlRadius = documentRef.getElementById("tune-xxl-radius");
    const tuneXxlRadiusOut = documentRef.getElementById("tune-xxl-radius-out");
    const tuneXxlRadiusSave = documentRef.getElementById("tune-xxl-radius-save");
    const tuneXxlRadiusDefault = documentRef.getElementById("tune-xxl-radius-default");
    const tuneXlCount = documentRef.getElementById("tune-xl-count");
    const tuneXlCountOut = documentRef.getElementById("tune-xl-count-out");
    const tuneXlCountSave = documentRef.getElementById("tune-xl-count-save");
    const tuneXlCountDefault = documentRef.getElementById("tune-xl-count-default");
    const tuneXxlCount = documentRef.getElementById("tune-xxl-count");
    const tuneXxlCountOut = documentRef.getElementById("tune-xxl-count-out");
    const tuneXxlCountSave = documentRef.getElementById("tune-xxl-count-save");
    const tuneXxlCountDefault = documentRef.getElementById("tune-xxl-count-default");
    const tuneTier2Unlock = documentRef.getElementById("tune-tier2-unlock");
    const tuneTier2UnlockOut = documentRef.getElementById("tune-tier2-unlock-out");
    const tuneTier2UnlockSave = documentRef.getElementById("tune-tier2-unlock-save");
    const tuneTier2UnlockDefault = documentRef.getElementById("tune-tier2-unlock-default");
    const tuneTier3Unlock = documentRef.getElementById("tune-tier3-unlock");
    const tuneTier3UnlockOut = documentRef.getElementById("tune-tier3-unlock-out");
    const tuneTier3UnlockSave = documentRef.getElementById("tune-tier3-unlock-save");
    const tuneTier3UnlockDefault = documentRef.getElementById("tune-tier3-unlock-default");
    const tuneTier1Zoom = documentRef.getElementById("tune-tier1-zoom");
    const tuneTier1ZoomOut = documentRef.getElementById("tune-tier1-zoom-out");
    const tuneTier1ZoomSave = documentRef.getElementById("tune-tier1-zoom-save");
    const tuneTier1ZoomDefault = documentRef.getElementById("tune-tier1-zoom-default");
    const tuneTier2Zoom = documentRef.getElementById("tune-tier2-zoom");
    const tuneTier2ZoomOut = documentRef.getElementById("tune-tier2-zoom-out");
    const tuneTier2ZoomSave = documentRef.getElementById("tune-tier2-zoom-save");
    const tuneTier2ZoomDefault = documentRef.getElementById("tune-tier2-zoom-default");
    const tuneTier3Zoom = documentRef.getElementById("tune-tier3-zoom");
    const tuneTier3ZoomOut = documentRef.getElementById("tune-tier3-zoom-out");
    const tuneTier3ZoomSave = documentRef.getElementById("tune-tier3-zoom-save");
    const tuneTier3ZoomDefault = documentRef.getElementById("tune-tier3-zoom-default");
    const tuneTierZoomSec = documentRef.getElementById("tune-tier-zoom-sec");
    const tuneTierZoomSecOut = documentRef.getElementById("tune-tier-zoom-sec-out");
    const tuneTierZoomSecSave = documentRef.getElementById("tune-tier-zoom-sec-save");
    const tuneTierZoomSecDefault = documentRef.getElementById("tune-tier-zoom-sec-default");
    const tuneStarDensity = documentRef.getElementById("tune-star-density");
    const tuneStarDensityOut = documentRef.getElementById("tune-star-density-out");
    const tuneStarDensitySave = documentRef.getElementById("tune-star-density-save");
    const tuneStarDensityDefault = documentRef.getElementById("tune-star-density-default");
    const tuneParallax = documentRef.getElementById("tune-parallax");
    const tuneParallaxOut = documentRef.getElementById("tune-parallax-out");
    const tuneParallaxSave = documentRef.getElementById("tune-parallax-save");
    const tuneParallaxDefault = documentRef.getElementById("tune-parallax-default");
    const tuneStarAccentChance = documentRef.getElementById("tune-star-accent-chance");
    const tuneStarAccentChanceOut = documentRef.getElementById("tune-star-accent-chance-out");
    const tuneStarAccentChanceSave = documentRef.getElementById("tune-star-accent-chance-save");
    const tuneStarAccentChanceDefault = documentRef.getElementById("tune-star-accent-chance-default");
    const tuneTwinkleChance = documentRef.getElementById("tune-twinkle-chance");
    const tuneTwinkleChanceOut = documentRef.getElementById("tune-twinkle-chance-out");
    const tuneTwinkleChanceSave = documentRef.getElementById("tune-twinkle-chance-save");
    const tuneTwinkleChanceDefault = documentRef.getElementById("tune-twinkle-chance-default");
    const tuneTwinkleStrength = documentRef.getElementById("tune-twinkle-strength");
    const tuneTwinkleStrengthOut = documentRef.getElementById("tune-twinkle-strength-out");
    const tuneTwinkleStrengthSave = documentRef.getElementById("tune-twinkle-strength-save");
    const tuneTwinkleStrengthDefault = documentRef.getElementById("tune-twinkle-strength-default");
    const tuneTwinkleSpeed = documentRef.getElementById("tune-twinkle-speed");
    const tuneTwinkleSpeedOut = documentRef.getElementById("tune-twinkle-speed-out");
    const tuneTwinkleSpeedSave = documentRef.getElementById("tune-twinkle-speed-save");
    const tuneTwinkleSpeedDefault = documentRef.getElementById("tune-twinkle-speed-default");
    const nf = new Intl.NumberFormat();
    function setOut(outEl, value, suffix = "") {
      if (!outEl)
        return;
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
        suffix: " px"
      },
      {
        key: "forceFieldRadius",
        input: tuneField,
        saveBtn: tuneFieldSave,
        savedOut: tuneFieldDefault,
        suffix: " px"
      },
      {
        key: "tier1ForceFieldScale",
        input: tuneFieldScale1,
        saveBtn: tuneFieldScale1Save,
        savedOut: tuneFieldScale1Default,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}x`
      },
      {
        key: "tier2ForceFieldScale",
        input: tuneFieldScale2,
        saveBtn: tuneFieldScale2Save,
        savedOut: tuneFieldScale2Default,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}x`
      },
      {
        key: "tier3ForceFieldScale",
        input: tuneFieldScale3,
        saveBtn: tuneFieldScale3Save,
        savedOut: tuneFieldScale3Default,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}x`
      },
      {
        key: "forceFieldHullGap",
        input: tuneFieldGap,
        saveBtn: tuneFieldGapSave,
        savedOut: tuneFieldGapDefault,
        suffix: " px"
      },
      {
        key: "gravityK",
        input: tuneGravity,
        saveBtn: tuneGravitySave,
        savedOut: tuneGravityDefault,
        suffix: ""
      },
      {
        key: "innerGravityMult",
        input: tuneInnerGrav,
        saveBtn: tuneInnerGravSave,
        savedOut: tuneInnerGravDefault,
        suffix: "",
        format: (v) => `x${Number(v).toFixed(2)}`
      },
      {
        key: "gemTtlSec",
        input: tuneGemTtl,
        saveBtn: tuneGemTtlSave,
        savedOut: tuneGemTtlDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(1)} s`
      },
      {
        key: "gemBlinkMaxHz",
        input: tuneGemBlink,
        saveBtn: tuneGemBlinkSave,
        savedOut: tuneGemBlinkDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(1)} /s`
      },
      {
        key: "captureSpeed",
        input: tuneCapture,
        saveBtn: tuneCaptureSave,
        savedOut: tuneCaptureDefault,
        suffix: " px/s"
      },
      {
        key: "burstSpeed",
        input: tuneBurst,
        saveBtn: tuneBurstSave,
        savedOut: tuneBurstDefault,
        suffix: " px/s"
      },
      {
        key: "shipThrust",
        input: tuneThrust,
        saveBtn: tuneThrustSave,
        savedOut: tuneThrustDefault,
        suffix: " px/s^2"
      },
      {
        key: "smallDamageSpeedMin",
        input: tuneDmg,
        saveBtn: tuneDmgSave,
        savedOut: tuneDmgDefault,
        suffix: " px/s"
      },
      {
        key: "xlargeRadius",
        input: tuneXlRadius,
        saveBtn: tuneXlRadiusSave,
        savedOut: tuneXlRadiusDefault,
        suffix: " px"
      },
      {
        key: "xxlargeRadius",
        input: tuneXxlRadius,
        saveBtn: tuneXxlRadiusSave,
        savedOut: tuneXxlRadiusDefault,
        suffix: " px"
      },
      {
        key: "xlargeCount",
        input: tuneXlCount,
        saveBtn: tuneXlCountSave,
        savedOut: tuneXlCountDefault,
        suffix: ""
      },
      {
        key: "xxlargeCount",
        input: tuneXxlCount,
        saveBtn: tuneXxlCountSave,
        savedOut: tuneXxlCountDefault,
        suffix: ""
      },
      {
        key: "fractureImpactSpeed",
        input: tuneFracture,
        saveBtn: tuneFractureSave,
        savedOut: tuneFractureDefault,
        suffix: " px/s"
      },
      {
        key: "tier2UnlockGemScore",
        input: tuneTier2Unlock,
        saveBtn: tuneTier2UnlockSave,
        savedOut: tuneTier2UnlockDefault,
        suffix: ""
      },
      {
        key: "tier3UnlockGemScore",
        input: tuneTier3Unlock,
        saveBtn: tuneTier3UnlockSave,
        savedOut: tuneTier3UnlockDefault,
        suffix: ""
      },
      {
        key: "tier1Zoom",
        input: tuneTier1Zoom,
        saveBtn: tuneTier1ZoomSave,
        savedOut: tuneTier1ZoomDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}x`
      },
      {
        key: "tier2Zoom",
        input: tuneTier2Zoom,
        saveBtn: tuneTier2ZoomSave,
        savedOut: tuneTier2ZoomDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}x`
      },
      {
        key: "tier3Zoom",
        input: tuneTier3Zoom,
        saveBtn: tuneTier3ZoomSave,
        savedOut: tuneTier3ZoomDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}x`
      },
      {
        key: "tierZoomTweenSec",
        input: tuneTierZoomSec,
        saveBtn: tuneTierZoomSecSave,
        savedOut: tuneTierZoomSecDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)} s`
      },
      {
        key: "asteroidWorldDensityScale",
        input: tuneWorldDensity,
        saveBtn: tuneWorldDensitySave,
        savedOut: tuneWorldDensityDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}x`
      },
      {
        key: "starDensityScale",
        input: tuneStarDensity,
        saveBtn: tuneStarDensitySave,
        savedOut: tuneStarDensityDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}x`
      },
      {
        key: "starParallaxStrength",
        input: tuneParallax,
        saveBtn: tuneParallaxSave,
        savedOut: tuneParallaxDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}x`
      },
      {
        key: "starAccentChance",
        input: tuneStarAccentChance,
        saveBtn: tuneStarAccentChanceSave,
        savedOut: tuneStarAccentChanceDefault,
        suffix: "",
        format: (v) => `${(Number(v) * 100).toFixed(0)}%`
      },
      {
        key: "starTwinkleChance",
        input: tuneTwinkleChance,
        saveBtn: tuneTwinkleChanceSave,
        savedOut: tuneTwinkleChanceDefault,
        suffix: "",
        format: (v) => `${(Number(v) * 100).toFixed(0)}%`
      },
      {
        key: "starTwinkleStrength",
        input: tuneTwinkleStrength,
        saveBtn: tuneTwinkleStrengthSave,
        savedOut: tuneTwinkleStrengthDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}x`
      },
      {
        key: "starTwinkleSpeed",
        input: tuneTwinkleSpeed,
        saveBtn: tuneTwinkleSpeedSave,
        savedOut: tuneTwinkleSpeedDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}x`
      }
    ];
    function readTuningDefaultsFromStorage() {
      try {
        const raw = localStorage.getItem(TUNING_DEFAULTS_STORAGE_KEY);
        if (!raw)
          return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object")
          return null;
        const out = {};
        for (const f of TUNING_FIELDS) {
          const v = parsed[f.key];
          if (Number.isFinite(Number(v)))
            out[f.key] = Number(v);
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
      }
    }
    function setTuningDefault(key, value) {
      const next = { ...readTuningDefaultsFromStorage() || {} };
      next[key] = value;
      writeTuningDefaultsToStorage(next);
      return next;
    }
    function applyTuningDefaultsToParams() {
      const defaults = readTuningDefaultsFromStorage();
      if (!defaults)
        return;
      const p = game.state.params;
      for (const f of TUNING_FIELDS) {
        if (!Object.prototype.hasOwnProperty.call(defaults, f.key))
          continue;
        p[f.key] = defaults[f.key];
      }
      const before = {
        attractRadius: p.attractRadius,
        forceFieldRadius: p.forceFieldRadius
      };
      p.forceFieldRadius = clamp(p.forceFieldRadius, 40, 420);
      p.tier1ForceFieldScale = clamp(Number(p.tier1ForceFieldScale ?? SHIP_TIERS.small.forcefieldScale), 0.2, 6);
      p.tier2ForceFieldScale = clamp(Number(p.tier2ForceFieldScale ?? SHIP_TIERS.medium.forcefieldScale), 0.2, 6);
      p.tier3ForceFieldScale = clamp(Number(p.tier3ForceFieldScale ?? SHIP_TIERS.large.forcefieldScale), 0.2, 6);
      p.forceFieldHullGap = clamp(Number(p.forceFieldHullGap ?? 14), 0, 200);
      ensureAttractRadiusCoversForcefield(p);
      p.xlargeRadius = clamp(p.xlargeRadius, p.largeRadius + 6, 220);
      p.xxlargeRadius = clamp(p.xxlargeRadius, p.xlargeRadius + 6, 320);
      p.xlargeCount = clamp(Math.round(p.xlargeCount), 0, 50);
      p.xxlargeCount = clamp(Math.round(p.xxlargeCount), 0, 50);
      p.tier2UnlockGemScore = clamp(Math.round(p.tier2UnlockGemScore), 1, 1e4);
      p.tier3UnlockGemScore = clamp(Math.round(p.tier3UnlockGemScore), p.tier2UnlockGemScore + 50, 1e4);
      p.tier1Zoom = clamp(p.tier1Zoom, 0.35, 1.2);
      p.tier2Zoom = clamp(p.tier2Zoom, 0.35, 1.2);
      p.tier3Zoom = clamp(p.tier3Zoom, 0.35, 1.2);
      p.tierZoomTweenSec = clamp(p.tierZoomTweenSec, 0.05, 1.2);
      if (Object.prototype.hasOwnProperty.call(defaults, "forceFieldRadius") && before.forceFieldRadius !== p.forceFieldRadius) {
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
          if (f.format && f.savedOut)
            f.savedOut.textContent = f.format(v);
          else
            setOut(f.savedOut, v, f.suffix);
        } else if (f.savedOut) {
          f.savedOut.textContent = "\u2014";
        }
      }
    }
    function syncTuningUiFromParams() {
      const p = game.state.params;
      if (tuneAttract) {
        const maxNow = Number(tuneAttract.max || 0);
        if (Number.isFinite(maxNow) && maxNow > 0 && p.attractRadius > maxNow)
          tuneAttract.max = String(Math.ceil(p.attractRadius));
        tuneAttract.value = String(Math.round(p.attractRadius));
      }
      if (tuneField)
        tuneField.value = String(Math.round(p.forceFieldRadius));
      if (tuneFieldScale1)
        tuneFieldScale1.value = String(p.tier1ForceFieldScale);
      if (tuneFieldScale2)
        tuneFieldScale2.value = String(p.tier2ForceFieldScale);
      if (tuneFieldScale3)
        tuneFieldScale3.value = String(p.tier3ForceFieldScale);
      if (tuneFieldGap)
        tuneFieldGap.value = String(Math.round(p.forceFieldHullGap));
      if (tuneGravity)
        tuneGravity.value = String(Math.round(p.gravityK));
      if (tuneInnerGrav)
        tuneInnerGrav.value = String(p.innerGravityMult);
      if (tuneGemTtl)
        tuneGemTtl.value = String(p.gemTtlSec);
      if (tuneGemBlink)
        tuneGemBlink.value = String(p.gemBlinkMaxHz);
      if (tuneCapture)
        tuneCapture.value = String(Math.round(p.captureSpeed));
      if (tuneBurst)
        tuneBurst.value = String(Math.round(p.burstSpeed));
      if (tuneThrust)
        tuneThrust.value = String(Math.round(p.shipThrust));
      if (tuneDmg)
        tuneDmg.value = String(Math.round(p.smallDamageSpeedMin));
      if (tuneXlRadius)
        tuneXlRadius.value = String(Math.round(p.xlargeRadius));
      if (tuneXxlRadius)
        tuneXxlRadius.value = String(Math.round(p.xxlargeRadius));
      if (tuneXlCount)
        tuneXlCount.value = String(Math.round(p.xlargeCount));
      if (tuneXxlCount)
        tuneXxlCount.value = String(Math.round(p.xxlargeCount));
      if (tuneFracture)
        tuneFracture.value = String(Math.round(p.fractureImpactSpeed));
      if (tuneTier2Unlock)
        tuneTier2Unlock.value = String(Math.round(p.tier2UnlockGemScore));
      if (tuneTier3Unlock)
        tuneTier3Unlock.value = String(Math.round(p.tier3UnlockGemScore));
      if (tuneTier1Zoom)
        tuneTier1Zoom.value = String(p.tier1Zoom);
      if (tuneTier2Zoom)
        tuneTier2Zoom.value = String(p.tier2Zoom);
      if (tuneTier3Zoom)
        tuneTier3Zoom.value = String(p.tier3Zoom);
      if (tuneTierZoomSec)
        tuneTierZoomSec.value = String(p.tierZoomTweenSec);
      if (tuneWorldDensity)
        tuneWorldDensity.value = String(p.asteroidWorldDensityScale);
      if (tuneStarDensity)
        tuneStarDensity.value = String(p.starDensityScale);
      if (tuneParallax)
        tuneParallax.value = String(p.starParallaxStrength);
      if (tuneStarAccentChance)
        tuneStarAccentChance.value = String(p.starAccentChance);
      if (tuneTwinkleChance)
        tuneTwinkleChance.value = String(p.starTwinkleChance);
      if (tuneTwinkleStrength)
        tuneTwinkleStrength.value = String(p.starTwinkleStrength);
      if (tuneTwinkleSpeed)
        tuneTwinkleSpeed.value = String(p.starTwinkleSpeed);
      syncTuningUiLabels();
    }
    function syncTuningUiLabels() {
      const p = game.state.params;
      setOut(tuneAttractOut, readNum(tuneAttract, p.attractRadius), " px");
      setOut(tuneFieldOut, readNum(tuneField, p.forceFieldRadius), " px");
      if (tuneFieldScale1Out)
        tuneFieldScale1Out.textContent = `${readNum(tuneFieldScale1, p.tier1ForceFieldScale).toFixed(2)}x`;
      if (tuneFieldScale2Out)
        tuneFieldScale2Out.textContent = `${readNum(tuneFieldScale2, p.tier2ForceFieldScale).toFixed(2)}x`;
      if (tuneFieldScale3Out)
        tuneFieldScale3Out.textContent = `${readNum(tuneFieldScale3, p.tier3ForceFieldScale).toFixed(2)}x`;
      setOut(tuneFieldGapOut, readNum(tuneFieldGap, p.forceFieldHullGap), " px");
      setOut(tuneGravityOut, readNum(tuneGravity, p.gravityK));
      if (tuneInnerGravOut)
        tuneInnerGravOut.textContent = `x${readNum(tuneInnerGrav, p.innerGravityMult).toFixed(2)}`;
      if (tuneGemTtlOut)
        tuneGemTtlOut.textContent = `${readNum(tuneGemTtl, p.gemTtlSec).toFixed(1)} s`;
      if (tuneGemBlinkOut)
        tuneGemBlinkOut.textContent = `${readNum(tuneGemBlink, p.gemBlinkMaxHz).toFixed(1)} /s`;
      setOut(tuneCaptureOut, readNum(tuneCapture, p.captureSpeed), " px/s");
      setOut(tuneBurstOut, readNum(tuneBurst, p.burstSpeed), " px/s");
      setOut(tuneThrustOut, readNum(tuneThrust, p.shipThrust), " px/s^2");
      setOut(tuneDmgOut, readNum(tuneDmg, p.smallDamageSpeedMin), " px/s");
      setOut(tuneXlRadiusOut, readNum(tuneXlRadius, p.xlargeRadius), " px");
      setOut(tuneXxlRadiusOut, readNum(tuneXxlRadius, p.xxlargeRadius), " px");
      setOut(tuneXlCountOut, readNum(tuneXlCount, p.xlargeCount));
      setOut(tuneXxlCountOut, readNum(tuneXxlCount, p.xxlargeCount));
      setOut(tuneFractureOut, readNum(tuneFracture, p.fractureImpactSpeed), " px/s");
      setOut(tuneTier2UnlockOut, readNum(tuneTier2Unlock, p.tier2UnlockGemScore));
      setOut(tuneTier3UnlockOut, readNum(tuneTier3Unlock, p.tier3UnlockGemScore));
      if (tuneTier1ZoomOut)
        tuneTier1ZoomOut.textContent = `${readNum(tuneTier1Zoom, p.tier1Zoom).toFixed(2)}x`;
      if (tuneTier2ZoomOut)
        tuneTier2ZoomOut.textContent = `${readNum(tuneTier2Zoom, p.tier2Zoom).toFixed(2)}x`;
      if (tuneTier3ZoomOut)
        tuneTier3ZoomOut.textContent = `${readNum(tuneTier3Zoom, p.tier3Zoom).toFixed(2)}x`;
      if (tuneTierZoomSecOut)
        tuneTierZoomSecOut.textContent = `${readNum(tuneTierZoomSec, p.tierZoomTweenSec).toFixed(2)} s`;
      if (tuneWorldDensityOut) {
        tuneWorldDensityOut.textContent = `${readNum(tuneWorldDensity, p.asteroidWorldDensityScale).toFixed(2)}x`;
      }
      if (tuneStarDensityOut)
        tuneStarDensityOut.textContent = `${readNum(tuneStarDensity, p.starDensityScale).toFixed(2)}x`;
      if (tuneParallaxOut)
        tuneParallaxOut.textContent = `${readNum(tuneParallax, p.starParallaxStrength).toFixed(2)}x`;
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
    function applyTuningFromMenu() {
      const p = game.state.params;
      p.attractRadius = readNum(tuneAttract, p.attractRadius);
      p.forceFieldRadius = readNum(tuneField, p.forceFieldRadius);
      p.forceFieldRadius = clamp(p.forceFieldRadius, 40, 420);
      p.tier1ForceFieldScale = clamp(readNum(tuneFieldScale1, p.tier1ForceFieldScale), 0.2, 6);
      p.tier2ForceFieldScale = clamp(readNum(tuneFieldScale2, p.tier2ForceFieldScale), 0.2, 6);
      p.tier3ForceFieldScale = clamp(readNum(tuneFieldScale3, p.tier3ForceFieldScale), 0.2, 6);
      p.forceFieldHullGap = clamp(Math.round(readNum(tuneFieldGap, p.forceFieldHullGap)), 0, 200);
      ensureAttractRadiusCoversForcefield(p);
      p.gravityK = readNum(tuneGravity, p.gravityK);
      p.innerGravityMult = clamp(readNum(tuneInnerGrav, p.innerGravityMult), 1, 8);
      p.gemTtlSec = clamp(readNum(tuneGemTtl, p.gemTtlSec), 0.5, 60);
      p.gemBlinkMaxHz = clamp(readNum(tuneGemBlink, p.gemBlinkMaxHz), 0.25, 12);
      p.captureSpeed = readNum(tuneCapture, p.captureSpeed);
      p.burstSpeed = readNum(tuneBurst, p.burstSpeed);
      p.shipThrust = readNum(tuneThrust, p.shipThrust);
      p.smallDamageSpeedMin = readNum(tuneDmg, p.smallDamageSpeedMin);
      p.xlargeRadius = clamp(readNum(tuneXlRadius, p.xlargeRadius), p.largeRadius + 6, 220);
      p.xxlargeRadius = clamp(readNum(tuneXxlRadius, p.xxlargeRadius), p.xlargeRadius + 6, 320);
      p.xlargeCount = clamp(Math.round(readNum(tuneXlCount, p.xlargeCount)), 0, 50);
      p.xxlargeCount = clamp(Math.round(readNum(tuneXxlCount, p.xxlargeCount)), 0, 50);
      p.fractureImpactSpeed = readNum(tuneFracture, p.fractureImpactSpeed);
      p.tier2UnlockGemScore = clamp(Math.round(readNum(tuneTier2Unlock, p.tier2UnlockGemScore)), 1, 1e4);
      p.tier3UnlockGemScore = clamp(Math.round(readNum(tuneTier3Unlock, p.tier3UnlockGemScore)), 1, 1e4);
      if (p.tier3UnlockGemScore <= p.tier2UnlockGemScore)
        p.tier3UnlockGemScore = p.tier2UnlockGemScore + 50;
      p.tier1Zoom = clamp(readNum(tuneTier1Zoom, p.tier1Zoom), 0.35, 1.2);
      p.tier2Zoom = clamp(readNum(tuneTier2Zoom, p.tier2Zoom), 0.35, 1.2);
      p.tier3Zoom = clamp(readNum(tuneTier3Zoom, p.tier3Zoom), 0.35, 1.2);
      p.tierZoomTweenSec = clamp(readNum(tuneTierZoomSec, p.tierZoomTweenSec), 0.05, 1.2);
      p.asteroidWorldDensityScale = clamp(readNum(tuneWorldDensity, p.asteroidWorldDensityScale), 0.08, 2.5);
      p.starDensityScale = clamp(readNum(tuneStarDensity, p.starDensityScale), 0.4, 2.2);
      p.starParallaxStrength = clamp(readNum(tuneParallax, p.starParallaxStrength), 0, 1.8);
      p.starAccentChance = clamp(readNum(tuneStarAccentChance, p.starAccentChance), 0, 0.35);
      p.starTwinkleChance = clamp(readNum(tuneTwinkleChance, p.starTwinkleChance), 0, 1);
      p.starTwinkleStrength = clamp(readNum(tuneTwinkleStrength, p.starTwinkleStrength), 0, 0.8);
      p.starTwinkleSpeed = clamp(readNum(tuneTwinkleSpeed, p.starTwinkleSpeed), 0.2, 3);
      game.state.settings.tierOverrideEnabled = !!dbgTierOverride?.checked;
      game.state.settings.tierOverrideIndex = clamp(Math.round(readNum(dbgTierOverrideLevel, 1)), 1, 3);
      game.state.settings.pauseOnMenuOpen = !!dbgPauseOnOpen?.checked;
      game.refreshBackground();
      game.refreshProgression({ animateZoom: false });
      syncTuningUiFromParams();
    }
    function syncArenaUi() {
      if (dbgCameraMode)
        dbgCameraMode.value = game.state.camera.mode || "centered";
      if (dbgWorldScale)
        dbgWorldScale.value = String(game.state.world.scale || 1);
      if (dbgWorldScaleOut)
        dbgWorldScaleOut.textContent = `${Number(game.state.world.scale || 1).toFixed(2)}x`;
      if (dbgPauseOnOpen)
        dbgPauseOnOpen.checked = !!game.state.settings.pauseOnMenuOpen;
      if (dbgTierOverride)
        dbgTierOverride.checked = !!game.state.settings.tierOverrideEnabled;
      if (dbgTierOverrideLevel)
        dbgTierOverrideLevel.value = String(Math.round(game.state.settings.tierOverrideIndex || 1));
      if (dbgTierOverrideOut)
        dbgTierOverrideOut.textContent = `${Math.round(game.state.settings.tierOverrideIndex || 1)}`;
    }
    function applyArenaFromMenu() {
      const mode = dbgCameraMode?.value === "deadzone" ? "deadzone" : "centered";
      const scale = clamp(readNum(dbgWorldScale, game.state.world.scale || 1), 1, 10);
      game.setArenaConfig({ cameraMode: mode, worldScale: scale });
      if (dbgWorldScale)
        dbgWorldScale.value = String(scale);
      if (dbgWorldScaleOut)
        dbgWorldScaleOut.textContent = `${scale.toFixed(2)}x`;
      game.state.settings.pauseOnMenuOpen = !!dbgPauseOnOpen?.checked;
      game.state.settings.tierOverrideEnabled = !!dbgTierOverride?.checked;
      game.state.settings.tierOverrideIndex = clamp(Math.round(readNum(dbgTierOverrideLevel, 1)), 1, 3);
      if (dbgTierOverrideOut)
        dbgTierOverrideOut.textContent = `${Math.round(game.state.settings.tierOverrideIndex)}`;
      game.refreshProgression({ animateZoom: false });
    }
    function applyDebugFlagsFromMenu() {
      game.state.settings.showAttractRadius = !!dbgAttract?.checked;
      game.state.settings.shipExplodesOnImpact = !!shipExplode?.checked;
      game.state.settings.pauseOnMenuOpen = !!dbgPauseOnOpen?.checked;
      game.state.settings.tierOverrideEnabled = !!dbgTierOverride?.checked;
      game.state.settings.tierOverrideIndex = clamp(Math.round(readNum(dbgTierOverrideLevel, 1)), 1, 3);
      if (dbgTierOverrideOut)
        dbgTierOverrideOut.textContent = `${Math.round(game.state.settings.tierOverrideIndex)}`;
    }
    function syncRuntimeDebugUi() {
      if (dbgGemScoreOut)
        dbgGemScoreOut.textContent = `${Math.round(game.state.score)}`;
      if (dbgCurrentTierOut)
        dbgCurrentTierOut.textContent = `${game.state.progression.currentTier}`;
      if (dbgGemScore && documentRef.activeElement !== dbgGemScore) {
        dbgGemScore.value = String(clamp(Math.round(game.state.score), 0, 5e3));
      }
    }
    function updateHudScore() {
      if (hudScore)
        hudScore.textContent = `Score: ${nf.format(game.state.score)}`;
    }
    function isMenuVisible() {
      if (!menu)
        return false;
      return menu.style.display !== "none";
    }
    function clearHeldInput() {
      const i = game.state.input;
      i.left = false;
      i.right = false;
      i.up = false;
      i.down = false;
      i.burst = false;
    }
    function syncMenuButtons() {
      const playing = game.state.mode === "playing";
      if (startBtn)
        startBtn.textContent = playing ? "Apply + Resume" : "Start";
      if (debugToggleBtn) {
        const visible = isMenuVisible();
        debugToggleBtn.textContent = visible ? "Close Debug (M)" : "Open Debug (M)";
        debugToggleBtn.setAttribute("aria-expanded", visible ? "true" : "false");
      }
    }
    function setMenuVisible(visible) {
      if (!menu)
        return;
      menu.style.display = visible ? "grid" : "none";
      if (visible)
        clearHeldInput();
      if (visible)
        syncRuntimeDebugUi();
      syncMenuButtons();
    }
    function startOrResume() {
      applyTuningFromMenu();
      applyDebugFlagsFromMenu();
      applyArenaFromMenu();
      if (game.state.mode === "menu") {
        game.startGame();
      } else if (game.state.mode === "gameover") {
        game.resetWorld();
        game.state.mode = "playing";
      }
      setMenuVisible(false);
    }
    function toggleDebugMenu() {
      if (isMenuVisible()) {
        setMenuVisible(false);
      } else {
        syncTuningUiFromParams();
        syncArenaUi();
        setMenuVisible(true);
      }
    }
    function applyAllFromMenu() {
      applyTuningFromMenu();
      applyDebugFlagsFromMenu();
      applyArenaFromMenu();
    }
    function bindTuneInput(el) {
      if (!el)
        return;
      el.addEventListener("input", () => {
        syncTuningUiLabels();
        applyTuningFromMenu();
      });
    }
    bindTuneInput(tuneAttract);
    bindTuneInput(tuneField);
    bindTuneInput(tuneFieldScale1);
    bindTuneInput(tuneFieldScale2);
    bindTuneInput(tuneFieldScale3);
    bindTuneInput(tuneFieldGap);
    bindTuneInput(tuneGravity);
    bindTuneInput(tuneInnerGrav);
    bindTuneInput(tuneGemTtl);
    bindTuneInput(tuneGemBlink);
    bindTuneInput(tuneCapture);
    bindTuneInput(tuneBurst);
    bindTuneInput(tuneThrust);
    bindTuneInput(tuneDmg);
    bindTuneInput(tuneXlRadius);
    bindTuneInput(tuneXxlRadius);
    bindTuneInput(tuneXlCount);
    bindTuneInput(tuneXxlCount);
    bindTuneInput(tuneFracture);
    bindTuneInput(tuneTier2Unlock);
    bindTuneInput(tuneTier3Unlock);
    bindTuneInput(tuneTier1Zoom);
    bindTuneInput(tuneTier2Zoom);
    bindTuneInput(tuneTier3Zoom);
    bindTuneInput(tuneTierZoomSec);
    bindTuneInput(tuneWorldDensity);
    bindTuneInput(tuneStarDensity);
    bindTuneInput(tuneParallax);
    bindTuneInput(tuneStarAccentChance);
    bindTuneInput(tuneTwinkleChance);
    bindTuneInput(tuneTwinkleStrength);
    bindTuneInput(tuneTwinkleSpeed);
    if (startBtn)
      startBtn.addEventListener("click", () => startOrResume());
    if (debugToggleBtn)
      debugToggleBtn.addEventListener("click", () => toggleDebugMenu());
    if (dbgCameraMode)
      dbgCameraMode.addEventListener("change", () => applyArenaFromMenu());
    if (dbgWorldScale)
      dbgWorldScale.addEventListener("input", () => applyArenaFromMenu());
    if (dbgPauseOnOpen)
      dbgPauseOnOpen.addEventListener("change", () => applyDebugFlagsFromMenu());
    if (dbgTierOverride) {
      dbgTierOverride.addEventListener("change", () => {
        applyDebugFlagsFromMenu();
        game.refreshProgression({ animateZoom: false });
      });
    }
    if (dbgTierOverrideLevel) {
      dbgTierOverrideLevel.addEventListener("input", () => {
        applyDebugFlagsFromMenu();
        game.refreshProgression({ animateZoom: false });
      });
    }
    if (dbgGemScore) {
      dbgGemScore.addEventListener("input", () => {
        game.state.score = clamp(Math.round(readNum(dbgGemScore, game.state.score)), 0, 5e3);
        game.refreshProgression({ animateZoom: true });
        syncRuntimeDebugUi();
      });
    }
    if (dbgAttract)
      dbgAttract.addEventListener("change", () => applyDebugFlagsFromMenu());
    if (shipExplode)
      shipExplode.addEventListener("change", () => applyDebugFlagsFromMenu());
    for (const f of TUNING_FIELDS) {
      if (!f.saveBtn || !f.input)
        continue;
      f.saveBtn.addEventListener("click", () => {
        const p = game.state.params;
        const v = readNum(f.input, p[f.key]);
        setTuningDefault(f.key, v);
        syncTuningDefaultLabels();
        const prev = f.saveBtn.textContent;
        f.saveBtn.textContent = "Saved";
        windowRef.setTimeout(() => {
          f.saveBtn.textContent = prev;
        }, 800);
      });
    }
    applyTuningDefaultsToParams();
    syncTuningUiFromParams();
    applyTuningFromMenu();
    syncArenaUi();
    applyArenaFromMenu();
    applyDebugFlagsFromMenu();
    syncMenuButtons();
    syncRuntimeDebugUi();
    syncTuningDefaultLabels();
    if (canvas) {
      canvas.addEventListener("click", () => {
        if (game.state.mode === "menu")
          startOrResume();
      });
    }
    return {
      applyAllFromMenu,
      isMenuVisible,
      setMenuVisible,
      startOrResume,
      toggleDebugMenu,
      syncRuntimeDebugUi,
      updateHudScore
    };
  }

  // src/main.js
  (() => {
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d", { alpha: false });
    const engine = createEngine({ width: canvas.width, height: canvas.height });
    const renderer = createRenderer(engine);
    const game = {
      ...engine,
      render: (drawCtx) => renderer.render(drawCtx),
      engine,
      renderer
    };
    const ui = createUiBindings({ game, canvas, documentRef: document, windowRef: window });
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
    function toggleFullscreen() {
      const el = document.documentElement;
      if (!document.fullscreenElement) {
        el.requestFullscreen?.().catch(() => {
        });
      } else {
        document.exitFullscreen?.().catch(() => {
        });
      }
    }
    window.addEventListener("resize", () => resizeCanvasToCss());
    document.addEventListener("fullscreenchange", () => resizeCanvasToCss());
    resizeCanvasToCss();
    const input = game.state.input;
    function setKey(e, isDown) {
      const menuOpen = ui.isMenuVisible();
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          if (!menuOpen)
            input.left = isDown;
          e.preventDefault();
          break;
        case "ArrowRight":
        case "KeyD":
          if (!menuOpen)
            input.right = isDown;
          e.preventDefault();
          break;
        case "ArrowUp":
        case "KeyW":
          if (!menuOpen)
            input.up = isDown;
          e.preventDefault();
          break;
        case "ArrowDown":
        case "KeyS":
          if (!menuOpen)
            input.down = isDown;
          e.preventDefault();
          break;
        case "Space":
          if (isDown && !menuOpen)
            input.burst = true;
          e.preventDefault();
          break;
        case "KeyR":
          if (isDown) {
            ui.applyAllFromMenu();
            game.resetWorld();
            game.state.mode = "playing";
            ui.setMenuVisible(false);
          }
          break;
        case "KeyF":
          if (isDown)
            toggleFullscreen();
          break;
        case "KeyM":
        case "Backquote":
          if (isDown) {
            if (game.state.mode === "playing" || game.state.mode === "gameover")
              ui.toggleDebugMenu();
          }
          e.preventDefault();
          break;
        case "Escape":
          if (isDown && ui.isMenuVisible() && (game.state.mode === "playing" || game.state.mode === "gameover")) {
            ui.setMenuVisible(false);
            e.preventDefault();
          }
          break;
      }
    }
    window.addEventListener("keydown", (e) => setKey(e, true));
    window.addEventListener("keyup", (e) => setKey(e, false));
    canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0 && game.state.mode === "playing")
        input.burst = true;
    });
    let externalStepping = false;
    let last = performance.now();
    let accumulator = 0;
    const fixedDt = 1 / 60;
    function stepRealTime(ts) {
      const dtMs = Math.min(50, ts - last);
      last = ts;
      accumulator += dtMs / 1e3;
      const pausedByMenu = ui.isMenuVisible() && game.state.mode === "playing" && !!game.state.settings.pauseOnMenuOpen && !externalStepping;
      if (!externalStepping) {
        while (!pausedByMenu && accumulator >= fixedDt) {
          game.update(fixedDt);
          accumulator -= fixedDt;
        }
        if (pausedByMenu)
          accumulator = 0;
      } else {
        accumulator = 0;
      }
      game.render(ctx);
      ui.updateHudScore();
      ui.syncRuntimeDebugUi();
      requestAnimationFrame(stepRealTime);
    }
    requestAnimationFrame(stepRealTime);
    function renderGameToText() {
      return game.renderGameToText();
    }
    function setShipSvgRenderer(tierKey, svgPathData, svgScale = 1) {
      game.setShipSvgRenderer(tierKey, svgPathData, svgScale);
    }
    function advanceTime(ms) {
      externalStepping = true;
      const steps = Math.max(1, Math.round(ms / (1e3 / 60)));
      for (let i = 0; i < steps; i++)
        game.update(1 / 60);
      game.render(ctx);
      ui.updateHudScore();
      ui.syncRuntimeDebugUi();
    }
    const existingApi = window.Blasteroids && typeof window.Blasteroids === "object" ? window.Blasteroids : {};
    window.Blasteroids = {
      ...existingApi,
      renderGameToText,
      setShipSvgRenderer,
      advanceTime
    };
    window.render_game_to_text = () => window.Blasteroids.renderGameToText();
    window.set_ship_svg_renderer = (tierKey, svgPathData, svgScale = 1) => window.Blasteroids.setShipSvgRenderer(tierKey, svgPathData, svgScale);
    window.advanceTime = (ms) => window.Blasteroids.advanceTime(ms);
  })();
})();
