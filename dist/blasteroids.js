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

  // src/engine/shipPresetDefaults.js
  var DEFAULT_SHIP_SVGS = {
    "small": {
      "id": "fighter_needle",
      "path": "M 19 0 L 7 -5 L -10 -4 L -16 0 L -10 4 L 7 5 Z M -9 -2 L -12 0 L -9 2",
      "hullRadius": 19,
      "svgScale": 1,
      "mirrorX": false,
      "engines": null
    },
    "medium": {
      "id": "gunship_hammer",
      "path": "M 19.066 28.876 C 16.265 29.186 13.507 29.497 10.747 29.793 C 10.521 29.817 10.273 29.768 10.053 29.695 C 2.238 27.095 -5.575 24.486 -13.392 21.891 C -13.762 21.769 -14.169 21.705 -14.559 21.704 C -22.344 21.693 -30.129 21.698 -37.914 21.687 C -38.166 21.687 -38.456 21.611 -38.663 21.473 C -43.876 18.011 -49.081 14.538 -54.281 11.056 C -54.493 10.915 -54.692 10.700 -54.806 10.474 C -56.493 7.129 -58.162 3.775 -59.848 0.431 C -60 0.129 -59.991 -0.098 -59.841 -0.397 C -58.150 -3.761 -56.477 -7.134 -54.787 -10.498 C -54.679 -10.712 -54.492 -10.915 -54.292 -11.048 C -49.104 -14.519 -43.911 -17.982 -38.710 -21.433 C -38.489 -21.579 -38.183 -21.665 -37.917 -21.665 C -30.116 -21.677 -22.315 -21.673 -14.514 -21.682 C -14.189 -21.682 -13.851 -21.742 -13.542 -21.844 C -5.683 -24.454 2.171 -27.075 10.029 -29.686 C 10.277 -29.768 10.561 -29.817 10.818 -29.789 C 18.667 -28.925 26.516 -28.046 34.365 -27.182 C 34.730 -27.142 34.964 -27.009 35.171 -26.711 C 37.061 -23.992 38.960 -21.280 40.869 -18.575 C 40.980 -18.418 41.201 -18.237 41.371 -18.238 C 43.256 -18.239 45.140 -18.283 47.024 -18.300 C 51.242 -18.337 55.460 -18.366 59.677 -18.397 C 59.770 -18.398 59.862 -18.398 60 -18.398 C 60 -14.925 60 -11.478 60 -7.972 C 56.913 -6.904 53.780 -5.820 50.571 -4.709 C 51.030 -4.046 51.465 -3.410 51.907 -2.778 C 52.490 -1.943 53.072 -1.108 53.666 -0.280 C 53.816 -0.070 53.819 0.063 53.653 0.296 C 52.279 2.227 50.929 4.177 49.529 6.182 C 52.961 7.370 56.353 8.544 59.748 9.719 C 59.748 13.195 59.748 16.657 59.748 20.145 C 58.626 20.145 57.528 20.154 56.430 20.143 C 54.482 20.124 52.534 20.087 50.586 20.067 C 47.184 20.031 43.781 20.004 40.379 19.966 C 40.062 19.963 39.843 20.006 39.630 20.315 C 38.132 22.494 36.604 24.652 35.068 26.804 C 34.951 26.969 34.714 27.122 34.517 27.145 C 30.588 27.601 26.657 28.038 22.725 28.477 C 21.520 28.612 20.315 28.742 19.066 28.876 M -45.799 8.602 C -47.308 7.531 -48.275 6.098 -48.908 4.423 C -49.971 1.612 -50.048 -1.243 -49.165 -4.105 C -48.536 -6.145 -47.470 -7.909 -45.638 -9.118 C -43.491 -10.534 -40.743 -10.244 -38.881 -8.469 C -36.669 -6.361 -35.779 -3.707 -35.642 -0.753 C -35.511 2.046 -36.150 4.664 -37.856 6.931 C -39.098 8.582 -40.702 9.653 -42.873 9.610 C -43.943 9.589 -44.889 9.194 -45.799 8.602 z M 21.310 1.930 C 21.310 0.369 21.310 -1.146 21.310 -2.688 C 26.746 -2.688 32.140 -2.688 37.560 -2.688 C 37.560 -0.902 37.560 0.877 37.560 2.681 C 32.154 2.681 26.760 2.681 21.310 2.681 C 21.310 2.444 21.310 2.211 21.310 1.930 z",
      "hullRadius": 60,
      "svgScale": 1,
      "mirrorX": true,
      "engines": [
        {
          "x": 60.3,
          "y": -13.25,
          "len": 18
        },
        {
          "x": 60.3,
          "y": 14.95,
          "len": 18
        }
      ]
    },
    "large": {
      "id": "carrier_bulwark",
      "path": "M 46 0 L 32 -20 L 14 -22 L -4 -16 L -22 -16 L -34 -8 L -38 0 L -34 8 L -22 16 L -4 16 L 14 22 L 32 20 Z M 22 -2 L 34 -2 L 34 2 L 22 2",
      "hullRadius": 46,
      "svgScale": 1,
      "mirrorX": false,
      "engines": null
    }
  };

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
  var FRACTURE_SIZE_BIAS_PER_RANK = 0.06;
  var WORLD_BASE_MIN_W = 980;
  var WORLD_BASE_MIN_H = 620;
  var ROUND_PART_COUNT = 4;
  var STAR_EDGE_ORDER = ["left", "right", "top", "bottom"];
  function oppositeStarEdge(edge) {
    if (edge === "left")
      return "right";
    if (edge === "right")
      return "left";
    if (edge === "top")
      return "bottom";
    return "top";
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
  function deriveSeed(seed, salt) {
    const base = Number(seed) >>> 0 || 3737844653;
    const mix = base ^ hashStringToU32(salt) ^ 2654435769;
    let x = mix >>> 0;
    x ^= x >>> 16;
    x = Math.imul(x, 2146121005);
    x ^= x >>> 15;
    x = Math.imul(x, 2221713035);
    x ^= x >>> 16;
    return x >>> 0 || 3737844653;
  }
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
  function makeSvgShipRenderer({ path, hullRadius, svgScale = 1, mirrorX = false, engines = [] }) {
    const hullR = Number(hullRadius);
    const scale = Number(svgScale);
    const mx = mirrorX === true;
    return {
      type: "svg",
      path,
      svgScale: Number.isFinite(scale) ? scale : 1,
      hullRadius: Number.isFinite(hullR) && hullR > 0 ? hullR : void 0,
      mirrorX: mx ? true : void 0,
      engines: Array.isArray(engines) ? engines.map((e) => ({ x: e.x, y: e.y, len: e.len })) : []
    };
  }
  var SHIP_TIERS = {
    small: {
      key: "small",
      label: "Small",
      scale: 1,
      radius: 28,
      mass: 1040,
      burstForceScale: 1,
      forcefieldScale: 1,
      attractScale: 1,
      ringRgb: [255, 221, 88],
      ringColor: "rgba(255,221,88,0.40)",
      attractSizes: ["small"],
      renderer: makeSvgShipRenderer({
        path: DEFAULT_SHIP_SVGS.small.path,
        hullRadius: DEFAULT_SHIP_SVGS.small.hullRadius,
        svgScale: DEFAULT_SHIP_SVGS.small.svgScale,
        mirrorX: DEFAULT_SHIP_SVGS.small.mirrorX,
        engines: Array.isArray(DEFAULT_SHIP_SVGS.small.engines) ? DEFAULT_SHIP_SVGS.small.engines : DEFAULT_SHIP_RENDERERS.small.engines
      })
    },
    medium: {
      key: "medium",
      label: "Medium",
      scale: 2.7,
      radius: 57,
      mass: 4320,
      burstForceScale: 1.38,
      forcefieldScale: 1.28,
      attractScale: 1.2,
      ringRgb: [92, 235, 255],
      ringColor: "rgba(92,235,255,0.42)",
      attractSizes: ["small", "med"],
      renderer: makeSvgShipRenderer({
        path: DEFAULT_SHIP_SVGS.medium.path,
        hullRadius: DEFAULT_SHIP_SVGS.medium.hullRadius,
        svgScale: DEFAULT_SHIP_SVGS.medium.svgScale,
        mirrorX: DEFAULT_SHIP_SVGS.medium.mirrorX,
        engines: Array.isArray(DEFAULT_SHIP_SVGS.medium.engines) ? DEFAULT_SHIP_SVGS.medium.engines : DEFAULT_SHIP_RENDERERS.medium.engines
      })
    },
    large: {
      key: "large",
      label: "Large",
      scale: 8,
      radius: 112,
      mass: 16640,
      burstForceScale: 1.85,
      forcefieldScale: 1.62,
      attractScale: 1.42,
      ringRgb: [255, 112, 127],
      ringColor: "rgba(255,112,127,0.42)",
      attractSizes: ["small", "med", "large"],
      renderer: makeSvgShipRenderer({
        path: DEFAULT_SHIP_SVGS.large.path,
        hullRadius: DEFAULT_SHIP_SVGS.large.hullRadius,
        svgScale: DEFAULT_SHIP_SVGS.large.svgScale,
        mirrorX: DEFAULT_SHIP_SVGS.large.mirrorX,
        engines: Array.isArray(DEFAULT_SHIP_SVGS.large.engines) ? DEFAULT_SHIP_SVGS.large.engines : DEFAULT_SHIP_RENDERERS.large.engines
      })
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
      const svgScale = Number.isFinite(Number(renderer.svgScale)) ? Number(renderer.svgScale) : 1;
      const hullR = Number(renderer.hullRadius);
      if (Number.isFinite(hullR) && hullR > 0)
        return Math.max(tier.radius, tier.radius * svgScale);
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
      tier: tier.key,
      escapeScale: 1
    };
  }
  function shipForward(ship) {
    return angleToVec(ship.angle);
  }
  function makePlayerInput() {
    return {
      left: false,
      right: false,
      up: false,
      down: false,
      burst: false,
      ping: false,
      turnAnalog: 0,
      // [-1,1] optional analog turn input (UI/touch)
      thrustAnalog: 0
      // [0,1] optional analog thrust input (UI/touch)
    };
  }
  function makePlayerProgression() {
    return {
      gemScore: 0,
      currentTier: "small",
      tierShiftT: 0
    };
  }
  function makePlayer(id, {
    ship = makeShip("small"),
    input = makePlayerInput(),
    score = 0,
    gemsCollected = { diamond: 0, ruby: 0, emerald: 0, gold: 0 },
    burstCooldown = 0,
    blastPulseT = 0,
    progression = makePlayerProgression()
  } = {}) {
    return {
      id: String(id ?? ""),
      ship,
      input,
      score,
      gemsCollected,
      burstCooldown,
      blastPulseT,
      progression
    };
  }
  function createEngine({ width, height, seed, role = "client" } = {}) {
    const baseSeedRaw = Number.isFinite(Number(seed)) ? Number(seed) : 3737844653;
    const baseSeed = baseSeedRaw >>> 0 || 3737844653;
    const engineRole = role === "server" ? "server" : "client";
    const isServer = engineRole === "server";
    let sessionSeed = baseSeed;
    let rng = seededRng(baseSeed);
    const starRng = seededRng(1369960461);
    let fxRng = seededRng(deriveSeed(baseSeed, "fx"));
    let exhaustRng = seededRng(518504175);
    const exhaustPool = [];
    const state = {
      role: engineRole,
      mode: "menu",
      // menu | playing | gameover
      time: 0,
      round: {
        sessionSeed: baseSeed,
        roundIndex: 0,
        seed: baseSeed,
        durationSec: 300,
        elapsedSec: 0,
        outcome: null,
        // { kind: "win"|"lose", reason: string } | null
        star: null,
        gate: null,
        techParts: [],
        carriedPartId: null,
        techPing: null,
        techPingCooldownSec: 0,
        starExposureSec: 0,
        escape: null
      },
      ship: makeShip("small"),
      asteroids: [],
      gems: [],
      effects: [],
      exhaust: [],
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
        burst: false,
        ping: false,
        turnAnalog: 0,
        // [-1,1] optional analog turn input (UI/touch)
        thrustAnalog: 0
        // [0,1] optional analog thrust input (UI/touch)
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
        mode: "centered",
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
        exhaustIntensity: 1,
        // VFX only: scales thruster particle emission
        exhaustSparkScale: 1,
        // VFX only: scales spark emission chance
        exhaustPalette: 0,
        // VFX only: 0..N palette id
        exhaustCoreScale: 1,
        // VFX only: core brightness scale
        exhaustGlowScale: 1,
        // VFX only: glow strength scale
        exhaustLegacyJets: 0,
        // VFX only: show old gradient jet overlay
        attractRadius: 252,
        // +5%
        forceFieldRadius: 75,
        tier1ForceFieldScale: SHIP_TIERS.small.forcefieldScale,
        tier2ForceFieldScale: SHIP_TIERS.medium.forcefieldScale,
        tier3ForceFieldScale: SHIP_TIERS.large.forcefieldScale,
        forceFieldHullGap: 14,
        gravityK: 115e4,
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
        burstSpeed: 580,
        // tuned
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
        fractureImpactSpeed: 275,
        // < 0 makes larger asteroids a bit weaker per unit mass (size-effect realism).
        // This counteracts "XL feels impossible" without making small/med paper-thin.
        fractureSizeStrengthExp: -0.8,
        // Below-threshold impacts can accumulate "chip damage" that decays over time.
        // This lets repeated hits break XL/XXL even when a single hit is insufficient.
        fractureChipScale: 1,
        fractureChipDecaySec: 3,
        fractureChipMinSpeed: 140,
        // Glancing impacts: normal-only fracture feels "wrong" for big ship-slung rocks.
        // We allow ship-launched asteroids to contribute some tangential (shear) speed to fracture energy,
        // scaled by the amount of normal closing speed (friction-ish).
        fractureShearWeightLaunched: 0.85,
        fractureShearNormalRefSpeed: 120,
        projectileImpactScale: 1.35,
        maxAsteroids: 4e3,
        asteroidWorldDensityScale: 0.32,
        asteroidSpawnRateScale: 1,
        asteroidSpawnMinSec: 0.18,
        asteroidSpawnMaxSec: 0.45,
        asteroidSpawnUrgentMinSec: 0.05,
        asteroidSpawnUrgentMaxSec: 0.12,
        tier2UnlockGemScore: 500,
        tier3UnlockGemScore: 1e3,
        tier1Zoom: 1,
        tier2Zoom: 0.78,
        tier3Zoom: 0.58,
        deviceCameraZoomScale: 1,
        tierZoomTweenSec: 0.45,
        gemTtlSec: 6,
        gemBlinkMaxHz: 5,
        // Round loop (RL-01..04) — deterministic star/gate/parts.
        roundDurationSec: 300,
        starSafeBufferPx: 320,
        jumpGateRadius: 190,
        jumpGateEdgeInsetExtraPx: 160,
        jumpGateInstallPad: 60,
        jumpGateChargeSec: 2,
        jumpGateEscapeApproachSec: 0.75,
        jumpGateEscapeVanishSec: 0.26,
        techPartRadius: 80,
        techPartPickupPad: 20,
        techPingSpeedPxPerSec: 2400,
        techPingCooldownSec: 3,
        techPingGlowSec: 8,
        techPingThicknessPx: 22,
        techPartEdgeMarginPx: 520,
        shipStarKillSec: 3,
        shipStarCoolRate: 1.6,
        starAsteroidBurnSec: 0.22,
        wallRestitution: 0.65,
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
    state.localPlayerId = "local";
    state.playersById = /* @__PURE__ */ Object.create(null);
    state.playersById[state.localPlayerId] = makePlayer(state.localPlayerId, {
      ship: state.ship,
      input: state.input,
      score: state.score,
      gemsCollected: state.gemsCollected,
      burstCooldown: state.burstCooldown,
      blastPulseT: state.blastPulseT,
      progression: state.progression
    });
    function localPlayer() {
      return state.playersById[state.localPlayerId];
    }
    function sortedPlayerIds() {
      return Object.keys(state.playersById).sort();
    }
    function forEachPlayer(fn) {
      const ids = sortedPlayerIds();
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        fn(state.playersById[id], id, i);
      }
    }
    function aliasLocalPlayerField(field) {
      Object.defineProperty(state, field, {
        enumerable: true,
        configurable: true,
        get() {
          return localPlayer()[field];
        },
        set(value) {
          localPlayer()[field] = value;
        }
      });
    }
    aliasLocalPlayerField("ship");
    aliasLocalPlayerField("input");
    aliasLocalPlayerField("score");
    aliasLocalPlayerField("gemsCollected");
    aliasLocalPlayerField("burstCooldown");
    aliasLocalPlayerField("blastPulseT");
    aliasLocalPlayerField("progression");
    function setGameplaySeed(nextSeed) {
      const raw = Number.isFinite(Number(nextSeed)) ? Number(nextSeed) : 3737844653;
      const s = raw >>> 0 || 3737844653;
      state.round.seed = s;
      rng = seededRng(s);
      fxRng = seededRng(deriveSeed(s, "fx"));
    }
    function setRoundSeed(nextSeed) {
      setSessionSeed(nextSeed);
      setGameplaySeed(state.round.sessionSeed);
    }
    function setSessionSeed(nextSeed) {
      const raw = Number.isFinite(Number(nextSeed)) ? Number(nextSeed) : 3737844653;
      const s = raw >>> 0 || 3737844653;
      sessionSeed = s;
      state.round.sessionSeed = s;
      state.round.roundIndex = 0;
    }
    function advanceToNextRoundSeed() {
      const nextIndex = Math.max(0, Math.floor(state.round.roundIndex || 0)) + 1;
      state.round.roundIndex = nextIndex;
      setGameplaySeed(deriveSeed(sessionSeed, `round-${nextIndex}`));
    }
    function makeRoundRng(tag) {
      return seededRng(deriveSeed(state.round.seed, tag));
    }
    function shipTierForProgression(player = localPlayer()) {
      if (state.settings.tierOverrideEnabled) {
        const idx = clamp(Math.round(state.settings.tierOverrideIndex || 1), 1, SHIP_BASE_BY_TIER_INDEX.length);
        return SHIP_BASE_BY_TIER_INDEX[idx - 1];
      }
      const score = Number(player?.score) || 0;
      if (score >= state.params.tier3UnlockGemScore)
        return "large";
      if (score >= state.params.tier2UnlockGemScore)
        return "medium";
      return "small";
    }
    function currentShipTier(player = localPlayer()) {
      return shipTierByKey(player?.ship?.tier);
    }
    function forceFieldRadiusForPlayer(player = localPlayer()) {
      const tier = currentShipTier(player);
      return requiredForceFieldRadiusForTier(state.params, tier.key);
    }
    function currentForceFieldRadius() {
      return forceFieldRadiusForPlayer(localPlayer());
    }
    function attractRadiusForPlayer(player = localPlayer()) {
      const tier = currentShipTier(player);
      return state.params.attractRadius * tier.attractScale;
    }
    function currentAttractRadius() {
      return attractRadiusForPlayer(localPlayer());
    }
    function burstSpeedForPlayer(player = localPlayer()) {
      const tier = currentShipTier(player);
      const scale = Math.max(0.2, Number(tier.burstForceScale) || 1);
      return state.params.burstSpeed * scale;
    }
    function currentBurstSpeed() {
      return burstSpeedForPlayer(localPlayer());
    }
    function currentShipAttractSizes(player = localPlayer()) {
      return currentShipTier(player).attractSizes;
    }
    function shipCanAttractSize(size, player = localPlayer()) {
      return sizeSetHas(currentShipAttractSizes(player), size);
    }
    function cameraZoomForTier(tierKey) {
      const base = tierKey === "large" ? clamp(state.params.tier3Zoom, 0.35, 1.2) : tierKey === "medium" ? clamp(state.params.tier2Zoom, 0.35, 1.2) : clamp(state.params.tier1Zoom, 0.35, 1.2);
      const deviceScale = clamp(Number(state.params.deviceCameraZoomScale ?? 1), 0.55, 1);
      return clamp(base * deviceScale, 0.35, 1.2);
    }
    function beginCameraZoomTo(targetZoom, animate = true) {
      if (isServer)
        return;
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
      if (isServer)
        return;
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
    function applyShipTierForPlayer(player, nextTierKey, { animateZoom = true, affectCamera = false } = {}) {
      const next = shipTierByKey(nextTierKey);
      const ship = player?.ship;
      const prog = player?.progression;
      if (!ship || !prog)
        return false;
      if (ship.tier === next.key && prog.currentTier === next.key)
        return false;
      ship.tier = next.key;
      prog.currentTier = next.key;
      ship.radius = next.radius;
      ship.mass = next.mass;
      prog.tierShiftT = 0.7;
      if (affectCamera)
        beginCameraZoomTo(cameraZoomForTier(next.key), animateZoom);
      return true;
    }
    function applyShipTier(nextTierKey, { animateZoom = true } = {}) {
      return applyShipTierForPlayer(localPlayer(), nextTierKey, { animateZoom, affectCamera: true });
    }
    function refreshShipTierProgressionForPlayer(player, options = {}) {
      const desired = shipTierForProgression(player);
      const changed = applyShipTierForPlayer(player, desired, {
        ...options,
        affectCamera: player?.id === state.localPlayerId
      });
      for (const a of state.asteroids) {
        if (!a.attached)
          continue;
        const attachedTo = a.attachedTo ?? state.localPlayerId;
        if (attachedTo !== player?.id)
          continue;
        if (shipCanAttractSize(a.size, player))
          continue;
        a.attached = false;
        a.attachedTo = null;
        a.shipLaunched = false;
      }
      return changed;
    }
    function refreshShipTierProgression(options = {}) {
      return refreshShipTierProgressionForPlayer(localPlayer(), options);
    }
    function makeAsteroid(size, pos, vel, rngFn = null) {
      const rr = typeof rngFn === "function" ? rngFn : rng;
      const radius = asteroidRadiusForSize(state.params, size);
      const verts = ASTEROID_VERTS[size] || ASTEROID_VERTS.small;
      const rotVelMax = ASTEROID_ROT_VEL_MAX[size] || ASTEROID_ROT_VEL_MAX.small;
      const shape = makeAsteroidShape(rr, radius, verts);
      return {
        id: `${size}-${Math.floor(rr() * 1e9)}`,
        size,
        pos,
        vel,
        radius,
        mass: asteroidMassForRadius(radius),
        rot: rr() * Math.PI * 2,
        rotVel: (rr() * 2 - 1) * rotVelMax,
        shape,
        attached: false,
        attachedTo: null,
        shipLaunched: false,
        orbitA: 0,
        // ship-local angle (radians) when attached
        fractureCooldownT: 0,
        fractureDamage: 0,
        hitFxT: 0,
        starBurnSec: 0,
        techPartId: null
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
    function randomPointInWorld({ margin = 0, rngFn = null } = {}) {
      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;
      const m = clamp(Number(margin) || 0, 0, Math.min(halfW, halfH));
      const rr = typeof rngFn === "function" ? rngFn : rng;
      const x = lerp(-halfW + m, halfW - m, rr());
      const y = lerp(-halfH + m, halfH - m, rr());
      return vec(x, y);
    }
    function generateSpawnPoints(count, { margin = 120, minSeparation = 420, maxAttemptsPerPoint = 1200, relaxFactor = 0.82, seed: seed2 = state.round.seed } = {}) {
      const n = Math.max(0, Math.floor(count));
      const points = [];
      if (n === 0)
        return points;
      const m = clamp(Number(margin) || 0, 0, Math.min(state.world.w, state.world.h) * 0.45);
      const seedRaw = Number.isFinite(Number(seed2)) ? Number(seed2) : state.round.seed;
      const seedU32 = seedRaw >>> 0 || 3737844653;
      const pointRng = seededRng((seedU32 ^ 2654435769) >>> 0 || 305419896);
      let sep = Math.max(0, Number(minSeparation) || 0);
      const relax = clamp(Number(relaxFactor) || 0.82, 0.5, 0.99);
      const maxAttempts = Math.max(10, Math.floor(maxAttemptsPerPoint));
      const dist2 = (a, b) => {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx * dx + dy * dy;
      };
      for (let i = 0; i < n; i++) {
        let picked = null;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const cand = randomPointInWorld({ margin: m, rngFn: pointRng });
          const sep2 = sep * sep;
          let ok = true;
          for (let j = 0; j < points.length; j++) {
            if (dist2(cand, points[j]) < sep2) {
              ok = false;
              break;
            }
          }
          if (ok) {
            picked = cand;
            break;
          }
        }
        if (!picked) {
          const extendedAttempts = Math.min(12e3, maxAttempts * 6);
          for (let attempt = 0; attempt < extendedAttempts; attempt++) {
            const cand = randomPointInWorld({ margin: m, rngFn: pointRng });
            const sep2 = sep * sep;
            let ok = true;
            for (let j = 0; j < points.length; j++) {
              if (dist2(cand, points[j]) < sep2) {
                ok = false;
                break;
              }
            }
            if (ok) {
              picked = cand;
              break;
            }
          }
        }
        if (!picked) {
          let best = null;
          let bestMinD2 = -1;
          const fallbackAttempts = Math.min(120, maxAttempts);
          for (let attempt = 0; attempt < fallbackAttempts; attempt++) {
            const cand = randomPointInWorld({ margin: m, rngFn: pointRng });
            let minD2 = Infinity;
            for (let j = 0; j < points.length; j++) {
              const d2 = dist2(cand, points[j]);
              if (d2 < minD2)
                minD2 = d2;
            }
            if (minD2 > bestMinD2) {
              bestMinD2 = minD2;
              best = cand;
            }
          }
          picked = best || randomPointInWorld({ margin: m, rngFn: pointRng });
          sep *= relax;
        }
        points.push(picked);
      }
      return points;
    }
    function randomPointInRect(rect, rngFn = null) {
      const rr = typeof rngFn === "function" ? rngFn : rng;
      const x = lerp(rect.xMin, rect.xMax, rr());
      const y = lerp(rect.yMin, rect.yMax, rr());
      return vec(x, y);
    }
    function generateSeparatedPoints(count, rect, { minSeparation = 0, maxAttemptsPerPoint = 1200, relaxFactor = 0.82, rngFn = null } = {}) {
      const n = Math.max(0, Math.floor(count));
      const points = [];
      if (!rect || n === 0)
        return points;
      const rr = typeof rngFn === "function" ? rngFn : rng;
      let sep = Math.max(0, Number(minSeparation) || 0);
      const relax = clamp(Number(relaxFactor) || 0.82, 0.5, 0.99);
      const maxAttempts = Math.max(10, Math.floor(maxAttemptsPerPoint));
      const dist2 = (a, b) => {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx * dx + dy * dy;
      };
      for (let i = 0; i < n; i++) {
        let picked = null;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const cand = randomPointInRect(rect, rr);
          const sep2 = sep * sep;
          let ok = true;
          for (let j = 0; j < points.length; j++) {
            if (dist2(cand, points[j]) < sep2) {
              ok = false;
              break;
            }
          }
          if (ok) {
            picked = cand;
            break;
          }
        }
        if (!picked) {
          let best = null;
          let bestMinD2 = -1;
          const fallbackAttempts = Math.min(200, maxAttempts);
          for (let attempt = 0; attempt < fallbackAttempts; attempt++) {
            const cand = randomPointInRect(rect, rr);
            let minD2 = Infinity;
            for (let j = 0; j < points.length; j++) {
              const d2 = dist2(cand, points[j]);
              if (d2 < minD2)
                minD2 = d2;
            }
            if (minD2 > bestMinD2) {
              bestMinD2 = minD2;
              best = cand;
            }
          }
          picked = best || randomPointInRect(rect, rr);
          sep *= relax;
        }
        points.push(picked);
      }
      return points;
    }
    function makeRedGiant(edge) {
      const axis = edge === "left" || edge === "right" ? "x" : "y";
      const dir = edge === "left" || edge === "top" ? 1 : -1;
      return { id: "red-giant-0", edge, axis, dir, t: 0, boundary: 0 };
    }
    function updateRedGiant(star, t) {
      if (!star)
        return;
      const tt = clamp(Number(t) || 0, 0, 1);
      star.t = tt;
      if (star.axis === "x") {
        const halfW = state.world.w / 2;
        const start = star.dir === 1 ? -halfW : halfW;
        const end = star.dir === 1 ? halfW : -halfW;
        star.boundary = lerp(start, end, tt);
      } else {
        const halfH = state.world.h / 2;
        const start = star.dir === 1 ? -halfH : halfH;
        const end = star.dir === 1 ? halfH : -halfH;
        star.boundary = lerp(start, end, tt);
      }
    }
    function starSignedDistToBodyEdge(body, star) {
      if (!body || !star)
        return Infinity;
      const r = Math.max(0, Number(body.radius) || 0);
      const axisPos = star.axis === "x" ? Number(body.pos?.x) || 0 : Number(body.pos?.y) || 0;
      const dir = star.dir === 1 ? 1 : -1;
      return (axisPos - Number(star.boundary || 0)) * dir - r;
    }
    function starConsumesBody(body, star) {
      if (!body || !star)
        return false;
      const r = Math.max(0, Number(body.radius) || 0);
      const x = Number(body.pos?.x) || 0;
      const y = Number(body.pos?.y) || 0;
      const b = Number(star.boundary) || 0;
      if (star.axis === "x") {
        if (star.dir === 1)
          return x - r < b;
        return x + r > b;
      }
      if (star.dir === 1)
        return y - r < b;
      return y + r > b;
    }
    function starSafeRect(star, { bufferPx = 0, marginPx = 0 } = {}) {
      if (!star)
        return null;
      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;
      const m = clamp(Number(marginPx) || 0, 0, Math.min(halfW, halfH));
      const buf = Math.max(0, Number(bufferPx) || 0);
      let xMin = -halfW + m;
      let xMax = halfW - m;
      let yMin = -halfH + m;
      let yMax = halfH - m;
      if (star.axis === "x") {
        if (star.dir === 1)
          xMin = Math.max(xMin, star.boundary + buf);
        else
          xMax = Math.min(xMax, star.boundary - buf);
      } else {
        if (star.dir === 1)
          yMin = Math.max(yMin, star.boundary + buf);
        else
          yMax = Math.min(yMax, star.boundary - buf);
      }
      if (xMin > xMax || yMin > yMax)
        return null;
      return { xMin, xMax, yMin, yMax };
    }
    function starSafeRectRelaxed(star, { bufferPx = 0, marginPx = 0 } = {}) {
      const rect = starSafeRect(star, { bufferPx, marginPx });
      if (rect)
        return rect;
      if (bufferPx > 0)
        return starSafeRect(star, { bufferPx: 0, marginPx });
      return null;
    }
    function clampPointInsideWorld(point, edgeMargin) {
      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;
      const margin = clamp(Number(edgeMargin) || 0, 0, Math.min(halfW, halfH) - 2);
      return {
        x: clamp(Number(point?.x) || 0, -halfW + margin, halfW - margin),
        y: clamp(Number(point?.y) || 0, -halfH + margin, halfH - margin)
      };
    }
    function pointInsideAnyView(point, radius, marginPx = 0) {
      const views = currentSpawnExclusionViews();
      for (let i = 0; i < views.length; i++) {
        if (isInsideViewRect(point, radius, views[i], marginPx))
          return true;
      }
      return false;
    }
    function pointTooCloseToList(point, points, minSeparation) {
      const minD2 = Math.max(0, Number(minSeparation) || 0) ** 2;
      if (minD2 <= 0)
        return false;
      for (let i = 0; i < points.length; i++) {
        const dx = Number(point.x) - Number(points[i].x);
        const dy = Number(point.y) - Number(points[i].y);
        if (dx * dx + dy * dy < minD2)
          return true;
      }
      return false;
    }
    function pickTechPartAsteroidPoint({
      rect,
      edgeMarginWanted,
      asteroidRadius,
      rngFn = null,
      avoidViews = true,
      viewMarginPx = 120,
      minSeparation = 0,
      existingPoints = []
    }) {
      if (!rect)
        return null;
      const rr = typeof rngFn === "function" ? rngFn : rng;
      let fallback = null;
      let fallbackScore = -Infinity;
      const views = avoidViews ? currentSpawnExclusionViews() : [];
      for (let attempt = 0; attempt < 200; attempt++) {
        const raw = randomPointInRect(rect, rr);
        const cand = clampPointInsideWorld(raw, edgeMarginWanted);
        let insideView = false;
        if (views.length) {
          for (let vi = 0; vi < views.length; vi++) {
            if (isInsideViewRect(cand, asteroidRadius, views[vi], viewMarginPx)) {
              insideView = true;
              break;
            }
          }
        }
        const tooClose = pointTooCloseToList(cand, existingPoints, minSeparation);
        if (!insideView && !tooClose)
          return cand;
        let nearestViewDist = 0;
        if (views.length) {
          nearestViewDist = Infinity;
          for (let vi = 0; vi < views.length; vi++) {
            const dx = Number(views[vi].x) - Number(cand.x);
            const dy = Number(views[vi].y) - Number(cand.y);
            nearestViewDist = Math.min(nearestViewDist, Math.hypot(dx, dy));
          }
          if (!Number.isFinite(nearestViewDist))
            nearestViewDist = 0;
        }
        const score = nearestViewDist - (insideView ? 1e6 : 0) - (tooClose ? 1e5 : 0);
        if (score > fallbackScore) {
          fallback = cand;
          fallbackScore = score;
        }
      }
      return fallback;
    }
    function makeJumpGate(edge) {
      const rr = makeRoundRng("jump-gate");
      const radiusRaw = Number(state.params.jumpGateRadius ?? 190);
      const edgeInsetExtraPx = Number(state.params.jumpGateEdgeInsetExtraPx ?? 0);
      const chargeSec = clamp(Number(state.params.jumpGateChargeSec ?? 2), 0, 30);
      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;
      const radius = clamp(radiusRaw, 16, Math.min(halfW, halfH) * 0.35);
      const insetExtra = clamp(edgeInsetExtraPx || 0, 0, Math.min(halfW, halfH));
      const inset = radius + 14 + insetExtra;
      const alongMargin = Math.max(radius + 40, Math.min(halfW, halfH) * 0.08);
      let x = 0;
      let y = 0;
      if (edge === "left") {
        x = -halfW + inset;
        y = lerp(-halfH + alongMargin, halfH - alongMargin, rr());
      } else if (edge === "right") {
        x = halfW - inset;
        y = lerp(-halfH + alongMargin, halfH - alongMargin, rr());
      } else if (edge === "top") {
        x = lerp(-halfW + alongMargin, halfW - alongMargin, rr());
        y = -halfH + inset;
      } else {
        x = lerp(-halfW + alongMargin, halfW - alongMargin, rr());
        y = halfH - inset;
      }
      return {
        id: "jump-gate-0",
        edge,
        pos: vec(x, y),
        radius,
        active: false,
        chargeSec,
        chargeElapsedSec: null,
        slots: new Array(ROUND_PART_COUNT).fill(null)
      };
    }
    function makeTechPart(index) {
      const radiusRaw = Number(state.params.techPartRadius ?? 80);
      const maxR = clamp(Number(state.params.xlargeRadius ?? 90) * 0.92, 8, 220);
      const radius = clamp(radiusRaw, 2, maxR);
      return {
        id: `part-${index}`,
        state: "lost",
        pos: vec(0, 0),
        vel: vec(0, 0),
        radius,
        containerAsteroidId: null,
        installedSlot: null,
        respawnCount: 0
      };
    }
    function getTechPartById(id) {
      const parts = state.round.techParts;
      if (!Array.isArray(parts))
        return null;
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].id === id)
          return parts[i];
      }
      return null;
    }
    function techPingMaxRadius() {
      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;
      return Math.sqrt(halfW * halfW + halfH * halfH) * 1.3;
    }
    function tryStartTechPing() {
      if (state.mode !== "playing")
        return false;
      if ((Number(state.round.techPingCooldownSec) || 0) > 0)
        return false;
      const speed = clamp(Number(state.params.techPingSpeedPxPerSec ?? 2400), 200, 2e4);
      state.round.techPing = {
        origin: vec(Number(state.ship.pos?.x) || 0, Number(state.ship.pos?.y) || 0),
        radius: 0,
        prevRadius: 0,
        speed,
        maxRadius: techPingMaxRadius()
      };
      state.round.techPingCooldownSec = clamp(Number(state.params.techPingCooldownSec ?? 3), 0, 60);
      return true;
    }
    function updateTechPing(dt) {
      if (state.mode !== "playing")
        return;
      state.round.techPingCooldownSec = Math.max(0, (Number(state.round.techPingCooldownSec) || 0) - dt);
      const ping = state.round.techPing;
      const thickness = clamp(Number(state.params.techPingThicknessPx ?? 22), 4, 240);
      const glowSec = clamp(Number(state.params.techPingGlowSec ?? 8), 0.25, 30);
      const origin = ping?.origin || vec(0, 0);
      const prevR = ping ? Math.max(0, Number(ping.radius) || 0) : 0;
      const nextR = ping ? prevR + Math.max(0, Number(ping.speed) || 0) * dt : 0;
      if (ping) {
        ping.prevRadius = prevR;
        ping.radius = nextR;
      }
      for (let i = 0; i < state.asteroids.length; i++) {
        const a = state.asteroids[i];
        if (!a)
          continue;
        if (a.techPingFxT)
          a.techPingFxT = Math.max(0, (Number(a.techPingFxT) || 0) - dt);
        if (!ping || !a.techPartId)
          continue;
        const dist = len(sub(a.pos, origin));
        const pad = Math.max(0, Number(a.radius) || 0) + thickness;
        if (dist >= prevR - pad && dist <= nextR + pad)
          a.techPingFxT = glowSec;
      }
      if (ping && nextR >= (Number(ping.maxRadius) || techPingMaxRadius()))
        state.round.techPing = null;
    }
    function endRound(kind, reason) {
      if (state.mode !== "playing")
        return;
      if (state.round.escape?.active)
        state.round.escape.active = false;
      state.round.outcome = { kind, reason };
      state.mode = "gameover";
    }
    function startGateEscapeSequence(gate) {
      if (!gate || !gate.active)
        return false;
      if (state.round.escape?.active)
        return true;
      const approachSec = clamp(Number(state.params.jumpGateEscapeApproachSec ?? 0.75), 0.1, 4);
      const vanishSec = clamp(Number(state.params.jumpGateEscapeVanishSec ?? 0.26), 0.05, 4);
      state.round.escape = {
        active: true,
        elapsedSec: 0,
        approachSec,
        vanishSec,
        startPos: vec(Number(state.ship.pos?.x) || 0, Number(state.ship.pos?.y) || 0),
        startAngle: Number(state.ship.angle) || 0
      };
      state.ship.vel = vec(0, 0);
      state.ship.escapeScale = 1;
      state.input.left = false;
      state.input.right = false;
      state.input.up = false;
      state.input.down = false;
      state.input.burst = false;
      state.input.ping = false;
      state.input.turnAnalog = 0;
      state.input.thrustAnalog = 0;
      return true;
    }
    function updateGateEscapeSequence(dt) {
      const esc = state.round.escape;
      const gate = state.round.gate;
      if (!esc?.active || !gate)
        return false;
      const stepDt = Math.max(0, Number(dt) || 0);
      esc.elapsedSec += stepDt;
      const approachSec = Math.max(1e-3, Number(esc.approachSec) || 0.75);
      const vanishSec = Math.max(1e-3, Number(esc.vanishSec) || 0.26);
      const approachT = clamp(esc.elapsedSec / approachSec, 0, 1);
      const ease = 1 - (1 - approachT) * (1 - approachT);
      state.ship.pos.x = lerp(Number(esc.startPos?.x) || 0, Number(gate.pos?.x) || 0, ease);
      state.ship.pos.y = lerp(Number(esc.startPos?.y) || 0, Number(gate.pos?.y) || 0, ease);
      state.ship.vel.x = 0;
      state.ship.vel.y = 0;
      const spinTurns = 0.8;
      state.ship.angle = wrapAngle((Number(esc.startAngle) || 0) + approachT * Math.PI * 2 * spinTurns);
      if (esc.elapsedSec <= approachSec) {
        state.ship.escapeScale = 1;
        return true;
      }
      const vanishT = clamp((esc.elapsedSec - approachSec) / vanishSec, 0, 1);
      state.ship.escapeScale = 1 - vanishT;
      if (vanishT >= 1) {
        state.ship.escapeScale = 0;
        endRound("win", "escaped");
        return true;
      }
      return true;
    }
    function dropTechPartFromAsteroid(asteroid, { lost = false } = {}) {
      if (!asteroid || !asteroid.techPartId)
        return false;
      const part = getTechPartById(asteroid.techPartId);
      const partId = asteroid.techPartId;
      asteroid.techPartId = null;
      if (!part || part.state === "installed")
        return false;
      part.containerAsteroidId = null;
      part.pos = vec(Number(asteroid.pos?.x) || 0, Number(asteroid.pos?.y) || 0);
      if (lost) {
        part.state = "lost";
        part.vel = vec(0, 0);
      } else {
        part.state = "dropped";
        const v = asteroid.vel || vec(0, 0);
        part.vel = mul(vec(Number(v.x) || 0, Number(v.y) || 0), 0.35);
      }
      if (state.round.carriedPartId === partId)
        state.round.carriedPartId = null;
      return true;
    }
    function setTechPartLost(part, { reason = "lost" } = {}) {
      if (!part || part.state === "installed")
        return false;
      part.state = "lost";
      part.containerAsteroidId = null;
      part.vel = vec(0, 0);
      if (state.round.carriedPartId === part.id)
        state.round.carriedPartId = null;
      if (reason && typeof reason === "string")
        part.lostReason = reason;
      return true;
    }
    function roundDurationSec() {
      return clamp(Number(state.params.roundDurationSec ?? 300), 10, 60 * 60);
    }
    function pickRoundStarEdge() {
      const rr = makeRoundRng("red-giant-edge");
      const idx = Math.min(STAR_EDGE_ORDER.length - 1, Math.floor(rr() * STAR_EDGE_ORDER.length));
      return STAR_EDGE_ORDER[idx] || "left";
    }
    function seedInitialTechParts() {
      const star = state.round.star;
      const parts = state.round.techParts;
      if (!star || !Array.isArray(parts) || parts.length === 0)
        return;
      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;
      const asteroidR = asteroidRadiusForSize(state.params, "xlarge");
      const bufferMax = Math.min(state.world.w, state.world.h) * 0.45;
      const buffer = clamp(Number(state.params.starSafeBufferPx ?? 0), 0, bufferMax);
      const edgeMarginParam = Number(state.params.techPartEdgeMarginPx ?? 520);
      const edgeMarginWanted = clamp(edgeMarginParam, asteroidR + 120, Math.min(halfW, halfH) * 0.45);
      const margin = clamp(Math.max(asteroidR + 60, edgeMarginWanted), 0, Math.min(halfW, halfH) * 0.45);
      const fallbackRect = { xMin: -halfW + margin, xMax: halfW - margin, yMin: -halfH + margin, yMax: halfH - margin };
      const rect = starSafeRectRelaxed(star, { bufferPx: buffer, marginPx: margin }) || fallbackRect;
      const placementRng = makeRoundRng("tech-part-placement");
      const minSep = clamp(Math.min(state.world.w, state.world.h) * 0.22, asteroidR * 2.4, Math.min(state.world.w, state.world.h) * 0.65);
      const points = generateSeparatedPoints(parts.length, rect, { minSeparation: minSep, rngFn: placementRng });
      const placed = [];
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const pRaw = points[i] || randomPointInRect(rect, placementRng);
        const pClamped = clampPointInsideWorld(pRaw, edgeMarginWanted);
        const pNeedsRelocate = pointInsideAnyView(pClamped, asteroidR, 120) || pointTooCloseToList(pClamped, placed, minSep * 0.85);
        const p = (pNeedsRelocate ? pickTechPartAsteroidPoint({
          rect,
          edgeMarginWanted,
          asteroidRadius: asteroidR,
          rngFn: placementRng,
          avoidViews: true,
          viewMarginPx: 120,
          minSeparation: minSep * 0.85,
          existingPoints: placed
        }) : pClamped) || pClamped;
        placed.push(p);
        const rr = makeRoundRng(`tech-part-${i}`);
        const speed = lerp(12, 46, rr());
        const ang = rr() * Math.PI * 2;
        const v = mul(angleToVec(ang), speed);
        const asteroid = makeAsteroid("xlarge", vec(p.x, p.y), v, rr);
        asteroid.techPartId = part.id;
        state.asteroids.push(asteroid);
        part.state = "in_asteroid";
        part.containerAsteroidId = asteroid.id;
        part.pos = vec(p.x, p.y);
        part.vel = vec(0, 0);
        part.installedSlot = null;
        part.respawnCount = 0;
        part.lostReason = void 0;
      }
    }
    function resetRoundState() {
      state.round.durationSec = roundDurationSec();
      state.round.elapsedSec = 0;
      state.round.outcome = null;
      state.round.carriedPartId = null;
      state.round.techPing = null;
      state.round.techPingCooldownSec = 0;
      state.round.starExposureSec = 0;
      state.round.escape = null;
      const starEdge = pickRoundStarEdge();
      const star = makeRedGiant(starEdge);
      updateRedGiant(star, 0);
      state.round.star = star;
      const gateEdge = oppositeStarEdge(starEdge);
      state.round.gate = makeJumpGate(gateEdge);
      state.round.techParts = [];
      for (let i = 0; i < ROUND_PART_COUNT; i++)
        state.round.techParts.push(makeTechPart(i));
      seedInitialTechParts();
    }
    function updateRound(dt) {
      const dur = Math.max(1e-3, Number(state.round.durationSec) || roundDurationSec());
      state.round.elapsedSec = Math.max(0, Number(state.round.elapsedSec) || 0) + dt;
      const t = clamp(state.round.elapsedSec / dur, 0, 1);
      updateRedGiant(state.round.star, t);
      if (t >= 1)
        endRound("lose", "star_reached_far_edge");
    }
    function updateShipStarExposure(dt) {
      const star = state.round.star;
      if (!star) {
        state.round.starExposureSec = 0;
        state.ship.starHeat = 0;
        return;
      }
      const killSec = clamp(Number(state.params.shipStarKillSec ?? 3), 0.25, 30);
      const coolRate = clamp(Number(state.params.shipStarCoolRate ?? 1.6), 0, 20);
      const signed = starSignedDistToBodyEdge(state.ship, star);
      const inStar = signed < 0;
      let next = Math.max(0, Number(state.round.starExposureSec) || 0);
      if (inStar)
        next += dt;
      else
        next = Math.max(0, next - coolRate * dt);
      state.round.starExposureSec = next;
      state.ship.starHeat = clamp(killSec > 1e-6 ? next / killSec : 0, 0, 1);
      if (next >= killSec) {
        spawnExplosion(state.ship.pos, { kind: "pop", rgb: [255, 140, 95], r0: 12, r1: 68, ttl: 0.22 });
        endRound("lose", "star_overheat");
      }
    }
    function applyRedGiantHazard() {
      const star = state.round.star;
      if (!star)
        return;
      const burnSecNeeded = clamp(Number(state.params.starAsteroidBurnSec ?? 0.22), 0.02, 2);
      for (let i = state.asteroids.length - 1; i >= 0; i--) {
        const a = state.asteroids[i];
        if (!starConsumesBody(a, star))
          continue;
        if ((Number(a.starBurnSec) || 0) < burnSecNeeded)
          continue;
        if (a.techPartId)
          dropTechPartFromAsteroid(a, { lost: true });
        state.asteroids.splice(i, 1);
      }
      for (let i = state.gems.length - 1; i >= 0; i--) {
        if (starConsumesBody(state.gems[i], star))
          state.gems.splice(i, 1);
      }
      if (state.saucer && starConsumesBody(state.saucer, star)) {
        state.saucer = null;
        state.saucerLasers = [];
      } else {
        for (let i = state.saucerLasers.length - 1; i >= 0; i--) {
          if (starConsumesBody(state.saucerLasers[i], star))
            state.saucerLasers.splice(i, 1);
        }
      }
      const parts = state.round.techParts;
      if (Array.isArray(parts)) {
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (part.state !== "dropped")
            continue;
          if (!starConsumesBody(part, star))
            continue;
          setTechPartLost(part, { reason: "star" });
        }
      }
    }
    function updateTechParts(dt) {
      const parts = state.round.techParts;
      if (!Array.isArray(parts) || parts.length === 0)
        return;
      const stepDt = Math.max(0, Number(dt) || 0);
      const ship = state.ship;
      const gate = state.round.gate;
      const star = state.round.star;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part || part.state !== "in_asteroid")
          continue;
        const cid = part.containerAsteroidId;
        if (!cid) {
          setTechPartLost(part, { reason: "container_missing" });
          continue;
        }
        let container = null;
        for (let j = 0; j < state.asteroids.length; j++) {
          const a = state.asteroids[j];
          if (a && a.id === cid) {
            container = a;
            break;
          }
        }
        if (!container) {
          setTechPartLost(part, { reason: "container_missing" });
          continue;
        }
        part.pos = vec(Number(container.pos?.x) || 0, Number(container.pos?.y) || 0);
      }
      if (star) {
        const halfW = state.world.w / 2;
        const halfH = state.world.h / 2;
        const asteroidR = asteroidRadiusForSize(state.params, "xlarge");
        const bufferMax = Math.min(state.world.w, state.world.h) * 0.45;
        const baseBuffer = clamp(Number(state.params.starSafeBufferPx ?? 0), 0, bufferMax);
        const bufferWanted = baseBuffer + asteroidR + 20;
        const bufferMin = asteroidR + 4;
        const margin = clamp(asteroidR + 2, 0, Math.min(halfW, halfH));
        const rect = starSafeRect(star, { bufferPx: bufferWanted, marginPx: margin }) || starSafeRect(star, { bufferPx: bufferMin, marginPx: margin });
        if (rect) {
          const respawnedPoints = [];
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!part || part.state !== "lost")
              continue;
            const edgeMarginParam = Number(state.params.techPartEdgeMarginPx ?? 520);
            const edgeMarginWanted = clamp(edgeMarginParam, asteroidR + 120, Math.min(halfW, halfH) * 0.45);
            const nextCount = Math.max(0, Number(part.respawnCount) || 0) + 1;
            const rr = makeRoundRng(`tech-part-respawn-${part.id}-${nextCount}`);
            const picked = pickTechPartAsteroidPoint({
              rect,
              edgeMarginWanted,
              asteroidRadius: asteroidR,
              rngFn: rr,
              avoidViews: true,
              viewMarginPx: 120,
              minSeparation: asteroidR * 2.2,
              existingPoints: respawnedPoints
            }) || clampPointInsideWorld(randomPointInRect(rect, rr), edgeMarginWanted);
            respawnedPoints.push(picked);
            const speed = lerp(12, 46, rr());
            const ang = rr() * Math.PI * 2;
            const v = mul(angleToVec(ang), speed);
            const asteroid = makeAsteroid("xlarge", vec(picked.x, picked.y), v, rr);
            asteroid.techPartId = part.id;
            state.asteroids.push(asteroid);
            part.state = "in_asteroid";
            part.containerAsteroidId = asteroid.id;
            part.pos = vec(picked.x, picked.y);
            part.vel = vec(0, 0);
            part.installedSlot = null;
            part.respawnCount = nextCount;
            part.lostReason = void 0;
          }
        }
      }
      if (state.round.carriedPartId) {
        const carried = getTechPartById(state.round.carriedPartId);
        if (!carried || carried.state !== "carried")
          state.round.carriedPartId = null;
      }
      if (!state.round.carriedPartId) {
        const pad = clamp(Number(state.params.techPartPickupPad ?? 20), 0, 800);
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (!part || part.state !== "dropped")
            continue;
          const pickR = Math.max(0, Number(ship.radius) || 0) + Math.max(0, Number(part.radius) || 0) + pad;
          if (len2(sub(part.pos, ship.pos)) > pickR * pickR)
            continue;
          part.state = "carried";
          part.containerAsteroidId = null;
          part.installedSlot = null;
          part.vel = vec(0, 0);
          state.round.carriedPartId = part.id;
          break;
        }
      }
      if (gate && state.round.carriedPartId) {
        const part = getTechPartById(state.round.carriedPartId);
        const slots = Array.isArray(gate.slots) ? gate.slots : null;
        if (part && part.state === "carried" && slots) {
          const pad = clamp(Number(state.params.jumpGateInstallPad ?? 60), 0, 2e3);
          const installR = Math.max(0, Number(gate.radius) || 0) + Math.max(0, Number(ship.radius) || 0) + pad;
          if (len2(sub(ship.pos, gate.pos)) <= installR * installR) {
            let slotIndex = -1;
            for (let i = 0; i < slots.length; i++) {
              if (!slots[i]) {
                slotIndex = i;
                break;
              }
            }
            if (slotIndex >= 0) {
              slots[slotIndex] = part.id;
              gate.slots = slots;
              part.state = "installed";
              part.installedSlot = slotIndex;
              part.containerAsteroidId = null;
              part.vel = vec(0, 0);
              part.pos = vec(Number(gate.pos?.x) || 0, Number(gate.pos?.y) || 0);
              state.round.carriedPartId = null;
            }
          }
        }
      }
      if (gate && Array.isArray(gate.slots)) {
        const allInstalled = gate.slots.every((slot) => !!slot);
        if (!allInstalled) {
          gate.active = false;
          gate.chargeElapsedSec = null;
        } else if (!gate.active) {
          if (gate.chargeElapsedSec == null)
            gate.chargeElapsedSec = 0;
          gate.chargeElapsedSec += stepDt;
          const chargeSec = clamp(Number(gate.chargeSec ?? state.params.jumpGateChargeSec ?? 2), 0, 30);
          gate.chargeSec = chargeSec;
          if (gate.chargeElapsedSec >= chargeSec)
            gate.active = true;
        }
      }
      if (state.round.carriedPartId) {
        const part = getTechPartById(state.round.carriedPartId);
        if (part && part.state === "carried") {
          const fwd = shipForward(ship);
          const gap = 10;
          const off = Math.max(0, Number(ship.radius) || 0) + Math.max(0, Number(part.radius) || 0) + gap;
          part.pos = add(ship.pos, mul(fwd, off));
          part.vel = vec(0, 0);
        } else {
          state.round.carriedPartId = null;
        }
      }
      if (gate?.active) {
        const r = Math.max(0, Number(gate.radius) || 0) + Math.max(0, Number(ship.radius) || 0);
        if (len2(sub(ship.pos, gate.pos)) <= r * r)
          startGateEscapeSequence(gate);
      }
    }
    function rebuildWorldCellIndex() {
      const counts = worldCellAsteroidCounts;
      counts.clear();
      for (const a of state.asteroids) {
        const { cx, cy } = worldCellCoordsForPos(a.pos);
        const key = worldCellKey(cx, cy);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      state.worldCells.indexedAsteroidCells = counts.size;
      if (isServer) {
        worldCellActiveKeys.clear();
        state.worldCells.activeCount = 0;
        return;
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
      state.worldCells.activeCount = worldCellActiveKeys.size;
    }
    function asteroidPopulationBudget() {
      const seed2 = asteroidSeedCount();
      const viewArea = Math.max(1, state.view.w * state.view.h);
      const worldArea = Math.max(1, state.world.w * state.world.h);
      const densityScale = clamp(state.params.asteroidWorldDensityScale || 0.32, 0.08, 2.5);
      const worldFactor = Math.min(worldArea / viewArea, 25);
      const scaledTarget = Math.round(seed2 * worldFactor * densityScale);
      const max = Math.max(1, Math.floor(state.params.maxAsteroids));
      const target = clamp(scaledTarget, Math.min(seed2, max), max);
      const min = clamp(Math.floor(target * 0.8), 8, target);
      return { min, target, max };
    }
    function scheduleNextAsteroidSpawn(urgent = false) {
      const lo = urgent ? state.params.asteroidSpawnUrgentMinSec : state.params.asteroidSpawnMinSec;
      const hi = urgent ? state.params.asteroidSpawnUrgentMaxSec : state.params.asteroidSpawnMaxSec;
      const rateScale = clamp(Number(state.params.asteroidSpawnRateScale ?? 1), 0.25, 3);
      const effLo = Math.max(0.01, lo / rateScale);
      const effHi = Math.max(effLo, hi / rateScale);
      state.asteroidSpawnT = lerp(effLo, effHi, rng());
    }
    function isInsideViewRect(pos, radius, view, margin = 0) {
      const halfW = view.halfW + radius + margin;
      const halfH = view.halfH + radius + margin;
      return Math.abs(pos.x - view.x) <= halfW && Math.abs(pos.y - view.y) <= halfH;
    }
    function spawnExclusionZoomForPlayer(player) {
      if (!player?.ship)
        return Math.max(0.1, state.camera.zoom || 1);
      const tierKey = player.ship.tier;
      const base = cameraZoomForTier(tierKey === "medium" || tierKey === "large" ? tierKey : "small");
      if (player.id === state.localPlayerId)
        return Math.max(0.1, state.camera.zoom || base || 1);
      return Math.max(0.1, base || 1);
    }
    function currentSpawnExclusionViews() {
      const views = [];
      forEachPlayer((p) => {
        if (!p?.ship)
          return;
        const zoom2 = spawnExclusionZoomForPlayer(p);
        views.push({
          x: p.ship.pos.x,
          y: p.ship.pos.y,
          halfW: state.view.w * 0.5 / zoom2,
          halfH: state.view.h * 0.5 / zoom2
        });
      });
      if (views.length)
        return views;
      const zoom = Math.max(0.1, state.camera.zoom || 1);
      return [{ x: state.camera.x, y: state.camera.y, halfW: state.view.w * 0.5 / zoom, halfH: state.view.h * 0.5 / zoom }];
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
        const minD2 = minDistFromShip * minDistFromShip;
        let shipClear = true;
        const ids = sortedPlayerIds();
        for (let pi = 0; pi < ids.length; pi++) {
          const ship = state.playersById[ids[pi]]?.ship;
          if (!ship)
            continue;
          if (len2(sub(p, ship.pos)) <= minD2) {
            shipClear = false;
            break;
          }
        }
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
      let maxViewDiag = 0;
      for (let vi = 0; vi < excludeViews.length; vi++) {
        const v = excludeViews[vi];
        maxViewDiag = Math.max(maxViewDiag, Math.hypot(v.halfW, v.halfH));
      }
      const worldHalfMin = Math.min(state.world.w, state.world.h) * 0.5;
      const ids = sortedPlayerIds();
      let focusPlayer = null;
      if (ids.length) {
        const pick = Math.floor(rng() * ids.length);
        focusPlayer = state.playersById[ids[pick]];
      }
      const focusShip = focusPlayer?.ship;
      const focusZoom = focusPlayer ? spawnExclusionZoomForPlayer(focusPlayer) : Math.max(0.1, state.camera.zoom || 1);
      const halfViewW = state.view.w * 0.5 / focusZoom;
      const halfViewH = state.view.h * 0.5 / focusZoom;
      const viewDiag = Math.hypot(halfViewW, halfViewH);
      const nearPos = focusShip ? vec(focusShip.pos.x, focusShip.pos.y) : vec(state.camera.x, state.camera.y);
      const nearRadius = Math.min(worldHalfMin, viewDiag + 520);
      const minDistFromShip = clamp(Math.max(260, viewDiag * 0.82), 120, Math.max(140, nearRadius - 60));
      const canSpawnNearPlayers = nearRadius > minDistFromShip + 40;
      const spawnExcludeViews = worldHalfMin <= maxViewDiag + 140 ? [] : excludeViews;
      for (let i = 0; i < burst && state.asteroids.length < max; i++) {
        const preferNearPlayers = urgent || rng() < 0.75;
        const useNearPlayers = canSpawnNearPlayers && preferNearPlayers;
        if (!trySpawnAmbientAsteroid(
          useNearPlayers ? {
            nearPos,
            nearRadius,
            minDistFromShip,
            maxCellCount: urgent ? 14 : 12,
            excludeViews: spawnExcludeViews
          } : { excludeViews: spawnExcludeViews }
        )) {
          break;
        }
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
          endRound("lose", "saucer_laser");
          return;
        }
        const pushDir = norm(b.vel);
        state.ship.vel = add(state.ship.vel, mul(pushDir, 170));
      }
    }
    function reducedMass(aMass, bMass) {
      const a = Math.max(1, Number(aMass) || 1);
      const b = Math.max(1, Number(bMass) || 1);
      return a * b / (a + b);
    }
    function closingSpeedAlongNormal(a, b, n) {
      if (!a || !b)
        return 0;
      const nn = n && Number.isFinite(n.x) && Number.isFinite(n.y) ? n : vec(1, 0);
      const rv = sub(b.vel, a.vel);
      const velAlongNormal = dot(rv, nn);
      return Math.max(0, -velAlongNormal);
    }
    function impactSpeeds(a, b, n) {
      if (!a || !b)
        return { vN: 0, vT: 0, vRel: 0 };
      const nn = n && Number.isFinite(n.x) && Number.isFinite(n.y) ? n : vec(1, 0);
      const rv = sub(b.vel, a.vel);
      const vRel2 = len2(rv);
      const vRel = Math.sqrt(Math.max(0, vRel2));
      const velAlongNormal = dot(rv, nn);
      const vN = Math.max(0, -velAlongNormal);
      const vT2 = Math.max(0, vRel2 - velAlongNormal * velAlongNormal);
      const vT = Math.sqrt(vT2);
      return { vN, vT, vRel };
    }
    function fractureImpactSpeed(projectile, target, n) {
      const { vN, vT } = impactSpeeds(projectile, target, n);
      if (!(vN > 0) || !(vT > 0) || !projectile?.shipLaunched)
        return vN;
      const w = clamp(Number(state.params.fractureShearWeightLaunched ?? 0), 0, 2);
      if (w <= 0)
        return vN;
      const ref = Math.max(1e-6, Number(state.params.fractureShearNormalRefSpeed ?? 120));
      const shearGate = clamp(vN / ref, 0, 1);
      const slip = vT * w * shearGate;
      return Math.sqrt(vN * vN + slip * slip);
    }
    function fractureSizeBias(targetSize) {
      const rank = asteroidSizeRank(targetSize);
      return 1 + rank * FRACTURE_SIZE_BIAS_PER_RANK;
    }
    function fractureEnergyThreshold(target) {
      const targetMass = Math.max(1, Number(target?.mass) || 1);
      const baseSpeed = Math.max(1, Number(state.params.fractureImpactSpeed) || 0);
      const sizeBias = fractureSizeBias(target?.size);
      const speed = baseSpeed * sizeBias;
      const refR = Math.max(1, asteroidRadiusForSize(state.params, "med"));
      const r = Math.max(1, Number(target?.radius) || refR);
      const exp = clamp(Number(state.params.fractureSizeStrengthExp ?? 0), -2, 2);
      const sizeStrength = Math.pow(r / refR, exp);
      return 0.25 * targetMass * speed * speed * sizeStrength;
    }
    function impactEnergy(projectile, target, impactSpeed) {
      const rel = Math.max(0, Number(impactSpeed) || 0);
      const mu = reducedMass(projectile?.mass, target?.mass);
      const base = 0.5 * mu * rel * rel;
      const boostRaw = Number(state.params.projectileImpactScale ?? 1);
      const boost = projectile?.shipLaunched ? clamp(boostRaw, 0.2, 4) : 1;
      return base * boost;
    }
    function applyFractureChipDamage(target, energy, threshold, impactSpeed) {
      if (!target)
        return false;
      if ((target.fractureCooldownT || 0) > 0)
        return false;
      if (energy >= threshold)
        return true;
      const minSpeed = Math.max(0, Number(state.params.fractureChipMinSpeed ?? 0));
      const speed = Math.max(0, Number(impactSpeed) || 0);
      if (speed < minSpeed)
        return false;
      const scale = clamp(Number(state.params.fractureChipScale ?? 0), 0, 5);
      if (scale <= 0)
        return false;
      if (!Number.isFinite(target.fractureDamage))
        target.fractureDamage = 0;
      const denom = Math.max(1e-6, threshold);
      const next = target.fractureDamage + energy / denom * scale;
      target.fractureDamage = clamp(next, 0, 1);
      return target.fractureDamage >= 1;
    }
    function spawnExplosion(pos, { rgb = [255, 255, 255], kind = "pop", r0 = 6, r1 = 26, ttl = 0.22 } = {}) {
      if (isServer)
        return;
      state.effects.push({
        kind,
        x: pos.x,
        y: pos.y,
        t: 0,
        ttl,
        r0,
        r1,
        rgb,
        seed: Math.floor(fxRng() * 1e9)
      });
    }
    function spawnBurstWavelets({ pos, angle, speed, ttl = 0.55 * 1.1, rgb = [255, 221, 88] }) {
      if (isServer)
        return;
      state.effects.push({
        kind: "wavelets",
        x: pos.x,
        y: pos.y,
        angle,
        speed,
        t: 0,
        ttl,
        rgb,
        seed: Math.floor(fxRng() * 1e9)
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
    function spawnShipAt(pos) {
      if (!pos || typeof pos !== "object")
        return false;
      const ship = state.ship;
      if (!ship)
        return false;
      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;
      const r = Math.max(1, Number(ship.radius) || 1);
      ship.pos.x = clamp(Number(pos.x) || 0, -halfW + r, halfW - r);
      ship.pos.y = clamp(Number(pos.y) || 0, -halfH + r, halfH - r);
      ship.vel.x = 0;
      ship.vel.y = 0;
      ship.escapeScale = 1;
      syncCameraToShip();
      return true;
    }
    function spawnShipAtForPlayer(playerId, pos) {
      const pid = String(playerId ?? "");
      if (!pid)
        return false;
      const player = state.playersById?.[pid];
      if (!player?.ship)
        return false;
      if (!pos || typeof pos !== "object")
        return false;
      const ship = player.ship;
      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;
      const r = Math.max(1, Number(ship.radius) || 1);
      ship.pos.x = clamp(Number(pos.x) || 0, -halfW + r, halfW - r);
      ship.pos.y = clamp(Number(pos.y) || 0, -halfH + r, halfH - r);
      ship.vel.x = 0;
      ship.vel.y = 0;
      ship.escapeScale = 1;
      if (player.id === state.localPlayerId)
        syncCameraToShip();
      return true;
    }
    function addPlayer(playerId, { tierKey = "small", makeLocalIfFirst = true } = {}) {
      const pid = String(playerId ?? "");
      if (!pid)
        return null;
      if (!state.playersById)
        state.playersById = /* @__PURE__ */ Object.create(null);
      if (state.playersById[pid])
        return state.playersById[pid];
      const tier = tierKey === "medium" || tierKey === "large" ? tierKey : "small";
      const p = makePlayer(pid, { ship: makeShip(tier) });
      state.playersById[pid] = p;
      if (makeLocalIfFirst) {
        const current = String(state.localPlayerId ?? "");
        const currentExists = !!(current && state.playersById[current]);
        if (!currentExists)
          state.localPlayerId = pid;
      }
      return p;
    }
    function removePlayer(playerId) {
      const pid = String(playerId ?? "");
      if (!pid || !state.playersById || !state.playersById[pid])
        return false;
      delete state.playersById[pid];
      if (state.localPlayerId === pid) {
        const nextIds = Object.keys(state.playersById).sort();
        if (nextIds.length) {
          state.localPlayerId = nextIds[0];
        } else {
          state.localPlayerId = "local";
          state.playersById[state.localPlayerId] = makePlayer(state.localPlayerId, { ship: makeShip("small") });
        }
      }
      return true;
    }
    function resetWorld() {
      advanceToNextRoundSeed();
      state.time = 0;
      forEachPlayer((p) => {
        p.score = 0;
        if (!p.progression)
          p.progression = makePlayerProgression();
        p.progression.gemScore = 0;
        p.progression.currentTier = "small";
        p.progression.tierShiftT = 0;
        p.burstCooldown = 0;
        p.blastPulseT = 0;
        p.gemsCollected = { diamond: 0, ruby: 0, emerald: 0, gold: 0 };
        if (!p.input)
          p.input = makePlayerInput();
        p.input.left = false;
        p.input.right = false;
        p.input.up = false;
        p.input.down = false;
        p.input.burst = false;
        p.input.ping = false;
        p.input.turnAnalog = 0;
        p.input.thrustAnalog = 0;
        p.ship = makeShip("small");
      });
      state.effects = [];
      state.exhaust = [];
      exhaustRng = seededRng(518504175);
      exhaustPool.length = 0;
      state.gems = [];
      state.saucer = null;
      state.saucerLasers = [];
      scheduleNextSaucerSpawn();
      scheduleNextAsteroidSpawn(false);
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
      resetRoundState();
      rebuildWorldCellIndex();
    }
    function startGame(options = {}) {
      if (options && Object.prototype.hasOwnProperty.call(options, "seed")) {
        setSessionSeed(options.seed);
      }
      resetWorld();
      if (options && options.shipSpawn && typeof options.shipSpawn === "object") {
        spawnShipAt(options.shipSpawn);
      }
      state.mode = "playing";
    }
    function orbitRadiusForAsteroidForPlayer(a, player = localPlayer()) {
      const base = forceFieldRadiusForPlayer(player);
      return base + Math.max(0, a.radius - state.params.smallRadius * 0.7) + state.params.attachPadding;
    }
    function orbitRadiusForAsteroid(a) {
      return orbitRadiusForAsteroidForPlayer(a, localPlayer());
    }
    function orbitPosForAsteroidForPlayer(a, player = localPlayer()) {
      const ship = player?.ship;
      if (!ship)
        return vec(0, 0);
      const r = orbitRadiusForAsteroidForPlayer(a, player);
      const wAngle = ship.angle + a.orbitA;
      return add(ship.pos, mul(angleToVec(wAngle), r));
    }
    function orbitPosFor(a) {
      return orbitPosForAsteroidForPlayer(a, localPlayer());
    }
    function tryAttachAsteroidForPlayer(a, player = localPlayer()) {
      if (!player?.ship)
        return false;
      if (!shipCanAttractSize(a.size, player) || a.attached || a.shipLaunched)
        return false;
      const toShip = sub(a.pos, player.ship.pos);
      const d = len(toShip);
      const targetR = orbitRadiusForAsteroidForPlayer(a, player);
      const err = Math.abs(d - targetR);
      const spd = len(a.vel);
      if (err <= state.params.attachBand && spd <= state.params.attachSpeedMax) {
        a.attached = true;
        a.attachedTo = player.id;
        a.shipLaunched = false;
        a.vel = vec(0, 0);
        a.orbitA = wrapAngle(angleOf(toShip) - player.ship.angle);
        a.pos = orbitPosForAsteroidForPlayer(a, player);
        return true;
      }
      return false;
    }
    function tryAttachAsteroid(a) {
      return tryAttachAsteroidForPlayer(a, localPlayer());
    }
    function burstAttachedForPlayer(player = localPlayer()) {
      if (state.mode !== "playing")
        return;
      if (!player?.ship)
        return;
      if (player.burstCooldown > 0)
        return;
      player.burstCooldown = state.params.burstCooldownSec;
      player.blastPulseT = 0.22;
      const fieldR = forceFieldRadiusForPlayer(player);
      spawnExplosion(player.ship.pos, {
        kind: "ring",
        rgb: [255, 255, 255],
        r0: fieldR - 2,
        r1: fieldR + 26,
        ttl: 0.18
      });
      let attachedCount = 0;
      for (const a of state.asteroids) {
        if (!a.attached)
          continue;
        const ownerId = a.attachedTo ?? state.localPlayerId;
        if (ownerId === player.id)
          attachedCount++;
      }
      const maxWavelets = 14;
      const stride = attachedCount > 0 ? Math.max(1, Math.ceil(attachedCount / maxWavelets)) : 1;
      const strideOffset = stride > 1 ? Math.floor(rng() * stride) : 0;
      const waveletTtl = attachedCount >= 16 ? 0.42 * 1.1 : 0.55 * 1.1;
      const shipV = player.ship.vel;
      let attachedIndex = 0;
      for (const a of state.asteroids) {
        if (!a.attached)
          continue;
        const ownerId = a.attachedTo ?? state.localPlayerId;
        if (ownerId !== player.id)
          continue;
        a.attached = false;
        a.attachedTo = null;
        a.shipLaunched = true;
        a.pos = orbitPosForAsteroidForPlayer(a, player);
        const dir = norm(sub(a.pos, player.ship.pos));
        const base = mul(dir, burstSpeedForPlayer(player));
        a.vel = add(base, mul(shipV, 0.55));
        a.rotVel += (rng() * 2 - 1) * 1.8;
        const shouldSpawnWavelets = stride === 1 || (attachedIndex + strideOffset) % stride === 0;
        if (shouldSpawnWavelets) {
          const vDir = len(a.vel) > 1e-6 ? norm(a.vel) : dir;
          const ringP = add(player.ship.pos, mul(vDir, fieldR));
          const ang = angleOf(vDir);
          const spd = len(a.vel);
          spawnBurstWavelets({ pos: ringP, angle: ang, speed: spd * 0.9, ttl: waveletTtl, rgb: [255, 221, 88] });
        }
        attachedIndex++;
      }
    }
    function burstAttached() {
      return burstAttachedForPlayer(localPlayer());
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
      if (isServer)
        return;
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
      return confineBodyToWorld(ship);
    }
    function confineBodyToWorld(ship) {
      if (!ship)
        return;
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
    function confineAllShipsToWorld() {
      forEachPlayer((p) => confineBodyToWorld(p.ship));
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
      const baseViewW = Math.max(Number(state.view.w) || 0, WORLD_BASE_MIN_W);
      const baseViewH = Math.max(Number(state.view.h) || 0, WORLD_BASE_MIN_H);
      state.world.w = baseViewW * s;
      state.world.h = baseViewH * s;
      confineAllShipsToWorld();
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
    function updateShip(dt, player = localPlayer()) {
      const ship = player?.ship;
      const input = player?.input;
      if (!ship || !input)
        return;
      const turnDigital = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const turnAnalog = clamp(Number(input.turnAnalog ?? 0), -1, 1);
      const turn = clamp(turnDigital + turnAnalog, -1, 1);
      if (Math.abs(turn) > 1e-6)
        ship.angle += turn * state.params.shipTurnRate * dt;
      const fwd = shipForward(ship);
      const thrustDigital = input.up ? 1 : 0;
      const thrustAnalog = clamp(Number(input.thrustAnalog ?? 0), 0, 1);
      const thrust = Math.max(thrustDigital, thrustAnalog);
      if (thrust > 1e-6)
        ship.vel = add(ship.vel, mul(fwd, state.params.shipThrust * thrust * dt));
      if (input.down) {
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
      confineBodyToWorld(ship);
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
    function spawnExhaustParticle(kind, x, y, vx, vy, { ttl, r, seed: seed2 }) {
      const p = exhaustPool.length ? exhaustPool.pop() : { kind: "flame", pos: vec(0, 0), vel: vec(0, 0), age: 0, ttl: 0, r: 1, seed: 0 };
      p.kind = kind;
      p.pos.x = x;
      p.pos.y = y;
      p.vel.x = vx;
      p.vel.y = vy;
      p.age = 0;
      p.ttl = ttl;
      p.r = r;
      p.seed = seed2;
      state.exhaust.push(p);
    }
    function updateExhaust(dt) {
      if (isServer) {
        state.exhaust.length = 0;
        exhaustPool.length = 0;
        return;
      }
      const particles = state.exhaust;
      let w = 0;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.age += dt;
        if (p.age >= p.ttl) {
          exhaustPool.push(p);
          continue;
        }
        const drag = p.kind === "spark" ? 3.8 : 2.4;
        const damp = Math.exp(-drag * dt);
        p.vel.x *= damp;
        p.vel.y *= damp;
        p.pos.x += p.vel.x * dt;
        p.pos.y += p.vel.y * dt;
        particles[w++] = p;
      }
      particles.length = w;
      const ship = state.ship;
      if (!ship)
        return;
      const thrustAmt = Math.max(state.input.up ? 1 : 0, clamp(Number(state.input.thrustAnalog ?? 0), 0, 1));
      if (thrustAmt <= 1e-6)
        return;
      const tier = currentShipTier();
      const renderer = tier?.renderer || {};
      const engines = Array.isArray(renderer.engines) ? renderer.engines : [];
      if (engines.length === 0)
        return;
      const { scale, mirrorX } = exhaustShipScaleAndMirror(tier, ship);
      const ang = ship.angle || 0;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      const backX = -c;
      const backY = -s;
      const sideX = -s;
      const sideY = c;
      const baseVelX = Number(ship.vel?.x) || 0;
      const baseVelY = Number(ship.vel?.y) || 0;
      const shipX = Number(ship.pos?.x) || 0;
      const shipY = Number(ship.pos?.y) || 0;
      const intensity = clamp(Number(state.params.exhaustIntensity ?? 1), 0, 2.5) * thrustAmt;
      const sparkScale = clamp(Number(state.params.exhaustSparkScale ?? 1), 0, 3) * thrustAmt;
      if (intensity <= 1e-6 && sparkScale <= 1e-6)
        return;
      const dtScale = clamp(dt * 60, 0.1, 4);
      const tierScale = tier.key === "large" ? 1.35 : tier.key === "medium" ? 1.15 : 1;
      const flamesPerEngineBase = tier.key === "large" ? 3 : tier.key === "medium" ? 2 : 1;
      const sparkChanceBase = tier.key === "large" ? 0.16 : tier.key === "medium" ? 0.14 : 0.12;
      const maxParticles = clamp(Math.round(650 + 550 * intensity), 220, 1400);
      for (let ei = 0; ei < engines.length; ei++) {
        const e = engines[ei];
        let lx = (Number(e?.x) || 0) * scale;
        const ly = (Number(e?.y) || 0) * scale;
        if (mirrorX)
          lx = -lx;
        const nozzleOffset = 1.6 * scale;
        const localX = lx - nozzleOffset;
        const localY = ly;
        const nozzleX = shipX + localX * c - localY * s;
        const nozzleY = shipY + localX * s + localY * c;
        const flameCountF = flamesPerEngineBase * intensity * dtScale;
        const flameWhole = Math.floor(flameCountF);
        const flameFrac = flameCountF - flameWhole;
        const flameCount = flameWhole + (exhaustRng() < flameFrac ? 1 : 0);
        for (let j = 0; j < flameCount; j++) {
          const seed2 = Math.floor(exhaustRng() * 4294967295) >>> 0;
          const sideJitter = (exhaustRng() * 2 - 1) * 52 * tierScale;
          const backJitter = (exhaustRng() * 2 - 1) * 22 * tierScale;
          const speed = (180 + exhaustRng() * 150) * tierScale;
          const vx = baseVelX + backX * (speed + backJitter) + sideX * sideJitter;
          const vy = baseVelY + backY * (speed + backJitter) + sideY * sideJitter;
          const ttl = 0.28 + exhaustRng() * 0.26;
          const r = (2 + exhaustRng() * 2.2) * tierScale * (0.85 + 0.25 * intensity);
          const posX = nozzleX + sideX * ((exhaustRng() * 2 - 1) * 2.2 * tierScale) + backX * (exhaustRng() * 2.8);
          const posY = nozzleY + sideY * ((exhaustRng() * 2 - 1) * 2.2 * tierScale) + backY * (exhaustRng() * 2.8);
          spawnExhaustParticle("flame", posX, posY, vx, vy, { ttl, r, seed: seed2 });
        }
        const sparkChance = clamp(sparkChanceBase * sparkScale * dtScale, 0, 1);
        if (sparkChance > 1e-6 && exhaustRng() < sparkChance) {
          const seed2 = Math.floor(exhaustRng() * 4294967295) >>> 0;
          const sideJitter = (exhaustRng() * 2 - 1) * 120 * tierScale;
          const speed = (300 + exhaustRng() * 220) * tierScale;
          const vx = baseVelX + backX * speed + sideX * sideJitter;
          const vy = baseVelY + backY * speed + sideY * sideJitter;
          const ttl = 0.12 + exhaustRng() * 0.2;
          const r = (1 + exhaustRng() * 1.4) * tierScale;
          spawnExhaustParticle("spark", nozzleX, nozzleY, vx, vy, { ttl, r, seed: seed2 });
        }
      }
      if (particles.length > maxParticles) {
        while (particles.length > maxParticles) {
          exhaustPool.push(particles.pop());
        }
      }
    }
    function updateAsteroids(dt) {
      const star = state.round?.star;
      const heatBand = clamp(Number(state.params.starSafeBufferPx ?? 320), 80, Math.min(state.world.w, state.world.h));
      const chipDecaySec = Math.max(0, Number(state.params.fractureChipDecaySec ?? 0));
      const attachedByOwner = /* @__PURE__ */ new Map();
      for (let i = 0; i < state.asteroids.length; i++) {
        const a = state.asteroids[i];
        if (!a.attached)
          continue;
        const ownerId = a.attachedTo ?? state.localPlayerId;
        const arr = attachedByOwner.get(ownerId);
        if (arr)
          arr.push(a);
        else
          attachedByOwner.set(ownerId, [a]);
      }
      for (const [ownerId, attached] of attachedByOwner.entries()) {
        if (attached.length < 2)
          continue;
        const owner = state.playersById[ownerId];
        if (!owner?.ship)
          continue;
        const iters = 3;
        for (let it = 0; it < iters; it++) {
          for (let i = 0; i < attached.length; i++) {
            for (let j = i + 1; j < attached.length; j++) {
              const a = attached[i];
              const b = attached[j];
              const r = Math.max(20, Math.min(orbitRadiusForAsteroidForPlayer(a, owner), orbitRadiusForAsteroidForPlayer(b, owner)));
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
        if (!Number.isFinite(a.fractureDamage))
          a.fractureDamage = 0;
        if (chipDecaySec > 0 && a.fractureDamage > 0) {
          a.fractureDamage *= Math.exp(-dt / Math.max(1e-3, chipDecaySec));
          if (a.fractureDamage < 1e-4)
            a.fractureDamage = 0;
        }
        if (a.attached) {
          const ownerId = a.attachedTo ?? state.localPlayerId;
          const owner2 = state.playersById[ownerId];
          if (!owner2?.ship) {
            a.attached = false;
            a.attachedTo = null;
            a.shipLaunched = false;
            a.pullOwnerId = null;
          } else {
            a.pullOwnerId = ownerId;
            a.pos = orbitPosForAsteroidForPlayer(a, owner2);
            a.rot += a.rotVel * dt;
            continue;
          }
        }
        a.fractureCooldownT = Math.max(0, a.fractureCooldownT - dt);
        a.hitFxT = Math.max(0, a.hitFxT - dt);
        if (!Number.isFinite(a.pullFx))
          a.pullFx = 0;
        if (a.shipLaunched)
          a.pullOwnerId = null;
        const pullEaseIn = 1 - Math.exp(-dt * 10);
        const pullEaseOut = 1 - Math.exp(-dt * 6);
        let pullTarget = 0;
        let owner = null;
        let ownerAttractRadius = 0;
        let ownerForceFieldRadius = 0;
        if (!a.shipLaunched) {
          let bestD2 = Infinity;
          forEachPlayer((p) => {
            if (!p?.ship)
              return;
            if (!shipCanAttractSize(a.size, p))
              return;
            const ar = attractRadiusForPlayer(p);
            const toShip = sub(p.ship.pos, a.pos);
            const d2 = len2(toShip);
            if (d2 > ar * ar)
              return;
            if (d2 < bestD2) {
              bestD2 = d2;
              owner = p;
              ownerAttractRadius = ar;
              ownerForceFieldRadius = forceFieldRadiusForPlayer(p);
            }
          });
        }
        if (owner) {
          a.pullOwnerId = owner.id;
          const toShip = sub(owner.ship.pos, a.pos);
          const d2 = len2(toShip);
          const d = Math.max(10, Math.sqrt(d2));
          const dirIn = mul(toShip, 1 / d);
          const soft = state.params.gravitySoftening;
          const grav = state.params.gravityK / (d2 + soft * soft);
          const insideRing = d < ownerForceFieldRadius;
          const innerMult = insideRing ? state.params.innerGravityMult : 1;
          const innerT = insideRing ? clamp(1 - d / Math.max(1, ownerForceFieldRadius), 0, 1) : 0;
          a.vel = add(a.vel, mul(dirIn, grav * innerMult * dt));
          if (innerT > 0) {
            a.vel = mul(a.vel, Math.max(0, 1 - state.params.innerDrag * innerT * dt));
          }
          const targetRingRadius = orbitRadiusForAsteroidForPlayer(a, owner);
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
          const denom = Math.max(1, ownerAttractRadius - ownerForceFieldRadius);
          pullTarget = clamp(1 - (d - ownerForceFieldRadius) / denom, 0, 1);
          if (d < ownerForceFieldRadius)
            pullTarget = 1;
          tryAttachAsteroidForPlayer(a, owner);
        } else if (!a.shipLaunched) {
          a.pullOwnerId = null;
        }
        const blend = pullTarget > a.pullFx ? pullEaseIn : pullEaseOut;
        a.pullFx = lerp(a.pullFx, pullTarget, blend);
        if (a.pullFx < 1e-4)
          a.pullFx = 0;
        a.pos = add(a.pos, mul(a.vel, dt));
        if (isOutsideWorld(a, 24)) {
          if (a.techPartId)
            dropTechPartFromAsteroid(a, { lost: true });
          state.asteroids.splice(i, 1);
          continue;
        }
        if (star) {
          const axisPos = star.axis === "x" ? a.pos.x : a.pos.y;
          const dir = star.dir === 1 ? 1 : -1;
          const signedDist = (axisPos - Number(star.boundary || 0)) * dir - a.radius;
          a.starHeat = clamp(1 - signedDist / Math.max(1, heatBand), 0, 1);
          if (signedDist < 0) {
            const burnDepth = clamp(-signedDist / Math.max(8, a.radius), 0, 3);
            const nextBurn = (Number(a.starBurnSec) || 0) + dt * (0.6 + burnDepth * 1.4);
            a.starBurnSec = clamp(nextBurn, 0, 4);
          } else {
            a.starBurnSec = Math.max(0, (Number(a.starBurnSec) || 0) - dt * 1.2);
          }
        } else {
          a.starHeat = 0;
          a.starBurnSec = 0;
        }
        a.rot += a.rotVel * dt;
      }
    }
    function updateGems(dt) {
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
        let owner = null;
        let bestD2 = Infinity;
        forEachPlayer((p) => {
          if (!p?.ship)
            return;
          const d22 = len2(sub(p.ship.pos, g.pos));
          if (d22 < bestD2) {
            bestD2 = d22;
            owner = p;
          }
        });
        if (!owner?.ship) {
          g.spin += g.spinVel * dt;
          continue;
        }
        const toShip = sub(owner.ship.pos, g.pos);
        const d2 = len2(toShip);
        const d = Math.max(8, Math.sqrt(d2));
        const dirIn = mul(toShip, 1 / d);
        const soft = Math.max(16, state.params.gravitySoftening * 0.55);
        const core = Math.max(1, owner.ship.radius + g.radius + 30);
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
        let collector = null;
        let bestD2 = Infinity;
        forEachPlayer((p) => {
          if (!p?.ship)
            return;
          const pickR = p.ship.radius + g.radius + 20;
          const d2 = len2(sub(g.pos, p.ship.pos));
          if (d2 > pickR * pickR)
            return;
          if (d2 < bestD2) {
            bestD2 = d2;
            collector = p;
          }
        });
        if (!collector)
          continue;
        state.gems.splice(i, 1);
        if (!collector.gemsCollected)
          collector.gemsCollected = { diamond: 0, ruby: 0, emerald: 0, gold: 0 };
        collector.gemsCollected[g.kind] = (collector.gemsCollected[g.kind] || 0) + 1;
        const pts = gemPoints(g.kind);
        collector.score += pts;
        if (!collector.progression)
          collector.progression = makePlayerProgression();
        collector.progression.gemScore += pts;
        refreshShipTierProgressionForPlayer(collector, { animateZoom: true });
        spawnExplosion(collector.ship.pos, { kind: "tiny", rgb: gemRgb2(g.kind), r0: 4, r1: 16, ttl: 0.14 });
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
      if (target.size === "med") {
        const baseR2 = Math.max(1, target.radius || asteroidRadiusForSize(state.params, "med"));
        spawnExplosion(target.pos, {
          kind: "pop",
          rgb: [255, 255, 255],
          r0: 10,
          r1: Math.max(26, baseR2 * 1.45),
          ttl: 0.22
        });
        const dir = len2(impactDir) > 1e-6 ? norm(impactDir) : vec(1, 0);
        const axis2 = rot(dir, Math.PI / 2);
        const sep2 = gemRadius("emerald") * 1.6;
        spawnGem(add(target.pos, mul(axis2, sep2)), vec(0, 0), { jitterMag: 0 });
        spawnGem(add(target.pos, mul(axis2, -sep2)), vec(0, 0), { jitterMag: 0 });
        const rankGain2 = Math.max(1, asteroidSizeRank(target.size));
        state.score += 4 + rankGain2 * 3;
        return [];
      }
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
      for (const a of state.asteroids) {
        if (a.attached)
          continue;
        const shipHit = circleCollide(state.ship, a);
        if (!shipHit)
          continue;
        const impactSpeedN = closingSpeedAlongNormal(state.ship, a, shipHit.n);
        const impactSpeedF = fractureImpactSpeed(a, state.ship, mul(shipHit.n, -1));
        if (a.shipLaunched) {
          if (a.size === "small") {
            breakSmallAsteroid(a, { velHint: a.vel, removeSet: shipRemovals });
          } else {
            const energy = impactEnergy(a, state.ship, impactSpeedF);
            const threshold = fractureEnergyThreshold(a);
            if (energy >= threshold) {
              const frags = fractureAsteroid(a, norm(a.vel), impactSpeedN);
              if (frags) {
                if (a.techPartId)
                  dropTechPartFromAsteroid(a);
                shipRemovals.add(a.id);
                const room = Math.max(0, state.params.maxAsteroids - (state.asteroids.length + shipAdds.length - shipRemovals.size));
                shipAdds.push(...frags.slice(0, room));
              }
            } else {
              if (a.techPartId)
                dropTechPartFromAsteroid(a);
              shipRemovals.add(a.id);
              spawnExplosion(a.pos, { kind: "tiny", rgb: [255, 89, 100], r0: 5, r1: 18, ttl: 0.14 });
            }
          }
          continue;
        }
        if (a.size === "small") {
          const energy = impactEnergy(a, state.ship, impactSpeedF);
          const threshold = fractureEnergyThreshold(a);
          const shouldBreak = applyFractureChipDamage(a, energy, threshold, impactSpeedF);
          if (shouldBreak) {
            breakSmallAsteroid(a, { velHint: a.vel, removeSet: shipRemovals });
          } else {
            resolveElasticCollision(state.ship, a, shipHit.n, shipHit.penetration);
          }
          continue;
        }
        if (state.settings.shipExplodesOnImpact) {
          endRound("lose", "ship_impact");
          return;
        }
        resolveElasticCollision(state.ship, a, shipHit.n, shipHit.penetration);
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
        const impactSpeedN = closingSpeedAlongNormal(a, b, hit.n);
        const aImpactSpeedF = fractureImpactSpeed(a, b, hit.n);
        const bImpactSpeedF = fractureImpactSpeed(b, a, mul(hit.n, -1));
        const aEnergy = impactEnergy(a, b, aImpactSpeedF);
        const bEnergy = impactEnergy(b, a, bImpactSpeedF);
        const aThreshold = fractureEnergyThreshold(b);
        const bThreshold = fractureEnergyThreshold(a);
        const aCanFracture = applyFractureChipDamage(b, aEnergy, aThreshold, aImpactSpeedF);
        const bCanFracture = applyFractureChipDamage(a, bEnergy, bThreshold, bImpactSpeedF);
        if (aCanFracture || bCanFracture) {
          resolveElasticCollision(a, b, hit.n, hit.penetration);
          const interactions = [];
          if (aCanFracture)
            interactions.push({ projectile: a, target: b, impactDir: hit.n, energy: aEnergy });
          if (bCanFracture)
            interactions.push({ projectile: b, target: a, impactDir: mul(hit.n, -1), energy: bEnergy });
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
            const frags = fractureAsteroid(target, it.impactDir, impactSpeedN);
            if (frags) {
              if (target.techPartId)
                dropTechPartFromAsteroid(target);
              toRemove.add(target.id);
              const room = Math.max(0, state.params.maxAsteroids - (state.asteroids.length + toAdd.length - toRemove.size));
              toAdd.push(...frags.slice(0, room));
              continue;
            }
            spawnExplosion(target.pos, { kind: "tiny", rgb: [255, 89, 100], r0: 4, r1: 14, ttl: 0.14 });
            const massRatio = projectile.mass > 0 && target.mass > 0 ? projectile.mass / target.mass : 1;
            const shoveScale = Math.min(1, Math.max(0, massRatio));
            const shove = Math.min(180, impactSpeedN * 0.5 * shoveScale);
            target.vel = add(target.vel, mul(it.impactDir, shove));
          }
          return;
        }
        if (impactSpeedN > 190 && (a.hitFxT <= 0 || b.hitFxT <= 0)) {
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
      if (state.round.escape?.active) {
        state.time += dt;
        forEachPlayer((p) => {
          p.burstCooldown = Math.max(0, (Number(p.burstCooldown) || 0) - dt);
          p.blastPulseT = Math.max(0, (Number(p.blastPulseT) || 0) - dt);
          if (!p.progression)
            p.progression = makePlayerProgression();
          p.progression.tierShiftT = Math.max(0, (Number(p.progression.tierShiftT) || 0) - dt);
        });
        updateCameraZoom(dt);
        for (let i = state.effects.length - 1; i >= 0; i--) {
          const e = state.effects[i];
          e.t += dt;
          if (e.t >= e.ttl)
            state.effects.splice(i, 1);
        }
        updateGateEscapeSequence(dt);
        syncCameraToShip();
        return;
      }
      updateRound(dt);
      if (state.mode !== "playing")
        return;
      state.time += dt;
      forEachPlayer((p) => {
        p.burstCooldown = Math.max(0, (Number(p.burstCooldown) || 0) - dt);
        p.blastPulseT = Math.max(0, (Number(p.blastPulseT) || 0) - dt);
        if (!p.progression)
          p.progression = makePlayerProgression();
        p.progression.tierShiftT = Math.max(0, (Number(p.progression.tierShiftT) || 0) - dt);
      });
      forEachPlayer((p) => refreshShipTierProgressionForPlayer(p, { animateZoom: true }));
      updateCameraZoom(dt);
      for (let i = state.effects.length - 1; i >= 0; i--) {
        const e = state.effects[i];
        e.t += dt;
        if (e.t >= e.ttl)
          state.effects.splice(i, 1);
      }
      forEachPlayer((p) => {
        if (!p?.input)
          p.input = makePlayerInput();
        if (!p.input.burst)
          return;
        p.input.burst = false;
        burstAttachedForPlayer(p);
      });
      if (state.input.ping) {
        state.input.ping = false;
        tryStartTechPing();
      }
      forEachPlayer((p) => updateShip(dt, p));
      updateShipStarExposure(dt);
      if (state.mode !== "playing")
        return;
      updateExhaust(dt);
      syncCameraToShip();
      updateAsteroids(dt);
      updateGems(dt);
      updateSaucer(dt);
      updateSaucerLasers(dt);
      applyRedGiantHazard();
      if (state.mode !== "playing")
        return;
      handleSaucerAsteroidCollisions();
      handleGemShipCollisions();
      handleSaucerLaserShipCollisions();
      handleCollisions();
      if (state.mode !== "playing")
        return;
      updateTechPing(dt);
      updateTechParts(dt);
      if (state.mode !== "playing")
        return;
      rebuildWorldCellIndex();
      maintainAsteroidPopulation(dt);
    }
    function renderGameToText() {
      const ship = state.ship;
      const attached = state.asteroids.filter((a) => a.attached).length;
      const zoom = Math.max(0.1, state.camera.zoom || 1);
      const popBudget = asteroidPopulationBudget();
      const spawnRateScale = clamp(Number(state.params.asteroidSpawnRateScale ?? 1), 0.25, 3);
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
        attached_to: a.attachedTo ?? null,
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
        round: {
          session_seed: state.round.sessionSeed >>> 0,
          round_index: Math.max(0, Math.floor(state.round.roundIndex || 0)),
          seed: state.round.seed >>> 0,
          duration_sec: +Number(state.round.durationSec || 0).toFixed(3),
          elapsed_sec: +Number(state.round.elapsedSec || 0).toFixed(3),
          outcome: state.round.outcome ? { ...state.round.outcome } : null,
          star: state.round.star ? {
            edge: state.round.star.edge,
            axis: state.round.star.axis,
            dir: state.round.star.dir,
            t: +Number(state.round.star.t || 0).toFixed(6),
            boundary: +Number(state.round.star.boundary || 0).toFixed(3)
          } : null,
          gate: state.round.gate ? {
            edge: state.round.gate.edge,
            x: Math.round(state.round.gate.pos?.x || 0),
            y: Math.round(state.round.gate.pos?.y || 0),
            radius: +Number(state.round.gate.radius || 0).toFixed(2),
            active: !!state.round.gate.active,
            charging: state.round.gate.chargeElapsedSec != null && !state.round.gate.active,
            charge_elapsed_sec: state.round.gate.chargeElapsedSec != null ? +Number(state.round.gate.chargeElapsedSec || 0).toFixed(3) : null,
            charge_sec: +Number(state.round.gate.chargeSec ?? 0).toFixed(3),
            installed: Array.isArray(state.round.gate.slots) ? state.round.gate.slots.reduce((n, slot) => n + (slot ? 1 : 0), 0) : 0
          } : null,
          tech_parts: Array.isArray(state.round.techParts) ? state.round.techParts.map((p) => ({
            id: p.id,
            state: p.state,
            x: Math.round(p.pos?.x || 0),
            y: Math.round(p.pos?.y || 0),
            container: p.containerAsteroidId,
            installed_slot: p.installedSlot,
            respawns: p.respawnCount || 0
          })) : [],
          carried_part: state.round.carriedPartId || null,
          tech_ping: state.round.techPing ? {
            x: Math.round(state.round.techPing.origin?.x || 0),
            y: Math.round(state.round.techPing.origin?.y || 0),
            radius: +Number(state.round.techPing.radius || 0).toFixed(1),
            max_radius: +Number(state.round.techPing.maxRadius || 0).toFixed(1)
          } : null,
          escape: state.round.escape ? {
            active: !!state.round.escape.active,
            elapsed_sec: +Number(state.round.escape.elapsedSec || 0).toFixed(3),
            approach_sec: +Number(state.round.escape.approachSec || 0).toFixed(3),
            vanish_sec: +Number(state.round.escape.vanishSec || 0).toFixed(3)
          } : null
        },
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
          radius: +ship.radius.toFixed(2),
          escape_scale: +Number(ship.escapeScale ?? 1).toFixed(3)
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
        population: {
          current: state.asteroids.length,
          min: popBudget.min,
          target: popBudget.target,
          max: popBudget.max,
          spawn_t: +Math.max(0, state.asteroidSpawnT).toFixed(3),
          spawn_rate_scale: +spawnRateScale.toFixed(2)
        },
        counts: { ...counts, attached, score: state.score, asteroids_on_screen: asteroidsOnScreen },
        gems_on_field: gemsOnField,
        gems_collected: { ...state.gemsCollected },
        sample_asteroids: sample
      });
    }
    function setShipSvgRenderer(tierKey, pathData, svgScale = 1, hullRadius = null) {
      const key = tierKey === "medium" || tierKey === "large" ? tierKey : "small";
      const tier = shipTierByKey(key);
      if (!pathData || typeof pathData !== "string") {
        tier.renderer = cloneRenderer(DEFAULT_SHIP_RENDERERS[key]);
        return false;
      }
      const hullR = Number(hullRadius);
      tier.renderer = {
        type: "svg",
        path: pathData,
        svgScale: Number.isFinite(Number(svgScale)) ? Number(svgScale) : 1,
        hullRadius: Number.isFinite(hullR) && hullR > 0 ? hullR : void 0,
        mirrorX: void 0,
        engines: cloneRenderer(DEFAULT_SHIP_RENDERERS[key]).engines || []
      };
      return true;
    }
    rebuildStarfield();
    applyWorldScale(state.world.scale);
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
      getCurrentAttractRadius: () => currentAttractRadius(),
      setRoundSeed,
      generateSpawnPoints,
      spawnShipAt,
      spawnShipAtForPlayer,
      addPlayer,
      removePlayer
    };
  }

  // src/render/renderGame.js
  var ASTEROID_VERTS2 = {
    small: 9,
    med: 11,
    large: 12,
    xlarge: 13,
    xxlarge: 14
  };
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
  function drawThrusterJets(ctx, engines, { tierKey = "small", exhaustSign = -1, t = 0 } = {}) {
    if (!Array.isArray(engines) || engines.length === 0)
      return;
    const size = tierKey === "large" ? 1.6 : tierKey === "medium" ? 1.25 : 1;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "butt";
    for (const e of engines) {
      const sx = Number(e.x) || 0;
      const sy = Number(e.y) || 0;
      const baseLen = Math.max(6, Number(e.len) || 14);
      const flicker = 0.78 + 0.22 * Math.sin(t * 28 + sy * 0.35) + 0.12 * Math.sin(t * 61 + sx * 0.09) + 0.06 * Math.sin(t * 97);
      const len3 = baseLen * (1.05 + flicker * 0.75) * size;
      const nozzle = 1.8 * size;
      const nx = sx + exhaustSign * nozzle;
      const ex = nx + exhaustSign * len3;
      const jetSign = sy >= 0 ? 1 : -1;
      const aim = (1 + 0.55 * Math.sin(t * 13 + sy * 0.2) + 0.25 * Math.sin(t * 7.5 + sx * 0.08)) * size;
      const ey = sy + jetSign * aim;
      const g0 = ctx.createLinearGradient(nx, sy, ex, ey);
      g0.addColorStop(0, "rgba(255,248,220,0.08)");
      g0.addColorStop(0.12, "rgba(255,210,145,0.12)");
      g0.addColorStop(0.3, "rgba(255,135,70,0.15)");
      g0.addColorStop(0.6, "rgba(255,75,35,0.11)");
      g0.addColorStop(1, "rgba(160,30,15,0)");
      ctx.strokeStyle = g0;
      ctx.lineWidth = 7.4 * size;
      ctx.shadowColor = "rgba(255,120,70,0.96)";
      ctx.shadowBlur = 22 * size;
      for (let i = 0; i < 4; i++) {
        const wobSign = i % 2 === 0 ? 1 : -1;
        const wobPhase = t * (15 + i * 2.8) + sy * 0.7 + i * 0.9;
        const wob = wobSign * (0.7 + 0.95 * Math.sin(wobPhase)) * size;
        const bend = (0.2 + 0.25 * Math.sin(t * 9.5 + i * 1.7 + sx * 0.04)) * size;
        ctx.beginPath();
        ctx.moveTo(nx, sy);
        ctx.quadraticCurveTo(nx + exhaustSign * len3 * 0.42, sy + wob * 0.25, ex, ey + wob + bend);
        ctx.stroke();
      }
      const g1 = ctx.createLinearGradient(nx, sy, ex, ey);
      g1.addColorStop(0, "rgba(255,255,245,0.24)");
      g1.addColorStop(0.14, "rgba(255,235,185,0.28)");
      g1.addColorStop(0.3, "rgba(255,170,95,0.25)");
      g1.addColorStop(0.62, "rgba(255,105,55,0.18)");
      g1.addColorStop(1, "rgba(255,70,30,0)");
      ctx.strokeStyle = g1;
      ctx.lineWidth = 4.1 * size;
      ctx.shadowBlur = 14 * size;
      ctx.beginPath();
      ctx.moveTo(nx, sy);
      ctx.quadraticCurveTo(
        nx + exhaustSign * len3 * 0.5,
        sy,
        ex,
        ey + Math.sin(t * 22 + sy * 0.5) * 0.8 * size
      );
      ctx.stroke();
      const g2 = ctx.createLinearGradient(nx, sy, ex, ey);
      g2.addColorStop(0, "rgba(210,245,255,0.20)");
      g2.addColorStop(0.1, "rgba(255,255,255,0.52)");
      g2.addColorStop(0.26, "rgba(255,250,225,0.30)");
      g2.addColorStop(1, "rgba(255,205,130,0)");
      ctx.shadowBlur = 0;
      ctx.strokeStyle = g2;
      ctx.lineWidth = 1.7 * size;
      ctx.beginPath();
      ctx.moveTo(nx, sy);
      ctx.lineTo(nx + exhaustSign * len3 * 0.78, sy);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,240,205,0.24)";
      const diamonds = tierKey === "large" ? 4 : 3;
      for (let i = 0; i < diamonds; i++) {
        const u = (0.18 + i * 0.16) * len3;
        const wob = Math.sin(t * (18 + i * 6) + sy * 0.4) * 0.5 * size;
        const px = nx + exhaustSign * u;
        const py = sy + wob;
        const ww = (3.8 - i * 0.55) * size;
        const hh = (1.8 - i * 0.25) * size;
        ctx.fillRect(px - ww * 0.5, py - hh * 0.5, ww, hh);
      }
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,230,180,0.30)";
      ctx.lineWidth = 1.1 * size;
      for (let i = 0; i < 5; i++) {
        const tt = (0.52 + 0.42 * Math.sin(t * (26 + i * 7) + sx * 0.02 + sy * 0.17 + i * 0.7)) * len3;
        const px = nx + exhaustSign * tt;
        const side = i % 2 === 0 ? 1 : -1;
        const py = sy + side * (0.8 + 1.9 * Math.sin(t * 10 + sy * 0.3 + i * 0.3)) * size;
        const streak = (2.4 + 2.8 * Math.sin(t * 16 + i * 0.9 + sy * 0.2)) * size;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + exhaustSign * streak, py);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  function drawExhaustParticles(ctx, particles, sprites, timeSec = 0) {
    if (!Array.isArray(particles) || particles.length === 0)
      return;
    const flameSprite = sprites?.flame || null;
    const sparkSprite = sprites?.spark || null;
    if (!flameSprite && !sparkSprite)
      return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of particles) {
      const age = Number(p?.age) || 0;
      const ttl = Math.max(1e-6, Number(p?.ttl) || 1e-3);
      const t = clamp(age / ttl, 0, 1);
      const life = 1 - t;
      if (life <= 1e-3)
        continue;
      const seed = Number(p?.seed) || 0;
      const flicker = 0.85 + 0.15 * Math.sin(timeSec * 38 + seed % 997 * 0.07);
      const r = clamp(Number(p?.r) || 2, 0.25, 12);
      const x = Number(p?.pos?.x) || 0;
      const y = Number(p?.pos?.y) || 0;
      if (p.kind !== "spark") {
        if (!flameSprite)
          continue;
        const alpha2 = clamp(life * (0.55 + 0.45 * flicker), 0, 1);
        const sizePx2 = r * 7.5;
        ctx.globalAlpha = alpha2;
        ctx.drawImage(flameSprite, x - sizePx2 * 0.5, y - sizePx2 * 0.5, sizePx2, sizePx2);
        continue;
      }
      if (!sparkSprite)
        continue;
      const alpha = clamp(life * (0.75 + 0.25 * flicker), 0, 1);
      const sizePx = Math.max(2, r * 6);
      ctx.globalAlpha = alpha;
      ctx.drawImage(sparkSprite, x - sizePx * 0.5, y - sizePx * 0.5, sizePx, sizePx);
      const vx = Number(p?.vel?.x) || 0;
      const vy = Number(p?.vel?.y) || 0;
      const offX = -vx * 0.01;
      const offY = -vy * 0.01;
      ctx.globalAlpha = alpha * 0.45;
      ctx.drawImage(sparkSprite, x + offX - sizePx * 0.5, y + offY - sizePx * 0.5, sizePx, sizePx);
    }
    ctx.globalAlpha = 1;
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
  function shipTierByKey2(key) {
    return SHIP_TIERS[key] || SHIP_TIERS.small;
  }
  function forceFieldScaleForTierKey2(params, tierKey) {
    if (tierKey === "large")
      return clamp(Number(params?.tier3ForceFieldScale ?? SHIP_TIERS.large.forcefieldScale), 0.2, 6);
    if (tierKey === "medium")
      return clamp(Number(params?.tier2ForceFieldScale ?? SHIP_TIERS.medium.forcefieldScale), 0.2, 6);
    return clamp(Number(params?.tier1ForceFieldScale ?? SHIP_TIERS.small.forcefieldScale), 0.2, 6);
  }
  function shipHullRadiusForTierKey2(tierKey) {
    const tier = shipTierByKey2(tierKey);
    const renderer = tier.renderer || {};
    if (renderer.type === "svg") {
      const svgScale = Number.isFinite(Number(renderer.svgScale)) ? Number(renderer.svgScale) : 1;
      const hullR = Number(renderer.hullRadius);
      if (Number.isFinite(hullR) && hullR > 0)
        return Math.max(tier.radius, tier.radius * svgScale);
    }
    const points = Array.isArray(renderer.points) ? renderer.points : null;
    const baseR = points ? polygonHullRadius(points) : 0;
    return Math.max(tier.radius, baseR || 0);
  }
  function requiredForceFieldRadiusForTier2(params, tierKey) {
    const base = Number(params?.forceFieldRadius ?? 0);
    const scale = forceFieldScaleForTierKey2(params, tierKey);
    const desired = base * scale;
    const gap = clamp(Number(params?.forceFieldHullGap ?? 14), 0, 200);
    const hullR = shipHullRadiusForTierKey2(tierKey);
    return Math.max(desired, hullR + gap);
  }
  function makeAsteroidShapeFromSeed(seedU32, radius, verts) {
    let s = seedU32 >>> 0 || 3737844653;
    const pts = [];
    const step = Math.PI * 2 / Math.max(3, verts | 0);
    for (let i = 0; i < verts; i++) {
      s = xorshift32(s);
      const u = s / 4294967295;
      const jitter = 0.62 + u * 0.54;
      pts.push({ a: i * step, r: radius * jitter });
    }
    return pts;
  }
  function drawElectricTether(ctx, from, to, rgb, intensity, timeSec, seedBase, { thicknessScale = 1, alphaScale = 1, wobbleScale = 1 } = {}) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (!Number.isFinite(dist) || dist < 2)
      return;
    const inv = 1 / dist;
    const nx = -dy * inv;
    const ny = dx * inv;
    const segs = clamp(Math.round(dist / 22), 4, 12);
    const amp = lerp(1.5, 9, intensity) * wobbleScale;
    const phase = timeSec * 18;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.strokeStyle = rgbToRgba(rgb, lerp(0.02, 0.22, intensity) * alphaScale);
    ctx.lineWidth = lerp(2, 7, intensity) * thicknessScale;
    ctx.shadowColor = rgbToRgba(rgb, 0.95);
    ctx.shadowBlur = lerp(4, 14, intensity) * thicknessScale;
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
    ctx.strokeStyle = rgbToRgba(rgb, lerp(0.05, 0.9, intensity) * alphaScale);
    ctx.lineWidth = lerp(1, 2.5, intensity) * thicknessScale;
    ctx.stroke();
    ctx.restore();
  }
  function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / Math.max(1e-6, edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function pullTetherLineCountForSize(size) {
    return clamp(asteroidSizeRank(size) + 1, 1, 8);
  }
  function pullFxVisualScaleForTier(tierKey) {
    if (tierKey === "large")
      return { thickness: 1.45, alpha: 1.35, wobble: 1.2, spread: 1.35 };
    if (tierKey === "medium")
      return { thickness: 1.22, alpha: 1.18, wobble: 1.1, spread: 1.15 };
    return { thickness: 1, alpha: 1, wobble: 1, spread: 1 };
  }
  function attachedAsteroidColorForTierRgb(ringRgb) {
    return rgbToRgba(ringRgb, 0.95);
  }
  function drawBurstWaveletsEffect(ctx, e, waveletCrowd) {
    const ttl = Math.max(1e-6, Number(e.ttl) || 0.55);
    const age = clamp((Number(e.t) || 0) / ttl, 0, 1);
    const fadeOut = 1 - age;
    const speed = Math.max(0, Number(e.speed) || 520);
    const travelDist = speed * (Number(e.t) || 0);
    const fadeIn = smoothstep(18, 78, travelDist);
    const baseFade = fadeIn * fadeOut;
    if (baseFade <= 1e-3)
      return;
    const angle = Number.isFinite(e.angle) ? e.angle : 0;
    const dirx = Math.cos(angle);
    const diry = Math.sin(angle);
    const many = waveletCrowd >= 12;
    const extreme = waveletCrowd >= 22;
    if (extreme && (e.seed ?? 0) % 2 !== 0)
      return;
    const waves = many ? 3 : 4;
    const gap = many ? 11 : 12;
    const arcSpan = many ? 0.5 : 0.56;
    const arcR = many ? 12 : 13;
    const bandStart = many ? 10 : 12;
    const distFade = smoothstep(0, 18, travelDist);
    const aBase = (many ? 0.28 : 0.34) * 1.1 * baseFade * distFade;
    const doGlow = !many;
    const rgb = Array.isArray(e.rgb) ? e.rgb : [255, 221, 88];
    const rr = rgb?.[0] ?? 255;
    const gg = rgb?.[1] ?? 221;
    const bb = rgb?.[2] ?? 88;
    const strokeRgb = `rgb(${rr},${gg},${bb})`;
    ctx.strokeStyle = strokeRgb;
    for (let i = 0; i < waves; i++) {
      const local = Math.pow(1 - i / Math.max(1, waves - 1), 1.15);
      const a = Math.min(1, aBase * local);
      if (a <= 0.01)
        continue;
      const rJ = randSigned((e.seed ?? 1) + i * 997);
      const wobble = rJ * (many ? 0.01 : 0.014);
      const span = arcSpan * (0.92 + 0.08 * rJ);
      const a0 = angle - span + wobble;
      const a1 = angle + span + wobble;
      const dist = bandStart + i * gap;
      const cx = e.x + dirx * dist;
      const cy = e.y + diry * dist;
      if (doGlow) {
        ctx.shadowColor = strokeRgb;
        ctx.shadowBlur = 10;
        ctx.globalAlpha = a * 0.28;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx, cy, arcR, a0, a1);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = a;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, arcR, a0, a1);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
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
  function installedCountFromSlots(slots) {
    if (!Array.isArray(slots))
      return 0;
    return slots.reduce((n, slot) => n + (slot ? 1 : 0), 0);
  }
  function createRenderer(engine) {
    const state = engine.state;
    const svgPathCache = /* @__PURE__ */ new Map();
    const asteroidShapeCache = /* @__PURE__ */ new Map();
    let exhaustSpritesCacheKey = "";
    let exhaustSpritesCache = null;
    function sortedPlayerIds() {
      const obj = state.playersById && typeof state.playersById === "object" ? state.playersById : {};
      return Object.keys(obj).sort();
    }
    function getLocalPlayerId() {
      return state.localPlayerId || "local";
    }
    function getAsteroidShape(a) {
      const shape = a?.shape;
      if (Array.isArray(shape) && shape.length)
        return shape;
      const id = String(a?.id ?? "");
      const radius = Math.max(0, Number(a?.radius) || 0);
      const size = String(a?.size ?? "small");
      const verts = ASTEROID_VERTS2[size] || 10;
      const prev = asteroidShapeCache.get(id);
      if (prev && prev.verts === verts && Math.abs(prev.radius - radius) <= 1e-6)
        return prev.shape;
      const seed = fnv1aSeed(id || `${size}:${radius.toFixed(2)}`);
      const next = makeAsteroidShapeFromSeed(seed, radius, verts);
      asteroidShapeCache.set(id, { radius, verts, shape: next });
      return next;
    }
    function getExhaustSprites() {
      try {
        if (typeof document === "undefined")
          return null;
        const p = state.params || {};
        const palette = Math.max(0, Math.min(4, Math.round(Number(p.exhaustPalette ?? 0))));
        const core = clamp(Number(p.exhaustCoreScale ?? 1), 0, 2.5);
        const glow = clamp(Number(p.exhaustGlowScale ?? 1), 0, 2.5);
        const key = `${palette}:${core.toFixed(2)}:${glow.toFixed(2)}`;
        if (key === exhaustSpritesCacheKey && exhaustSpritesCache)
          return exhaustSpritesCache;
        const makeRadialSprite = (sizePx, stops) => {
          const c = document.createElement("canvas");
          c.width = sizePx;
          c.height = sizePx;
          const g = c.getContext("2d");
          if (!g)
            return null;
          const cx = sizePx * 0.5;
          const cy = sizePx * 0.5;
          const r = sizePx * 0.5;
          const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
          for (const s of stops)
            grad.addColorStop(s[0], s[1]);
          g.fillStyle = grad;
          g.fillRect(0, 0, sizePx, sizePx);
          return c;
        };
        const pal = (() => {
          if (palette === 1) {
            return {
              flameMid: [140, 200, 255],
              flameOuter: [70, 140, 255],
              sparkMid: [190, 235, 255],
              sparkOuter: [120, 200, 255]
            };
          }
          if (palette === 2) {
            return {
              flameMid: [215, 150, 255],
              flameOuter: [165, 85, 255],
              sparkMid: [240, 210, 255],
              sparkOuter: [210, 160, 255]
            };
          }
          if (palette === 3) {
            return {
              flameMid: [170, 255, 190],
              flameOuter: [70, 255, 150],
              sparkMid: [215, 255, 230],
              sparkOuter: [140, 255, 200]
            };
          }
          if (palette === 4) {
            return {
              flameMid: [255, 165, 140],
              flameOuter: [255, 85, 70],
              sparkMid: [255, 230, 220],
              sparkOuter: [255, 170, 150]
            };
          }
          return {
            flameMid: [255, 190, 125],
            flameOuter: [255, 120, 70],
            sparkMid: [255, 230, 200],
            sparkOuter: [255, 200, 125]
          };
        })();
        const flame = makeRadialSprite(64, [
          [0, `rgba(255,255,255,${clamp(0.95 * core, 0, 1).toFixed(3)})`],
          [0.12, `rgba(255,245,220,${clamp(0.9 * core, 0, 1).toFixed(3)})`],
          [0.3, `rgba(${pal.flameMid[0]},${pal.flameMid[1]},${pal.flameMid[2]},${clamp(0.55 * glow, 0, 1).toFixed(3)})`],
          [0.58, `rgba(${pal.flameOuter[0]},${pal.flameOuter[1]},${pal.flameOuter[2]},${clamp(0.22 * glow, 0, 1).toFixed(3)})`],
          [1, "rgba(0,0,0,0.00)"]
        ]);
        const spark = makeRadialSprite(48, [
          [0, `rgba(255,255,255,${clamp(0.95 * core, 0, 1).toFixed(3)})`],
          [0.22, `rgba(${pal.sparkMid[0]},${pal.sparkMid[1]},${pal.sparkMid[2]},${clamp(0.85 * core, 0, 1).toFixed(3)})`],
          [0.6, `rgba(${pal.sparkOuter[0]},${pal.sparkOuter[1]},${pal.sparkOuter[2]},${clamp(0.22 * glow, 0, 1).toFixed(3)})`],
          [1, "rgba(0,0,0,0.00)"]
        ]);
        exhaustSpritesCacheKey = key;
        exhaustSpritesCache = { flame, spark };
        return exhaustSpritesCache;
      } catch {
        return null;
      }
    }
    function drawRedGiantUnderlay(ctx) {
      const star = state.round?.star;
      if (!star)
        return;
      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;
      const b = Number(star.boundary) || 0;
      const safeDir = star.dir === 1 ? 1 : -1;
      const arcAmp = clamp(Math.min(halfW, halfH) * 0.06, 18, 80);
      const segs = 34;
      const seed = fnv1aSeed(`red-giant:${star.edge}`);
      const shimmerPhase = seed % 1e3 * 1e-3 * Math.PI * 2;
      const shimmer = 0.5 + 0.5 * Math.sin(state.time * 2.2 + shimmerPhase);
      const shimmerAmp = lerp(2, 10, shimmer);
      function boundaryPoints(offsetPx = 0) {
        const pts = [];
        if (star.axis === "x") {
          for (let i = 0; i <= segs; i++) {
            const t = i / segs;
            const u = lerp(-1, 1, t);
            const fire = safeDir * shimmerAmp * Math.sin(u * 4.7 + state.time * 3.4 + shimmerPhase);
            const bulge = safeDir * arcAmp * (1 - u * u) + fire;
            const y = lerp(-halfH, halfH, t);
            const x = b + bulge + safeDir * offsetPx;
            pts.push({ x, y });
          }
        } else {
          for (let i = 0; i <= segs; i++) {
            const t = i / segs;
            const u = lerp(-1, 1, t);
            const fire = safeDir * shimmerAmp * Math.sin(u * 4.7 + state.time * 3.4 + shimmerPhase);
            const bulge = safeDir * arcAmp * (1 - u * u) + fire;
            const x = lerp(-halfW, halfW, t);
            const y = b + bulge + safeDir * offsetPx;
            pts.push({ x, y });
          }
        }
        return pts;
      }
      ctx.save();
      if (star.axis === "x") {
        const edgeX = safeDir === 1 ? -halfW : halfW;
        const grad = ctx.createLinearGradient(b, 0, edgeX, 0);
        grad.addColorStop(0, "rgba(255,140,95,0.45)");
        grad.addColorStop(0.25, "rgba(255,85,45,0.72)");
        grad.addColorStop(1, "rgba(180,18,8,0.88)");
        ctx.fillStyle = grad;
        const curve = boundaryPoints(0);
        ctx.beginPath();
        ctx.moveTo(edgeX, -halfH);
        ctx.lineTo(edgeX, halfH);
        for (let i = curve.length - 1; i >= 0; i--)
          ctx.lineTo(curve[i].x, curve[i].y);
        ctx.closePath();
        ctx.fill();
      } else {
        const edgeY = safeDir === 1 ? -halfH : halfH;
        const grad = ctx.createLinearGradient(0, b, 0, edgeY);
        grad.addColorStop(0, "rgba(255,140,95,0.45)");
        grad.addColorStop(0.25, "rgba(255,85,45,0.72)");
        grad.addColorStop(1, "rgba(180,18,8,0.88)");
        ctx.fillStyle = grad;
        const curve = boundaryPoints(0);
        ctx.beginPath();
        ctx.moveTo(-halfW, edgeY);
        ctx.lineTo(halfW, edgeY);
        for (let i = curve.length - 1; i >= 0; i--)
          ctx.lineTo(curve[i].x, curve[i].y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    function drawTechPing(ctx) {
      const ping = state.round?.techPing;
      if (!ping)
        return;
      const origin = ping.origin;
      if (!origin)
        return;
      const r = Math.max(0, Number(ping.radius) || 0);
      const thickness = clamp(Number(state.params.techPingThicknessPx ?? 22), 4, 240);
      const wave = 0.5 + 0.5 * Math.sin(state.time * 6.2);
      ctx.save();
      ctx.translate(Number(origin.x) || 0, Number(origin.y) || 0);
      ctx.globalCompositeOperation = "lighter";
      ctx.shadowColor = "rgba(215,150,255,0.95)";
      ctx.shadowBlur = clamp(thickness * 0.8, 10, 28);
      ctx.strokeStyle = `rgba(215,150,255,${(0.1 + wave * 0.1).toFixed(3)})`;
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(231,240,255,${(0.12 + wave * 0.12).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    function drawRedGiantOverlay(ctx) {
      const star = state.round?.star;
      if (!star)
        return;
      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;
      const b = Number(star.boundary) || 0;
      const bandW = clamp(Number(state.params.starSafeBufferPx ?? 320), 80, Math.min(state.world.w, state.world.h));
      const safeDir = star.dir === 1 ? 1 : -1;
      const arcAmp = clamp(Math.min(halfW, halfH) * 0.06, 18, 80);
      const segs = 34;
      const seed = fnv1aSeed(`red-giant:${star.edge}`);
      const shimmerPhase = seed % 1e3 * 1e-3 * Math.PI * 2;
      const shimmer = 0.5 + 0.5 * Math.sin(state.time * 2.2 + shimmerPhase);
      const shimmerAmp = lerp(2, 10, shimmer);
      function boundaryPoints(offsetPx = 0) {
        const pts = [];
        if (star.axis === "x") {
          for (let i = 0; i <= segs; i++) {
            const t = i / segs;
            const u = lerp(-1, 1, t);
            const fire = safeDir * shimmerAmp * Math.sin(u * 4.7 + state.time * 3.4 + shimmerPhase);
            const bulge = safeDir * arcAmp * (1 - u * u) + fire;
            const y = lerp(-halfH, halfH, t);
            const x = b + bulge + safeDir * offsetPx;
            pts.push({ x, y });
          }
        } else {
          for (let i = 0; i <= segs; i++) {
            const t = i / segs;
            const u = lerp(-1, 1, t);
            const fire = safeDir * shimmerAmp * Math.sin(u * 4.7 + state.time * 3.4 + shimmerPhase);
            const bulge = safeDir * arcAmp * (1 - u * u) + fire;
            const x = lerp(-halfW, halfW, t);
            const y = b + bulge + safeDir * offsetPx;
            pts.push({ x, y });
          }
        }
        return pts;
      }
      ctx.save();
      const curve0 = boundaryPoints(0);
      const curve1 = boundaryPoints(bandW);
      if (star.axis === "x") {
        const x0 = b;
        const x1 = b + safeDir * bandW;
        const grad = ctx.createLinearGradient(x0, 0, x1, 0);
        grad.addColorStop(0, "rgba(255,75,35,0.62)");
        grad.addColorStop(0.35, "rgba(255,120,70,0.20)");
        grad.addColorStop(1, "rgba(255,120,70,0)");
        ctx.fillStyle = grad;
      } else {
        const y0 = b;
        const y1 = b + safeDir * bandW;
        const grad = ctx.createLinearGradient(0, y0, 0, y1);
        grad.addColorStop(0, "rgba(255,75,35,0.62)");
        grad.addColorStop(0.35, "rgba(255,120,70,0.20)");
        grad.addColorStop(1, "rgba(255,120,70,0)");
        ctx.fillStyle = grad;
      }
      ctx.beginPath();
      ctx.moveTo(curve0[0].x, curve0[0].y);
      for (let i = 1; i < curve0.length; i++)
        ctx.lineTo(curve0[i].x, curve0[i].y);
      for (let i = curve1.length - 1; i >= 0; i--)
        ctx.lineTo(curve1[i].x, curve1[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = "lighter";
      const flicker = 0.5 + 0.5 * Math.sin(state.time * 5.1 + shimmerPhase * 1.7);
      ctx.shadowColor = "rgba(255,120,70,0.95)";
      ctx.shadowBlur = lerp(16, 26, flicker);
      ctx.strokeStyle = `rgba(255,170,150,${(0.5 + flicker * 0.18).toFixed(3)})`;
      ctx.lineWidth = lerp(12, 16, flicker);
      ctx.beginPath();
      ctx.moveTo(curve0[0].x, curve0[0].y);
      for (let i = 1; i < curve0.length; i++)
        ctx.lineTo(curve0[i].x, curve0[i].y);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(255,245,230,${(0.18 + flicker * 0.12).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(curve0[0].x, curve0[0].y);
      for (let i = 1; i < curve0.length; i++)
        ctx.lineTo(curve0[i].x, curve0[i].y);
      ctx.stroke();
      ctx.restore();
    }
    function drawJumpGate(ctx) {
      const gate = state.round?.gate;
      if (!gate)
        return;
      const active = !!gate.active;
      const charging = gate.chargeElapsedSec != null && !active;
      const chargeT = charging ? clamp((Number(gate.chargeElapsedSec) || 0) / Math.max(1e-6, Number(gate.chargeSec) || 1), 0, 1) : 0;
      const slots = Array.isArray(gate.slots) ? gate.slots : [];
      const total = Math.max(1, slots.length || 4);
      const installed = installedCountFromSlots(slots);
      const baseRgb = active ? [84, 240, 165] : charging ? [255, 190, 125] : [142, 198, 255];
      const slotR = clamp(
        Number(state.round?.techParts?.[0]?.radius ?? state.params?.techPartRadius ?? 80) || 80,
        4,
        180
      );
      const segCount = 4;
      const segSpan = Math.PI * 2 / segCount;
      const segInset = segSpan * 0.08;
      const slotInnerR = slotR * 0.62;
      ctx.save();
      ctx.translate(gate.pos.x, gate.pos.y);
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = rgbToRgba(baseRgb, active ? 0.34 : 0.26);
      const ringW = clamp(gate.radius * 0.12, 12, 30);
      ctx.lineWidth = active ? ringW * 1.15 : charging ? ringW * 1.05 : ringW;
      ctx.shadowColor = rgbToRgba(baseRgb, 0.85);
      ctx.shadowBlur = active ? clamp(gate.radius * 0.22, 20, 46) : charging ? clamp(gate.radius * 0.2, 18, 44) : clamp(gate.radius * 0.18, 18, 40);
      ctx.beginPath();
      ctx.arc(0, 0, gate.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;
      ctx.strokeStyle = active ? "rgba(231,240,255,0.78)" : "rgba(231,240,255,0.62)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, gate.radius, 0, Math.PI * 2);
      ctx.stroke();
      const slotDist = gate.radius + slotR * 0.62 + ringW * 0.15;
      for (let i = 0; i < total; i++) {
        const ang = -Math.PI / 2 + i / total * Math.PI * 2;
        const px = Math.cos(ang) * slotDist;
        const py = Math.sin(ang) * slotDist;
        const filled = !!slots[i];
        const t = active ? 0.65 : 0.4;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(ang - segSpan * 0.5);
        ctx.globalCompositeOperation = "lighter";
        if (filled) {
          ctx.fillStyle = rgbToRgba(baseRgb, 0.22);
          ctx.beginPath();
          ctx.arc(0, 0, slotR, segInset, segSpan - segInset);
          ctx.arc(0, 0, slotInnerR, segSpan - segInset, segInset, true);
          ctx.closePath();
          ctx.fill();
        }
        ctx.shadowColor = rgbToRgba(baseRgb, 0.85);
        ctx.shadowBlur = filled ? 16 : 10;
        ctx.strokeStyle = filled ? rgbToRgba(baseRgb, 0.92) : `rgba(231,240,255,${(0.22 + t * 0.24).toFixed(3)})`;
        ctx.lineWidth = clamp(slotR * 0.06, 2, 6);
        ctx.beginPath();
        ctx.arc(0, 0, slotR, segInset, segSpan - segInset);
        ctx.arc(0, 0, slotInnerR, segSpan - segInset, segInset, true);
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(0,0,0,0.55)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
      if (active || charging) {
        const wave = 0.5 + 0.5 * Math.sin(state.time * 5.5);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const a = active ? 0.14 + wave * 0.08 : 0.12 + wave * 0.14 * chargeT;
        ctx.strokeStyle = rgbToRgba(baseRgb, a);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, gate.radius * 0.72, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = "rgba(231,240,255,0.70)";
      ctx.font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        active ? "GATE ACTIVE" : charging ? `CHARGING ${(chargeT * 100).toFixed(0)}%` : `${installed}/${total}`,
        0,
        gate.radius + slotR * 1.55
      );
      ctx.restore();
    }
    function drawTechPart(ctx, part, { carried = false } = {}) {
      if (!part)
        return;
      const r = clamp(Number(part.radius) || 12, 4, 180);
      const seed = fnv1aSeed(part.id);
      const phase = seed % 1e3 * 1e-3 * Math.PI * 2;
      const spin = phase + state.time * (carried ? 2.2 : 1.6);
      const coreRgb = carried ? [231, 240, 255] : [215, 150, 255];
      const index = Number(String(part.id).split("-").pop() || 0) || 0;
      const segCount = 4;
      const segSpan = Math.PI * 2 / segCount;
      const segInset = segSpan * 0.08;
      const a0 = segInset;
      const a1 = segSpan - segInset;
      const innerR = r * 0.62;
      ctx.save();
      ctx.translate(part.pos.x, part.pos.y);
      ctx.rotate(spin + index * segSpan);
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = rgbToRgba(coreRgb, carried ? 0.16 : 0.42);
      ctx.beginPath();
      ctx.arc(0, 0, r, a0, a1);
      ctx.arc(0, 0, innerR, a1, a0, true);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = rgbToRgba(coreRgb, 0.95);
      ctx.shadowBlur = carried ? clamp(r * 0.32, 10, 30) : clamp(r * 0.28, 10, 26);
      ctx.strokeStyle = rgbToRgba(coreRgb, carried ? 0.98 : 0.92);
      ctx.lineWidth = clamp(r * 0.06, 2, 6);
      ctx.beginPath();
      ctx.arc(0, 0, r, a0, a1);
      ctx.arc(0, 0, innerR, a1, a0, true);
      ctx.closePath();
      ctx.stroke();
      const detail = clamp(seed % 1e3 / 1e3, 0, 1);
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = rgbToRgba(coreRgb, carried ? 0.32 : 0.26);
      ctx.lineWidth = clamp(r * 0.02, 1, 3);
      for (let i = 0; i < 3; i++) {
        const tt = posMod(detail + i * 0.27, 1);
        const ang = a0 + (a1 - a0) * (0.18 + 0.64 * tt);
        const midR = lerp(innerR * 1.08, r * 0.94, 0.5);
        ctx.beginPath();
        ctx.arc(0, 0, midR, ang - 0.09, ang + 0.09);
        ctx.stroke();
        const tick0 = lerp(innerR * 1.06, r * 0.88, 0.15 + 0.7 * tt);
        const tick1 = tick0 + clamp(r * 0.08, 5, 12);
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * tick0, Math.sin(ang) * tick0);
        ctx.lineTo(Math.cos(ang) * tick1, Math.sin(ang) * tick1);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(231,240,255,0.26)";
      for (let i = 0; i < 2; i++) {
        const tt = posMod(detail * 0.7 + i * 0.41, 1);
        const ang = a0 + (a1 - a0) * (0.22 + 0.56 * tt);
        const boltR = lerp(innerR * 1.12, r * 0.86, 0.55);
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * boltR, Math.sin(ang) * boltR, clamp(r * 0.045, 1.5, 4.2), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    function drawTechParts(ctx) {
      const parts = state.round?.techParts;
      if (!Array.isArray(parts) || parts.length === 0)
        return;
      for (const part of parts) {
        if (!part)
          continue;
        if (part.state === "dropped")
          drawTechPart(ctx, part, { carried: false });
        else if (part.state === "carried")
          drawTechPart(ctx, part, { carried: true });
      }
    }
    function drawForcefieldRings(ctx, playerInfos, localPlayerId) {
      if (state.mode !== "playing")
        return;
      if (state.round?.escape?.active)
        return;
      const localId = localPlayerId || getLocalPlayerId();
      for (let i = 0; i < playerInfos.length; i++) {
        const p = playerInfos[i];
        if (!p?.ship || !p?.tier)
          continue;
        const tier = p.tier;
        const fieldR = p.fieldR;
        const attractR = p.attractR;
        const pulse = clamp(p.pulse / 0.22, 0, 1);
        const tierShift = clamp(p.tierShift / 0.7, 0, 1);
        ctx.save();
        ctx.strokeStyle = tier.ringColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.ship.pos.x, p.ship.pos.y, fieldR, 0, Math.PI * 2);
        ctx.stroke();
        if (pulse > 0) {
          ctx.strokeStyle = `rgba(255,255,255,${lerp(0, 0.85, pulse).toFixed(3)})`;
          ctx.lineWidth = lerp(2, 6, pulse);
          ctx.beginPath();
          ctx.arc(p.ship.pos.x, p.ship.pos.y, fieldR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = `rgba(255,89,100,${lerp(0, 0.55, pulse).toFixed(3)})`;
          ctx.lineWidth = lerp(1, 4, pulse);
          ctx.beginPath();
          ctx.arc(p.ship.pos.x, p.ship.pos.y, fieldR + lerp(0, 10, pulse), 0, Math.PI * 2);
          ctx.stroke();
        }
        if (tierShift > 0) {
          ctx.strokeStyle = `rgba(255,255,255,${(tierShift * 0.9).toFixed(3)})`;
          ctx.lineWidth = lerp(2, 8, tierShift);
          ctx.beginPath();
          ctx.arc(p.ship.pos.x, p.ship.pos.y, fieldR + lerp(0, 34, 1 - tierShift), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        if (p.id === localId && state.settings.showAttractRadius) {
          ctx.save();
          ctx.strokeStyle = "rgba(86,183,255,0.12)";
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 10]);
          ctx.lineDashOffset = 0;
          ctx.beginPath();
          ctx.arc(p.ship.pos.x, p.ship.pos.y, attractR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
    function drawAsteroid(ctx, a, { tier, ship, fieldR }) {
      const canShowForTier = Array.isArray(tier.attractSizes) ? tier.attractSizes.includes(a.size) : false;
      const showPullFx = state.mode === "playing" && canShowForTier && !a.attached && !a.shipLaunched;
      const pullFx = showPullFx ? clamp(a.pullFx ?? 0, 0, 1) : 0;
      const shape = getAsteroidShape(a);
      if (pullFx > 0.01) {
        const visScale = pullFxVisualScaleForTier(tier.key);
        const outward = sub(a.pos, ship.pos);
        const outwardLen = Math.max(1e-6, len(outward));
        const ringPoint = add(ship.pos, mul(outward, fieldR / outwardLen));
        const seed = fnv1aSeed(a.id);
        const lineCount = pullTetherLineCountForSize(a.size);
        const tether = sub(ringPoint, a.pos);
        const tetherLen = Math.max(1e-6, len(tether));
        const perp = { x: -tether.y / tetherLen, y: tether.x / tetherLen };
        const lineSpread = lineCount > 1 ? lerp(2.2, 3.6, Math.min(1, (lineCount - 2) / 4)) * visScale.spread : 0;
        const half = (lineCount - 1) * 0.5;
        for (let i = 0; i < lineCount; i++) {
          const offset = (i - half) * lineSpread;
          const from = add(a.pos, mul(perp, offset));
          const to = add(ringPoint, mul(perp, offset));
          const edgeT = half > 0 ? Math.abs(i - half) / half : 0;
          const lineFx = pullFx * lerp(1, 0.84, edgeT);
          drawElectricTether(ctx, from, to, tier.ringRgb, lineFx, state.time, seed + i * 1013, {
            thicknessScale: visScale.thickness,
            alphaScale: visScale.alpha,
            wobbleScale: visScale.wobble
          });
        }
        const stackScale = lineCount > 1 ? lerp(1, 0.7, Math.min(1, (lineCount - 1) / 4)) : 1;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = rgbToRgba(tier.ringRgb, lerp(0.05, 0.35, pullFx) * stackScale * visScale.alpha);
        ctx.lineWidth = lerp(2, 7, pullFx) * stackScale * visScale.thickness;
        ctx.shadowColor = rgbToRgba(tier.ringRgb, 0.9);
        ctx.shadowBlur = lerp(3, 14, pullFx) * stackScale * visScale.thickness;
        drawPolyline(ctx, shape, a.pos.x, a.pos.y, a.rot, ctx.strokeStyle, ctx.lineWidth);
        ctx.restore();
      }
      const pingFxT = Math.max(0, Number(a.techPingFxT) || 0);
      if (pingFxT > 1e-3) {
        const glowSec = clamp(Number(state.params.techPingGlowSec ?? 8), 0.25, 30);
        const fadeOutSec = clamp(Math.min(2, glowSec), 0.1, 10);
        const intensity = pingFxT > fadeOutSec ? 1 : clamp(pingFxT / fadeOutSec, 0, 1);
        const alpha = 0.06 + 0.28 * intensity;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.shadowColor = "rgba(215,150,255,0.95)";
        ctx.shadowBlur = lerp(8, 22, intensity);
        drawPolyline(ctx, shape, a.pos.x, a.pos.y, a.rot, `rgba(215,150,255,${alpha.toFixed(3)})`, lerp(4, 9, intensity));
        ctx.restore();
      }
      const burnSecNeeded = Math.max(0.02, Number(state.params.starAsteroidBurnSec ?? 0.22));
      const burnT = clamp((Number(a.starBurnSec) || 0) / burnSecNeeded, 0, 1);
      const starHeat = clamp(Math.max(Number(a.starHeat) || 0, burnT), 0, 1);
      if (starHeat > 1e-3) {
        const hotRgb = lerpRgb([255, 130, 80], [255, 255, 255], clamp(starHeat * starHeat, 0, 1));
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.shadowColor = rgbToRgba([255, 120, 70], 0.9);
        ctx.shadowBlur = lerp(6, 24, starHeat);
        ctx.strokeStyle = rgbToRgba(hotRgb, 0.06 + 0.22 * starHeat);
        ctx.lineWidth = lerp(2, 9, starHeat);
        drawPolyline(ctx, shape, a.pos.x, a.pos.y, a.rot, ctx.strokeStyle, ctx.lineWidth);
        ctx.restore();
      }
      const base = a.size === "xxlarge" ? "rgba(231,240,255,0.62)" : a.size === "xlarge" ? "rgba(231,240,255,0.68)" : a.size === "large" ? "rgba(231,240,255,0.74)" : a.size === "med" ? "rgba(231,240,255,0.80)" : "rgba(231,240,255,0.88)";
      let color = a.attached ? attachedAsteroidColorForTierRgb(tier.ringRgb) : base;
      if (pullFx > 0.01) {
        const baseRgb = [231, 240, 255];
        const mixed = lerpRgb(baseRgb, tier.ringRgb, pullFx);
        const aAlpha = lerp(0.78, 0.98, pullFx);
        color = rgbToRgba(mixed, aAlpha);
      }
      if (starHeat > 1e-3) {
        const hotRgb = lerpRgb([255, 150, 95], [255, 255, 255], clamp(starHeat * starHeat, 0, 1));
        const mixed = lerpRgb([231, 240, 255], hotRgb, clamp(starHeat * 0.9, 0, 1));
        color = rgbToRgba(mixed, 0.88);
      }
      drawPolyline(ctx, shape, a.pos.x, a.pos.y, a.rot, color, 2, "rgba(0,0,0,0.92)");
    }
    function drawShipModel(ctx, ship, thrusting, tierOverride = null) {
      const tier = tierOverride || shipTierByKey2(ship?.tier);
      const renderer = tier.renderer || {};
      const shipRadius = Math.max(1, Number(ship.radius) || Number(tier.radius) || 1);
      const escapeScale = clamp(Number(ship.escapeScale) || 0, 0, 1);
      if (escapeScale <= 1e-3)
        return;
      ctx.save();
      ctx.translate(ship.pos.x, ship.pos.y);
      ctx.rotate(ship.angle);
      ctx.scale(escapeScale, escapeScale);
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
        const mirrorX = renderer.mirrorX === true;
        const exhaustSign = mirrorX ? 1 : -1;
        ctx.save();
        ctx.scale(drawScale, drawScale);
        if (mirrorX)
          ctx.scale(-1, 1);
        ctx.stroke(path);
        const legacyJets = Number(state.params?.exhaustLegacyJets ?? 0) >= 0.5;
        const particlesOn = Number(state.params?.exhaustIntensity ?? 1) > 1e-3 || Number(state.params?.exhaustSparkScale ?? 1) > 1e-3;
        if (thrusting && (legacyJets || !particlesOn)) {
          drawThrusterJets(ctx, engines, { tierKey: tier.key, exhaustSign, t: state.time });
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
        const legacyJets = Number(state.params?.exhaustLegacyJets ?? 0) >= 0.5;
        const particlesOn = Number(state.params?.exhaustIntensity ?? 1) > 1e-3 || Number(state.params?.exhaustSparkScale ?? 1) > 1e-3;
        if (thrusting && (legacyJets || !particlesOn)) {
          drawThrusterJets(ctx, engines, { tierKey: tier.key, exhaustSign: -1, t: state.time });
        }
        ctx.restore();
      }
      const heat = clamp(Number(ship.starHeat) || 0, 0, 1);
      if (heat > 1e-3) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.shadowColor = "rgba(255,120,70,0.95)";
        ctx.shadowBlur = lerp(10, 28, heat);
        ctx.fillStyle = `rgba(255,140,95,${(0.05 + 0.22 * heat).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(0, 0, shipRadius * lerp(1.1, 1.65, heat), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
    function render(ctx) {
      const w = state.view.w;
      const h = state.view.h;
      ctx.clearRect(0, 0, w, h);
      const localId = getLocalPlayerId();
      const ids = sortedPlayerIds();
      const playerInfos = [];
      const playerInfoById = /* @__PURE__ */ Object.create(null);
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const player = state.playersById?.[id];
        const ship = player?.ship;
        if (!ship)
          continue;
        const tier = shipTierByKey2(ship.tier);
        const fieldR = requiredForceFieldRadiusForTier2(state.params, tier.key);
        const attractR = Number(state.params?.attractRadius ?? 0) * Number(tier.attractScale || 1);
        const pulse = Number(player?.blastPulseT) || 0;
        const tierShift = Number(player?.progression?.tierShiftT) || 0;
        const info = { id, player, ship, tier, fieldR, attractR, pulse, tierShift };
        playerInfos.push(info);
        playerInfoById[id] = info;
      }
      const localInfo = playerInfoById[localId] || (playerInfos.length ? playerInfos[0] : null);
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
      drawRedGiantUnderlay(ctx);
      drawTechPing(ctx);
      for (const a of state.asteroids) {
        if (a.attached)
          continue;
        const ownerId = a.pullOwnerId || localId;
        const owner = playerInfoById[ownerId] || localInfo;
        if (!owner)
          continue;
        drawAsteroid(ctx, a, { tier: owner.tier, ship: owner.ship, fieldR: owner.fieldR });
      }
      drawForcefieldRings(ctx, playerInfos, localId);
      for (const a of state.asteroids) {
        if (!a.attached)
          continue;
        const ownerId = a.attachedTo || localId;
        const owner = playerInfoById[ownerId] || localInfo;
        if (!owner)
          continue;
        drawAsteroid(ctx, a, { tier: owner.tier, ship: owner.ship, fieldR: owner.fieldR });
      }
      drawJumpGate(ctx);
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
      drawTechParts(ctx);
      drawRedGiantOverlay(ctx);
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
      let waveletCrowd = 0;
      for (const e of state.effects) {
        if (e.kind === "wavelets")
          waveletCrowd++;
      }
      if (waveletCrowd > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";
        for (const e of state.effects) {
          if (e.kind !== "wavelets")
            continue;
          drawBurstWaveletsEffect(ctx, e, waveletCrowd);
        }
        ctx.restore();
      }
      for (const e of state.effects) {
        if (e.kind === "wavelets")
          continue;
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
      drawExhaustParticles(ctx, state.exhaust, getExhaustSprites(), state.time);
      const localThrusting = state.mode === "playing" && (state.input.up || Number(state.input?.thrustAnalog ?? 0) > 0.02);
      for (let i = 0; i < playerInfos.length; i++) {
        const p = playerInfos[i];
        if (p.id === localId)
          continue;
        drawShipModel(ctx, p.ship, false, p.tier);
      }
      if (localInfo?.ship)
        drawShipModel(ctx, localInfo.ship, localThrusting, localInfo.tier);
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
        const gate = state.round?.gate;
        const star = state.round?.star;
        const totalSlots = gate && Array.isArray(gate.slots) ? gate.slots.length : 0;
        const installed = gate && Array.isArray(gate.slots) ? installedCountFromSlots(gate.slots) : 0;
        const escaping = !!state.round?.escape?.active;
        const gateLine = gate && totalSlots > 0 ? `Gate: ${installed}/${totalSlots}${gate.active ? " ACTIVE" : ""}${escaping ? " ESCAPING" : ""}   Carry: ${state.round.carriedPartId || "\u2014"}` : "";
        const starLine = star ? `Star: ${String(star.edge).toUpperCase()}` : "";
        ctx.fillText(
          `Tier: ${localInfo?.tier?.label || shipTierByKey2(state.ship?.tier).label}   Attached: ${attached}   S:${small} M:${med} L:${large} XL:${xlarge} XXL:${xxlarge}   Gems: ${state.progression.gemScore}   Score: ${state.score}`,
          14,
          18
        );
        if (gateLine)
          ctx.fillText(gateLine, 14, 34);
        if (starLine)
          ctx.fillText(starLine, 14, 50);
      } else if (state.mode === "gameover") {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, w, h);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const outcomeKind = state.round?.outcome?.kind || "lose";
        const outcomeReason = state.round?.outcome?.reason || "";
        const win = outcomeKind === "win";
        ctx.fillStyle = win ? "rgba(84,240,165,0.96)" : "rgba(255,89,100,0.96)";
        ctx.font = "700 52px ui-sans-serif, system-ui";
        ctx.fillText(win ? "ESCAPED" : "GAME OVER", w * 0.5, h * 0.5 - 70);
        ctx.fillStyle = "rgba(231,240,255,0.92)";
        ctx.font = "16px ui-sans-serif, system-ui";
        ctx.fillText(`Score: ${state.score}`, w * 0.5, h * 0.5 - 26);
        if (outcomeReason)
          ctx.fillText(`Reason: ${outcomeReason}`, w * 0.5, h * 0.5 - 4);
        ctx.fillText("Press R or click to restart", w * 0.5, h * 0.5 + 18);
        ctx.fillStyle = "rgba(231,240,255,0.70)";
        ctx.fillText("Press M for debug/tuning", w * 0.5, h * 0.5 + 46);
        ctx.restore();
      }
      ctx.restore();
    }
    return {
      render
    };
  }

  // src/ui/createUiBindings.js
  var DEBUG_MENU_CONTROL_IDS = Object.freeze([
    "dbg-attract",
    "ship-explode",
    "dbg-camera-mode",
    "dbg-world-scale",
    "dbg-pause-on-open",
    "dbg-tier-override",
    "dbg-tier-override-level",
    "dbg-gem-score",
    "tune-tier2-unlock",
    "tune-tier3-unlock",
    "tune-tier1-zoom",
    "tune-tier2-zoom",
    "tune-tier3-zoom",
    "tune-tier-zoom-sec",
    "tune-attract",
    "tune-field",
    "tune-field-scale1",
    "tune-field-scale2",
    "tune-field-scale3",
    "tune-field-gap",
    "tune-gravity",
    "tune-inner-grav",
    "tune-gravity-soft",
    "tune-inner-drag",
    "tune-ring-k",
    "tune-ring-damp",
    "tune-capture",
    "tune-burst",
    "tune-thrust",
    "tune-exhaust-intensity",
    "tune-exhaust-sparks",
    "tune-exhaust-palette",
    "tune-exhaust-core",
    "tune-exhaust-glow",
    "tune-exhaust-jets",
    "tune-dmg",
    "tune-fracture",
    "tune-fracture-sizeexp",
    "tune-fracture-chip",
    "tune-fracture-decay",
    "tune-fracture-minspeed",
    "tune-fracture-shear",
    "tune-fracture-shearref",
    "tune-world-density",
    "tune-spawn-rate",
    "tune-xl-radius",
    "tune-xxl-radius",
    "tune-xl-count",
    "tune-xxl-count",
    "tune-gem-ttl",
    "tune-gem-blink",
    "tune-star-density",
    "tune-parallax",
    "tune-star-accent-chance",
    "tune-twinkle-chance",
    "tune-twinkle-strength",
    "tune-twinkle-speed",
    "tune-tech-ping-cooldown"
  ]);
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
    const tuneGravitySoft = documentRef.getElementById("tune-gravity-soft");
    const tuneGravitySoftOut = documentRef.getElementById("tune-gravity-soft-out");
    const tuneGravitySoftSave = documentRef.getElementById("tune-gravity-soft-save");
    const tuneGravitySoftDefault = documentRef.getElementById("tune-gravity-soft-default");
    const tuneInnerDrag = documentRef.getElementById("tune-inner-drag");
    const tuneInnerDragOut = documentRef.getElementById("tune-inner-drag-out");
    const tuneInnerDragSave = documentRef.getElementById("tune-inner-drag-save");
    const tuneInnerDragDefault = documentRef.getElementById("tune-inner-drag-default");
    const tuneRingK = documentRef.getElementById("tune-ring-k");
    const tuneRingKOut = documentRef.getElementById("tune-ring-k-out");
    const tuneRingKSave = documentRef.getElementById("tune-ring-k-save");
    const tuneRingKDefault = documentRef.getElementById("tune-ring-k-default");
    const tuneRingDamp = documentRef.getElementById("tune-ring-damp");
    const tuneRingDampOut = documentRef.getElementById("tune-ring-damp-out");
    const tuneRingDampSave = documentRef.getElementById("tune-ring-damp-save");
    const tuneRingDampDefault = documentRef.getElementById("tune-ring-damp-default");
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
    const tuneExhaustIntensity = documentRef.getElementById("tune-exhaust-intensity");
    const tuneExhaustIntensityOut = documentRef.getElementById("tune-exhaust-intensity-out");
    const tuneExhaustIntensitySave = documentRef.getElementById("tune-exhaust-intensity-save");
    const tuneExhaustIntensityDefault = documentRef.getElementById("tune-exhaust-intensity-default");
    const tuneExhaustSparks = documentRef.getElementById("tune-exhaust-sparks");
    const tuneExhaustSparksOut = documentRef.getElementById("tune-exhaust-sparks-out");
    const tuneExhaustSparksSave = documentRef.getElementById("tune-exhaust-sparks-save");
    const tuneExhaustSparksDefault = documentRef.getElementById("tune-exhaust-sparks-default");
    const tuneExhaustPalette = documentRef.getElementById("tune-exhaust-palette");
    const tuneExhaustPaletteOut = documentRef.getElementById("tune-exhaust-palette-out");
    const tuneExhaustPaletteSave = documentRef.getElementById("tune-exhaust-palette-save");
    const tuneExhaustPaletteDefault = documentRef.getElementById("tune-exhaust-palette-default");
    const tuneExhaustCore = documentRef.getElementById("tune-exhaust-core");
    const tuneExhaustCoreOut = documentRef.getElementById("tune-exhaust-core-out");
    const tuneExhaustCoreSave = documentRef.getElementById("tune-exhaust-core-save");
    const tuneExhaustCoreDefault = documentRef.getElementById("tune-exhaust-core-default");
    const tuneExhaustGlow = documentRef.getElementById("tune-exhaust-glow");
    const tuneExhaustGlowOut = documentRef.getElementById("tune-exhaust-glow-out");
    const tuneExhaustGlowSave = documentRef.getElementById("tune-exhaust-glow-save");
    const tuneExhaustGlowDefault = documentRef.getElementById("tune-exhaust-glow-default");
    const tuneExhaustJets = documentRef.getElementById("tune-exhaust-jets");
    const tuneExhaustJetsOut = documentRef.getElementById("tune-exhaust-jets-out");
    const tuneExhaustJetsSave = documentRef.getElementById("tune-exhaust-jets-save");
    const tuneExhaustJetsDefault = documentRef.getElementById("tune-exhaust-jets-default");
    const touchUi = documentRef.getElementById("touch-ui");
    const touchJoystick = documentRef.getElementById("touch-joystick");
    const touchJoystickBase = documentRef.getElementById("touch-joystick-base");
    const touchJoystickKnob = documentRef.getElementById("touch-joystick-knob");
    const touchPingBtn = documentRef.getElementById("touch-ping");
    const touchBurstBtn = documentRef.getElementById("touch-burst");
    const tuneDmg = documentRef.getElementById("tune-dmg");
    const tuneDmgOut = documentRef.getElementById("tune-dmg-out");
    const tuneDmgSave = documentRef.getElementById("tune-dmg-save");
    const tuneDmgDefault = documentRef.getElementById("tune-dmg-default");
    const tuneFracture = documentRef.getElementById("tune-fracture");
    const tuneFractureOut = documentRef.getElementById("tune-fracture-out");
    const tuneFractureSave = documentRef.getElementById("tune-fracture-save");
    const tuneFractureDefault = documentRef.getElementById("tune-fracture-default");
    const tuneFractureSizeExp = documentRef.getElementById("tune-fracture-sizeexp");
    const tuneFractureSizeExpOut = documentRef.getElementById("tune-fracture-sizeexp-out");
    const tuneFractureSizeExpSave = documentRef.getElementById("tune-fracture-sizeexp-save");
    const tuneFractureSizeExpDefault = documentRef.getElementById("tune-fracture-sizeexp-default");
    const tuneFractureChip = documentRef.getElementById("tune-fracture-chip");
    const tuneFractureChipOut = documentRef.getElementById("tune-fracture-chip-out");
    const tuneFractureChipSave = documentRef.getElementById("tune-fracture-chip-save");
    const tuneFractureChipDefault = documentRef.getElementById("tune-fracture-chip-default");
    const tuneFractureDecay = documentRef.getElementById("tune-fracture-decay");
    const tuneFractureDecayOut = documentRef.getElementById("tune-fracture-decay-out");
    const tuneFractureDecaySave = documentRef.getElementById("tune-fracture-decay-save");
    const tuneFractureDecayDefault = documentRef.getElementById("tune-fracture-decay-default");
    const tuneFractureMinSpeed = documentRef.getElementById("tune-fracture-minspeed");
    const tuneFractureMinSpeedOut = documentRef.getElementById("tune-fracture-minspeed-out");
    const tuneFractureMinSpeedSave = documentRef.getElementById("tune-fracture-minspeed-save");
    const tuneFractureMinSpeedDefault = documentRef.getElementById("tune-fracture-minspeed-default");
    const tuneFractureShear = documentRef.getElementById("tune-fracture-shear");
    const tuneFractureShearOut = documentRef.getElementById("tune-fracture-shear-out");
    const tuneFractureShearSave = documentRef.getElementById("tune-fracture-shear-save");
    const tuneFractureShearDefault = documentRef.getElementById("tune-fracture-shear-default");
    const tuneFractureShearRef = documentRef.getElementById("tune-fracture-shearref");
    const tuneFractureShearRefOut = documentRef.getElementById("tune-fracture-shearref-out");
    const tuneFractureShearRefSave = documentRef.getElementById("tune-fracture-shearref-save");
    const tuneFractureShearRefDefault = documentRef.getElementById("tune-fracture-shearref-default");
    const tuneWorldDensity = documentRef.getElementById("tune-world-density");
    const tuneWorldDensityOut = documentRef.getElementById("tune-world-density-out");
    const tuneWorldDensitySave = documentRef.getElementById("tune-world-density-save");
    const tuneWorldDensityDefault = documentRef.getElementById("tune-world-density-default");
    const tuneSpawnRate = documentRef.getElementById("tune-spawn-rate");
    const tuneSpawnRateOut = documentRef.getElementById("tune-spawn-rate-out");
    const tuneSpawnRateSave = documentRef.getElementById("tune-spawn-rate-save");
    const tuneSpawnRateDefault = documentRef.getElementById("tune-spawn-rate-default");
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
    const tuneTechPingCooldown = documentRef.getElementById("tune-tech-ping-cooldown");
    const tuneTechPingCooldownOut = documentRef.getElementById("tune-tech-ping-cooldown-out");
    const tuneTechPingCooldownSave = documentRef.getElementById("tune-tech-ping-cooldown-save");
    const tuneTechPingCooldownDefault = documentRef.getElementById("tune-tech-ping-cooldown-default");
    const nf = new Intl.NumberFormat();
    const touch = {
      active: false,
      pointerId: null,
      centerX: 0,
      centerY: 0,
      maxR: 60,
      desiredAngle: 0,
      thrust: 0
    };
    function setJoystickKnob(dx, dy, dragging) {
      if (!touchJoystick || !touchJoystickKnob)
        return;
      if (dragging)
        touchJoystick.classList.add("dragging");
      else
        touchJoystick.classList.remove("dragging");
      touchJoystickKnob.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
    }
    function resetTouchControls() {
      touch.active = false;
      touch.pointerId = null;
      touch.thrust = 0;
      if (game?.state?.input) {
        game.state.input.thrustAnalog = 0;
        game.state.input.turnAnalog = 0;
      }
      setJoystickKnob(0, 0, false);
    }
    function updateJoystickFromPointer(clientX, clientY) {
      const dx = clientX - touch.centerX;
      const dy = clientY - touch.centerY;
      const dist = Math.hypot(dx, dy);
      const r = touch.maxR;
      const clamped = dist > r && dist > 1e-6 ? r / dist : 1;
      const jx = dx * clamped;
      const jy = dy * clamped;
      const deadZone = r * 0.12;
      const mag = clamp((dist - deadZone) / Math.max(1, r - deadZone), 0, 1);
      touch.thrust = mag;
      touch.desiredAngle = Math.atan2(jy, jx);
      setJoystickKnob(jx, jy, true);
    }
    function applyTouchControls() {
      if (!game?.state?.input)
        return;
      if (!touch.active) {
        game.state.input.thrustAnalog = 0;
        game.state.input.turnAnalog = 0;
        return;
      }
      const shipA = Number(game.state.ship?.angle) || 0;
      const diff = wrapAngle(touch.desiredAngle - shipA);
      const k = 0.95;
      const dead = 0.04;
      const turn = Math.abs(diff) < dead ? 0 : clamp(diff * k, -1, 1);
      game.state.input.turnAnalog = turn;
      game.state.input.thrustAnalog = clamp(touch.thrust, 0, 1);
    }
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
        key: "gravitySoftening",
        input: tuneGravitySoft,
        saveBtn: tuneGravitySoftSave,
        savedOut: tuneGravitySoftDefault,
        suffix: " px"
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
        key: "innerDrag",
        input: tuneInnerDrag,
        saveBtn: tuneInnerDragSave,
        savedOut: tuneInnerDragDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}`
      },
      {
        key: "ringK",
        input: tuneRingK,
        saveBtn: tuneRingKSave,
        savedOut: tuneRingKDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}`
      },
      {
        key: "ringRadialDamp",
        input: tuneRingDamp,
        saveBtn: tuneRingDampSave,
        savedOut: tuneRingDampDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}`
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
        key: "exhaustIntensity",
        input: tuneExhaustIntensity,
        saveBtn: tuneExhaustIntensitySave,
        savedOut: tuneExhaustIntensityDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}x`
      },
      {
        key: "exhaustSparkScale",
        input: tuneExhaustSparks,
        saveBtn: tuneExhaustSparksSave,
        savedOut: tuneExhaustSparksDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}x`
      },
      {
        key: "exhaustPalette",
        input: tuneExhaustPalette,
        saveBtn: tuneExhaustPaletteSave,
        savedOut: tuneExhaustPaletteDefault,
        suffix: "",
        format: (v) => {
          const i = Math.round(Number(v) || 0);
          if (i === 1)
            return "Ion (blue)";
          if (i === 2)
            return "Plasma (purple)";
          if (i === 3)
            return "Toxic (green)";
          if (i === 4)
            return "Ember (red)";
          return "Rocket (warm)";
        }
      },
      {
        key: "exhaustCoreScale",
        input: tuneExhaustCore,
        saveBtn: tuneExhaustCoreSave,
        savedOut: tuneExhaustCoreDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}x`
      },
      {
        key: "exhaustGlowScale",
        input: tuneExhaustGlow,
        saveBtn: tuneExhaustGlowSave,
        savedOut: tuneExhaustGlowDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}x`
      },
      {
        key: "exhaustLegacyJets",
        input: tuneExhaustJets,
        saveBtn: tuneExhaustJetsSave,
        savedOut: tuneExhaustJetsDefault,
        suffix: "",
        format: (v) => Number(v) >= 0.5 ? "On" : "Off"
      },
      {
        key: "projectileImpactScale",
        input: tuneDmg,
        saveBtn: tuneDmgSave,
        savedOut: tuneDmgDefault,
        suffix: "x",
        format: (v) => `${Number(v).toFixed(2)}x`
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
        key: "fractureSizeStrengthExp",
        input: tuneFractureSizeExp,
        saveBtn: tuneFractureSizeExpSave,
        savedOut: tuneFractureSizeExpDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}`
      },
      {
        key: "fractureChipScale",
        input: tuneFractureChip,
        saveBtn: tuneFractureChipSave,
        savedOut: tuneFractureChipDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}x`
      },
      {
        key: "fractureChipDecaySec",
        input: tuneFractureDecay,
        saveBtn: tuneFractureDecaySave,
        savedOut: tuneFractureDecayDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)} s`
      },
      {
        key: "fractureChipMinSpeed",
        input: tuneFractureMinSpeed,
        saveBtn: tuneFractureMinSpeedSave,
        savedOut: tuneFractureMinSpeedDefault,
        suffix: " px/s"
      },
      {
        key: "fractureShearWeightLaunched",
        input: tuneFractureShear,
        saveBtn: tuneFractureShearSave,
        savedOut: tuneFractureShearDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)}x`
      },
      {
        key: "fractureShearNormalRefSpeed",
        input: tuneFractureShearRef,
        saveBtn: tuneFractureShearRefSave,
        savedOut: tuneFractureShearRefDefault,
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
        key: "asteroidSpawnRateScale",
        input: tuneSpawnRate,
        saveBtn: tuneSpawnRateSave,
        savedOut: tuneSpawnRateDefault,
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
      },
      {
        key: "techPingCooldownSec",
        input: tuneTechPingCooldown,
        saveBtn: tuneTechPingCooldownSave,
        savedOut: tuneTechPingCooldownDefault,
        suffix: "",
        format: (v) => `${Number(v).toFixed(2)} s`
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
      p.gravitySoftening = clamp(Number(p.gravitySoftening ?? 70), 10, 220);
      p.innerGravityMult = clamp(Number(p.innerGravityMult ?? 1.5), 1, 8);
      p.innerDrag = clamp(Number(p.innerDrag ?? 4), 0, 20);
      p.ringK = clamp(Number(p.ringK ?? 6.5), 0, 30);
      p.ringRadialDamp = clamp(Number(p.ringRadialDamp ?? 6.5), 0, 40);
      p.exhaustIntensity = clamp(Number(p.exhaustIntensity ?? 1), 0, 2.5);
      p.exhaustSparkScale = clamp(Number(p.exhaustSparkScale ?? 1), 0, 3);
      p.exhaustPalette = clamp(Math.round(Number(p.exhaustPalette ?? 0)), 0, 4);
      p.exhaustCoreScale = clamp(Number(p.exhaustCoreScale ?? 1), 0, 2.5);
      p.exhaustGlowScale = clamp(Number(p.exhaustGlowScale ?? 1), 0, 2.5);
      p.exhaustLegacyJets = clamp(Math.round(Number(p.exhaustLegacyJets ?? 0)), 0, 1);
      p.projectileImpactScale = clamp(Number(p.projectileImpactScale ?? 1), 0.2, 4);
      p.fractureImpactSpeed = clamp(Number(p.fractureImpactSpeed ?? 275), 150, 700);
      p.fractureSizeStrengthExp = clamp(Number(p.fractureSizeStrengthExp ?? -0.8), -1.5, 0.6);
      p.fractureChipScale = clamp(Number(p.fractureChipScale ?? 1), 0, 3);
      p.fractureChipDecaySec = clamp(Number(p.fractureChipDecaySec ?? 3), 0, 12);
      p.fractureChipMinSpeed = clamp(Number(p.fractureChipMinSpeed ?? 140), 0, 520);
      p.fractureShearWeightLaunched = clamp(Number(p.fractureShearWeightLaunched ?? 0.85), 0, 1.6);
      p.fractureShearNormalRefSpeed = clamp(Number(p.fractureShearNormalRefSpeed ?? 120), 20, 320);
      p.asteroidSpawnRateScale = clamp(Number(p.asteroidSpawnRateScale ?? 1), 0.25, 3);
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
      p.techPingCooldownSec = clamp(Number(p.techPingCooldownSec ?? 3), 0, 60);
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
      if (tuneGravitySoft)
        tuneGravitySoft.value = String(Math.round(p.gravitySoftening));
      if (tuneInnerDrag)
        tuneInnerDrag.value = String(p.innerDrag);
      if (tuneRingK)
        tuneRingK.value = String(p.ringK);
      if (tuneRingDamp)
        tuneRingDamp.value = String(p.ringRadialDamp);
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
      if (tuneExhaustIntensity)
        tuneExhaustIntensity.value = String(p.exhaustIntensity ?? 1);
      if (tuneExhaustSparks)
        tuneExhaustSparks.value = String(p.exhaustSparkScale ?? 1);
      if (tuneExhaustPalette)
        tuneExhaustPalette.value = String(Math.round(p.exhaustPalette ?? 0));
      if (tuneExhaustCore)
        tuneExhaustCore.value = String(p.exhaustCoreScale ?? 1);
      if (tuneExhaustGlow)
        tuneExhaustGlow.value = String(p.exhaustGlowScale ?? 1);
      if (tuneExhaustJets)
        tuneExhaustJets.value = String(Math.round(p.exhaustLegacyJets ?? 0));
      if (tuneDmg)
        tuneDmg.value = String(p.projectileImpactScale ?? 1);
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
      if (tuneFractureSizeExp)
        tuneFractureSizeExp.value = String(p.fractureSizeStrengthExp ?? 0);
      if (tuneFractureChip)
        tuneFractureChip.value = String(p.fractureChipScale ?? 0);
      if (tuneFractureDecay)
        tuneFractureDecay.value = String(p.fractureChipDecaySec ?? 0);
      if (tuneFractureMinSpeed)
        tuneFractureMinSpeed.value = String(Math.round(p.fractureChipMinSpeed ?? 0));
      if (tuneFractureShear)
        tuneFractureShear.value = String(p.fractureShearWeightLaunched ?? 0);
      if (tuneFractureShearRef)
        tuneFractureShearRef.value = String(Math.round(p.fractureShearNormalRefSpeed ?? 120));
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
      if (tuneSpawnRate)
        tuneSpawnRate.value = String(p.asteroidSpawnRateScale);
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
      if (tuneTechPingCooldown)
        tuneTechPingCooldown.value = String(p.techPingCooldownSec ?? 3);
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
      setOut(tuneGravitySoftOut, readNum(tuneGravitySoft, p.gravitySoftening), " px");
      if (tuneInnerDragOut)
        tuneInnerDragOut.textContent = `${readNum(tuneInnerDrag, p.innerDrag).toFixed(2)}`;
      if (tuneRingKOut)
        tuneRingKOut.textContent = `${readNum(tuneRingK, p.ringK).toFixed(2)}`;
      if (tuneRingDampOut)
        tuneRingDampOut.textContent = `${readNum(tuneRingDamp, p.ringRadialDamp).toFixed(2)}`;
      if (tuneGemTtlOut)
        tuneGemTtlOut.textContent = `${readNum(tuneGemTtl, p.gemTtlSec).toFixed(1)} s`;
      if (tuneGemBlinkOut)
        tuneGemBlinkOut.textContent = `${readNum(tuneGemBlink, p.gemBlinkMaxHz).toFixed(1)} /s`;
      setOut(tuneCaptureOut, readNum(tuneCapture, p.captureSpeed), " px/s");
      setOut(tuneBurstOut, readNum(tuneBurst, p.burstSpeed), " px/s");
      setOut(tuneThrustOut, readNum(tuneThrust, p.shipThrust), " px/s^2");
      if (tuneExhaustIntensityOut)
        tuneExhaustIntensityOut.textContent = `${readNum(tuneExhaustIntensity, p.exhaustIntensity).toFixed(2)}x`;
      if (tuneExhaustSparksOut)
        tuneExhaustSparksOut.textContent = `${readNum(tuneExhaustSparks, p.exhaustSparkScale).toFixed(2)}x`;
      if (tuneExhaustPaletteOut) {
        const i = Math.round(readNum(tuneExhaustPalette, p.exhaustPalette));
        tuneExhaustPaletteOut.textContent = i === 1 ? "Ion (blue)" : i === 2 ? "Plasma (purple)" : i === 3 ? "Toxic (green)" : i === 4 ? "Ember (red)" : "Rocket (warm)";
      }
      if (tuneExhaustCoreOut)
        tuneExhaustCoreOut.textContent = `${readNum(tuneExhaustCore, p.exhaustCoreScale).toFixed(2)}x`;
      if (tuneExhaustGlowOut)
        tuneExhaustGlowOut.textContent = `${readNum(tuneExhaustGlow, p.exhaustGlowScale).toFixed(2)}x`;
      if (tuneExhaustJetsOut)
        tuneExhaustJetsOut.textContent = readNum(tuneExhaustJets, p.exhaustLegacyJets) >= 0.5 ? "On" : "Off";
      if (tuneDmgOut) {
        const val = readNum(tuneDmg, p.projectileImpactScale);
        tuneDmgOut.textContent = `${Number(val).toFixed(2)}x`;
      }
      setOut(tuneXlRadiusOut, readNum(tuneXlRadius, p.xlargeRadius), " px");
      setOut(tuneXxlRadiusOut, readNum(tuneXxlRadius, p.xxlargeRadius), " px");
      setOut(tuneXlCountOut, readNum(tuneXlCount, p.xlargeCount));
      setOut(tuneXxlCountOut, readNum(tuneXxlCount, p.xxlargeCount));
      setOut(tuneFractureOut, readNum(tuneFracture, p.fractureImpactSpeed), " px/s");
      if (tuneFractureSizeExpOut) {
        tuneFractureSizeExpOut.textContent = `${readNum(tuneFractureSizeExp, p.fractureSizeStrengthExp ?? 0).toFixed(2)}`;
      }
      if (tuneFractureChipOut) {
        tuneFractureChipOut.textContent = `${readNum(tuneFractureChip, p.fractureChipScale ?? 0).toFixed(2)}x`;
      }
      if (tuneFractureDecayOut) {
        tuneFractureDecayOut.textContent = `${readNum(tuneFractureDecay, p.fractureChipDecaySec ?? 0).toFixed(2)} s`;
      }
      setOut(tuneFractureMinSpeedOut, readNum(tuneFractureMinSpeed, p.fractureChipMinSpeed ?? 0), " px/s");
      if (tuneFractureShearOut) {
        tuneFractureShearOut.textContent = `${readNum(tuneFractureShear, p.fractureShearWeightLaunched ?? 0).toFixed(2)}x`;
      }
      setOut(tuneFractureShearRefOut, readNum(tuneFractureShearRef, p.fractureShearNormalRefSpeed ?? 120), " px/s");
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
      if (tuneSpawnRateOut) {
        tuneSpawnRateOut.textContent = `${readNum(tuneSpawnRate, p.asteroidSpawnRateScale).toFixed(2)}x`;
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
      if (tuneTechPingCooldownOut) {
        tuneTechPingCooldownOut.textContent = `${readNum(tuneTechPingCooldown, p.techPingCooldownSec ?? 3).toFixed(2)} s`;
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
      p.gravitySoftening = clamp(Math.round(readNum(tuneGravitySoft, p.gravitySoftening)), 10, 220);
      p.innerGravityMult = clamp(readNum(tuneInnerGrav, p.innerGravityMult), 1, 8);
      p.innerDrag = clamp(readNum(tuneInnerDrag, p.innerDrag), 0, 20);
      p.ringK = clamp(readNum(tuneRingK, p.ringK), 0, 30);
      p.ringRadialDamp = clamp(readNum(tuneRingDamp, p.ringRadialDamp), 0, 40);
      p.gemTtlSec = clamp(readNum(tuneGemTtl, p.gemTtlSec), 0.5, 60);
      p.gemBlinkMaxHz = clamp(readNum(tuneGemBlink, p.gemBlinkMaxHz), 0.25, 12);
      p.captureSpeed = readNum(tuneCapture, p.captureSpeed);
      p.burstSpeed = readNum(tuneBurst, p.burstSpeed);
      p.shipThrust = readNum(tuneThrust, p.shipThrust);
      p.exhaustIntensity = clamp(readNum(tuneExhaustIntensity, p.exhaustIntensity), 0, 2.5);
      p.exhaustSparkScale = clamp(readNum(tuneExhaustSparks, p.exhaustSparkScale), 0, 3);
      p.exhaustPalette = clamp(Math.round(readNum(tuneExhaustPalette, p.exhaustPalette)), 0, 4);
      p.exhaustCoreScale = clamp(readNum(tuneExhaustCore, p.exhaustCoreScale), 0, 2.5);
      p.exhaustGlowScale = clamp(readNum(tuneExhaustGlow, p.exhaustGlowScale), 0, 2.5);
      p.exhaustLegacyJets = clamp(Math.round(readNum(tuneExhaustJets, p.exhaustLegacyJets)), 0, 1);
      p.projectileImpactScale = clamp(readNum(tuneDmg, p.projectileImpactScale), 0.2, 4);
      p.xlargeRadius = clamp(readNum(tuneXlRadius, p.xlargeRadius), p.largeRadius + 6, 220);
      p.xxlargeRadius = clamp(readNum(tuneXxlRadius, p.xxlargeRadius), p.xlargeRadius + 6, 320);
      p.xlargeCount = clamp(Math.round(readNum(tuneXlCount, p.xlargeCount)), 0, 50);
      p.xxlargeCount = clamp(Math.round(readNum(tuneXxlCount, p.xxlargeCount)), 0, 50);
      p.fractureImpactSpeed = clamp(readNum(tuneFracture, p.fractureImpactSpeed), 150, 700);
      p.fractureSizeStrengthExp = clamp(readNum(tuneFractureSizeExp, p.fractureSizeStrengthExp ?? -0.8), -1.5, 0.6);
      p.fractureChipScale = clamp(readNum(tuneFractureChip, p.fractureChipScale ?? 1), 0, 3);
      p.fractureChipDecaySec = clamp(readNum(tuneFractureDecay, p.fractureChipDecaySec ?? 3), 0, 12);
      p.fractureChipMinSpeed = clamp(Math.round(readNum(tuneFractureMinSpeed, p.fractureChipMinSpeed ?? 140)), 0, 520);
      p.fractureShearWeightLaunched = clamp(readNum(tuneFractureShear, p.fractureShearWeightLaunched ?? 0.85), 0, 1.6);
      p.fractureShearNormalRefSpeed = clamp(
        Math.round(readNum(tuneFractureShearRef, p.fractureShearNormalRefSpeed ?? 120)),
        20,
        320
      );
      p.tier2UnlockGemScore = clamp(Math.round(readNum(tuneTier2Unlock, p.tier2UnlockGemScore)), 1, 1e4);
      p.tier3UnlockGemScore = clamp(Math.round(readNum(tuneTier3Unlock, p.tier3UnlockGemScore)), 1, 1e4);
      if (p.tier3UnlockGemScore <= p.tier2UnlockGemScore)
        p.tier3UnlockGemScore = p.tier2UnlockGemScore + 50;
      p.tier1Zoom = clamp(readNum(tuneTier1Zoom, p.tier1Zoom), 0.35, 1.2);
      p.tier2Zoom = clamp(readNum(tuneTier2Zoom, p.tier2Zoom), 0.35, 1.2);
      p.tier3Zoom = clamp(readNum(tuneTier3Zoom, p.tier3Zoom), 0.35, 1.2);
      p.tierZoomTweenSec = clamp(readNum(tuneTierZoomSec, p.tierZoomTweenSec), 0.05, 1.2);
      p.asteroidWorldDensityScale = clamp(readNum(tuneWorldDensity, p.asteroidWorldDensityScale), 0.08, 2.5);
      p.asteroidSpawnRateScale = clamp(readNum(tuneSpawnRate, p.asteroidSpawnRateScale), 0.25, 3);
      p.starDensityScale = clamp(readNum(tuneStarDensity, p.starDensityScale), 0.4, 2.2);
      p.starParallaxStrength = clamp(readNum(tuneParallax, p.starParallaxStrength), 0, 1.8);
      p.starAccentChance = clamp(readNum(tuneStarAccentChance, p.starAccentChance), 0, 0.35);
      p.starTwinkleChance = clamp(readNum(tuneTwinkleChance, p.starTwinkleChance), 0, 1);
      p.starTwinkleStrength = clamp(readNum(tuneTwinkleStrength, p.starTwinkleStrength), 0, 0.8);
      p.starTwinkleSpeed = clamp(readNum(tuneTwinkleSpeed, p.starTwinkleSpeed), 0.2, 3);
      p.techPingCooldownSec = clamp(readNum(tuneTechPingCooldown, p.techPingCooldownSec ?? 3), 0, 60);
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
      if (touchPingBtn) {
        const cooldownSec = Math.max(0, Number(game.state.round?.techPingCooldownSec) || 0);
        const coolingDown = cooldownSec > 0.02;
        touchPingBtn.classList.toggle("cooldown", coolingDown);
        touchPingBtn.setAttribute("aria-disabled", coolingDown ? "true" : "false");
        touchPingBtn.textContent = coolingDown ? `SONAR ${cooldownSec.toFixed(1)}s` : "SONAR";
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
      i.ping = false;
    }
    function syncMenuButtons() {
      const playing = game.state.mode === "playing";
      if (startBtn)
        startBtn.textContent = playing ? "Apply + Resume" : game.state.mode === "gameover" ? "Restart" : "Start";
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
    for (const f of TUNING_FIELDS)
      bindTuneInput(f.input);
    if (startBtn)
      startBtn.addEventListener("click", () => startOrResume());
    if (debugToggleBtn)
      debugToggleBtn.addEventListener("click", () => toggleDebugMenu());
    const DEBUG_MENU_BINDINGS = [
      { el: dbgCameraMode, event: "change", handler: () => applyArenaFromMenu() },
      { el: dbgWorldScale, event: "input", handler: () => applyArenaFromMenu() },
      { el: dbgPauseOnOpen, event: "change", handler: () => applyDebugFlagsFromMenu() },
      {
        el: dbgTierOverride,
        event: "change",
        handler: () => {
          applyDebugFlagsFromMenu();
          game.refreshProgression({ animateZoom: false });
        }
      },
      {
        el: dbgTierOverrideLevel,
        event: "input",
        handler: () => {
          applyDebugFlagsFromMenu();
          game.refreshProgression({ animateZoom: false });
        }
      },
      {
        el: dbgGemScore,
        event: "input",
        handler: () => {
          game.state.score = clamp(Math.round(readNum(dbgGemScore, game.state.score)), 0, 5e3);
          game.refreshProgression({ animateZoom: true });
          syncRuntimeDebugUi();
        }
      },
      { el: dbgAttract, event: "change", handler: () => applyDebugFlagsFromMenu() },
      { el: shipExplode, event: "change", handler: () => applyDebugFlagsFromMenu() }
    ];
    for (const b of DEBUG_MENU_BINDINGS) {
      if (!b.el)
        continue;
      b.el.addEventListener(b.event, b.handler);
    }
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
    if (touchUi) {
      touchUi.setAttribute("aria-hidden", "true");
    }
    if (touchJoystickBase) {
      const updateCenterFromLayout = () => {
        const rect = touchJoystickBase.getBoundingClientRect();
        touch.centerX = rect.left + rect.width / 2;
        touch.centerY = rect.top + rect.height / 2;
        touch.maxR = Math.max(24, Math.min(90, rect.width * 0.35));
      };
      updateCenterFromLayout();
      windowRef.addEventListener("resize", () => updateCenterFromLayout());
      touchJoystickBase.addEventListener("pointerdown", (e) => {
        if (typeof e?.preventDefault === "function")
          e.preventDefault();
        if (touch.pointerId !== null)
          return;
        updateCenterFromLayout();
        touch.active = true;
        touch.pointerId = e.pointerId;
        try {
          touchJoystickBase.setPointerCapture?.(e.pointerId);
        } catch {
        }
        updateJoystickFromPointer(e.clientX, e.clientY);
      });
      touchJoystickBase.addEventListener("pointermove", (e) => {
        if (!touch.active || touch.pointerId !== e.pointerId)
          return;
        if (typeof e?.preventDefault === "function")
          e.preventDefault();
        updateJoystickFromPointer(e.clientX, e.clientY);
      });
      const end = (e) => {
        if (!touch.active || touch.pointerId !== e.pointerId)
          return;
        if (typeof e?.preventDefault === "function")
          e.preventDefault();
        try {
          touchJoystickBase.releasePointerCapture?.(e.pointerId);
        } catch {
        }
        resetTouchControls();
      };
      touchJoystickBase.addEventListener("pointerup", end);
      touchJoystickBase.addEventListener("pointercancel", end);
      touchJoystickBase.addEventListener("lostpointercapture", () => resetTouchControls());
    }
    if (touchBurstBtn) {
      const press = (e) => {
        if (typeof e?.preventDefault === "function")
          e.preventDefault();
        if (game.state.mode !== "playing")
          return;
        game.state.input.burst = true;
        touchBurstBtn.classList.add("pressed");
        try {
          touchBurstBtn.setPointerCapture?.(e.pointerId);
        } catch {
        }
      };
      const release = (e) => {
        if (typeof e?.preventDefault === "function")
          e.preventDefault();
        touchBurstBtn.classList.remove("pressed");
        try {
          touchBurstBtn.releasePointerCapture?.(e.pointerId);
        } catch {
        }
      };
      touchBurstBtn.addEventListener("pointerdown", press);
      touchBurstBtn.addEventListener("pointerup", release);
      touchBurstBtn.addEventListener("pointercancel", release);
      touchBurstBtn.addEventListener("lostpointercapture", () => touchBurstBtn.classList.remove("pressed"));
    }
    if (touchPingBtn) {
      const press = (e) => {
        if (typeof e?.preventDefault === "function")
          e.preventDefault();
        if (game.state.mode !== "playing")
          return;
        const cooldownSec = Math.max(0, Number(game.state.round?.techPingCooldownSec) || 0);
        if (cooldownSec > 0.02)
          return;
        game.state.input.ping = true;
        touchPingBtn.classList.add("pressed");
        try {
          touchPingBtn.setPointerCapture?.(e.pointerId);
        } catch {
        }
        syncRuntimeDebugUi();
      };
      const release = (e) => {
        if (typeof e?.preventDefault === "function")
          e.preventDefault();
        touchPingBtn.classList.remove("pressed");
        try {
          touchPingBtn.releasePointerCapture?.(e.pointerId);
        } catch {
        }
      };
      touchPingBtn.addEventListener("pointerdown", press);
      touchPingBtn.addEventListener("pointerup", release);
      touchPingBtn.addEventListener("pointercancel", release);
      touchPingBtn.addEventListener("lostpointercapture", () => touchPingBtn.classList.remove("pressed"));
    }
    return {
      applyAllFromMenu,
      isMenuVisible,
      setMenuVisible,
      startOrResume,
      toggleDebugMenu,
      syncRuntimeDebugUi,
      updateHudScore,
      applyTouchControls
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
    function applyAndroidZoomCompensation() {
      const userAgent = String(window.navigator?.userAgent || "");
      const isAndroid = /Android/i.test(userAgent);
      const isCoarse = window.matchMedia?.("(pointer: coarse)")?.matches === true;
      const shortest = Math.min(window.innerWidth || 0, window.innerHeight || 0);
      let scale = 1;
      if (isAndroid && isCoarse) {
        if (shortest <= 420)
          scale = 0.72;
        else if (shortest <= 520)
          scale = 0.78;
        else
          scale = 0.84;
      }
      game.state.params.deviceCameraZoomScale = scale;
      game.refreshProgression({ animateZoom: false });
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
    window.addEventListener("resize", () => applyAndroidZoomCompensation());
    window.addEventListener("orientationchange", () => applyAndroidZoomCompensation());
    resizeCanvasToCss();
    applyAndroidZoomCompensation();
    const input = game.state.input;
    function restartGame() {
      ui.applyAllFromMenu();
      game.resetWorld();
      game.state.mode = "playing";
      ui.setMenuVisible(false);
    }
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
        case "KeyQ":
          if (isDown && !menuOpen)
            input.ping = true;
          e.preventDefault();
          break;
        case "KeyR":
          if (isDown) {
            restartGame();
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
      if (e.button !== 0)
        return;
      if (game.state.mode === "playing") {
        if (!ui.isMenuVisible())
          input.burst = true;
        return;
      }
      if (game.state.mode === "gameover") {
        if (!ui.isMenuVisible())
          restartGame();
      }
    });
    let externalStepping = false;
    let last = performance.now();
    let accumulator = 0;
    const fixedDt = 1 / 60;
    function stepRealTime(ts) {
      const dtMs = Math.min(50, ts - last);
      last = ts;
      accumulator += dtMs / 1e3;
      ui.applyTouchControls?.();
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
    function setShipSvgRenderer(tierKey, svgPathData, svgScale = 1, hullRadius = null) {
      game.setShipSvgRenderer(tierKey, svgPathData, svgScale, hullRadius);
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
      advanceTime,
      // Debug helpers for visual iteration (intentionally undocumented).
      getGame: () => game,
      debugSpawnBurstWavelets: ({ count = 6, speed = 520, ttl = 0.55 * 1.1 } = {}) => {
        const n = Math.max(1, Math.min(32, Math.floor(count)));
        const fieldR = game.getCurrentForceFieldRadius();
        const ship = game.state.ship;
        for (let i = 0; i < n; i++) {
          const angle = i / n * Math.PI * 2 + game.state.time % 1 * 0.4;
          const x = ship.pos.x + Math.cos(angle) * fieldR;
          const y = ship.pos.y + Math.sin(angle) * fieldR;
          game.state.effects.push({
            kind: "wavelets",
            x,
            y,
            angle,
            speed,
            t: 0,
            ttl,
            rgb: [255, 221, 88],
            seed: Math.floor(Math.random() * 1e9)
          });
        }
      }
    };
    window.render_game_to_text = () => window.Blasteroids.renderGameToText();
    window.set_ship_svg_renderer = (tierKey, svgPathData, svgScale = 1) => window.Blasteroids.setShipSvgRenderer(tierKey, svgPathData, svgScale);
    window.advanceTime = (ms) => window.Blasteroids.advanceTime(ms);
  })();
})();
