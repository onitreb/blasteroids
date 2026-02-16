(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target2) => (target2 = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target2, "default", { value: mod, enumerable: true }) : target2,
    mod
  ));
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };
  var __accessCheck = (obj, member, msg) => {
    if (!member.has(obj))
      throw TypeError("Cannot " + msg);
  };
  var __privateGet = (obj, member, getter) => {
    __accessCheck(obj, member, "read from private field");
    return getter ? getter.call(obj) : member.get(obj);
  };
  var __privateAdd = (obj, member, value) => {
    if (member.has(obj))
      throw TypeError("Cannot add the same private member more than once");
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  };
  var __privateSet = (obj, member, value, setter) => {
    __accessCheck(obj, member, "write to private field");
    setter ? setter.call(obj, value) : member.set(obj, value);
    return value;
  };

  // node_modules/ws/browser.js
  var require_browser = __commonJS({
    "node_modules/ws/browser.js"(exports, module) {
      "use strict";
      module.exports = function() {
        throw new Error(
          "ws does not work in the browser. Browser clients must use the native WebSocket object"
        );
      };
    }
  });

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
      paletteIdx: null,
      // MP cosmetic only (server-assigned)
      score,
      gemsCollected,
      burstCooldown,
      blastPulseT,
      progression
    };
  }
  function createEngine({ width, height, seed, role = "client", features = null } = {}) {
    const baseSeedRaw = Number.isFinite(Number(seed)) ? Number(seed) : 3737844653;
    const baseSeed = baseSeedRaw >>> 0 || 3737844653;
    const engineRole = role === "server" ? "server" : "client";
    const isServer = engineRole === "server";
    const effFeatures = {
      roundLoop: !(features && typeof features === "object" && features.roundLoop === false),
      saucer: !(features && typeof features === "object" && features.saucer === false),
      mpSimScaling: !!(features && typeof features === "object" && features.mpSimScaling === true)
    };
    let sessionSeed = baseSeed;
    let rng = seededRng(baseSeed);
    const starRng = seededRng(1369960461);
    let fxRng = seededRng(deriveSeed(baseSeed, "fx"));
    let exhaustRng = seededRng(518504175);
    const exhaustPool = [];
    const state = {
      role: engineRole,
      features: effFeatures,
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
      // Server-only multiplayer helpers (not synced to clients).
      _mpSim: {
        viewRects: null
        // Array<{ cx, cy, halfW, halfH, margin }>
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
      if (!state.features?.roundLoop) {
        state.round.durationSec = roundDurationSec();
        state.round.elapsedSec = 0;
        state.round.outcome = null;
        state.round.carriedPartId = null;
        state.round.techPing = null;
        state.round.techPingCooldownSec = 0;
        state.round.starExposureSec = 0;
        state.round.escape = null;
        state.round.star = null;
        state.round.gate = null;
        state.round.techParts = [];
        return;
      }
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
      const target2 = clamp(scaledTarget, Math.min(seed2, max), max);
      const min = clamp(Math.floor(target2 * 0.8), 8, target2);
      return { min, target: target2, max };
    }
    function scheduleNextAsteroidSpawn(urgent = false) {
      const lo = urgent ? state.params.asteroidSpawnUrgentMinSec : state.params.asteroidSpawnMinSec;
      const hi = urgent ? state.params.asteroidSpawnUrgentMaxSec : state.params.asteroidSpawnMaxSec;
      const rateScale = clamp(Number(state.params.asteroidSpawnRateScale ?? 1), 0.25, 3);
      const effLo = Math.max(0.01, lo / rateScale);
      const effHi = Math.max(effLo, hi / rateScale);
      state.asteroidSpawnT = lerp(effLo, effHi, rng());
    }
    function isInsideViewRect(pos, radius, view2, margin = 0) {
      const halfW = view2.halfW + radius + margin;
      const halfH = view2.halfH + radius + margin;
      return Math.abs(pos.x - view2.x) <= halfW && Math.abs(pos.y - view2.y) <= halfH;
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
        for (const view2 of excludeViews) {
          if (isInsideViewRect(p, radius, view2, 80)) {
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
      const { min, target: target2, max } = asteroidPopulationBudget();
      const count = state.asteroids.length;
      if (count >= target2)
        return;
      if (count >= max)
        return;
      state.asteroidSpawnT -= dt;
      if (state.asteroidSpawnT > 0)
        return;
      const urgent = count < min;
      const deficit = Math.max(1, target2 - count);
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
    function fractureImpactSpeed(projectile, target2, n) {
      const { vN, vT } = impactSpeeds(projectile, target2, n);
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
    function fractureEnergyThreshold(target2) {
      const targetMass = Math.max(1, Number(target2?.mass) || 1);
      const baseSpeed = Math.max(1, Number(state.params.fractureImpactSpeed) || 0);
      const sizeBias = fractureSizeBias(target2?.size);
      const speed = baseSpeed * sizeBias;
      const refR = Math.max(1, asteroidRadiusForSize(state.params, "med"));
      const r = Math.max(1, Number(target2?.radius) || refR);
      const exp = clamp(Number(state.params.fractureSizeStrengthExp ?? 0), -2, 2);
      const sizeStrength = Math.pow(r / refR, exp);
      return 0.25 * targetMass * speed * speed * sizeStrength;
    }
    function impactEnergy(projectile, target2, impactSpeed) {
      const rel = Math.max(0, Number(impactSpeed) || 0);
      const mu = reducedMass(projectile?.mass, target2?.mass);
      const base = 0.5 * mu * rel * rel;
      const boostRaw = Number(state.params.projectileImpactScale ?? 1);
      const boost = projectile?.shipLaunched ? clamp(boostRaw, 0.2, 4) : 1;
      return base * boost;
    }
    function applyFractureChipDamage(target2, energy, threshold, impactSpeed) {
      if (!target2)
        return false;
      if ((target2.fractureCooldownT || 0) > 0)
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
      if (!Number.isFinite(target2.fractureDamage))
        target2.fractureDamage = 0;
      const denom = Math.max(1e-6, threshold);
      const next = target2.fractureDamage + energy / denom * scale;
      target2.fractureDamage = clamp(next, 0, 1);
      return target2.fractureDamage >= 1;
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
    function isPosInAnyViewRect({ x, y, radius = 0, viewRects = null, extraMargin = 0 } = {}) {
      if (!Array.isArray(viewRects) || viewRects.length === 0)
        return true;
      const r = (Number(radius) || 0) + (Number(extraMargin) || 0);
      for (let i = 0; i < viewRects.length; i++) {
        const vr = viewRects[i];
        if (!vr)
          continue;
        const margin = (Number(vr.margin) || 0) + r;
        if (Math.abs(x - vr.cx) > vr.halfW + margin)
          continue;
        if (Math.abs(y - vr.cy) > vr.halfH + margin)
          continue;
        return true;
      }
      return false;
    }
    function setMpViewRects(rects) {
      if (!isServer)
        return false;
      if (!state._mpSim)
        state._mpSim = { viewRects: null };
      if (!Array.isArray(rects) || rects.length === 0) {
        state._mpSim.viewRects = null;
        return true;
      }
      const next = [];
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (!r || typeof r !== "object")
          continue;
        const cx = Number(r.cx);
        const cy = Number(r.cy);
        const halfW = Number(r.halfW);
        const halfH = Number(r.halfH);
        const margin = Number(r.margin);
        if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(halfW) || !Number.isFinite(halfH))
          continue;
        next.push({
          cx,
          cy,
          halfW: clamp(halfW, 40, 2e5),
          halfH: clamp(halfH, 40, 2e5),
          margin: clamp(Number.isFinite(margin) ? margin : 0, 0, 2e5)
        });
      }
      state._mpSim.viewRects = next.length ? next : null;
      return true;
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
      const mpSimScaling = isServer && !!state.features?.mpSimScaling;
      const viewRects = mpSimScaling ? state._mpSim?.viewRects : null;
      const extraSimMargin = mpSimScaling ? 420 : 0;
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
        if (mpSimScaling && !isPosInAnyViewRect({ x: a.pos.x, y: a.pos.y, radius: a.radius, viewRects, extraMargin: extraSimMargin })) {
          a.pullOwnerId = null;
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
          continue;
        }
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
    function fractureAsteroid(target2, impactDir, impactSpeed) {
      if (target2.fractureCooldownT > 0)
        return null;
      if (target2.size === "med") {
        const baseR2 = Math.max(1, target2.radius || asteroidRadiusForSize(state.params, "med"));
        spawnExplosion(target2.pos, {
          kind: "pop",
          rgb: [255, 255, 255],
          r0: 10,
          r1: Math.max(26, baseR2 * 1.45),
          ttl: 0.22
        });
        const dir = len2(impactDir) > 1e-6 ? norm(impactDir) : vec(1, 0);
        const axis2 = rot(dir, Math.PI / 2);
        const sep2 = gemRadius("emerald") * 1.6;
        spawnGem(add(target2.pos, mul(axis2, sep2)), vec(0, 0), { jitterMag: 0 });
        spawnGem(add(target2.pos, mul(axis2, -sep2)), vec(0, 0), { jitterMag: 0 });
        const rankGain2 = Math.max(1, asteroidSizeRank(target2.size));
        state.score += 4 + rankGain2 * 3;
        return [];
      }
      const next = asteroidNextSize(target2.size);
      if (!next)
        return null;
      const pieces = [];
      const count = 2;
      const baseR = asteroidRadiusForSize(state.params, next);
      const sep = baseR * 1.1;
      const axis = rot(impactDir, Math.PI / 2);
      const baseVel = add(target2.vel, mul(impactDir, Math.min(150, impactSpeed * 0.35)));
      for (let i = 0; i < count; i++) {
        const side = i === 0 ? 1 : -1;
        const p = add(target2.pos, mul(axis, sep * side));
        const v = add(baseVel, mul(axis, (70 + rng() * 80) * side));
        const frag = makeAsteroid(next, p, v);
        frag.fractureCooldownT = 0.65;
        pieces.push(frag);
      }
      spawnExplosion(target2.pos, {
        kind: "pop",
        rgb: [255, 255, 255],
        r0: 10,
        r1: Math.max(26, baseR * 1.45),
        ttl: 0.22
      });
      const rankGain = Math.max(1, asteroidSizeRank(target2.size));
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
      const mpSimScaling = isServer && !!state.features?.mpSimScaling;
      const viewRects = mpSimScaling ? state._mpSim?.viewRects : null;
      const extraSimMargin = mpSimScaling ? 420 : 0;
      const asteroids = state.asteroids;
      for (let i = 0; i < asteroids.length; i++) {
        const a = asteroids[i];
        if (a.attached)
          continue;
        if (mpSimScaling && !isPosInAnyViewRect({ x: a.pos.x, y: a.pos.y, radius: a.radius, viewRects, extraMargin: extraSimMargin }))
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
      const mpSimScaling = isServer && !!state.features?.mpSimScaling;
      const viewRects = mpSimScaling ? state._mpSim?.viewRects : null;
      const extraSimMargin = mpSimScaling ? 420 : 0;
      const shipRemovals = /* @__PURE__ */ new Set();
      const shipAdds = [];
      const ids = sortedPlayerIds();
      for (let pi = 0; pi < ids.length; pi++) {
        const player = state.playersById[ids[pi]];
        const ship = player?.ship;
        if (!ship)
          continue;
        for (const a of state.asteroids) {
          if (!a || a.attached)
            continue;
          if (shipRemovals.has(a.id))
            continue;
          if (mpSimScaling && !isPosInAnyViewRect({ x: a.pos.x, y: a.pos.y, radius: a.radius, viewRects, extraMargin: extraSimMargin }))
            continue;
          const shipHit = circleCollide(ship, a);
          if (!shipHit)
            continue;
          const impactSpeedN = closingSpeedAlongNormal(ship, a, shipHit.n);
          const impactSpeedF = fractureImpactSpeed(a, ship, mul(shipHit.n, -1));
          if (a.shipLaunched) {
            if (a.size === "small") {
              breakSmallAsteroid(a, { velHint: a.vel, removeSet: shipRemovals });
            } else {
              const energy = impactEnergy(a, ship, impactSpeedF);
              const threshold = fractureEnergyThreshold(a);
              if (energy >= threshold) {
                const frags = fractureAsteroid(a, norm(a.vel), impactSpeedN);
                if (frags) {
                  if (a.techPartId)
                    dropTechPartFromAsteroid(a);
                  shipRemovals.add(a.id);
                  const room = Math.max(
                    0,
                    state.params.maxAsteroids - (state.asteroids.length + shipAdds.length - shipRemovals.size)
                  );
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
            const energy = impactEnergy(a, ship, impactSpeedF);
            const threshold = fractureEnergyThreshold(a);
            const shouldBreak = applyFractureChipDamage(a, energy, threshold, impactSpeedF);
            if (shouldBreak) {
              breakSmallAsteroid(a, { velHint: a.vel, removeSet: shipRemovals });
            } else {
              resolveElasticCollision(ship, a, shipHit.n, shipHit.penetration);
            }
            continue;
          }
          if (state.settings.shipExplodesOnImpact && state.features?.roundLoop) {
            endRound("lose", "ship_impact");
            return;
          }
          resolveElasticCollision(ship, a, shipHit.n, shipHit.penetration);
        }
      }
      if (shipRemovals.size) {
        state.asteroids = state.asteroids.filter((a) => a && !shipRemovals.has(a.id));
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
            const target2 = it.target;
            if (!projectile || !target2)
              continue;
            if (toRemove.has(projectile.id) || toRemove.has(target2.id))
              continue;
            if (projectile.size === "small") {
              breakSmallAsteroid(projectile, { velHint: projectile.vel, removeSet: toRemove });
            } else {
              projectile.shipLaunched = false;
              projectile.hitFxT = 0.18;
            }
            if (target2.size === "small") {
              breakSmallAsteroid(target2, { velHint: target2.vel, removeSet: toRemove });
              state.score += 1;
              continue;
            }
            const frags = fractureAsteroid(target2, it.impactDir, impactSpeedN);
            if (frags) {
              if (target2.techPartId)
                dropTechPartFromAsteroid(target2);
              toRemove.add(target2.id);
              const room = Math.max(0, state.params.maxAsteroids - (state.asteroids.length + toAdd.length - toRemove.size));
              toAdd.push(...frags.slice(0, room));
              continue;
            }
            spawnExplosion(target2.pos, { kind: "tiny", rgb: [255, 89, 100], r0: 4, r1: 14, ttl: 0.14 });
            const massRatio = projectile.mass > 0 && target2.mass > 0 ? projectile.mass / target2.mass : 1;
            const shoveScale = Math.min(1, Math.max(0, massRatio));
            const shove = Math.min(180, impactSpeedN * 0.5 * shoveScale);
            target2.vel = add(target2.vel, mul(it.impactDir, shove));
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
      if (state.features?.roundLoop) {
        updateRound(dt);
        if (state.mode !== "playing")
          return;
      }
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
      if (state.features?.roundLoop && state.input.ping) {
        state.input.ping = false;
        tryStartTechPing();
      }
      forEachPlayer((p) => updateShip(dt, p));
      if (state.features?.roundLoop) {
        updateShipStarExposure(dt);
        if (state.mode !== "playing")
          return;
      }
      updateExhaust(dt);
      syncCameraToShip();
      updateAsteroids(dt);
      updateGems(dt);
      if (state.features?.saucer) {
        updateSaucer(dt);
        updateSaucerLasers(dt);
        handleSaucerAsteroidCollisions();
      }
      if (state.features?.roundLoop) {
        applyRedGiantHazard();
        if (state.mode !== "playing")
          return;
      }
      handleGemShipCollisions();
      if (state.features?.saucer)
        handleSaucerLaserShipCollisions();
      handleCollisions();
      if (state.mode !== "playing")
        return;
      if (state.features?.roundLoop) {
        updateTechPing(dt);
        updateTechParts(dt);
        if (state.mode !== "playing")
          return;
      }
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
      setMpViewRects,
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
  var PLAYER_COLOR_PALETTES = [
    { key: "yellow", lightRgb: [255, 234, 138], darkRgb: [255, 196, 62] },
    { key: "pink", lightRgb: [255, 182, 216], darkRgb: [255, 96, 166] },
    { key: "blue", lightRgb: [170, 221, 255], darkRgb: [76, 156, 255] },
    { key: "green", lightRgb: [176, 255, 212], darkRgb: [72, 214, 132] }
  ];
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
  function paletteForPlayerId(id) {
    const key = String(id ?? "");
    const idx = PLAYER_COLOR_PALETTES.length ? fnv1aSeed(key) % PLAYER_COLOR_PALETTES.length : 0;
    const base = PLAYER_COLOR_PALETTES[idx] || PLAYER_COLOR_PALETTES[0];
    return {
      key: base?.key || "custom",
      lightRgb: base?.lightRgb || [255, 221, 88],
      darkRgb: base?.darkRgb || [231, 240, 255],
      ringColor: rgbToRgba(base?.lightRgb || [255, 221, 88], 0.4),
      shipStroke: rgbToRgba(base?.darkRgb || [231, 240, 255], 0.95)
    };
  }
  function paletteForPaletteIdx(idx) {
    const n = PLAYER_COLOR_PALETTES.length;
    if (n <= 0)
      return paletteForPlayerId("");
    const ii = ((idx | 0) % n + n) % n;
    const base = PLAYER_COLOR_PALETTES[ii] || PLAYER_COLOR_PALETTES[0];
    return {
      key: base?.key || "custom",
      lightRgb: base?.lightRgb || [255, 221, 88],
      darkRgb: base?.darkRgb || [231, 240, 255],
      ringColor: rgbToRgba(base?.lightRgb || [255, 221, 88], 0.4),
      shipStroke: rgbToRgba(base?.darkRgb || [231, 240, 255], 0.95)
    };
  }
  function paletteForPlayer(player, id) {
    const raw = player ? Number(player.paletteIdx) : NaN;
    if (Number.isFinite(raw) && raw >= 0)
      return paletteForPaletteIdx(raw);
    return paletteForPlayerId(id);
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
        ctx.strokeStyle = p.palette?.ringColor || tier.ringColor;
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
          const rgb = p.palette?.lightRgb || [86, 183, 255];
          ctx.strokeStyle = rgbToRgba(rgb, 0.12);
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
    function drawAsteroid(ctx, a, { tier, ship, fieldR, ringRgb = null }) {
      const ring = Array.isArray(ringRgb) ? ringRgb : tier?.ringRgb;
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
          drawElectricTether(ctx, from, to, ring, lineFx, state.time, seed + i * 1013, {
            thicknessScale: visScale.thickness,
            alphaScale: visScale.alpha,
            wobbleScale: visScale.wobble
          });
        }
        const stackScale = lineCount > 1 ? lerp(1, 0.7, Math.min(1, (lineCount - 1) / 4)) : 1;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = rgbToRgba(ring, lerp(0.05, 0.35, pullFx) * stackScale * visScale.alpha);
        ctx.lineWidth = lerp(2, 7, pullFx) * stackScale * visScale.thickness;
        ctx.shadowColor = rgbToRgba(ring, 0.9);
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
      let color = a.attached ? attachedAsteroidColorForTierRgb(ring) : base;
      if (pullFx > 0.01) {
        const baseRgb = [231, 240, 255];
        const mixed = lerpRgb(baseRgb, ring, pullFx);
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
    function drawShipModel(ctx, ship, thrusting, tierOverride = null, palette = null) {
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
      ctx.strokeStyle = palette?.shipStroke || "rgba(231,240,255,0.95)";
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
        ctx.strokeStyle = palette?.shipStroke || ctx.strokeStyle;
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
        ctx.strokeStyle = palette?.shipStroke || ctx.strokeStyle;
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
      const mpConnected = !!state._mp?.connected;
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
        const palette = mpConnected ? paletteForPlayer(player, id) : null;
        const info = { id, player, ship, tier, fieldR, attractR, pulse, tierShift, palette };
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
      const camX = state.camera.x;
      const camY = state.camera.y;
      const halfViewW = w * 0.5 / zoom;
      const halfViewH = h * 0.5 / zoom;
      const cullMargin = 160;
      drawRedGiantUnderlay(ctx);
      drawTechPing(ctx);
      for (const a of state.asteroids) {
        if (a.attached)
          continue;
        const r = (Number(a.radius) || 0) + cullMargin;
        if (Math.abs(a.pos.x - camX) > halfViewW + r)
          continue;
        if (Math.abs(a.pos.y - camY) > halfViewH + r)
          continue;
        const ownerId = a.pullOwnerId || localId;
        const owner = playerInfoById[ownerId] || localInfo;
        if (!owner)
          continue;
        drawAsteroid(ctx, a, { tier: owner.tier, ship: owner.ship, fieldR: owner.fieldR, ringRgb: owner.palette?.lightRgb });
      }
      drawForcefieldRings(ctx, playerInfos, localId);
      for (const a of state.asteroids) {
        if (!a.attached)
          continue;
        const r = (Number(a.radius) || 0) + cullMargin;
        if (Math.abs(a.pos.x - camX) > halfViewW + r)
          continue;
        if (Math.abs(a.pos.y - camY) > halfViewH + r)
          continue;
        const ownerId = a.attachedTo || localId;
        const owner = playerInfoById[ownerId] || localInfo;
        if (!owner)
          continue;
        drawAsteroid(ctx, a, { tier: owner.tier, ship: owner.ship, fieldR: owner.fieldR, ringRgb: owner.palette?.lightRgb });
      }
      drawJumpGate(ctx);
      for (const g of state.gems) {
        const rCull = (Number(g.radius) || 0) + cullMargin;
        if (Math.abs(g.pos.x - camX) > halfViewW + rCull)
          continue;
        if (Math.abs(g.pos.y - camY) > halfViewH + rCull)
          continue;
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
        drawShipModel(ctx, p.ship, false, p.tier, p.palette);
      }
      if (localInfo?.ship)
        drawShipModel(ctx, localInfo.ship, localThrusting, localInfo.tier, localInfo.palette);
      ctx.restore();
      ctx.save();
      ctx.fillStyle = "rgba(231,240,255,0.85)";
      ctx.font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      let attached = 0;
      let xxlarge = 0;
      let xlarge = 0;
      let large = 0;
      let med = 0;
      let small = 0;
      for (const a of state.asteroids) {
        if (a.attached)
          attached++;
        if (a.size === "xxlarge")
          xxlarge++;
        else if (a.size === "xlarge")
          xlarge++;
        else if (a.size === "large")
          large++;
        else if (a.size === "med")
          med++;
        else if (a.size === "small")
          small++;
      }
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
    const hudMp = documentRef.getElementById("hud-mp");
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
    function nowMs3() {
      if (windowRef?.performance && typeof windowRef.performance.now === "function")
        return windowRef.performance.now();
      return Date.now();
    }
    const hudPerf = { t0: nowMs3(), frames: 0, fps: 0 };
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
      if (!hudMp)
        return;
      const mp = game.state?._mp;
      if (!mp?.connected) {
        hudMp.textContent = "";
        return;
      }
      hudPerf.frames++;
      const t = nowMs3();
      const elapsed = t - hudPerf.t0;
      if (elapsed >= 500) {
        hudPerf.fps = hudPerf.frames * 1e3 / Math.max(1, elapsed);
        hudPerf.frames = 0;
        hudPerf.t0 = t;
      }
      const hz = Number.isFinite(mp.snapshotHz) ? mp.snapshotHz.toFixed(1) : "?";
      const dtAvg = Number.isFinite(mp.snapshotDtAvgMs) ? `${Math.round(mp.snapshotDtAvgMs)}ms` : "?";
      const age = Number.isFinite(mp.latestAgeMs) ? `${Math.round(mp.latestAgeMs)}ms` : "?";
      const sim = Number.isFinite(mp.serverSimSpeed) ? `${mp.serverSimSpeed.toFixed(2)}x` : "?";
      const tickHz = Number.isFinite(mp.serverTickHz) ? `${mp.serverTickHz.toFixed(1)}Hz` : "?";
      hudMp.textContent = `fps ${hudPerf.fps.toFixed(0)} | snap ${hz}Hz ~${dtAvg} | age ${age} | sim ${sim} (${tickHz}) | ent ${mp.playerCount}p ${mp.asteroidCount}a ${mp.gemCount}g`;
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

  // node_modules/@colyseus/sdk/build/legacy.mjs
  if (!ArrayBuffer.isView) {
    ArrayBuffer.isView = (a) => {
      return a !== null && typeof a === "object" && a.buffer instanceof ArrayBuffer;
    };
  }
  if (typeof globalThis === "undefined" && typeof window !== "undefined") {
    window["globalThis"] = window;
  }
  if (typeof FormData === "undefined") {
    globalThis["FormData"] = class {
    };
  }

  // node_modules/@colyseus/shared-types/build/Protocol.mjs
  var Protocol = {
    // Room-related (10~19)
    JOIN_ROOM: 10,
    ERROR: 11,
    LEAVE_ROOM: 12,
    ROOM_DATA: 13,
    ROOM_STATE: 14,
    ROOM_STATE_PATCH: 15,
    ROOM_DATA_SCHEMA: 16,
    // DEPRECATED: used to send schema instances via room.send()
    ROOM_DATA_BYTES: 17,
    PING: 18
  };
  var CloseCode = {
    NORMAL_CLOSURE: 1e3,
    GOING_AWAY: 1001,
    NO_STATUS_RECEIVED: 1005,
    ABNORMAL_CLOSURE: 1006,
    CONSENTED: 4e3,
    SERVER_SHUTDOWN: 4001,
    WITH_ERROR: 4002,
    FAILED_TO_RECONNECT: 4003,
    MAY_TRY_RECONNECT: 4010
  };

  // node_modules/@colyseus/sdk/build/errors/Errors.mjs
  var ServerError = class extends Error {
    constructor(code, message, opts) {
      super(message);
      __publicField(this, "code");
      __publicField(this, "headers");
      __publicField(this, "status");
      __publicField(this, "response");
      __publicField(this, "data");
      this.name = "ServerError";
      this.code = code;
      if (opts) {
        this.headers = opts.headers;
        this.status = opts.status;
        this.response = opts.response;
        this.data = opts.data;
      }
    }
  };
  var MatchMakeError = class _MatchMakeError extends Error {
    constructor(message, code) {
      super(message);
      __publicField(this, "code");
      this.code = code;
      this.name = "MatchMakeError";
      Object.setPrototypeOf(this, _MatchMakeError.prototype);
    }
  };

  // node_modules/@colyseus/schema/build/index.mjs
  var SWITCH_TO_STRUCTURE = 255;
  var TYPE_ID = 213;
  var OPERATION;
  (function(OPERATION2) {
    OPERATION2[OPERATION2["ADD"] = 128] = "ADD";
    OPERATION2[OPERATION2["REPLACE"] = 0] = "REPLACE";
    OPERATION2[OPERATION2["DELETE"] = 64] = "DELETE";
    OPERATION2[OPERATION2["DELETE_AND_MOVE"] = 96] = "DELETE_AND_MOVE";
    OPERATION2[OPERATION2["MOVE_AND_ADD"] = 160] = "MOVE_AND_ADD";
    OPERATION2[OPERATION2["DELETE_AND_ADD"] = 192] = "DELETE_AND_ADD";
    OPERATION2[OPERATION2["CLEAR"] = 10] = "CLEAR";
    OPERATION2[OPERATION2["REVERSE"] = 15] = "REVERSE";
    OPERATION2[OPERATION2["MOVE"] = 32] = "MOVE";
    OPERATION2[OPERATION2["DELETE_BY_REFID"] = 33] = "DELETE_BY_REFID";
    OPERATION2[OPERATION2["ADD_BY_REFID"] = 129] = "ADD_BY_REFID";
  })(OPERATION || (OPERATION = {}));
  Symbol.metadata ?? (Symbol.metadata = Symbol.for("Symbol.metadata"));
  var $refId = "~refId";
  var $track = "~track";
  var $encoder = "~encoder";
  var $decoder = "~decoder";
  var $filter = "~filter";
  var $getByIndex = "~getByIndex";
  var $deleteByIndex = "~deleteByIndex";
  var $changes = "~changes";
  var $childType = "~childType";
  var $onEncodeEnd = "~onEncodeEnd";
  var $onDecodeEnd = "~onDecodeEnd";
  var $descriptors = "~descriptors";
  var $numFields = "~__numFields";
  var $refTypeFieldIndexes = "~__refTypeFieldIndexes";
  var $viewFieldIndexes = "~__viewFieldIndexes";
  var $fieldIndexesByViewTag = "$__fieldIndexesByViewTag";
  var textEncoder;
  try {
    textEncoder = new TextEncoder();
  } catch (e) {
  }
  var _convoBuffer$1 = new ArrayBuffer(8);
  var _int32$1 = new Int32Array(_convoBuffer$1);
  var _float32$1 = new Float32Array(_convoBuffer$1);
  var _float64$1 = new Float64Array(_convoBuffer$1);
  var _int64$1 = new BigInt64Array(_convoBuffer$1);
  var hasBufferByteLength = typeof Buffer !== "undefined" && Buffer.byteLength;
  var utf8Length = hasBufferByteLength ? Buffer.byteLength : function(str, _) {
    var c = 0, length = 0;
    for (var i = 0, l = str.length; i < l; i++) {
      c = str.charCodeAt(i);
      if (c < 128) {
        length += 1;
      } else if (c < 2048) {
        length += 2;
      } else if (c < 55296 || c >= 57344) {
        length += 3;
      } else {
        i++;
        length += 4;
      }
    }
    return length;
  };
  function utf8Write(view2, str, it) {
    var c = 0;
    for (var i = 0, l = str.length; i < l; i++) {
      c = str.charCodeAt(i);
      if (c < 128) {
        view2[it.offset++] = c;
      } else if (c < 2048) {
        view2[it.offset] = 192 | c >> 6;
        view2[it.offset + 1] = 128 | c & 63;
        it.offset += 2;
      } else if (c < 55296 || c >= 57344) {
        view2[it.offset] = 224 | c >> 12;
        view2[it.offset + 1] = 128 | c >> 6 & 63;
        view2[it.offset + 2] = 128 | c & 63;
        it.offset += 3;
      } else {
        i++;
        c = 65536 + ((c & 1023) << 10 | str.charCodeAt(i) & 1023);
        view2[it.offset] = 240 | c >> 18;
        view2[it.offset + 1] = 128 | c >> 12 & 63;
        view2[it.offset + 2] = 128 | c >> 6 & 63;
        view2[it.offset + 3] = 128 | c & 63;
        it.offset += 4;
      }
    }
  }
  function int8$1(bytes, value, it) {
    bytes[it.offset++] = value & 255;
  }
  function uint8$1(bytes, value, it) {
    bytes[it.offset++] = value & 255;
  }
  function int16$1(bytes, value, it) {
    bytes[it.offset++] = value & 255;
    bytes[it.offset++] = value >> 8 & 255;
  }
  function uint16$1(bytes, value, it) {
    bytes[it.offset++] = value & 255;
    bytes[it.offset++] = value >> 8 & 255;
  }
  function int32$1(bytes, value, it) {
    bytes[it.offset++] = value & 255;
    bytes[it.offset++] = value >> 8 & 255;
    bytes[it.offset++] = value >> 16 & 255;
    bytes[it.offset++] = value >> 24 & 255;
  }
  function uint32$1(bytes, value, it) {
    const b4 = value >> 24;
    const b3 = value >> 16;
    const b2 = value >> 8;
    const b1 = value;
    bytes[it.offset++] = b1 & 255;
    bytes[it.offset++] = b2 & 255;
    bytes[it.offset++] = b3 & 255;
    bytes[it.offset++] = b4 & 255;
  }
  function int64$1(bytes, value, it) {
    const high = Math.floor(value / Math.pow(2, 32));
    const low = value >>> 0;
    uint32$1(bytes, low, it);
    uint32$1(bytes, high, it);
  }
  function uint64$1(bytes, value, it) {
    const high = value / Math.pow(2, 32) >> 0;
    const low = value >>> 0;
    uint32$1(bytes, low, it);
    uint32$1(bytes, high, it);
  }
  function bigint64$1(bytes, value, it) {
    _int64$1[0] = BigInt.asIntN(64, value);
    int32$1(bytes, _int32$1[0], it);
    int32$1(bytes, _int32$1[1], it);
  }
  function biguint64$1(bytes, value, it) {
    _int64$1[0] = BigInt.asIntN(64, value);
    int32$1(bytes, _int32$1[0], it);
    int32$1(bytes, _int32$1[1], it);
  }
  function float32$1(bytes, value, it) {
    _float32$1[0] = value;
    int32$1(bytes, _int32$1[0], it);
  }
  function float64$1(bytes, value, it) {
    _float64$1[0] = value;
    int32$1(bytes, _int32$1[0], it);
    int32$1(bytes, _int32$1[1], it);
  }
  function boolean$1(bytes, value, it) {
    bytes[it.offset++] = value ? 1 : 0;
  }
  function string$1(bytes, value, it) {
    if (!value) {
      value = "";
    }
    let length = utf8Length(value, "utf8");
    let size = 0;
    if (length < 32) {
      bytes[it.offset++] = length | 160;
      size = 1;
    } else if (length < 256) {
      bytes[it.offset++] = 217;
      bytes[it.offset++] = length % 255;
      size = 2;
    } else if (length < 65536) {
      bytes[it.offset++] = 218;
      uint16$1(bytes, length, it);
      size = 3;
    } else if (length < 4294967296) {
      bytes[it.offset++] = 219;
      uint32$1(bytes, length, it);
      size = 5;
    } else {
      throw new Error("String too long");
    }
    utf8Write(bytes, value, it);
    return size + length;
  }
  function number$1(bytes, value, it) {
    if (isNaN(value)) {
      return number$1(bytes, 0, it);
    } else if (!isFinite(value)) {
      return number$1(bytes, value > 0 ? Number.MAX_SAFE_INTEGER : -Number.MAX_SAFE_INTEGER, it);
    } else if (value !== (value | 0)) {
      if (Math.abs(value) <= 34028235e31) {
        _float32$1[0] = value;
        if (Math.abs(Math.abs(_float32$1[0]) - Math.abs(value)) < 1e-4) {
          bytes[it.offset++] = 202;
          float32$1(bytes, value, it);
          return 5;
        }
      }
      bytes[it.offset++] = 203;
      float64$1(bytes, value, it);
      return 9;
    }
    if (value >= 0) {
      if (value < 128) {
        bytes[it.offset++] = value & 255;
        return 1;
      }
      if (value < 256) {
        bytes[it.offset++] = 204;
        bytes[it.offset++] = value & 255;
        return 2;
      }
      if (value < 65536) {
        bytes[it.offset++] = 205;
        uint16$1(bytes, value, it);
        return 3;
      }
      if (value < 4294967296) {
        bytes[it.offset++] = 206;
        uint32$1(bytes, value, it);
        return 5;
      }
      bytes[it.offset++] = 207;
      uint64$1(bytes, value, it);
      return 9;
    } else {
      if (value >= -32) {
        bytes[it.offset++] = 224 | value + 32;
        return 1;
      }
      if (value >= -128) {
        bytes[it.offset++] = 208;
        int8$1(bytes, value, it);
        return 2;
      }
      if (value >= -32768) {
        bytes[it.offset++] = 209;
        int16$1(bytes, value, it);
        return 3;
      }
      if (value >= -2147483648) {
        bytes[it.offset++] = 210;
        int32$1(bytes, value, it);
        return 5;
      }
      bytes[it.offset++] = 211;
      int64$1(bytes, value, it);
      return 9;
    }
  }
  var encode = {
    int8: int8$1,
    uint8: uint8$1,
    int16: int16$1,
    uint16: uint16$1,
    int32: int32$1,
    uint32: uint32$1,
    int64: int64$1,
    uint64: uint64$1,
    bigint64: bigint64$1,
    biguint64: biguint64$1,
    float32: float32$1,
    float64: float64$1,
    boolean: boolean$1,
    string: string$1,
    number: number$1,
    utf8Write,
    utf8Length
  };
  var _convoBuffer = new ArrayBuffer(8);
  var _int32 = new Int32Array(_convoBuffer);
  var _float32 = new Float32Array(_convoBuffer);
  var _float64 = new Float64Array(_convoBuffer);
  var _uint64 = new BigUint64Array(_convoBuffer);
  var _int64 = new BigInt64Array(_convoBuffer);
  function utf8Read(bytes, it, length) {
    if (length > bytes.length - it.offset) {
      length = bytes.length - it.offset;
    }
    var string2 = "", chr = 0;
    for (var i = it.offset, end = it.offset + length; i < end; i++) {
      var byte = bytes[i];
      if ((byte & 128) === 0) {
        string2 += String.fromCharCode(byte);
        continue;
      }
      if ((byte & 224) === 192) {
        string2 += String.fromCharCode((byte & 31) << 6 | bytes[++i] & 63);
        continue;
      }
      if ((byte & 240) === 224) {
        string2 += String.fromCharCode((byte & 15) << 12 | (bytes[++i] & 63) << 6 | (bytes[++i] & 63) << 0);
        continue;
      }
      if ((byte & 248) === 240) {
        chr = (byte & 7) << 18 | (bytes[++i] & 63) << 12 | (bytes[++i] & 63) << 6 | (bytes[++i] & 63) << 0;
        if (chr >= 65536) {
          chr -= 65536;
          string2 += String.fromCharCode((chr >>> 10) + 55296, (chr & 1023) + 56320);
        } else {
          string2 += String.fromCharCode(chr);
        }
        continue;
      }
      console.error("decode.utf8Read(): Invalid byte " + byte + " at offset " + i + ". Skip to end of string: " + (it.offset + length));
      break;
    }
    it.offset += length;
    return string2;
  }
  function int8(bytes, it) {
    return uint8(bytes, it) << 24 >> 24;
  }
  function uint8(bytes, it) {
    return bytes[it.offset++];
  }
  function int16(bytes, it) {
    return uint16(bytes, it) << 16 >> 16;
  }
  function uint16(bytes, it) {
    return bytes[it.offset++] | bytes[it.offset++] << 8;
  }
  function int32(bytes, it) {
    return bytes[it.offset++] | bytes[it.offset++] << 8 | bytes[it.offset++] << 16 | bytes[it.offset++] << 24;
  }
  function uint32(bytes, it) {
    return int32(bytes, it) >>> 0;
  }
  function float32(bytes, it) {
    _int32[0] = int32(bytes, it);
    return _float32[0];
  }
  function float64(bytes, it) {
    _int32[0] = int32(bytes, it);
    _int32[1] = int32(bytes, it);
    return _float64[0];
  }
  function int64(bytes, it) {
    const low = uint32(bytes, it);
    const high = int32(bytes, it) * Math.pow(2, 32);
    return high + low;
  }
  function uint64(bytes, it) {
    const low = uint32(bytes, it);
    const high = uint32(bytes, it) * Math.pow(2, 32);
    return high + low;
  }
  function bigint64(bytes, it) {
    _int32[0] = int32(bytes, it);
    _int32[1] = int32(bytes, it);
    return _int64[0];
  }
  function biguint64(bytes, it) {
    _int32[0] = int32(bytes, it);
    _int32[1] = int32(bytes, it);
    return _uint64[0];
  }
  function boolean(bytes, it) {
    return uint8(bytes, it) > 0;
  }
  function string(bytes, it) {
    const prefix = bytes[it.offset++];
    let length;
    if (prefix < 192) {
      length = prefix & 31;
    } else if (prefix === 217) {
      length = uint8(bytes, it);
    } else if (prefix === 218) {
      length = uint16(bytes, it);
    } else if (prefix === 219) {
      length = uint32(bytes, it);
    }
    return utf8Read(bytes, it, length);
  }
  function number(bytes, it) {
    const prefix = bytes[it.offset++];
    if (prefix < 128) {
      return prefix;
    } else if (prefix === 202) {
      return float32(bytes, it);
    } else if (prefix === 203) {
      return float64(bytes, it);
    } else if (prefix === 204) {
      return uint8(bytes, it);
    } else if (prefix === 205) {
      return uint16(bytes, it);
    } else if (prefix === 206) {
      return uint32(bytes, it);
    } else if (prefix === 207) {
      return uint64(bytes, it);
    } else if (prefix === 208) {
      return int8(bytes, it);
    } else if (prefix === 209) {
      return int16(bytes, it);
    } else if (prefix === 210) {
      return int32(bytes, it);
    } else if (prefix === 211) {
      return int64(bytes, it);
    } else if (prefix > 223) {
      return (255 - prefix + 1) * -1;
    }
  }
  function stringCheck(bytes, it) {
    const prefix = bytes[it.offset];
    return (
      // fixstr
      prefix < 192 && prefix > 160 || // str 8
      prefix === 217 || // str 16
      prefix === 218 || // str 32
      prefix === 219
    );
  }
  var decode = {
    utf8Read,
    int8,
    uint8,
    int16,
    uint16,
    int32,
    uint32,
    float32,
    float64,
    int64,
    uint64,
    bigint64,
    biguint64,
    boolean,
    string,
    number,
    stringCheck
  };
  var registeredTypes = {};
  var identifiers = /* @__PURE__ */ new Map();
  function registerType(identifier, definition) {
    if (definition.constructor) {
      identifiers.set(definition.constructor, identifier);
      registeredTypes[identifier] = definition;
    }
    if (definition.encode) {
      encode[identifier] = definition.encode;
    }
    if (definition.decode) {
      decode[identifier] = definition.decode;
    }
  }
  function getType(identifier) {
    return registeredTypes[identifier];
  }
  var _TypeContext = class _TypeContext {
    constructor(rootClass) {
      __publicField(this, "types", {});
      __publicField(this, "schemas", /* @__PURE__ */ new Map());
      __publicField(this, "hasFilters", false);
      __publicField(this, "parentFiltered", {});
      if (rootClass) {
        this.discoverTypes(rootClass);
      }
    }
    static register(target2) {
      const parent = Object.getPrototypeOf(target2);
      if (parent !== Schema) {
        let inherits = _TypeContext.inheritedTypes.get(parent);
        if (!inherits) {
          inherits = /* @__PURE__ */ new Set();
          _TypeContext.inheritedTypes.set(parent, inherits);
        }
        inherits.add(target2);
      }
    }
    static cache(rootClass) {
      let context = _TypeContext.cachedContexts.get(rootClass);
      if (!context) {
        context = new _TypeContext(rootClass);
        _TypeContext.cachedContexts.set(rootClass, context);
      }
      return context;
    }
    has(schema2) {
      return this.schemas.has(schema2);
    }
    get(typeid) {
      return this.types[typeid];
    }
    add(schema2, typeid = this.schemas.size) {
      if (this.schemas.has(schema2)) {
        return false;
      }
      this.types[typeid] = schema2;
      if (schema2[Symbol.metadata] === void 0) {
        Metadata.initialize(schema2);
      }
      this.schemas.set(schema2, typeid);
      return true;
    }
    getTypeId(klass) {
      return this.schemas.get(klass);
    }
    discoverTypes(klass, parentType, parentIndex, parentHasViewTag) {
      var _a6;
      if (parentHasViewTag) {
        this.registerFilteredByParent(klass, parentType, parentIndex);
      }
      if (!this.add(klass)) {
        return;
      }
      _TypeContext.inheritedTypes.get(klass)?.forEach((child) => {
        this.discoverTypes(child, parentType, parentIndex, parentHasViewTag);
      });
      let parent = klass;
      while ((parent = Object.getPrototypeOf(parent)) && parent !== Schema && // stop at root (Schema)
      parent !== Function.prototype) {
        this.discoverTypes(parent);
      }
      const metadata = klass[_a6 = Symbol.metadata] ?? (klass[_a6] = {});
      if (metadata[$viewFieldIndexes]) {
        this.hasFilters = true;
      }
      for (const fieldIndex in metadata) {
        const index = fieldIndex;
        const fieldType = metadata[index].type;
        const fieldHasViewTag = metadata[index].tag !== void 0;
        if (typeof fieldType === "string") {
          continue;
        }
        if (typeof fieldType === "function") {
          this.discoverTypes(fieldType, klass, index, parentHasViewTag || fieldHasViewTag);
        } else {
          const type = Object.values(fieldType)[0];
          if (typeof type === "string") {
            continue;
          }
          this.discoverTypes(type, klass, index, parentHasViewTag || fieldHasViewTag);
        }
      }
    }
    /**
     * Keep track of which classes have filters applied.
     * Format: `${typeid}-${parentTypeid}-${parentIndex}`
     */
    registerFilteredByParent(schema2, parentType, parentIndex) {
      const typeid = this.schemas.get(schema2) ?? this.schemas.size;
      let key = `${typeid}`;
      if (parentType) {
        key += `-${this.schemas.get(parentType)}`;
      }
      key += `-${parentIndex}`;
      this.parentFiltered[key] = true;
    }
    debug() {
      let parentFiltered = "";
      for (const key in this.parentFiltered) {
        const keys = key.split("-").map(Number);
        const fieldIndex = keys.pop();
        parentFiltered += `
		`;
        parentFiltered += `${key}: ${keys.reverse().map((id, i) => {
          const klass = this.types[id];
          const metadata = klass[Symbol.metadata];
          let txt = klass.name;
          if (i === 0) {
            txt += `[${metadata[fieldIndex].name}]`;
          }
          return `${txt}`;
        }).join(" -> ")}`;
      }
      return `TypeContext ->
	Schema types: ${this.schemas.size}
	hasFilters: ${this.hasFilters}
	parentFiltered:${parentFiltered}`;
    }
  };
  /**
   * For inheritance support
   * Keeps track of which classes extends which. (parent -> children)
   */
  __publicField(_TypeContext, "inheritedTypes", /* @__PURE__ */ new Map());
  __publicField(_TypeContext, "cachedContexts", /* @__PURE__ */ new Map());
  var TypeContext = _TypeContext;
  function getNormalizedType(type) {
    if (Array.isArray(type)) {
      return { array: getNormalizedType(type[0]) };
    } else if (typeof type["type"] !== "undefined") {
      return type["type"];
    } else if (isTSEnum(type)) {
      return Object.keys(type).every((key) => typeof type[key] === "string") ? "string" : "number";
    } else if (typeof type === "object" && type !== null) {
      const collectionType = Object.keys(type).find((k) => registeredTypes[k] !== void 0);
      if (collectionType) {
        type[collectionType] = getNormalizedType(type[collectionType]);
        return type;
      }
    }
    return type;
  }
  function isTSEnum(_enum) {
    if (typeof _enum === "function" && _enum[Symbol.metadata]) {
      return false;
    }
    const keys = Object.keys(_enum);
    const numericFields = keys.filter((k) => /\d+/.test(k));
    if (numericFields.length > 0 && numericFields.length === keys.length / 2 && _enum[_enum[numericFields[0]]] == numericFields[0]) {
      return true;
    }
    if (keys.length > 0 && keys.every((key) => typeof _enum[key] === "string" && _enum[key] === key)) {
      return true;
    }
    return false;
  }
  var Metadata = {
    addField(metadata, index, name, type, descriptor) {
      if (index > 64) {
        throw new Error(`Can't define field '${name}'.
Schema instances may only have up to 64 fields.`);
      }
      metadata[index] = Object.assign(
        metadata[index] || {},
        // avoid overwriting previous field metadata (@owned / @deprecated)
        {
          type: getNormalizedType(type),
          index,
          name
        }
      );
      Object.defineProperty(metadata, $descriptors, {
        value: metadata[$descriptors] || {},
        enumerable: false,
        configurable: true
      });
      if (descriptor) {
        metadata[$descriptors][name] = descriptor;
        metadata[$descriptors][`_${name}`] = {
          value: void 0,
          writable: true,
          enumerable: false,
          configurable: true
        };
      } else {
        metadata[$descriptors][name] = {
          value: void 0,
          writable: true,
          enumerable: true,
          configurable: true
        };
      }
      Object.defineProperty(metadata, $numFields, {
        value: index,
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(metadata, name, {
        value: index,
        enumerable: false,
        configurable: true
      });
      if (typeof metadata[index].type !== "string") {
        if (metadata[$refTypeFieldIndexes] === void 0) {
          Object.defineProperty(metadata, $refTypeFieldIndexes, {
            value: [],
            enumerable: false,
            configurable: true
          });
        }
        metadata[$refTypeFieldIndexes].push(index);
      }
    },
    setTag(metadata, fieldName, tag) {
      const index = metadata[fieldName];
      const field = metadata[index];
      field.tag = tag;
      if (!metadata[$viewFieldIndexes]) {
        Object.defineProperty(metadata, $viewFieldIndexes, {
          value: [],
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(metadata, $fieldIndexesByViewTag, {
          value: {},
          enumerable: false,
          configurable: true
        });
      }
      metadata[$viewFieldIndexes].push(index);
      if (!metadata[$fieldIndexesByViewTag][tag]) {
        metadata[$fieldIndexesByViewTag][tag] = [];
      }
      metadata[$fieldIndexesByViewTag][tag].push(index);
    },
    setFields(target2, fields) {
      const constructor = target2.prototype.constructor;
      TypeContext.register(constructor);
      const parentClass = Object.getPrototypeOf(constructor);
      const parentMetadata = parentClass && parentClass[Symbol.metadata];
      const metadata = Metadata.initialize(constructor);
      if (!constructor[$track]) {
        constructor[$track] = Schema[$track];
      }
      if (!constructor[$encoder]) {
        constructor[$encoder] = Schema[$encoder];
      }
      if (!constructor[$decoder]) {
        constructor[$decoder] = Schema[$decoder];
      }
      if (!constructor.prototype.toJSON) {
        constructor.prototype.toJSON = Schema.prototype.toJSON;
      }
      let fieldIndex = metadata[$numFields] ?? (parentMetadata && parentMetadata[$numFields]) ?? -1;
      fieldIndex++;
      for (const field in fields) {
        const type = getNormalizedType(fields[field]);
        const complexTypeKlass = typeof Object.keys(type)[0] === "string" && getType(Object.keys(type)[0]);
        const childType = complexTypeKlass ? Object.values(type)[0] : type;
        Metadata.addField(metadata, fieldIndex, field, type, getPropertyDescriptor(`_${field}`, fieldIndex, childType, complexTypeKlass));
        fieldIndex++;
      }
      return target2;
    },
    isDeprecated(metadata, field) {
      return metadata[field].deprecated === true;
    },
    init(klass) {
      const metadata = {};
      klass[Symbol.metadata] = metadata;
      Object.defineProperty(metadata, $numFields, {
        value: 0,
        enumerable: false,
        configurable: true
      });
    },
    initialize(constructor) {
      const parentClass = Object.getPrototypeOf(constructor);
      const parentMetadata = parentClass[Symbol.metadata];
      let metadata = constructor[Symbol.metadata] ?? /* @__PURE__ */ Object.create(null);
      if (parentClass !== Schema && metadata === parentMetadata) {
        metadata = /* @__PURE__ */ Object.create(null);
        if (parentMetadata) {
          Object.setPrototypeOf(metadata, parentMetadata);
          Object.defineProperty(metadata, $numFields, {
            value: parentMetadata[$numFields],
            enumerable: false,
            configurable: true,
            writable: true
          });
          if (parentMetadata[$viewFieldIndexes] !== void 0) {
            Object.defineProperty(metadata, $viewFieldIndexes, {
              value: [...parentMetadata[$viewFieldIndexes]],
              enumerable: false,
              configurable: true,
              writable: true
            });
            Object.defineProperty(metadata, $fieldIndexesByViewTag, {
              value: { ...parentMetadata[$fieldIndexesByViewTag] },
              enumerable: false,
              configurable: true,
              writable: true
            });
          }
          if (parentMetadata[$refTypeFieldIndexes] !== void 0) {
            Object.defineProperty(metadata, $refTypeFieldIndexes, {
              value: [...parentMetadata[$refTypeFieldIndexes]],
              enumerable: false,
              configurable: true,
              writable: true
            });
          }
          Object.defineProperty(metadata, $descriptors, {
            value: { ...parentMetadata[$descriptors] },
            enumerable: false,
            configurable: true,
            writable: true
          });
        }
      }
      Object.defineProperty(constructor, Symbol.metadata, {
        value: metadata,
        writable: false,
        configurable: true
      });
      return metadata;
    },
    isValidInstance(klass) {
      return klass.constructor[Symbol.metadata] && Object.prototype.hasOwnProperty.call(klass.constructor[Symbol.metadata], $numFields);
    },
    getFields(klass) {
      const metadata = klass[Symbol.metadata];
      const fields = {};
      for (let i = 0; i <= metadata[$numFields]; i++) {
        fields[metadata[i].name] = metadata[i].type;
      }
      return fields;
    },
    hasViewTagAtIndex(metadata, index) {
      return metadata?.[$viewFieldIndexes]?.includes(index);
    }
  };
  function createChangeSet(queueRootNode) {
    return { indexes: {}, operations: [], queueRootNode };
  }
  function createChangeTreeList() {
    return { next: void 0, tail: void 0 };
  }
  function setOperationAtIndex(changeSet, index) {
    const operationsIndex = changeSet.indexes[index];
    if (operationsIndex === void 0) {
      changeSet.indexes[index] = changeSet.operations.push(index) - 1;
    } else {
      changeSet.operations[operationsIndex] = index;
    }
  }
  function deleteOperationAtIndex(changeSet, index) {
    let operationsIndex = changeSet.indexes[index];
    if (operationsIndex === void 0) {
      operationsIndex = Object.values(changeSet.indexes).at(-1);
      index = Object.entries(changeSet.indexes).find(([_, value]) => value === operationsIndex)?.[0];
    }
    changeSet.operations[operationsIndex] = void 0;
    delete changeSet.indexes[index];
  }
  var ChangeTree = class {
    constructor(ref) {
      __publicField(this, "ref");
      __publicField(this, "metadata");
      __publicField(this, "root");
      __publicField(this, "parentChain");
      // Linked list for tracking parents
      /**
       * Whether this structure is parent of a filtered structure.
       */
      __publicField(this, "isFiltered", false);
      __publicField(this, "isVisibilitySharedWithParent");
      // See test case: 'should not be required to manually call view.add() items to child arrays without @view() tag'
      __publicField(this, "indexedOperations", {});
      //
      // TODO:
      //   try storing the index + operation per item.
      //   example: 1024 & 1025 => ADD, 1026 => DELETE
      //
      // => https://chatgpt.com/share/67107d0c-bc20-8004-8583-83b17dd7c196
      //
      __publicField(this, "changes", { indexes: {}, operations: [] });
      __publicField(this, "allChanges", { indexes: {}, operations: [] });
      __publicField(this, "filteredChanges");
      __publicField(this, "allFilteredChanges");
      __publicField(this, "indexes");
      // TODO: remove this, only used by MapSchema/SetSchema/CollectionSchema (`encodeKeyValueOperation`)
      /**
       * Is this a new instance? Used on ArraySchema to determine OPERATION.MOVE_AND_ADD operation.
       */
      __publicField(this, "isNew", true);
      this.ref = ref;
      this.metadata = ref.constructor[Symbol.metadata];
      if (this.metadata?.[$viewFieldIndexes]) {
        this.allFilteredChanges = { indexes: {}, operations: [] };
        this.filteredChanges = { indexes: {}, operations: [] };
      }
    }
    setRoot(root) {
      this.root = root;
      const isNewChangeTree = this.root.add(this);
      this.checkIsFiltered(this.parent, this.parentIndex, isNewChangeTree);
      if (isNewChangeTree) {
        this.forEachChild((child, _) => {
          if (child.root !== root) {
            child.setRoot(root);
          } else {
            root.add(child);
          }
        });
      }
    }
    setParent(parent, root, parentIndex) {
      this.addParent(parent, parentIndex);
      if (!root) {
        return;
      }
      const isNewChangeTree = root.add(this);
      if (root !== this.root) {
        this.root = root;
        this.checkIsFiltered(parent, parentIndex, isNewChangeTree);
      }
      if (isNewChangeTree) {
        this.forEachChild((child, index) => {
          if (child.root === root) {
            root.add(child);
            root.moveNextToParent(child);
            return;
          }
          child.setParent(this.ref, root, index);
        });
      }
    }
    forEachChild(callback) {
      if (this.ref[$childType]) {
        if (typeof this.ref[$childType] !== "string") {
          for (const [key, value] of this.ref.entries()) {
            if (!value) {
              continue;
            }
            callback(value[$changes], this.indexes?.[key] ?? key);
          }
        }
      } else {
        for (const index of this.metadata?.[$refTypeFieldIndexes] ?? []) {
          const field = this.metadata[index];
          const value = this.ref[field.name];
          if (!value) {
            continue;
          }
          callback(value[$changes], index);
        }
      }
    }
    operation(op) {
      if (this.filteredChanges !== void 0) {
        this.filteredChanges.operations.push(-op);
        this.root?.enqueueChangeTree(this, "filteredChanges");
      } else {
        this.changes.operations.push(-op);
        this.root?.enqueueChangeTree(this, "changes");
      }
    }
    change(index, operation = OPERATION.ADD) {
      const isFiltered = this.isFiltered || this.metadata?.[index]?.tag !== void 0;
      const changeSet = isFiltered ? this.filteredChanges : this.changes;
      const previousOperation = this.indexedOperations[index];
      if (!previousOperation || previousOperation === OPERATION.DELETE) {
        const op = !previousOperation ? operation : previousOperation === OPERATION.DELETE ? OPERATION.DELETE_AND_ADD : operation;
        this.indexedOperations[index] = op;
      }
      setOperationAtIndex(changeSet, index);
      if (isFiltered) {
        setOperationAtIndex(this.allFilteredChanges, index);
        if (this.root) {
          this.root.enqueueChangeTree(this, "filteredChanges");
          this.root.enqueueChangeTree(this, "allFilteredChanges");
        }
      } else {
        setOperationAtIndex(this.allChanges, index);
        this.root?.enqueueChangeTree(this, "changes");
      }
    }
    shiftChangeIndexes(shiftIndex) {
      const changeSet = this.isFiltered ? this.filteredChanges : this.changes;
      const newIndexedOperations = {};
      const newIndexes = {};
      for (const index in this.indexedOperations) {
        newIndexedOperations[Number(index) + shiftIndex] = this.indexedOperations[index];
        newIndexes[Number(index) + shiftIndex] = changeSet.indexes[index];
      }
      this.indexedOperations = newIndexedOperations;
      changeSet.indexes = newIndexes;
      changeSet.operations = changeSet.operations.map((index) => index + shiftIndex);
    }
    shiftAllChangeIndexes(shiftIndex, startIndex = 0) {
      if (this.filteredChanges !== void 0) {
        this._shiftAllChangeIndexes(shiftIndex, startIndex, this.allFilteredChanges);
        this._shiftAllChangeIndexes(shiftIndex, startIndex, this.allChanges);
      } else {
        this._shiftAllChangeIndexes(shiftIndex, startIndex, this.allChanges);
      }
    }
    _shiftAllChangeIndexes(shiftIndex, startIndex = 0, changeSet) {
      const newIndexes = {};
      let newKey = 0;
      for (const key in changeSet.indexes) {
        newIndexes[newKey++] = changeSet.indexes[key];
      }
      changeSet.indexes = newIndexes;
      for (let i = 0; i < changeSet.operations.length; i++) {
        const index = changeSet.operations[i];
        if (index > startIndex) {
          changeSet.operations[i] = index + shiftIndex;
        }
      }
    }
    indexedOperation(index, operation, allChangesIndex = index) {
      this.indexedOperations[index] = operation;
      if (this.filteredChanges !== void 0) {
        setOperationAtIndex(this.allFilteredChanges, allChangesIndex);
        setOperationAtIndex(this.filteredChanges, index);
        this.root?.enqueueChangeTree(this, "filteredChanges");
      } else {
        setOperationAtIndex(this.allChanges, allChangesIndex);
        setOperationAtIndex(this.changes, index);
        this.root?.enqueueChangeTree(this, "changes");
      }
    }
    getType(index) {
      return (
        //
        // Get the child type from parent structure.
        // - ["string"] => "string"
        // - { map: "string" } => "string"
        // - { set: "string" } => "string"
        //
        this.ref[$childType] || // ArraySchema | MapSchema | SetSchema | CollectionSchema
        this.metadata[index].type
      );
    }
    getChange(index) {
      return this.indexedOperations[index];
    }
    //
    // used during `.encode()`
    //
    getValue(index, isEncodeAll = false) {
      return this.ref[$getByIndex](index, isEncodeAll);
    }
    delete(index, operation, allChangesIndex = index) {
      if (index === void 0) {
        try {
          throw new Error(`@colyseus/schema ${this.ref.constructor.name}: trying to delete non-existing index '${index}'`);
        } catch (e) {
          console.warn(e);
        }
        return;
      }
      const changeSet = this.filteredChanges !== void 0 ? this.filteredChanges : this.changes;
      this.indexedOperations[index] = operation ?? OPERATION.DELETE;
      setOperationAtIndex(changeSet, index);
      deleteOperationAtIndex(this.allChanges, allChangesIndex);
      const previousValue = this.getValue(index);
      if (previousValue && previousValue[$changes]) {
        this.root?.remove(previousValue[$changes]);
      }
      if (this.filteredChanges !== void 0) {
        deleteOperationAtIndex(this.allFilteredChanges, allChangesIndex);
        this.root?.enqueueChangeTree(this, "filteredChanges");
      } else {
        this.root?.enqueueChangeTree(this, "changes");
      }
      return previousValue;
    }
    endEncode(changeSetName) {
      this.indexedOperations = {};
      this[changeSetName] = createChangeSet();
      this.ref[$onEncodeEnd]?.();
      this.isNew = false;
    }
    discard(discardAll = false) {
      this.ref[$onEncodeEnd]?.();
      this.indexedOperations = {};
      this.changes = createChangeSet(this.changes.queueRootNode);
      if (this.filteredChanges !== void 0) {
        this.filteredChanges = createChangeSet(this.filteredChanges.queueRootNode);
      }
      if (discardAll) {
        this.allChanges = createChangeSet(this.allChanges.queueRootNode);
        if (this.allFilteredChanges !== void 0) {
          this.allFilteredChanges = createChangeSet(this.allFilteredChanges.queueRootNode);
        }
      }
    }
    /**
     * Recursively discard all changes from this, and child structures.
     * (Used in tests only)
     */
    discardAll() {
      const keys = Object.keys(this.indexedOperations);
      for (let i = 0, len3 = keys.length; i < len3; i++) {
        const value = this.getValue(Number(keys[i]));
        if (value && value[$changes]) {
          value[$changes].discardAll();
        }
      }
      this.discard();
    }
    get changed() {
      return Object.entries(this.indexedOperations).length > 0;
    }
    checkIsFiltered(parent, parentIndex, isNewChangeTree) {
      if (this.root.types.hasFilters) {
        this._checkFilteredByParent(parent, parentIndex);
        if (this.filteredChanges !== void 0) {
          this.root?.enqueueChangeTree(this, "filteredChanges");
          if (isNewChangeTree) {
            this.root?.enqueueChangeTree(this, "allFilteredChanges");
          }
        }
      }
      if (!this.isFiltered) {
        this.root?.enqueueChangeTree(this, "changes");
        if (isNewChangeTree) {
          this.root?.enqueueChangeTree(this, "allChanges");
        }
      }
    }
    _checkFilteredByParent(parent, parentIndex) {
      if (!parent) {
        return;
      }
      const refType = Metadata.isValidInstance(this.ref) ? this.ref.constructor : this.ref[$childType];
      let parentChangeTree;
      let parentIsCollection = !Metadata.isValidInstance(parent);
      if (parentIsCollection) {
        parentChangeTree = parent[$changes];
        parent = parentChangeTree.parent;
        parentIndex = parentChangeTree.parentIndex;
      } else {
        parentChangeTree = parent[$changes];
      }
      const parentConstructor = parent.constructor;
      let key = `${this.root.types.getTypeId(refType)}`;
      if (parentConstructor) {
        key += `-${this.root.types.schemas.get(parentConstructor)}`;
      }
      key += `-${parentIndex}`;
      const fieldHasViewTag = Metadata.hasViewTagAtIndex(parentConstructor?.[Symbol.metadata], parentIndex);
      this.isFiltered = parent[$changes].isFiltered || this.root.types.parentFiltered[key] || fieldHasViewTag;
      if (this.isFiltered) {
        this.isVisibilitySharedWithParent = parentChangeTree.isFiltered && typeof refType !== "string" && !fieldHasViewTag && parentIsCollection;
        if (!this.filteredChanges) {
          this.filteredChanges = createChangeSet();
          this.allFilteredChanges = createChangeSet();
        }
        if (this.changes.operations.length > 0) {
          this.changes.operations.forEach((index) => setOperationAtIndex(this.filteredChanges, index));
          this.allChanges.operations.forEach((index) => setOperationAtIndex(this.allFilteredChanges, index));
          this.changes = createChangeSet();
          this.allChanges = createChangeSet();
        }
      }
    }
    /**
     * Get the immediate parent
     */
    get parent() {
      return this.parentChain?.ref;
    }
    /**
     * Get the immediate parent index
     */
    get parentIndex() {
      return this.parentChain?.index;
    }
    /**
     * Add a parent to the chain
     */
    addParent(parent, index) {
      if (this.hasParent((p, _) => p[$changes] === parent[$changes])) {
        this.parentChain.index = index;
        return;
      }
      this.parentChain = {
        ref: parent,
        index,
        next: this.parentChain
      };
    }
    /**
     * Remove a parent from the chain
     * @param parent - The parent to remove
     * @returns true if parent was removed
     */
    removeParent(parent = this.parent) {
      let current = this.parentChain;
      let previous = null;
      while (current) {
        if (current.ref[$changes] === parent[$changes]) {
          if (previous) {
            previous.next = current.next;
          } else {
            this.parentChain = current.next;
          }
          return true;
        }
        previous = current;
        current = current.next;
      }
      return this.parentChain === void 0;
    }
    /**
     * Find a specific parent in the chain
     */
    findParent(predicate) {
      let current = this.parentChain;
      while (current) {
        if (predicate(current.ref, current.index)) {
          return current;
        }
        current = current.next;
      }
      return void 0;
    }
    /**
     * Check if this ChangeTree has a specific parent
     */
    hasParent(predicate) {
      return this.findParent(predicate) !== void 0;
    }
    /**
     * Get all parents as an array (for debugging/testing)
     */
    getAllParents() {
      const parents = [];
      let current = this.parentChain;
      while (current) {
        parents.push({ ref: current.ref, index: current.index });
        current = current.next;
      }
      return parents;
    }
  };
  function encodeValue(encoder, bytes, type, value, operation, it) {
    if (typeof type === "string") {
      encode[type]?.(bytes, value, it);
    } else if (type[Symbol.metadata] !== void 0) {
      encode.number(bytes, value[$refId], it);
      if ((operation & OPERATION.ADD) === OPERATION.ADD) {
        encoder.tryEncodeTypeId(bytes, type, value.constructor, it);
      }
    } else {
      encode.number(bytes, value[$refId], it);
    }
  }
  var encodeSchemaOperation = function(encoder, bytes, changeTree, index, operation, it, _, __, metadata) {
    bytes[it.offset++] = (index | operation) & 255;
    if (operation === OPERATION.DELETE) {
      return;
    }
    const ref = changeTree.ref;
    const field = metadata[index];
    encodeValue(encoder, bytes, metadata[index].type, ref[field.name], operation, it);
  };
  var encodeKeyValueOperation = function(encoder, bytes, changeTree, index, operation, it) {
    bytes[it.offset++] = operation & 255;
    encode.number(bytes, index, it);
    if (operation === OPERATION.DELETE) {
      return;
    }
    const ref = changeTree.ref;
    if ((operation & OPERATION.ADD) === OPERATION.ADD) {
      if (typeof ref["set"] === "function") {
        const dynamicIndex = changeTree.ref["$indexes"].get(index);
        encode.string(bytes, dynamicIndex, it);
      }
    }
    const type = ref[$childType];
    const value = ref[$getByIndex](index);
    encodeValue(encoder, bytes, type, value, operation, it);
  };
  var encodeArray = function(encoder, bytes, changeTree, field, operation, it, isEncodeAll, hasView) {
    const ref = changeTree.ref;
    const useOperationByRefId = hasView && changeTree.isFiltered && typeof changeTree.getType(field) !== "string";
    let refOrIndex;
    if (useOperationByRefId) {
      const item = ref["tmpItems"][field];
      if (!item) {
        return;
      }
      refOrIndex = item[$refId];
      if (operation === OPERATION.DELETE) {
        operation = OPERATION.DELETE_BY_REFID;
      } else if (operation === OPERATION.ADD) {
        operation = OPERATION.ADD_BY_REFID;
      }
    } else {
      refOrIndex = field;
    }
    bytes[it.offset++] = operation & 255;
    encode.number(bytes, refOrIndex, it);
    if (operation === OPERATION.DELETE || operation === OPERATION.DELETE_BY_REFID) {
      return;
    }
    const type = changeTree.getType(field);
    const value = changeTree.getValue(field, isEncodeAll);
    encodeValue(encoder, bytes, type, value, operation, it);
  };
  var DEFINITION_MISMATCH = -1;
  function decodeValue(decoder2, operation, ref, index, type, bytes, it, allChanges) {
    const $root = decoder2.root;
    const previousValue = ref[$getByIndex](index);
    let value;
    if ((operation & OPERATION.DELETE) === OPERATION.DELETE) {
      const previousRefId = previousValue?.[$refId];
      if (previousRefId !== void 0) {
        $root.removeRef(previousRefId);
      }
      if (operation !== OPERATION.DELETE_AND_ADD) {
        ref[$deleteByIndex](index);
      }
      value = void 0;
    }
    if (operation === OPERATION.DELETE)
      ;
    else if (Schema.is(type)) {
      const refId = decode.number(bytes, it);
      value = $root.refs.get(refId);
      if ((operation & OPERATION.ADD) === OPERATION.ADD) {
        const childType = decoder2.getInstanceType(bytes, it, type);
        if (!value) {
          value = decoder2.createInstanceOfType(childType);
        }
        $root.addRef(refId, value, value !== previousValue || // increment ref count if value has changed
        operation === OPERATION.DELETE_AND_ADD && value === previousValue);
      }
    } else if (typeof type === "string") {
      value = decode[type](bytes, it);
    } else {
      const typeDef = getType(Object.keys(type)[0]);
      const refId = decode.number(bytes, it);
      const valueRef = $root.refs.has(refId) ? previousValue || $root.refs.get(refId) : new typeDef.constructor();
      value = valueRef.clone(true);
      value[$childType] = Object.values(type)[0];
      if (previousValue) {
        let previousRefId = previousValue[$refId];
        if (previousRefId !== void 0 && refId !== previousRefId) {
          const entries = previousValue.entries();
          let iter;
          while ((iter = entries.next()) && !iter.done) {
            const [key, value2] = iter.value;
            if (typeof value2 === "object") {
              previousRefId = value2[$refId];
              $root.removeRef(previousRefId);
            }
            allChanges.push({
              ref: previousValue,
              refId: previousRefId,
              op: OPERATION.DELETE,
              field: key,
              value: void 0,
              previousValue: value2
            });
          }
        }
      }
      $root.addRef(refId, value, valueRef !== previousValue || operation === OPERATION.DELETE_AND_ADD && valueRef === previousValue);
    }
    return { value, previousValue };
  }
  var decodeSchemaOperation = function(decoder2, bytes, it, ref, allChanges) {
    const first_byte = bytes[it.offset++];
    const metadata = ref.constructor[Symbol.metadata];
    const operation = first_byte >> 6 << 6;
    const index = first_byte % (operation || 255);
    const field = metadata[index];
    if (field === void 0) {
      console.warn("@colyseus/schema: field not defined at", { index, ref: ref.constructor.name, metadata });
      return DEFINITION_MISMATCH;
    }
    const { value, previousValue } = decodeValue(decoder2, operation, ref, index, field.type, bytes, it, allChanges);
    if (value !== null && value !== void 0) {
      ref[field.name] = value;
    }
    if (previousValue !== value) {
      allChanges.push({
        ref,
        refId: decoder2.currentRefId,
        op: operation,
        field: field.name,
        value,
        previousValue
      });
    }
  };
  var decodeKeyValueOperation = function(decoder2, bytes, it, ref, allChanges) {
    const operation = bytes[it.offset++];
    if (operation === OPERATION.CLEAR) {
      decoder2.removeChildRefs(ref, allChanges);
      ref.clear();
      return;
    }
    const index = decode.number(bytes, it);
    const type = ref[$childType];
    let dynamicIndex;
    if ((operation & OPERATION.ADD) === OPERATION.ADD) {
      if (typeof ref["set"] === "function") {
        dynamicIndex = decode.string(bytes, it);
        ref["setIndex"](index, dynamicIndex);
      } else {
        dynamicIndex = index;
      }
    } else {
      dynamicIndex = ref["getIndex"](index);
    }
    const { value, previousValue } = decodeValue(decoder2, operation, ref, index, type, bytes, it, allChanges);
    if (value !== null && value !== void 0) {
      if (typeof ref["set"] === "function") {
        ref["$items"].set(dynamicIndex, value);
      } else if (typeof ref["$setAt"] === "function") {
        ref["$setAt"](index, value, operation);
      } else if (typeof ref["add"] === "function") {
        const index2 = ref.add(value);
        if (typeof index2 === "number") {
          ref["setIndex"](index2, index2);
        }
      }
    }
    if (previousValue !== value) {
      allChanges.push({
        ref,
        refId: decoder2.currentRefId,
        op: operation,
        field: "",
        // FIXME: remove this
        dynamicIndex,
        value,
        previousValue
      });
    }
  };
  var decodeArray = function(decoder2, bytes, it, ref, allChanges) {
    let operation = bytes[it.offset++];
    let index;
    if (operation === OPERATION.CLEAR) {
      decoder2.removeChildRefs(ref, allChanges);
      ref.clear();
      return;
    } else if (operation === OPERATION.REVERSE) {
      ref.reverse();
      return;
    } else if (operation === OPERATION.DELETE_BY_REFID) {
      const refId = decode.number(bytes, it);
      const previousValue2 = decoder2.root.refs.get(refId);
      index = ref.findIndex((value2) => value2 === previousValue2);
      ref[$deleteByIndex](index);
      allChanges.push({
        ref,
        refId: decoder2.currentRefId,
        op: OPERATION.DELETE,
        field: "",
        // FIXME: remove this
        dynamicIndex: index,
        value: void 0,
        previousValue: previousValue2
      });
      return;
    } else if (operation === OPERATION.ADD_BY_REFID) {
      const refId = decode.number(bytes, it);
      const itemByRefId = decoder2.root.refs.get(refId);
      if (itemByRefId) {
        index = ref.findIndex((value2) => value2 === itemByRefId);
      }
      if (index === -1 || index === void 0) {
        index = ref.length;
      }
    } else {
      index = decode.number(bytes, it);
    }
    const type = ref[$childType];
    let dynamicIndex = index;
    const { value, previousValue } = decodeValue(decoder2, operation, ref, index, type, bytes, it, allChanges);
    if (value !== null && value !== void 0 && value !== previousValue) {
      ref["$setAt"](index, value, operation);
    }
    if (previousValue !== value) {
      allChanges.push({
        ref,
        refId: decoder2.currentRefId,
        op: operation,
        field: "",
        // FIXME: remove this
        dynamicIndex,
        value,
        previousValue
      });
    }
  };
  var EncodeSchemaError = class extends Error {
  };
  function assertType(value, type, klass, field) {
    let typeofTarget;
    let allowNull = false;
    switch (type) {
      case "number":
      case "int8":
      case "uint8":
      case "int16":
      case "uint16":
      case "int32":
      case "uint32":
      case "int64":
      case "uint64":
      case "float32":
      case "float64":
        typeofTarget = "number";
        if (isNaN(value)) {
          console.log(`trying to encode "NaN" in ${klass.constructor.name}#${field}`);
        }
        break;
      case "bigint64":
      case "biguint64":
        typeofTarget = "bigint";
        break;
      case "string":
        typeofTarget = "string";
        allowNull = true;
        break;
      case "boolean":
        return;
      default:
        return;
    }
    if (typeof value !== typeofTarget && (!allowNull || allowNull && value !== null)) {
      let foundValue = `'${JSON.stringify(value)}'${value && value.constructor && ` (${value.constructor.name})` || ""}`;
      throw new EncodeSchemaError(`a '${typeofTarget}' was expected, but ${foundValue} was provided in ${klass.constructor.name}#${field}`);
    }
  }
  function assertInstanceType(value, type, instance, field) {
    if (!(value instanceof type)) {
      throw new EncodeSchemaError(`a '${type.name}' was expected, but '${value && value.constructor.name}' was provided in ${instance.constructor.name}#${field}`);
    }
  }
  var DEFAULT_SORT = (a, b) => {
    const A = a.toString();
    const B = b.toString();
    if (A < B)
      return -1;
    else if (A > B)
      return 1;
    else
      return 0;
  };
  var _a, _b, _c, _d, _e, _f;
  var _ArraySchema = class _ArraySchema {
    constructor(...items) {
      __publicField(this, _a);
      __publicField(this, _b);
      __publicField(this, _c);
      __publicField(this, "items", []);
      __publicField(this, "tmpItems", []);
      __publicField(this, "deletedIndexes", {});
      __publicField(this, "isMovingItems", false);
      // WORKAROUND for compatibility
      // - TypeScript 4 defines @@unscopables as a function
      // - TypeScript 5 defines @@unscopables as an object
      __publicField(this, _f);
      Object.defineProperty(this, $childType, {
        value: void 0,
        enumerable: false,
        writable: true,
        configurable: true
      });
      const proxy = new Proxy(this, {
        get: (obj, prop) => {
          if (typeof prop !== "symbol" && // FIXME: d8 accuses this as low performance
          !isNaN(prop)) {
            return this.items[prop];
          } else {
            return Reflect.get(obj, prop);
          }
        },
        set: (obj, key, setValue) => {
          if (typeof key !== "symbol" && !isNaN(key)) {
            if (setValue === void 0 || setValue === null) {
              obj.$deleteAt(key);
            } else {
              if (setValue[$changes]) {
                assertInstanceType(setValue, obj[$childType], obj, key);
                const previousValue = obj.items[key];
                if (!obj.isMovingItems) {
                  obj.$changeAt(Number(key), setValue);
                } else {
                  if (previousValue !== void 0) {
                    if (setValue[$changes].isNew) {
                      obj[$changes].indexedOperation(Number(key), OPERATION.MOVE_AND_ADD);
                    } else {
                      if ((obj[$changes].getChange(Number(key)) & OPERATION.DELETE) === OPERATION.DELETE) {
                        obj[$changes].indexedOperation(Number(key), OPERATION.DELETE_AND_MOVE);
                      } else {
                        obj[$changes].indexedOperation(Number(key), OPERATION.MOVE);
                      }
                    }
                  } else if (setValue[$changes].isNew) {
                    obj[$changes].indexedOperation(Number(key), OPERATION.ADD);
                  }
                  setValue[$changes].setParent(this, obj[$changes].root, key);
                }
                if (previousValue !== void 0) {
                  previousValue[$changes].root?.remove(previousValue[$changes]);
                }
              } else {
                obj.$changeAt(Number(key), setValue);
              }
              obj.items[key] = setValue;
              obj.tmpItems[key] = setValue;
            }
            return true;
          } else {
            return Reflect.set(obj, key, setValue);
          }
        },
        deleteProperty: (obj, prop) => {
          if (typeof prop === "number") {
            obj.$deleteAt(prop);
          } else {
            delete obj[prop];
          }
          return true;
        },
        has: (obj, key) => {
          if (typeof key !== "symbol" && !isNaN(Number(key))) {
            return Reflect.has(this.items, key);
          }
          return Reflect.has(obj, key);
        }
      });
      Object.defineProperty(this, $changes, {
        value: new ChangeTree(proxy),
        enumerable: false,
        writable: true
      });
      if (items.length > 0) {
        this.push(...items);
      }
      return proxy;
    }
    /**
     * Determine if a property must be filtered.
     * - If returns false, the property is NOT going to be encoded.
     * - If returns true, the property is going to be encoded.
     *
     * Encoding with "filters" happens in two steps:
     * - First, the encoder iterates over all "not owned" properties and encodes them.
     * - Then, the encoder iterates over all "owned" properties per instance and encodes them.
     */
    static [(_a = $changes, _b = $refId, _c = $childType, _d = $encoder, _e = $decoder, $filter)](ref, index, view2) {
      return !view2 || typeof ref[$childType] === "string" || view2.isChangeTreeVisible(ref["tmpItems"][index]?.[$changes]);
    }
    static is(type) {
      return (
        // type format: ["string"]
        Array.isArray(type) || // type format: { array: "string" }
        type["array"] !== void 0
      );
    }
    static from(iterable) {
      return new _ArraySchema(...Array.from(iterable));
    }
    set length(newLength) {
      if (newLength === 0) {
        this.clear();
      } else if (newLength < this.items.length) {
        this.splice(newLength, this.length - newLength);
      } else {
        console.warn("ArraySchema: can't set .length to a higher value than its length.");
      }
    }
    get length() {
      return this.items.length;
    }
    push(...values) {
      let length = this.tmpItems.length;
      const changeTree = this[$changes];
      for (let i = 0, l = values.length; i < l; i++, length++) {
        const value = values[i];
        if (value === void 0 || value === null) {
          return;
        } else if (typeof value === "object" && this[$childType]) {
          assertInstanceType(value, this[$childType], this, i);
        }
        changeTree.indexedOperation(length, OPERATION.ADD, this.items.length);
        this.items.push(value);
        this.tmpItems.push(value);
        value[$changes]?.setParent(this, changeTree.root, length);
      }
      return length;
    }
    /**
     * Removes the last element from an array and returns it.
     */
    pop() {
      let index = -1;
      for (let i = this.tmpItems.length - 1; i >= 0; i--) {
        if (this.deletedIndexes[i] !== true) {
          index = i;
          break;
        }
      }
      if (index < 0) {
        return void 0;
      }
      this[$changes].delete(index, void 0, this.items.length - 1);
      this.deletedIndexes[index] = true;
      return this.items.pop();
    }
    at(index) {
      if (index < 0)
        index += this.length;
      return this.items[index];
    }
    // encoding only
    $changeAt(index, value) {
      if (value === void 0 || value === null) {
        console.error("ArraySchema items cannot be null nor undefined; Use `deleteAt(index)` instead.");
        return;
      }
      if (this.items[index] === value) {
        return;
      }
      const operation = this.items[index] !== void 0 ? typeof value === "object" ? OPERATION.DELETE_AND_ADD : OPERATION.REPLACE : OPERATION.ADD;
      const changeTree = this[$changes];
      changeTree.change(index, operation);
      value[$changes]?.setParent(this, changeTree.root, index);
    }
    // encoding only
    $deleteAt(index, operation) {
      this[$changes].delete(index, operation);
    }
    // decoding only
    $setAt(index, value, operation) {
      if (index === 0 && operation === OPERATION.ADD && this.items[index] !== void 0) {
        this.items.unshift(value);
      } else if (operation === OPERATION.DELETE_AND_MOVE) {
        this.items.splice(index, 1);
        this.items[index] = value;
      } else {
        this.items[index] = value;
      }
    }
    clear() {
      if (this.items.length === 0) {
        return;
      }
      const changeTree = this[$changes];
      changeTree.forEachChild((childChangeTree, _) => {
        changeTree.root?.remove(childChangeTree);
      });
      changeTree.discard(true);
      changeTree.operation(OPERATION.CLEAR);
      this.items.length = 0;
      this.tmpItems.length = 0;
    }
    /**
     * Combines two or more arrays.
     * @param items Additional items to add to the end of array1.
     */
    // @ts-ignore
    concat(...items) {
      return new _ArraySchema(...this.items.concat(...items));
    }
    /**
     * Adds all the elements of an array separated by the specified separator string.
     * @param separator A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.
     */
    join(separator) {
      return this.items.join(separator);
    }
    /**
     * Reverses the elements in an Array.
     */
    // @ts-ignore
    reverse() {
      this[$changes].operation(OPERATION.REVERSE);
      this.items.reverse();
      this.tmpItems.reverse();
      return this;
    }
    /**
     * Removes the first element from an array and returns it.
     */
    shift() {
      if (this.items.length === 0) {
        return void 0;
      }
      const changeTree = this[$changes];
      const index = this.tmpItems.findIndex((item) => item === this.items[0]);
      const allChangesIndex = this.items.findIndex((item) => item === this.items[0]);
      changeTree.delete(index, OPERATION.DELETE, allChangesIndex);
      changeTree.shiftAllChangeIndexes(-1, allChangesIndex);
      this.deletedIndexes[index] = true;
      return this.items.shift();
    }
    /**
     * Returns a section of an array.
     * @param start The beginning of the specified portion of the array.
     * @param end The end of the specified portion of the array. This is exclusive of the element at the index 'end'.
     */
    slice(start, end) {
      const sliced = new _ArraySchema();
      sliced.push(...this.items.slice(start, end));
      return sliced;
    }
    /**
     * Sorts an array.
     * @param compareFn Function used to determine the order of the elements. It is expected to return
     * a negative value if first argument is less than second argument, zero if they're equal and a positive
     * value otherwise. If omitted, the elements are sorted in ascending, ASCII character order.
     * ```ts
     * [11,2,22,1].sort((a, b) => a - b)
     * ```
     */
    sort(compareFn = DEFAULT_SORT) {
      this.isMovingItems = true;
      const changeTree = this[$changes];
      const sortedItems = this.items.sort(compareFn);
      sortedItems.forEach((_, i) => changeTree.change(i, OPERATION.REPLACE));
      this.tmpItems.sort(compareFn);
      this.isMovingItems = false;
      return this;
    }
    /**
     * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
     * @param start The zero-based location in the array from which to start removing elements.
     * @param deleteCount The number of elements to remove.
     * @param insertItems Elements to insert into the array in place of the deleted elements.
     */
    splice(start, deleteCount, ...insertItems) {
      const changeTree = this[$changes];
      const itemsLength = this.items.length;
      const tmpItemsLength = this.tmpItems.length;
      const insertCount = insertItems.length;
      const indexes = [];
      for (let i = 0; i < tmpItemsLength; i++) {
        if (this.deletedIndexes[i] !== true) {
          indexes.push(i);
        }
      }
      if (itemsLength > start) {
        if (deleteCount === void 0) {
          deleteCount = itemsLength - start;
        }
        for (let i = start; i < start + deleteCount; i++) {
          const index = indexes[i];
          changeTree.delete(index, OPERATION.DELETE);
          this.deletedIndexes[index] = true;
        }
      } else {
        deleteCount = 0;
      }
      if (insertCount > 0) {
        if (insertCount > deleteCount) {
          console.error("Inserting more elements than deleting during ArraySchema#splice()");
          throw new Error("ArraySchema#splice(): insertCount must be equal or lower than deleteCount.");
        }
        for (let i = 0; i < insertCount; i++) {
          const addIndex = (indexes[start] ?? itemsLength) + i;
          changeTree.indexedOperation(addIndex, this.deletedIndexes[addIndex] ? OPERATION.DELETE_AND_ADD : OPERATION.ADD);
          insertItems[i][$changes]?.setParent(this, changeTree.root, addIndex);
        }
      }
      if (deleteCount > insertCount) {
        changeTree.shiftAllChangeIndexes(-(deleteCount - insertCount), indexes[start + insertCount]);
      }
      if (changeTree.filteredChanges !== void 0) {
        changeTree.root?.enqueueChangeTree(changeTree, "filteredChanges");
      } else {
        changeTree.root?.enqueueChangeTree(changeTree, "changes");
      }
      return this.items.splice(start, deleteCount, ...insertItems);
    }
    /**
     * Inserts new elements at the start of an array.
     * @param items  Elements to insert at the start of the Array.
     */
    unshift(...items) {
      const changeTree = this[$changes];
      changeTree.shiftChangeIndexes(items.length);
      if (changeTree.isFiltered) {
        setOperationAtIndex(changeTree.filteredChanges, this.items.length);
      } else {
        setOperationAtIndex(changeTree.allChanges, this.items.length);
      }
      items.forEach((_, index) => {
        changeTree.change(index, OPERATION.ADD);
      });
      this.tmpItems.unshift(...items);
      return this.items.unshift(...items);
    }
    /**
     * Returns the index of the first occurrence of a value in an array.
     * @param searchElement The value to locate in the array.
     * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
     */
    indexOf(searchElement, fromIndex) {
      return this.items.indexOf(searchElement, fromIndex);
    }
    /**
     * Returns the index of the last occurrence of a specified value in an array.
     * @param searchElement The value to locate in the array.
     * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at the last index in the array.
     */
    lastIndexOf(searchElement, fromIndex = this.length - 1) {
      return this.items.lastIndexOf(searchElement, fromIndex);
    }
    every(callbackfn, thisArg) {
      return this.items.every(callbackfn, thisArg);
    }
    /**
     * Determines whether the specified callback function returns true for any element of an array.
     * @param callbackfn A function that accepts up to three arguments. The some method calls
     * the callbackfn function for each element in the array until the callbackfn returns a value
     * which is coercible to the Boolean value true, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function.
     * If thisArg is omitted, undefined is used as the this value.
     */
    some(callbackfn, thisArg) {
      return this.items.some(callbackfn, thisArg);
    }
    /**
     * Performs the specified action for each element in an array.
     * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.
     * @param thisArg  An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    forEach(callbackfn, thisArg) {
      return this.items.forEach(callbackfn, thisArg);
    }
    /**
     * Calls a defined callback function on each element of an array, and returns an array that contains the results.
     * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    map(callbackfn, thisArg) {
      return this.items.map(callbackfn, thisArg);
    }
    filter(callbackfn, thisArg) {
      return this.items.filter(callbackfn, thisArg);
    }
    /**
     * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
     * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    reduce(callbackfn, initialValue) {
      return this.items.reduce(callbackfn, initialValue);
    }
    /**
     * Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
     * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
     */
    reduceRight(callbackfn, initialValue) {
      return this.items.reduceRight(callbackfn, initialValue);
    }
    /**
     * Returns the value of the first element in the array where predicate is true, and undefined
     * otherwise.
     * @param predicate find calls predicate once for each element of the array, in ascending
     * order, until it finds one where predicate returns true. If such an element is found, find
     * immediately returns that element value. Otherwise, find returns undefined.
     * @param thisArg If provided, it will be used as the this value for each invocation of
     * predicate. If it is not provided, undefined is used instead.
     */
    find(predicate, thisArg) {
      return this.items.find(predicate, thisArg);
    }
    /**
     * Returns the index of the first element in the array where predicate is true, and -1
     * otherwise.
     * @param predicate find calls predicate once for each element of the array, in ascending
     * order, until it finds one where predicate returns true. If such an element is found,
     * findIndex immediately returns that element index. Otherwise, findIndex returns -1.
     * @param thisArg If provided, it will be used as the this value for each invocation of
     * predicate. If it is not provided, undefined is used instead.
     */
    findIndex(predicate, thisArg) {
      return this.items.findIndex(predicate, thisArg);
    }
    /**
     * Returns the this object after filling the section identified by start and end with value
     * @param value value to fill array section with
     * @param start index to start filling the array at. If start is negative, it is treated as
     * length+start where length is the length of the array.
     * @param end index to stop filling the array at. If end is negative, it is treated as
     * length+end.
     */
    fill(value, start, end) {
      throw new Error("ArraySchema#fill() not implemented");
    }
    /**
     * Returns the this object after copying a section of the array identified by start and end
     * to the same array starting at position target
     * @param target If target is negative, it is treated as length+target where length is the
     * length of the array.
     * @param start If start is negative, it is treated as length+start. If end is negative, it
     * is treated as length+end.
     * @param end If not specified, length of the this object is used as its default value.
     */
    copyWithin(target2, start, end) {
      throw new Error("ArraySchema#copyWithin() not implemented");
    }
    /**
     * Returns a string representation of an array.
     */
    toString() {
      return this.items.toString();
    }
    /**
     * Returns a string representation of an array. The elements are converted to string using their toLocalString methods.
     */
    toLocaleString() {
      return this.items.toLocaleString();
    }
    /** Iterator */
    [Symbol.iterator]() {
      return this.items[Symbol.iterator]();
    }
    static get [Symbol.species]() {
      return _ArraySchema;
    }
    /**
     * Returns an iterable of key, value pairs for every entry in the array
     */
    entries() {
      return this.items.entries();
    }
    /**
     * Returns an iterable of keys in the array
     */
    keys() {
      return this.items.keys();
    }
    /**
     * Returns an iterable of values in the array
     */
    values() {
      return this.items.values();
    }
    /**
     * Determines whether an array includes a certain element, returning true or false as appropriate.
     * @param searchElement The element to search for.
     * @param fromIndex The position in this array at which to begin searching for searchElement.
     */
    includes(searchElement, fromIndex) {
      return this.items.includes(searchElement, fromIndex);
    }
    //
    // ES2022
    //
    /**
     * Calls a defined callback function on each element of an array. Then, flattens the result into
     * a new array.
     * This is identical to a map followed by flat with depth 1.
     *
     * @param callback A function that accepts up to three arguments. The flatMap method calls the
     * callback function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callback function. If
     * thisArg is omitted, undefined is used as the this value.
     */
    // @ts-ignore
    flatMap(callback, thisArg) {
      throw new Error("ArraySchema#flatMap() is not supported.");
    }
    /**
     * Returns a new array with all sub-array elements concatenated into it recursively up to the
     * specified depth.
     *
     * @param depth The maximum recursion depth
     */
    // @ts-ignore
    flat(depth) {
      throw new Error("ArraySchema#flat() is not supported.");
    }
    findLast() {
      return this.items.findLast.apply(this.items, arguments);
    }
    findLastIndex(...args) {
      return this.items.findLastIndex.apply(this.items, arguments);
    }
    //
    // ES2023
    //
    with(index, value) {
      const copy2 = this.items.slice();
      if (index < 0)
        index += this.length;
      copy2[index] = value;
      return new _ArraySchema(...copy2);
    }
    toReversed() {
      return this.items.slice().reverse();
    }
    toSorted(compareFn) {
      return this.items.slice().sort(compareFn);
    }
    // @ts-ignore
    toSpliced(start, deleteCount, ...items) {
      return this.items.toSpliced.apply(copy, arguments);
    }
    shuffle() {
      return this.move((_) => {
        let currentIndex = this.items.length;
        while (currentIndex != 0) {
          let randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;
          [this[currentIndex], this[randomIndex]] = [this[randomIndex], this[currentIndex]];
        }
      });
    }
    /**
     * Allows to move items around in the array.
     *
     * Example:
     *     state.cards.move((cards) => {
     *         [cards[4], cards[3]] = [cards[3], cards[4]];
     *         [cards[3], cards[2]] = [cards[2], cards[3]];
     *         [cards[2], cards[0]] = [cards[0], cards[2]];
     *         [cards[1], cards[1]] = [cards[1], cards[1]];
     *         [cards[0], cards[0]] = [cards[0], cards[0]];
     *     })
     *
     * @param cb
     * @returns
     */
    move(cb) {
      this.isMovingItems = true;
      cb(this);
      this.isMovingItems = false;
      return this;
    }
    [(_f = Symbol.unscopables, $getByIndex)](index, isEncodeAll = false) {
      return isEncodeAll ? this.items[index] : this.deletedIndexes[index] ? this.items[index] : this.tmpItems[index] || this.items[index];
    }
    [$deleteByIndex](index) {
      this.items[index] = void 0;
      this.tmpItems[index] = void 0;
    }
    [$onEncodeEnd]() {
      this.tmpItems = this.items.slice();
      this.deletedIndexes = {};
    }
    [$onDecodeEnd]() {
      this.items = this.items.filter((item) => item !== void 0);
      this.tmpItems = this.items.slice();
    }
    toArray() {
      return this.items.slice(0);
    }
    toJSON() {
      return this.toArray().map((value) => {
        return typeof value["toJSON"] === "function" ? value["toJSON"]() : value;
      });
    }
    //
    // Decoding utilities
    //
    clone(isDecoding) {
      let cloned;
      if (isDecoding) {
        cloned = new _ArraySchema();
        cloned.push(...this.items);
      } else {
        cloned = new _ArraySchema(...this.map((item) => item[$changes] ? item.clone() : item));
      }
      return cloned;
    }
  };
  __publicField(_ArraySchema, _d, encodeArray);
  __publicField(_ArraySchema, _e, decodeArray);
  var ArraySchema = _ArraySchema;
  registerType("array", { constructor: ArraySchema });
  var _a2, _b2, _c2, _d2, _e2;
  var _MapSchema = class _MapSchema {
    constructor(initialValues) {
      __publicField(this, _a2);
      __publicField(this, _b2);
      __publicField(this, "childType");
      __publicField(this, _c2);
      __publicField(this, "$items", /* @__PURE__ */ new Map());
      __publicField(this, "$indexes", /* @__PURE__ */ new Map());
      __publicField(this, "deletedItems", {});
      const changeTree = new ChangeTree(this);
      changeTree.indexes = {};
      Object.defineProperty(this, $changes, {
        value: changeTree,
        enumerable: false,
        writable: true
      });
      if (initialValues) {
        if (initialValues instanceof Map || initialValues instanceof _MapSchema) {
          initialValues.forEach((v, k) => this.set(k, v));
        } else {
          for (const k in initialValues) {
            this.set(k, initialValues[k]);
          }
        }
      }
      Object.defineProperty(this, $childType, {
        value: void 0,
        enumerable: false,
        writable: true,
        configurable: true
      });
    }
    /**
     * Determine if a property must be filtered.
     * - If returns false, the property is NOT going to be encoded.
     * - If returns true, the property is going to be encoded.
     *
     * Encoding with "filters" happens in two steps:
     * - First, the encoder iterates over all "not owned" properties and encodes them.
     * - Then, the encoder iterates over all "owned" properties per instance and encodes them.
     */
    static [(_a2 = $changes, _b2 = $refId, _c2 = $childType, _d2 = $encoder, _e2 = $decoder, $filter)](ref, index, view2) {
      return !view2 || typeof ref[$childType] === "string" || view2.isChangeTreeVisible((ref[$getByIndex](index) ?? ref.deletedItems[index])[$changes]);
    }
    static is(type) {
      return type["map"] !== void 0;
    }
    /** Iterator */
    [Symbol.iterator]() {
      return this.$items[Symbol.iterator]();
    }
    get [Symbol.toStringTag]() {
      return this.$items[Symbol.toStringTag];
    }
    static get [Symbol.species]() {
      return _MapSchema;
    }
    set(key, value) {
      if (value === void 0 || value === null) {
        throw new Error(`MapSchema#set('${key}', ${value}): trying to set ${value} value on '${key}'.`);
      } else if (typeof value === "object" && this[$childType]) {
        assertInstanceType(value, this[$childType], this, key);
      }
      key = key.toString();
      const changeTree = this[$changes];
      const isRef = value[$changes] !== void 0;
      let index;
      let operation;
      if (typeof changeTree.indexes[key] !== "undefined") {
        index = changeTree.indexes[key];
        operation = OPERATION.REPLACE;
        const previousValue = this.$items.get(key);
        if (previousValue === value) {
          return;
        } else if (isRef) {
          operation = OPERATION.DELETE_AND_ADD;
          if (previousValue !== void 0) {
            previousValue[$changes].root?.remove(previousValue[$changes]);
          }
        }
        if (this.deletedItems[index]) {
          delete this.deletedItems[index];
        }
      } else {
        index = changeTree.indexes[$numFields] ?? 0;
        operation = OPERATION.ADD;
        this.$indexes.set(index, key);
        changeTree.indexes[key] = index;
        changeTree.indexes[$numFields] = index + 1;
      }
      this.$items.set(key, value);
      changeTree.change(index, operation);
      if (isRef) {
        value[$changes].setParent(this, changeTree.root, index);
      }
      return this;
    }
    get(key) {
      return this.$items.get(key);
    }
    delete(key) {
      if (!this.$items.has(key)) {
        return false;
      }
      const index = this[$changes].indexes[key];
      this.deletedItems[index] = this[$changes].delete(index);
      return this.$items.delete(key);
    }
    clear() {
      const changeTree = this[$changes];
      changeTree.discard(true);
      changeTree.indexes = {};
      changeTree.forEachChild((childChangeTree, _) => {
        changeTree.root?.remove(childChangeTree);
      });
      this.$indexes.clear();
      this.$items.clear();
      changeTree.operation(OPERATION.CLEAR);
    }
    has(key) {
      return this.$items.has(key);
    }
    forEach(callbackfn) {
      this.$items.forEach(callbackfn);
    }
    entries() {
      return this.$items.entries();
    }
    keys() {
      return this.$items.keys();
    }
    values() {
      return this.$items.values();
    }
    get size() {
      return this.$items.size;
    }
    setIndex(index, key) {
      this.$indexes.set(index, key);
    }
    getIndex(index) {
      return this.$indexes.get(index);
    }
    [$getByIndex](index) {
      return this.$items.get(this.$indexes.get(index));
    }
    [$deleteByIndex](index) {
      const key = this.$indexes.get(index);
      this.$items.delete(key);
      this.$indexes.delete(index);
    }
    [$onEncodeEnd]() {
      const changeTree = this[$changes];
      for (const indexStr in this.deletedItems) {
        const index = parseInt(indexStr);
        const key = this.$indexes.get(index);
        delete changeTree.indexes[key];
        this.$indexes.delete(index);
      }
      this.deletedItems = {};
    }
    toJSON() {
      const map = {};
      this.forEach((value, key) => {
        map[key] = typeof value["toJSON"] === "function" ? value["toJSON"]() : value;
      });
      return map;
    }
    //
    // Decoding utilities
    //
    // @ts-ignore
    clone(isDecoding) {
      let cloned;
      if (isDecoding) {
        cloned = Object.assign(new _MapSchema(), this);
      } else {
        cloned = new _MapSchema();
        this.forEach((value, key) => {
          if (value[$changes]) {
            cloned.set(key, value["clone"]());
          } else {
            cloned.set(key, value);
          }
        });
      }
      return cloned;
    }
  };
  __publicField(_MapSchema, _d2, encodeKeyValueOperation);
  __publicField(_MapSchema, _e2, decodeKeyValueOperation);
  var MapSchema = _MapSchema;
  registerType("map", { constructor: MapSchema });
  var _a3, _b3, _c3, _d3, _e3;
  var _CollectionSchema = class _CollectionSchema {
    constructor(initialValues) {
      __publicField(this, _a3);
      __publicField(this, _b3);
      __publicField(this, _c3);
      __publicField(this, "$items", /* @__PURE__ */ new Map());
      __publicField(this, "$indexes", /* @__PURE__ */ new Map());
      __publicField(this, "deletedItems", {});
      __publicField(this, "$refId", 0);
      this[$changes] = new ChangeTree(this);
      this[$changes].indexes = {};
      if (initialValues) {
        initialValues.forEach((v) => this.add(v));
      }
      Object.defineProperty(this, $childType, {
        value: void 0,
        enumerable: false,
        writable: true,
        configurable: true
      });
    }
    /**
     * Determine if a property must be filtered.
     * - If returns false, the property is NOT going to be encoded.
     * - If returns true, the property is going to be encoded.
     *
     * Encoding with "filters" happens in two steps:
     * - First, the encoder iterates over all "not owned" properties and encodes them.
     * - Then, the encoder iterates over all "owned" properties per instance and encodes them.
     */
    static [(_a3 = $changes, _b3 = $refId, _c3 = $childType, _d3 = $encoder, _e3 = $decoder, $filter)](ref, index, view2) {
      return !view2 || typeof ref[$childType] === "string" || view2.isChangeTreeVisible((ref[$getByIndex](index) ?? ref.deletedItems[index])[$changes]);
    }
    static is(type) {
      return type["collection"] !== void 0;
    }
    add(value) {
      const index = this.$refId++;
      const isRef = value[$changes] !== void 0;
      if (isRef) {
        value[$changes].setParent(this, this[$changes].root, index);
      }
      this[$changes].indexes[index] = index;
      this.$indexes.set(index, index);
      this.$items.set(index, value);
      this[$changes].change(index);
      return index;
    }
    at(index) {
      const key = Array.from(this.$items.keys())[index];
      return this.$items.get(key);
    }
    entries() {
      return this.$items.entries();
    }
    delete(item) {
      const entries = this.$items.entries();
      let index;
      let entry;
      while (entry = entries.next()) {
        if (entry.done) {
          break;
        }
        if (item === entry.value[1]) {
          index = entry.value[0];
          break;
        }
      }
      if (index === void 0) {
        return false;
      }
      this.deletedItems[index] = this[$changes].delete(index);
      this.$indexes.delete(index);
      return this.$items.delete(index);
    }
    clear() {
      const changeTree = this[$changes];
      changeTree.discard(true);
      changeTree.indexes = {};
      changeTree.forEachChild((childChangeTree, _) => {
        changeTree.root?.remove(childChangeTree);
      });
      this.$indexes.clear();
      this.$items.clear();
      changeTree.operation(OPERATION.CLEAR);
    }
    has(value) {
      return Array.from(this.$items.values()).some((v) => v === value);
    }
    forEach(callbackfn) {
      this.$items.forEach((value, key, _) => callbackfn(value, key, this));
    }
    values() {
      return this.$items.values();
    }
    get size() {
      return this.$items.size;
    }
    /** Iterator */
    [Symbol.iterator]() {
      return this.$items.values();
    }
    setIndex(index, key) {
      this.$indexes.set(index, key);
    }
    getIndex(index) {
      return this.$indexes.get(index);
    }
    [$getByIndex](index) {
      return this.$items.get(this.$indexes.get(index));
    }
    [$deleteByIndex](index) {
      const key = this.$indexes.get(index);
      this.$items.delete(key);
      this.$indexes.delete(index);
    }
    [$onEncodeEnd]() {
      this.deletedItems = {};
    }
    toArray() {
      return Array.from(this.$items.values());
    }
    toJSON() {
      const values = [];
      this.forEach((value, key) => {
        values.push(typeof value["toJSON"] === "function" ? value["toJSON"]() : value);
      });
      return values;
    }
    //
    // Decoding utilities
    //
    clone(isDecoding) {
      let cloned;
      if (isDecoding) {
        cloned = Object.assign(new _CollectionSchema(), this);
      } else {
        cloned = new _CollectionSchema();
        this.forEach((value) => {
          if (value[$changes]) {
            cloned.add(value["clone"]());
          } else {
            cloned.add(value);
          }
        });
      }
      return cloned;
    }
  };
  __publicField(_CollectionSchema, _d3, encodeKeyValueOperation);
  __publicField(_CollectionSchema, _e3, decodeKeyValueOperation);
  var CollectionSchema = _CollectionSchema;
  registerType("collection", { constructor: CollectionSchema });
  var _a4, _b4, _c4, _d4, _e4;
  var _SetSchema = class _SetSchema {
    constructor(initialValues) {
      __publicField(this, _a4);
      __publicField(this, _b4);
      __publicField(this, _c4);
      __publicField(this, "$items", /* @__PURE__ */ new Map());
      __publicField(this, "$indexes", /* @__PURE__ */ new Map());
      __publicField(this, "deletedItems", {});
      __publicField(this, "$refId", 0);
      this[$changes] = new ChangeTree(this);
      this[$changes].indexes = {};
      if (initialValues) {
        initialValues.forEach((v) => this.add(v));
      }
      Object.defineProperty(this, $childType, {
        value: void 0,
        enumerable: false,
        writable: true,
        configurable: true
      });
    }
    /**
     * Determine if a property must be filtered.
     * - If returns false, the property is NOT going to be encoded.
     * - If returns true, the property is going to be encoded.
     *
     * Encoding with "filters" happens in two steps:
     * - First, the encoder iterates over all "not owned" properties and encodes them.
     * - Then, the encoder iterates over all "owned" properties per instance and encodes them.
     */
    static [(_a4 = $changes, _b4 = $refId, _c4 = $childType, _d4 = $encoder, _e4 = $decoder, $filter)](ref, index, view2) {
      return !view2 || typeof ref[$childType] === "string" || view2.visible.has((ref[$getByIndex](index) ?? ref.deletedItems[index])[$changes]);
    }
    static is(type) {
      return type["set"] !== void 0;
    }
    add(value) {
      if (this.has(value)) {
        return false;
      }
      const index = this.$refId++;
      if (value[$changes] !== void 0) {
        value[$changes].setParent(this, this[$changes].root, index);
      }
      const operation = this[$changes].indexes[index]?.op ?? OPERATION.ADD;
      this[$changes].indexes[index] = index;
      this.$indexes.set(index, index);
      this.$items.set(index, value);
      this[$changes].change(index, operation);
      return index;
    }
    entries() {
      return this.$items.entries();
    }
    delete(item) {
      const entries = this.$items.entries();
      let index;
      let entry;
      while (entry = entries.next()) {
        if (entry.done) {
          break;
        }
        if (item === entry.value[1]) {
          index = entry.value[0];
          break;
        }
      }
      if (index === void 0) {
        return false;
      }
      this.deletedItems[index] = this[$changes].delete(index);
      this.$indexes.delete(index);
      return this.$items.delete(index);
    }
    clear() {
      const changeTree = this[$changes];
      changeTree.discard(true);
      changeTree.indexes = {};
      this.$indexes.clear();
      this.$items.clear();
      changeTree.operation(OPERATION.CLEAR);
    }
    has(value) {
      const values = this.$items.values();
      let has = false;
      let entry;
      while (entry = values.next()) {
        if (entry.done) {
          break;
        }
        if (value === entry.value) {
          has = true;
          break;
        }
      }
      return has;
    }
    forEach(callbackfn) {
      this.$items.forEach((value, key, _) => callbackfn(value, key, this));
    }
    values() {
      return this.$items.values();
    }
    get size() {
      return this.$items.size;
    }
    /** Iterator */
    [Symbol.iterator]() {
      return this.$items.values();
    }
    setIndex(index, key) {
      this.$indexes.set(index, key);
    }
    getIndex(index) {
      return this.$indexes.get(index);
    }
    [$getByIndex](index) {
      return this.$items.get(this.$indexes.get(index));
    }
    [$deleteByIndex](index) {
      const key = this.$indexes.get(index);
      this.$items.delete(key);
      this.$indexes.delete(index);
    }
    [$onEncodeEnd]() {
      this.deletedItems = {};
    }
    toArray() {
      return Array.from(this.$items.values());
    }
    toJSON() {
      const values = [];
      this.forEach((value, key) => {
        values.push(typeof value["toJSON"] === "function" ? value["toJSON"]() : value);
      });
      return values;
    }
    //
    // Decoding utilities
    //
    clone(isDecoding) {
      let cloned;
      if (isDecoding) {
        cloned = Object.assign(new _SetSchema(), this);
      } else {
        cloned = new _SetSchema();
        this.forEach((value) => {
          if (value[$changes]) {
            cloned.add(value["clone"]());
          } else {
            cloned.add(value);
          }
        });
      }
      return cloned;
    }
  };
  __publicField(_SetSchema, _d4, encodeKeyValueOperation);
  __publicField(_SetSchema, _e4, decodeKeyValueOperation);
  var SetSchema = _SetSchema;
  registerType("set", { constructor: SetSchema });
  var DEFAULT_VIEW_TAG = -1;
  function view(tag = DEFAULT_VIEW_TAG) {
    return function(target2, fieldName) {
      var _a6;
      const constructor = target2.constructor;
      const parentClass = Object.getPrototypeOf(constructor);
      const parentMetadata = parentClass[Symbol.metadata];
      const metadata = constructor[_a6 = Symbol.metadata] ?? (constructor[_a6] = Object.assign({}, constructor[Symbol.metadata], parentMetadata ?? /* @__PURE__ */ Object.create(null)));
      Metadata.setTag(metadata, fieldName, tag);
    };
  }
  function getPropertyDescriptor(fieldCached, fieldIndex, type, complexTypeKlass) {
    return {
      get: function() {
        return this[fieldCached];
      },
      set: function(value) {
        const previousValue = this[fieldCached] ?? void 0;
        if (value === previousValue) {
          return;
        }
        if (value !== void 0 && value !== null) {
          if (complexTypeKlass) {
            if (complexTypeKlass.constructor === ArraySchema && !(value instanceof ArraySchema)) {
              value = new ArraySchema(...value);
            }
            if (complexTypeKlass.constructor === MapSchema && !(value instanceof MapSchema)) {
              value = new MapSchema(value);
            }
            value[$childType] = type;
          } else if (typeof type !== "string") {
            assertInstanceType(value, type, this, fieldCached.substring(1));
          } else {
            assertType(value, type, this, fieldCached.substring(1));
          }
          const changeTree = this[$changes];
          if (previousValue !== void 0 && previousValue[$changes]) {
            changeTree.root?.remove(previousValue[$changes]);
            this.constructor[$track](changeTree, fieldIndex, OPERATION.DELETE_AND_ADD);
          } else {
            this.constructor[$track](changeTree, fieldIndex, OPERATION.ADD);
          }
          value[$changes]?.setParent(this, changeTree.root, fieldIndex);
        } else if (previousValue !== void 0) {
          this[$changes].delete(fieldIndex);
        }
        this[fieldCached] = value;
      },
      enumerable: true,
      configurable: true
    };
  }
  function schema(fieldsAndMethods, name, inherits = Schema) {
    const fields = {};
    const methods = {};
    const defaultValues = {};
    const viewTagFields = {};
    for (let fieldName in fieldsAndMethods) {
      const value = fieldsAndMethods[fieldName];
      if (typeof value === "object") {
        if (value["view"] !== void 0) {
          viewTagFields[fieldName] = typeof value["view"] === "boolean" ? DEFAULT_VIEW_TAG : value["view"];
        }
        if (value["sync"] !== false) {
          fields[fieldName] = getNormalizedType(value);
        }
        if (!Object.prototype.hasOwnProperty.call(value, "default")) {
          if (Array.isArray(value) || value["array"] !== void 0) {
            defaultValues[fieldName] = new ArraySchema();
          } else if (value["map"] !== void 0) {
            defaultValues[fieldName] = new MapSchema();
          } else if (value["collection"] !== void 0) {
            defaultValues[fieldName] = new CollectionSchema();
          } else if (value["set"] !== void 0) {
            defaultValues[fieldName] = new SetSchema();
          } else if (value["type"] !== void 0 && Schema.is(value["type"])) {
            if (!value["type"].prototype.initialize || value["type"].prototype.initialize.length === 0) {
              defaultValues[fieldName] = new value["type"]();
            }
          }
        } else {
          defaultValues[fieldName] = value["default"];
        }
      } else if (typeof value === "function") {
        if (Schema.is(value)) {
          if (!value.prototype.initialize || value.prototype.initialize.length === 0) {
            defaultValues[fieldName] = new value();
          }
          fields[fieldName] = getNormalizedType(value);
        } else {
          methods[fieldName] = value;
        }
      } else {
        fields[fieldName] = getNormalizedType(value);
      }
    }
    const getDefaultValues = () => {
      const defaults = {};
      for (const fieldName in defaultValues) {
        const defaultValue = defaultValues[fieldName];
        if (defaultValue && typeof defaultValue.clone === "function") {
          defaults[fieldName] = defaultValue.clone();
        } else {
          defaults[fieldName] = defaultValue;
        }
      }
      return defaults;
    };
    const getParentProps = (props) => {
      const fieldNames = Object.keys(fields);
      const parentProps = {};
      for (const key in props) {
        if (!fieldNames.includes(key)) {
          parentProps[key] = props[key];
        }
      }
      return parentProps;
    };
    const klass = Metadata.setFields(class extends inherits {
      constructor(...args) {
        if (methods.initialize && typeof methods.initialize === "function") {
          super(Object.assign({}, getDefaultValues(), getParentProps(args[0] || {})));
          if (new.target === klass) {
            methods.initialize.apply(this, args);
          }
        } else {
          super(Object.assign({}, getDefaultValues(), args[0] || {}));
        }
      }
    }, fields);
    klass._getDefaultValues = getDefaultValues;
    Object.assign(klass.prototype, methods);
    for (let fieldName in viewTagFields) {
      view(viewTagFields[fieldName])(klass.prototype, fieldName);
    }
    if (name) {
      Object.defineProperty(klass, "name", { value: name });
    }
    klass.extends = (fields2, name2) => schema(fields2, name2, klass);
    return klass;
  }
  function getIndent(level) {
    return new Array(level).fill(0).map((_, i) => i === level - 1 ? `\u2514\u2500 ` : `   `).join("");
  }
  var _a5, _b5, _c5, _d5;
  var _Schema = class _Schema {
    // allow inherited classes to have a constructor
    constructor(arg) {
      __publicField(this, _d5);
      _Schema.initialize(this);
      if (arg) {
        Object.assign(this, arg);
      }
    }
    /**
     * Assign the property descriptors required to track changes on this instance.
     * @param instance
     */
    static initialize(instance) {
      Object.defineProperty(instance, $changes, {
        value: new ChangeTree(instance),
        enumerable: false,
        writable: true
      });
      Object.defineProperties(instance, instance.constructor[Symbol.metadata]?.[$descriptors] || {});
    }
    static is(type) {
      return typeof type[Symbol.metadata] === "object";
    }
    /**
     * Check if a value is an instance of Schema.
     * This method uses duck-typing to avoid issues with multiple @colyseus/schema versions.
     * @param obj Value to check
     * @returns true if the value is a Schema instance
     */
    static isSchema(obj) {
      return typeof obj?.assign === "function";
    }
    /**
     * Track property changes
     */
    static [(_a5 = Symbol.metadata, _b5 = $encoder, _c5 = $decoder, _d5 = $refId, $track)](changeTree, index, operation = OPERATION.ADD) {
      changeTree.change(index, operation);
    }
    /**
     * Determine if a property must be filtered.
     * - If returns false, the property is NOT going to be encoded.
     * - If returns true, the property is going to be encoded.
     *
     * Encoding with "filters" happens in two steps:
     * - First, the encoder iterates over all "not owned" properties and encodes them.
     * - Then, the encoder iterates over all "owned" properties per instance and encodes them.
     */
    static [$filter](ref, index, view2) {
      const metadata = ref.constructor[Symbol.metadata];
      const tag = metadata[index]?.tag;
      if (view2 === void 0) {
        return tag === void 0;
      } else if (tag === void 0) {
        return true;
      } else if (tag === DEFAULT_VIEW_TAG) {
        return view2.isChangeTreeVisible(ref[$changes]);
      } else {
        const tags = view2.tags?.get(ref[$changes]);
        return tags && tags.has(tag);
      }
    }
    /**
     * Assign properties to the instance.
     * @param props Properties to assign to the instance
     * @returns
     */
    assign(props) {
      Object.assign(this, props);
      return this;
    }
    /**
     * Restore the instance from JSON data.
     * @param jsonData JSON data to restore the instance from
     * @returns
     */
    restore(jsonData) {
      const metadata = this.constructor[Symbol.metadata];
      for (const fieldIndex in metadata) {
        const field = metadata[fieldIndex];
        const fieldName = field.name;
        const fieldType = field.type;
        const value = jsonData[fieldName];
        if (value === void 0 || value === null) {
          continue;
        }
        if (typeof fieldType === "string") {
          this[fieldName] = value;
        } else if (_Schema.is(fieldType)) {
          const instance = new fieldType();
          instance.restore(value);
          this[fieldName] = instance;
        } else if (typeof fieldType === "object") {
          const collectionType = Object.keys(fieldType)[0];
          const childType = fieldType[collectionType];
          if (collectionType === "map") {
            const mapSchema = this[fieldName];
            for (const key in value) {
              if (_Schema.is(childType)) {
                const childInstance = new childType();
                childInstance.restore(value[key]);
                mapSchema.set(key, childInstance);
              } else {
                mapSchema.set(key, value[key]);
              }
            }
          } else if (collectionType === "array") {
            const arraySchema = this[fieldName];
            for (let i = 0; i < value.length; i++) {
              if (_Schema.is(childType)) {
                const childInstance = new childType();
                childInstance.restore(value[i]);
                arraySchema.push(childInstance);
              } else {
                arraySchema.push(value[i]);
              }
            }
          }
        }
      }
      return this;
    }
    /**
     * (Server-side): Flag a property to be encoded for the next patch.
     * @param instance Schema instance
     * @param property string representing the property name, or number representing the index of the property.
     * @param operation OPERATION to perform (detected automatically)
     */
    setDirty(property, operation) {
      const metadata = this.constructor[Symbol.metadata];
      this[$changes].change(metadata[metadata[property]].index, operation);
    }
    clone() {
      const cloned = Object.create(this.constructor.prototype);
      _Schema.initialize(cloned);
      const metadata = this.constructor[Symbol.metadata];
      for (const fieldIndex in metadata) {
        const field = metadata[fieldIndex].name;
        if (typeof this[field] === "object" && typeof this[field]?.clone === "function") {
          cloned[field] = this[field].clone();
        } else {
          cloned[field] = this[field];
        }
      }
      return cloned;
    }
    toJSON() {
      const obj = {};
      const metadata = this.constructor[Symbol.metadata];
      for (const index in metadata) {
        const field = metadata[index];
        const fieldName = field.name;
        if (!field.deprecated && this[fieldName] !== null && typeof this[fieldName] !== "undefined") {
          obj[fieldName] = typeof this[fieldName]["toJSON"] === "function" ? this[fieldName]["toJSON"]() : this[fieldName];
        }
      }
      return obj;
    }
    /**
     * Used in tests only
     * @internal
     */
    discardAllChanges() {
      this[$changes].discardAll();
    }
    [$getByIndex](index) {
      const metadata = this.constructor[Symbol.metadata];
      return this[metadata[index].name];
    }
    [$deleteByIndex](index) {
      const metadata = this.constructor[Symbol.metadata];
      this[metadata[index].name] = void 0;
    }
    /**
     * Inspect the `refId` of all Schema instances in the tree. Optionally display the contents of the instance.
     *
     * @param ref Schema instance
     * @param showContents display JSON contents of the instance
     * @returns
     */
    static debugRefIds(ref, showContents = false, level = 0, decoder2, keyPrefix = "") {
      const contents = showContents ? ` - ${JSON.stringify(ref.toJSON())}` : "";
      const changeTree = ref[$changes];
      const refId = ref[$refId];
      const root = decoder2 ? decoder2.root : changeTree.root;
      const refCount = root?.refCount?.[refId] > 1 ? ` [\xD7${root.refCount[refId]}]` : "";
      let output = `${getIndent(level)}${keyPrefix}${ref.constructor.name} (refId: ${refId})${refCount}${contents}
`;
      changeTree.forEachChild((childChangeTree, indexOrKey) => {
        let key = indexOrKey;
        if (typeof indexOrKey === "number" && ref["$indexes"]) {
          key = ref["$indexes"].get(indexOrKey) ?? indexOrKey;
        }
        const keyPrefix2 = ref["forEach"] !== void 0 && key !== void 0 ? `["${key}"]: ` : "";
        output += this.debugRefIds(childChangeTree.ref, showContents, level + 1, decoder2, keyPrefix2);
      });
      return output;
    }
    static debugRefIdEncodingOrder(ref, changeSet = "allChanges") {
      let encodeOrder = [];
      let current = ref[$changes].root[changeSet].next;
      while (current) {
        if (current.changeTree) {
          encodeOrder.push(current.changeTree.ref[$refId]);
        }
        current = current.next;
      }
      return encodeOrder;
    }
    static debugRefIdsFromDecoder(decoder2) {
      return this.debugRefIds(decoder2.state, false, 0, decoder2);
    }
    /**
     * Return a string representation of the changes on a Schema instance.
     * The list of changes is cleared after each encode.
     *
     * @param instance Schema instance
     * @param isEncodeAll Return "full encode" instead of current change set.
     * @returns
     */
    static debugChanges(instance, isEncodeAll = false) {
      const changeTree = instance[$changes];
      const changeSet = isEncodeAll ? changeTree.allChanges : changeTree.changes;
      const changeSetName = isEncodeAll ? "allChanges" : "changes";
      let output = `${instance.constructor.name} (${instance[$refId]}) -> .${changeSetName}:
`;
      function dumpChangeSet(changeSet2) {
        changeSet2.operations.filter((op) => op).forEach((index) => {
          const operation = changeTree.indexedOperations[index];
          output += `- [${index}]: ${OPERATION[operation]} (${JSON.stringify(changeTree.getValue(Number(index), isEncodeAll))})
`;
        });
      }
      dumpChangeSet(changeSet);
      if (!isEncodeAll && changeTree.filteredChanges && changeTree.filteredChanges.operations.filter((op) => op).length > 0) {
        output += `${instance.constructor.name} (${instance[$refId]}) -> .filteredChanges:
`;
        dumpChangeSet(changeTree.filteredChanges);
      }
      if (isEncodeAll && changeTree.allFilteredChanges && changeTree.allFilteredChanges.operations.filter((op) => op).length > 0) {
        output += `${instance.constructor.name} (${instance[$refId]}) -> .allFilteredChanges:
`;
        dumpChangeSet(changeTree.allFilteredChanges);
      }
      return output;
    }
    static debugChangesDeep(ref, changeSetName = "changes") {
      let output = "";
      const rootChangeTree = ref[$changes];
      const root = rootChangeTree.root;
      const changeTrees = /* @__PURE__ */ new Map();
      const instanceRefIds = [];
      let totalOperations = 0;
      for (const [refId, changes] of Object.entries(root[changeSetName])) {
        const changeTree = root.changeTrees[refId];
        if (!changeTree) {
          continue;
        }
        let includeChangeTree = false;
        let parentChangeTrees = [];
        let parentChangeTree = changeTree.parent?.[$changes];
        if (changeTree === rootChangeTree) {
          includeChangeTree = true;
        } else {
          while (parentChangeTree !== void 0) {
            parentChangeTrees.push(parentChangeTree);
            if (parentChangeTree.ref === ref) {
              includeChangeTree = true;
              break;
            }
            parentChangeTree = parentChangeTree.parent?.[$changes];
          }
        }
        if (includeChangeTree) {
          instanceRefIds.push(changeTree.ref[$refId]);
          totalOperations += Object.keys(changes).length;
          changeTrees.set(changeTree, parentChangeTrees.reverse());
        }
      }
      output += "---\n";
      output += `root refId: ${rootChangeTree.ref[$refId]}
`;
      output += `Total instances: ${instanceRefIds.length} (refIds: ${instanceRefIds.join(", ")})
`;
      output += `Total changes: ${totalOperations}
`;
      output += "---\n";
      const visitedParents = /* @__PURE__ */ new WeakSet();
      for (const [changeTree, parentChangeTrees] of changeTrees.entries()) {
        parentChangeTrees.forEach((parentChangeTree, level2) => {
          if (!visitedParents.has(parentChangeTree)) {
            output += `${getIndent(level2)}${parentChangeTree.ref.constructor.name} (refId: ${parentChangeTree.ref[$refId]})
`;
            visitedParents.add(parentChangeTree);
          }
        });
        const changes = changeTree.indexedOperations;
        const level = parentChangeTrees.length;
        const indent = getIndent(level);
        const parentIndex = level > 0 ? `(${changeTree.parentIndex}) ` : "";
        output += `${indent}${parentIndex}${changeTree.ref.constructor.name} (refId: ${changeTree.ref[$refId]}) - changes: ${Object.keys(changes).length}
`;
        for (const index in changes) {
          const operation = changes[index];
          output += `${getIndent(level + 1)}${OPERATION[operation]}: ${index}
`;
        }
      }
      return `${output}`;
    }
  };
  __publicField(_Schema, _a5);
  __publicField(_Schema, _b5, encodeSchemaOperation);
  __publicField(_Schema, _c5, decodeSchemaOperation);
  var Schema = _Schema;
  var Root = class {
    // TODO: do not initialize it if filters are not used
    constructor(types) {
      __publicField(this, "types");
      __publicField(this, "nextUniqueId", 0);
      __publicField(this, "refCount", {});
      __publicField(this, "changeTrees", {});
      // all changes
      __publicField(this, "allChanges", createChangeTreeList());
      __publicField(this, "allFilteredChanges", createChangeTreeList());
      // TODO: do not initialize it if filters are not used
      // pending changes to be encoded
      __publicField(this, "changes", createChangeTreeList());
      __publicField(this, "filteredChanges", createChangeTreeList());
      this.types = types;
    }
    getNextUniqueId() {
      return this.nextUniqueId++;
    }
    add(changeTree) {
      const ref = changeTree.ref;
      if (ref[$refId] === void 0) {
        ref[$refId] = this.getNextUniqueId();
      }
      const refId = ref[$refId];
      const isNewChangeTree = this.changeTrees[refId] === void 0;
      if (isNewChangeTree) {
        this.changeTrees[refId] = changeTree;
      }
      const previousRefCount = this.refCount[refId];
      if (previousRefCount === 0) {
        const ops = changeTree.allChanges.operations;
        let len3 = ops.length;
        while (len3--) {
          changeTree.indexedOperations[ops[len3]] = OPERATION.ADD;
          setOperationAtIndex(changeTree.changes, len3);
        }
      }
      this.refCount[refId] = (previousRefCount || 0) + 1;
      return isNewChangeTree;
    }
    remove(changeTree) {
      const refId = changeTree.ref[$refId];
      const refCount = this.refCount[refId] - 1;
      if (refCount <= 0) {
        changeTree.root = void 0;
        delete this.changeTrees[refId];
        this.removeChangeFromChangeSet("allChanges", changeTree);
        this.removeChangeFromChangeSet("changes", changeTree);
        if (changeTree.filteredChanges) {
          this.removeChangeFromChangeSet("allFilteredChanges", changeTree);
          this.removeChangeFromChangeSet("filteredChanges", changeTree);
        }
        this.refCount[refId] = 0;
        changeTree.forEachChild((child, _) => {
          if (child.removeParent(changeTree.ref)) {
            if (child.parentChain === void 0 || // no parent, remove it
            child.parentChain && this.refCount[child.ref[$refId]] > 0) {
              this.remove(child);
            } else if (child.parentChain) {
              this.moveNextToParent(child);
            }
          }
        });
      } else {
        this.refCount[refId] = refCount;
        this.recursivelyMoveNextToParent(changeTree);
      }
      return refCount;
    }
    recursivelyMoveNextToParent(changeTree) {
      this.moveNextToParent(changeTree);
      changeTree.forEachChild((child, _) => this.recursivelyMoveNextToParent(child));
    }
    moveNextToParent(changeTree) {
      if (changeTree.filteredChanges) {
        this.moveNextToParentInChangeTreeList("filteredChanges", changeTree);
        this.moveNextToParentInChangeTreeList("allFilteredChanges", changeTree);
      } else {
        this.moveNextToParentInChangeTreeList("changes", changeTree);
        this.moveNextToParentInChangeTreeList("allChanges", changeTree);
      }
    }
    moveNextToParentInChangeTreeList(changeSetName, changeTree) {
      const changeSet = this[changeSetName];
      const node = changeTree[changeSetName].queueRootNode;
      if (!node)
        return;
      const parent = changeTree.parent;
      if (!parent || !parent[$changes])
        return;
      const parentNode = parent[$changes][changeSetName]?.queueRootNode;
      if (!parentNode || parentNode === node)
        return;
      const parentPosition = parentNode.position;
      const childPosition = node.position;
      if (childPosition > parentPosition)
        return;
      if (node.prev) {
        node.prev.next = node.next;
      } else {
        changeSet.next = node.next;
      }
      if (node.next) {
        node.next.prev = node.prev;
      } else {
        changeSet.tail = node.prev;
      }
      node.prev = parentNode;
      node.next = parentNode.next;
      if (parentNode.next) {
        parentNode.next.prev = node;
      } else {
        changeSet.tail = node;
      }
      parentNode.next = node;
      this.updatePositionsAfterMove(changeSet, node, parentPosition + 1);
    }
    enqueueChangeTree(changeTree, changeSet, queueRootNode = changeTree[changeSet].queueRootNode) {
      if (queueRootNode) {
        return;
      }
      changeTree[changeSet].queueRootNode = this.addToChangeTreeList(this[changeSet], changeTree);
    }
    addToChangeTreeList(list, changeTree) {
      const node = {
        changeTree,
        next: void 0,
        prev: void 0,
        position: list.tail ? list.tail.position + 1 : 0
      };
      if (!list.next) {
        list.next = node;
        list.tail = node;
      } else {
        node.prev = list.tail;
        list.tail.next = node;
        list.tail = node;
      }
      return node;
    }
    updatePositionsAfterRemoval(list, removedPosition) {
      let current = list.next;
      let position3 = 0;
      while (current) {
        if (position3 >= removedPosition) {
          current.position = position3;
        }
        current = current.next;
        position3++;
      }
    }
    updatePositionsAfterMove(list, node, newPosition) {
      let current = list.next;
      let position3 = 0;
      while (current) {
        current.position = position3;
        current = current.next;
        position3++;
      }
    }
    removeChangeFromChangeSet(changeSetName, changeTree) {
      const changeSet = this[changeSetName];
      const node = changeTree[changeSetName].queueRootNode;
      if (node && node.changeTree === changeTree) {
        const removedPosition = node.position;
        if (node.prev) {
          node.prev.next = node.next;
        } else {
          changeSet.next = node.next;
        }
        if (node.next) {
          node.next.prev = node.prev;
        } else {
          changeSet.tail = node.prev;
        }
        this.updatePositionsAfterRemoval(changeSet, removedPosition);
        changeTree[changeSetName].queueRootNode = void 0;
        return true;
      }
      return false;
    }
  };
  function concatBytes(a, b) {
    const result = new Uint8Array(a.length + b.length);
    result.set(a, 0);
    result.set(b, a.length);
    return result;
  }
  var _Encoder = class _Encoder {
    constructor(state) {
      // 8KB
      __publicField(this, "sharedBuffer", new Uint8Array(_Encoder.BUFFER_SIZE));
      __publicField(this, "context");
      __publicField(this, "state");
      __publicField(this, "root");
      this.context = TypeContext.cache(state.constructor);
      this.root = new Root(this.context);
      this.setState(state);
    }
    setState(state) {
      this.state = state;
      this.state[$changes].setRoot(this.root);
    }
    encode(it = { offset: 0 }, view2, buffer = this.sharedBuffer, changeSetName = "changes", isEncodeAll = changeSetName === "allChanges", initialOffset = it.offset) {
      const hasView = view2 !== void 0;
      const rootChangeTree = this.state[$changes];
      let current = this.root[changeSetName];
      while (current = current.next) {
        const changeTree = current.changeTree;
        if (hasView) {
          if (!view2.isChangeTreeVisible(changeTree)) {
            view2.invisible.add(changeTree);
            continue;
          }
          view2.invisible.delete(changeTree);
        }
        const changeSet = changeTree[changeSetName];
        const ref = changeTree.ref;
        const numChanges = changeSet.operations.length;
        if (numChanges === 0) {
          continue;
        }
        const ctor = ref.constructor;
        const encoder = ctor[$encoder];
        const filter = ctor[$filter];
        const metadata = ctor[Symbol.metadata];
        if (hasView || it.offset > initialOffset || changeTree !== rootChangeTree) {
          buffer[it.offset++] = SWITCH_TO_STRUCTURE & 255;
          encode.number(buffer, ref[$refId], it);
        }
        for (let j = 0; j < numChanges; j++) {
          const fieldIndex = changeSet.operations[j];
          if (fieldIndex < 0) {
            buffer[it.offset++] = Math.abs(fieldIndex) & 255;
            continue;
          }
          const operation = isEncodeAll ? OPERATION.ADD : changeTree.indexedOperations[fieldIndex];
          if (fieldIndex === void 0 || operation === void 0 || filter && !filter(ref, fieldIndex, view2)) {
            continue;
          }
          encoder(this, buffer, changeTree, fieldIndex, operation, it, isEncodeAll, hasView, metadata);
        }
      }
      if (it.offset > buffer.byteLength) {
        const newSize = Math.ceil(it.offset / _Encoder.BUFFER_SIZE) * _Encoder.BUFFER_SIZE;
        console.warn(`@colyseus/schema buffer overflow. Encoded state is higher than default BUFFER_SIZE. Use the following to increase default BUFFER_SIZE:

    import { Encoder } from "@colyseus/schema";
    Encoder.BUFFER_SIZE = ${Math.round(newSize / 1024)} * 1024; // ${Math.round(newSize / 1024)} KB
`);
        const newBuffer = new Uint8Array(newSize);
        newBuffer.set(buffer);
        buffer = newBuffer;
        if (buffer === this.sharedBuffer) {
          this.sharedBuffer = buffer;
        }
        return this.encode({ offset: initialOffset }, view2, buffer, changeSetName, isEncodeAll);
      } else {
        return buffer.subarray(0, it.offset);
      }
    }
    encodeAll(it = { offset: 0 }, buffer = this.sharedBuffer) {
      return this.encode(it, void 0, buffer, "allChanges", true);
    }
    encodeAllView(view2, sharedOffset, it, bytes = this.sharedBuffer) {
      const viewOffset = it.offset;
      this.encode(it, view2, bytes, "allFilteredChanges", true, viewOffset);
      return concatBytes(bytes.subarray(0, sharedOffset), bytes.subarray(viewOffset, it.offset));
    }
    encodeView(view2, sharedOffset, it, bytes = this.sharedBuffer) {
      const viewOffset = it.offset;
      for (const [refId, changes] of view2.changes) {
        const changeTree = this.root.changeTrees[refId];
        if (changeTree === void 0) {
          view2.changes.delete(refId);
          continue;
        }
        const keys = Object.keys(changes);
        if (keys.length === 0) {
          continue;
        }
        const ref = changeTree.ref;
        const ctor = ref.constructor;
        const encoder = ctor[$encoder];
        const metadata = ctor[Symbol.metadata];
        bytes[it.offset++] = SWITCH_TO_STRUCTURE & 255;
        encode.number(bytes, ref[$refId], it);
        for (let i = 0, numChanges = keys.length; i < numChanges; i++) {
          const index = Number(keys[i]);
          const value = changeTree.ref[$getByIndex](index);
          const operation = value !== void 0 && changes[index] || OPERATION.DELETE;
          encoder(this, bytes, changeTree, index, operation, it, false, true, metadata);
        }
      }
      view2.changes.clear();
      this.encode(it, view2, bytes, "filteredChanges", false, viewOffset);
      return concatBytes(bytes.subarray(0, sharedOffset), bytes.subarray(viewOffset, it.offset));
    }
    discardChanges() {
      let current = this.root.changes.next;
      while (current) {
        current.changeTree.endEncode("changes");
        current = current.next;
      }
      this.root.changes = createChangeTreeList();
      current = this.root.filteredChanges.next;
      while (current) {
        current.changeTree.endEncode("filteredChanges");
        current = current.next;
      }
      this.root.filteredChanges = createChangeTreeList();
    }
    tryEncodeTypeId(bytes, baseType, targetType, it) {
      const baseTypeId = this.context.getTypeId(baseType);
      const targetTypeId = this.context.getTypeId(targetType);
      if (targetTypeId === void 0) {
        console.warn(`@colyseus/schema WARNING: Class "${targetType.name}" is not registered on TypeRegistry - Please either tag the class with @entity or define a @type() field.`);
        return;
      }
      if (baseTypeId !== targetTypeId) {
        bytes[it.offset++] = TYPE_ID & 255;
        encode.number(bytes, targetTypeId, it);
      }
    }
    get hasChanges() {
      return this.root.changes.next !== void 0 || this.root.filteredChanges.next !== void 0;
    }
  };
  __publicField(_Encoder, "BUFFER_SIZE", 8 * 1024);
  var Encoder = _Encoder;
  function spliceOne(arr, index) {
    if (index === -1 || index >= arr.length) {
      return false;
    }
    const len3 = arr.length - 1;
    for (let i = index; i < len3; i++) {
      arr[i] = arr[i + 1];
    }
    arr.length = len3;
    return true;
  }
  var DecodingWarning = class extends Error {
    constructor(message) {
      super(message);
      this.name = "DecodingWarning";
    }
  };
  var ReferenceTracker = class {
    constructor() {
      //
      // Relation of refId => Schema structure
      // For direct access of structures during decoding time.
      //
      __publicField(this, "refs", /* @__PURE__ */ new Map());
      __publicField(this, "refCount", {});
      __publicField(this, "deletedRefs", /* @__PURE__ */ new Set());
      __publicField(this, "callbacks", {});
      __publicField(this, "nextUniqueId", 0);
    }
    getNextUniqueId() {
      return this.nextUniqueId++;
    }
    // for decoding
    addRef(refId, ref, incrementCount = true) {
      this.refs.set(refId, ref);
      ref[$refId] = refId;
      if (incrementCount) {
        this.refCount[refId] = (this.refCount[refId] || 0) + 1;
      }
      if (this.deletedRefs.has(refId)) {
        this.deletedRefs.delete(refId);
      }
    }
    // for decoding
    removeRef(refId) {
      const refCount = this.refCount[refId];
      if (refCount === void 0) {
        try {
          throw new DecodingWarning("trying to remove refId that doesn't exist: " + refId);
        } catch (e) {
          console.warn(e);
        }
        return;
      }
      if (refCount === 0) {
        try {
          const ref = this.refs.get(refId);
          throw new DecodingWarning(`trying to remove refId '${refId}' with 0 refCount (${ref.constructor.name}: ${JSON.stringify(ref)})`);
        } catch (e) {
          console.warn(e);
        }
        return;
      }
      if ((this.refCount[refId] = refCount - 1) <= 0) {
        this.deletedRefs.add(refId);
      }
    }
    clearRefs() {
      this.refs.clear();
      this.deletedRefs.clear();
      this.callbacks = {};
      this.refCount = {};
    }
    // for decoding
    garbageCollectDeletedRefs() {
      this.deletedRefs.forEach((refId) => {
        if (this.refCount[refId] > 0) {
          return;
        }
        const ref = this.refs.get(refId);
        if (ref.constructor[Symbol.metadata] !== void 0) {
          const metadata = ref.constructor[Symbol.metadata];
          for (const index in metadata) {
            const field = metadata[index].name;
            const child = ref[field];
            if (typeof child === "object" && child) {
              const childRefId = child[$refId];
              if (childRefId !== void 0 && !this.deletedRefs.has(childRefId)) {
                this.removeRef(childRefId);
              }
            }
          }
        } else {
          if (typeof ref[$childType] === "function") {
            Array.from(ref.values()).forEach((child) => {
              const childRefId = child[$refId];
              if (childRefId !== void 0 && !this.deletedRefs.has(childRefId)) {
                this.removeRef(childRefId);
              }
            });
          }
        }
        this.refs.delete(refId);
        delete this.refCount[refId];
        delete this.callbacks[refId];
      });
      this.deletedRefs.clear();
    }
    addCallback(refId, fieldOrOperation, callback) {
      if (refId === void 0) {
        const name = typeof fieldOrOperation === "number" ? OPERATION[fieldOrOperation] : fieldOrOperation;
        throw new Error(`Can't addCallback on '${name}' (refId is undefined)`);
      }
      if (!this.callbacks[refId]) {
        this.callbacks[refId] = {};
      }
      if (!this.callbacks[refId][fieldOrOperation]) {
        this.callbacks[refId][fieldOrOperation] = [];
      }
      this.callbacks[refId][fieldOrOperation].push(callback);
      return () => this.removeCallback(refId, fieldOrOperation, callback);
    }
    removeCallback(refId, field, callback) {
      const index = this.callbacks?.[refId]?.[field]?.indexOf(callback);
      if (index !== void 0 && index !== -1) {
        spliceOne(this.callbacks[refId][field], index);
      }
    }
  };
  var Decoder = class {
    constructor(root, context) {
      __publicField(this, "context");
      __publicField(this, "state");
      __publicField(this, "root");
      __publicField(this, "currentRefId", 0);
      __publicField(this, "triggerChanges");
      this.setState(root);
      this.context = context || new TypeContext(root.constructor);
    }
    setState(root) {
      this.state = root;
      this.root = new ReferenceTracker();
      this.root.addRef(0, root);
    }
    decode(bytes, it = { offset: 0 }, ref = this.state) {
      const allChanges = [];
      const $root = this.root;
      const totalBytes = bytes.byteLength;
      let decoder2 = ref["constructor"][$decoder];
      this.currentRefId = 0;
      while (it.offset < totalBytes) {
        if (bytes[it.offset] == SWITCH_TO_STRUCTURE) {
          it.offset++;
          ref[$onDecodeEnd]?.();
          const nextRefId = decode.number(bytes, it);
          const nextRef = $root.refs.get(nextRefId);
          if (!nextRef) {
            console.error(`"refId" not found: ${nextRefId}`, { previousRef: ref, previousRefId: this.currentRefId });
            console.warn("Please report this issue to the developers.");
            this.skipCurrentStructure(bytes, it, totalBytes);
          } else {
            ref = nextRef;
            decoder2 = ref.constructor[$decoder];
            this.currentRefId = nextRefId;
          }
          continue;
        }
        const result = decoder2(this, bytes, it, ref, allChanges);
        if (result === DEFINITION_MISMATCH) {
          console.warn("@colyseus/schema: definition mismatch");
          this.skipCurrentStructure(bytes, it, totalBytes);
          continue;
        }
      }
      ref[$onDecodeEnd]?.();
      this.triggerChanges?.(allChanges);
      $root.garbageCollectDeletedRefs();
      return allChanges;
    }
    skipCurrentStructure(bytes, it, totalBytes) {
      const nextIterator = { offset: it.offset };
      while (it.offset < totalBytes) {
        if (bytes[it.offset] === SWITCH_TO_STRUCTURE) {
          nextIterator.offset = it.offset + 1;
          if (this.root.refs.has(decode.number(bytes, nextIterator))) {
            break;
          }
        }
        it.offset++;
      }
    }
    getInstanceType(bytes, it, defaultType) {
      let type;
      if (bytes[it.offset] === TYPE_ID) {
        it.offset++;
        const type_id = decode.number(bytes, it);
        type = this.context.get(type_id);
      }
      return type || defaultType;
    }
    createInstanceOfType(type) {
      return new type();
    }
    removeChildRefs(ref, allChanges) {
      const needRemoveRef = typeof ref[$childType] !== "string";
      const refId = ref[$refId];
      ref.forEach((value, key) => {
        allChanges.push({
          ref,
          refId,
          op: OPERATION.DELETE,
          field: key,
          value: void 0,
          previousValue: value
        });
        if (needRemoveRef) {
          this.root.removeRef(value[$refId]);
        }
      });
    }
  };
  var ReflectionField = schema({
    name: "string",
    type: "string",
    referencedType: "number"
  });
  var ReflectionType = schema({
    id: "number",
    extendsId: "number",
    fields: [ReflectionField]
  });
  var Reflection = schema({
    types: [ReflectionType],
    rootType: "number"
  });
  Reflection.encode = function(encoder, it = { offset: 0 }) {
    const context = encoder.context;
    const reflection = new Reflection();
    const reflectionEncoder = new Encoder(reflection);
    const rootType = context.schemas.get(encoder.state.constructor);
    if (rootType > 0) {
      reflection.rootType = rootType;
    }
    const includedTypeIds = /* @__PURE__ */ new Set();
    const pendingReflectionTypes = {};
    const addType = (type) => {
      if (type.extendsId === void 0 || includedTypeIds.has(type.extendsId)) {
        includedTypeIds.add(type.id);
        reflection.types.push(type);
        const deps = pendingReflectionTypes[type.id];
        if (deps !== void 0) {
          delete pendingReflectionTypes[type.id];
          deps.forEach((childType) => addType(childType));
        }
      } else {
        if (pendingReflectionTypes[type.extendsId] === void 0) {
          pendingReflectionTypes[type.extendsId] = [];
        }
        pendingReflectionTypes[type.extendsId].push(type);
      }
    };
    context.schemas.forEach((typeid, klass) => {
      const type = new ReflectionType();
      type.id = Number(typeid);
      const inheritFrom = Object.getPrototypeOf(klass);
      if (inheritFrom !== Schema) {
        type.extendsId = context.schemas.get(inheritFrom);
      }
      const metadata = klass[Symbol.metadata];
      if (metadata !== inheritFrom[Symbol.metadata]) {
        for (const fieldIndex in metadata) {
          const index = Number(fieldIndex);
          const fieldName = metadata[index].name;
          if (!Object.prototype.hasOwnProperty.call(metadata, fieldName)) {
            continue;
          }
          const reflectionField = new ReflectionField();
          reflectionField.name = fieldName;
          let fieldType;
          const field = metadata[index];
          if (typeof field.type === "string") {
            fieldType = field.type;
          } else {
            let childTypeSchema;
            if (Schema.is(field.type)) {
              fieldType = "ref";
              childTypeSchema = field.type;
            } else {
              fieldType = Object.keys(field.type)[0];
              if (typeof field.type[fieldType] === "string") {
                fieldType += ":" + field.type[fieldType];
              } else {
                childTypeSchema = field.type[fieldType];
              }
            }
            reflectionField.referencedType = childTypeSchema ? context.getTypeId(childTypeSchema) : -1;
          }
          reflectionField.type = fieldType;
          type.fields.push(reflectionField);
        }
      }
      addType(type);
    });
    for (const typeid in pendingReflectionTypes) {
      pendingReflectionTypes[typeid].forEach((type) => reflection.types.push(type));
    }
    const buf = reflectionEncoder.encodeAll(it);
    return buf.slice(0, it.offset);
  };
  Reflection.decode = function(bytes, it) {
    const reflection = new Reflection();
    const reflectionDecoder = new Decoder(reflection);
    reflectionDecoder.decode(bytes, it);
    const typeContext = new TypeContext();
    reflection.types.forEach((reflectionType) => {
      const parentClass = typeContext.get(reflectionType.extendsId) ?? Schema;
      const schema2 = class _ extends parentClass {
      };
      TypeContext.register(schema2);
      typeContext.add(schema2, reflectionType.id);
    }, {});
    const addFields = (metadata, reflectionType, parentFieldIndex) => {
      reflectionType.fields.forEach((field, i) => {
        const fieldIndex = parentFieldIndex + i;
        if (field.referencedType !== void 0) {
          let fieldType = field.type;
          let refType = typeContext.get(field.referencedType);
          if (!refType) {
            const typeInfo = field.type.split(":");
            fieldType = typeInfo[0];
            refType = typeInfo[1];
          }
          if (fieldType === "ref") {
            Metadata.addField(metadata, fieldIndex, field.name, refType);
          } else {
            Metadata.addField(metadata, fieldIndex, field.name, { [fieldType]: refType });
          }
        } else {
          Metadata.addField(metadata, fieldIndex, field.name, field.type);
        }
      });
    };
    reflection.types.forEach((reflectionType) => {
      const schema2 = typeContext.get(reflectionType.id);
      const metadata = Metadata.initialize(schema2);
      const inheritedTypes = [];
      let parentType = reflectionType;
      do {
        inheritedTypes.push(parentType);
        parentType = reflection.types.find((t) => t.id === parentType.extendsId);
      } while (parentType);
      let parentFieldIndex = 0;
      inheritedTypes.reverse().forEach((reflectionType2) => {
        addFields(metadata, reflectionType2, parentFieldIndex);
        parentFieldIndex += reflectionType2.fields.length;
      });
    });
    const state = new (typeContext.get(reflection.rootType || 0))();
    return new Decoder(state, typeContext);
  };
  registerType("map", { constructor: MapSchema });
  registerType("array", { constructor: ArraySchema });
  registerType("set", { constructor: SetSchema });
  registerType("collection", { constructor: CollectionSchema });

  // node_modules/@colyseus/msgpackr/unpack.js
  var decoder;
  try {
    decoder = new TextDecoder();
  } catch (error) {
  }
  var src;
  var srcEnd;
  var position = 0;
  var EMPTY_ARRAY = [];
  var strings = EMPTY_ARRAY;
  var stringPosition = 0;
  var currentUnpackr = {};
  var currentStructures;
  var srcString;
  var srcStringStart = 0;
  var srcStringEnd = 0;
  var bundledStrings;
  var referenceMap;
  var currentExtensions = [];
  var dataView;
  var defaultOptions = {
    useRecords: false,
    mapsAsObjects: true
  };
  var C1Type = class {
  };
  var C1 = new C1Type();
  C1.name = "MessagePack 0xC1";
  var sequentialMode = false;
  var inlineObjectReadThreshold = 2;
  var readStruct;
  var onLoadedStructures;
  var onSaveState;
  try {
    new Function("");
  } catch (error) {
    inlineObjectReadThreshold = Infinity;
  }
  var Unpackr = class _Unpackr {
    constructor(options) {
      if (options) {
        if (options.useRecords === false && options.mapsAsObjects === void 0)
          options.mapsAsObjects = true;
        if (options.sequential && options.trusted !== false) {
          options.trusted = true;
          if (!options.structures && options.useRecords != false) {
            options.structures = [];
            if (!options.maxSharedStructures)
              options.maxSharedStructures = 0;
          }
        }
        if (options.structures)
          options.structures.sharedLength = options.structures.length;
        else if (options.getStructures) {
          (options.structures = []).uninitialized = true;
          options.structures.sharedLength = 0;
        }
        if (options.int64AsNumber) {
          options.int64AsType = "number";
        }
      }
      Object.assign(this, options);
    }
    unpack(source, options) {
      if (src) {
        return saveState(() => {
          clearSource();
          return this ? this.unpack(source, options) : _Unpackr.prototype.unpack.call(defaultOptions, source, options);
        });
      }
      if (!source.buffer && source.constructor === ArrayBuffer)
        source = typeof Buffer !== "undefined" ? Buffer.from(source) : new Uint8Array(source);
      if (typeof options === "object") {
        srcEnd = options.end || source.length;
        position = options.start || 0;
      } else {
        position = 0;
        srcEnd = options > -1 ? options : source.length;
      }
      stringPosition = 0;
      srcStringEnd = 0;
      srcString = null;
      strings = EMPTY_ARRAY;
      bundledStrings = null;
      src = source;
      try {
        dataView = source.dataView || (source.dataView = new DataView(source.buffer, source.byteOffset, source.byteLength));
      } catch (error) {
        src = null;
        if (source instanceof Uint8Array)
          throw error;
        throw new Error("Source must be a Uint8Array or Buffer but was a " + (source && typeof source == "object" ? source.constructor.name : typeof source));
      }
      if (this instanceof _Unpackr) {
        currentUnpackr = this;
        if (this.structures) {
          currentStructures = this.structures;
          return checkedRead(options);
        } else if (!currentStructures || currentStructures.length > 0) {
          currentStructures = [];
        }
      } else {
        currentUnpackr = defaultOptions;
        if (!currentStructures || currentStructures.length > 0)
          currentStructures = [];
      }
      return checkedRead(options);
    }
    unpackMultiple(source, forEach) {
      let values, lastPosition = 0;
      try {
        sequentialMode = true;
        let size = source.length;
        let value = this ? this.unpack(source, size) : defaultUnpackr.unpack(source, size);
        if (forEach) {
          if (forEach(value, lastPosition, position) === false)
            return;
          while (position < size) {
            lastPosition = position;
            if (forEach(checkedRead(), lastPosition, position) === false) {
              return;
            }
          }
        } else {
          values = [value];
          while (position < size) {
            lastPosition = position;
            values.push(checkedRead());
          }
          return values;
        }
      } catch (error) {
        error.lastPosition = lastPosition;
        error.values = values;
        throw error;
      } finally {
        sequentialMode = false;
        clearSource();
      }
    }
    _mergeStructures(loadedStructures, existingStructures) {
      if (onLoadedStructures)
        loadedStructures = onLoadedStructures.call(this, loadedStructures);
      loadedStructures = loadedStructures || [];
      if (Object.isFrozen(loadedStructures))
        loadedStructures = loadedStructures.map((structure) => structure.slice(0));
      for (let i = 0, l = loadedStructures.length; i < l; i++) {
        let structure = loadedStructures[i];
        if (structure) {
          structure.isShared = true;
          if (i >= 32)
            structure.highByte = i - 32 >> 5;
        }
      }
      loadedStructures.sharedLength = loadedStructures.length;
      for (let id in existingStructures || []) {
        if (id >= 0) {
          let structure = loadedStructures[id];
          let existing = existingStructures[id];
          if (existing) {
            if (structure)
              (loadedStructures.restoreStructures || (loadedStructures.restoreStructures = []))[id] = structure;
            loadedStructures[id] = existing;
          }
        }
      }
      return this.structures = loadedStructures;
    }
    decode(source, options) {
      return this.unpack(source, options);
    }
  };
  function checkedRead(options) {
    try {
      if (!currentUnpackr.trusted && !sequentialMode) {
        let sharedLength = currentStructures.sharedLength || 0;
        if (sharedLength < currentStructures.length)
          currentStructures.length = sharedLength;
      }
      let result;
      if (currentUnpackr.randomAccessStructure && src[position] < 64 && src[position] >= 32 && readStruct) {
        result = readStruct(src, position, srcEnd, currentUnpackr);
        src = null;
        if (!(options && options.lazy) && result)
          result = result.toJSON();
        position = srcEnd;
      } else
        result = read();
      if (bundledStrings) {
        position = bundledStrings.postBundlePosition;
        bundledStrings = null;
      }
      if (sequentialMode)
        currentStructures.restoreStructures = null;
      if (position == srcEnd) {
        if (currentStructures && currentStructures.restoreStructures)
          restoreStructures();
        currentStructures = null;
        src = null;
        if (referenceMap)
          referenceMap = null;
      } else if (position > srcEnd) {
        throw new Error("Unexpected end of MessagePack data");
      } else if (!sequentialMode) {
        let jsonView;
        try {
          jsonView = JSON.stringify(result, (_, value) => typeof value === "bigint" ? `${value}n` : value).slice(0, 100);
        } catch (error) {
          jsonView = "(JSON view not available " + error + ")";
        }
        throw new Error("Data read, but end of buffer not reached " + jsonView);
      }
      return result;
    } catch (error) {
      if (currentStructures && currentStructures.restoreStructures)
        restoreStructures();
      clearSource();
      if (error instanceof RangeError || error.message.startsWith("Unexpected end of buffer") || position > srcEnd) {
        error.incomplete = true;
      }
      throw error;
    }
  }
  function restoreStructures() {
    for (let id in currentStructures.restoreStructures) {
      currentStructures[id] = currentStructures.restoreStructures[id];
    }
    currentStructures.restoreStructures = null;
  }
  function read() {
    let token = src[position++];
    if (token < 160) {
      if (token < 128) {
        if (token < 64)
          return token;
        else {
          let structure = currentStructures[token & 63] || currentUnpackr.getStructures && loadStructures()[token & 63];
          if (structure) {
            if (!structure.read) {
              structure.read = createStructureReader(structure, token & 63);
            }
            return structure.read();
          } else
            return token;
        }
      } else if (token < 144) {
        token -= 128;
        if (currentUnpackr.mapsAsObjects) {
          let object = {};
          for (let i = 0; i < token; i++) {
            let key = readKey();
            if (key === "__proto__")
              key = "__proto_";
            object[key] = read();
          }
          return object;
        } else {
          let map = /* @__PURE__ */ new Map();
          for (let i = 0; i < token; i++) {
            map.set(read(), read());
          }
          return map;
        }
      } else {
        token -= 144;
        let array = new Array(token);
        for (let i = 0; i < token; i++) {
          array[i] = read();
        }
        if (currentUnpackr.freezeData)
          return Object.freeze(array);
        return array;
      }
    } else if (token < 192) {
      let length = token - 160;
      if (srcStringEnd >= position) {
        return srcString.slice(position - srcStringStart, (position += length) - srcStringStart);
      }
      if (srcStringEnd == 0 && srcEnd < 140) {
        let string2 = length < 16 ? shortStringInJS(length) : longStringInJS(length);
        if (string2 != null)
          return string2;
      }
      return readFixedString(length);
    } else {
      let value;
      switch (token) {
        case 192:
          return null;
        case 193:
          if (bundledStrings) {
            value = read();
            if (value > 0)
              return bundledStrings[1].slice(bundledStrings.position1, bundledStrings.position1 += value);
            else
              return bundledStrings[0].slice(bundledStrings.position0, bundledStrings.position0 -= value);
          }
          return C1;
        case 194:
          return false;
        case 195:
          return true;
        case 196:
          value = src[position++];
          if (value === void 0)
            throw new Error("Unexpected end of buffer");
          return readBin(value);
        case 197:
          value = dataView.getUint16(position);
          position += 2;
          return readBin(value);
        case 198:
          value = dataView.getUint32(position);
          position += 4;
          return readBin(value);
        case 199:
          return readExt(src[position++]);
        case 200:
          value = dataView.getUint16(position);
          position += 2;
          return readExt(value);
        case 201:
          value = dataView.getUint32(position);
          position += 4;
          return readExt(value);
        case 202:
          value = dataView.getFloat32(position);
          if (currentUnpackr.useFloat32 > 2) {
            let multiplier = mult10[(src[position] & 127) << 1 | src[position + 1] >> 7];
            position += 4;
            return (multiplier * value + (value > 0 ? 0.5 : -0.5) >> 0) / multiplier;
          }
          position += 4;
          return value;
        case 203:
          value = dataView.getFloat64(position);
          position += 8;
          return value;
        case 204:
          return src[position++];
        case 205:
          value = dataView.getUint16(position);
          position += 2;
          return value;
        case 206:
          value = dataView.getUint32(position);
          position += 4;
          return value;
        case 207:
          if (currentUnpackr.int64AsType === "number") {
            value = dataView.getUint32(position) * 4294967296;
            value += dataView.getUint32(position + 4);
          } else if (currentUnpackr.int64AsType === "string") {
            value = dataView.getBigUint64(position).toString();
          } else if (currentUnpackr.int64AsType === "auto") {
            value = dataView.getBigUint64(position);
            if (value <= BigInt(2) << BigInt(52))
              value = Number(value);
          } else
            value = dataView.getBigUint64(position);
          position += 8;
          return value;
        case 208:
          return dataView.getInt8(position++);
        case 209:
          value = dataView.getInt16(position);
          position += 2;
          return value;
        case 210:
          value = dataView.getInt32(position);
          position += 4;
          return value;
        case 211:
          if (currentUnpackr.int64AsType === "number") {
            value = dataView.getInt32(position) * 4294967296;
            value += dataView.getUint32(position + 4);
          } else if (currentUnpackr.int64AsType === "string") {
            value = dataView.getBigInt64(position).toString();
          } else if (currentUnpackr.int64AsType === "auto") {
            value = dataView.getBigInt64(position);
            if (value >= BigInt(-2) << BigInt(52) && value <= BigInt(2) << BigInt(52))
              value = Number(value);
          } else
            value = dataView.getBigInt64(position);
          position += 8;
          return value;
        case 212:
          value = src[position++];
          if (value == 114) {
            return recordDefinition(src[position++] & 63);
          } else {
            let extension = currentExtensions[value];
            if (extension) {
              if (extension.read) {
                position++;
                return extension.read(read());
              } else if (extension.noBuffer) {
                position++;
                return extension();
              } else
                return extension(src.subarray(position, ++position));
            } else
              throw new Error("Unknown extension " + value);
          }
        case 213:
          value = src[position];
          if (value == 114) {
            position++;
            return recordDefinition(src[position++] & 63, src[position++]);
          } else
            return readExt(2);
        case 214:
          return readExt(4);
        case 215:
          return readExt(8);
        case 216:
          return readExt(16);
        case 217:
          value = src[position++];
          if (srcStringEnd >= position) {
            return srcString.slice(position - srcStringStart, (position += value) - srcStringStart);
          }
          return readString8(value);
        case 218:
          value = dataView.getUint16(position);
          position += 2;
          if (srcStringEnd >= position) {
            return srcString.slice(position - srcStringStart, (position += value) - srcStringStart);
          }
          return readString16(value);
        case 219:
          value = dataView.getUint32(position);
          position += 4;
          if (srcStringEnd >= position) {
            return srcString.slice(position - srcStringStart, (position += value) - srcStringStart);
          }
          return readString32(value);
        case 220:
          value = dataView.getUint16(position);
          position += 2;
          return readArray(value);
        case 221:
          value = dataView.getUint32(position);
          position += 4;
          return readArray(value);
        case 222:
          value = dataView.getUint16(position);
          position += 2;
          return readMap(value);
        case 223:
          value = dataView.getUint32(position);
          position += 4;
          return readMap(value);
        default:
          if (token >= 224)
            return token - 256;
          if (token === void 0) {
            let error = new Error("Unexpected end of MessagePack data");
            error.incomplete = true;
            throw error;
          }
          throw new Error("Unknown MessagePack token " + token);
      }
    }
  }
  var validName = /^[a-zA-Z_$][a-zA-Z\d_$]*$/;
  function createStructureReader(structure, firstId) {
    function readObject() {
      if (readObject.count++ > inlineObjectReadThreshold) {
        let readObject2 = structure.read = new Function("r", "return function(){return " + (currentUnpackr.freezeData ? "Object.freeze" : "") + "({" + structure.map((key) => key === "__proto__" ? "__proto_:r()" : validName.test(key) ? key + ":r()" : "[" + JSON.stringify(key) + "]:r()").join(",") + "})}")(read);
        if (structure.highByte === 0)
          structure.read = createSecondByteReader(firstId, structure.read);
        return readObject2();
      }
      let object = {};
      for (let i = 0, l = structure.length; i < l; i++) {
        let key = structure[i];
        if (key === "__proto__")
          key = "__proto_";
        object[key] = read();
      }
      if (currentUnpackr.freezeData)
        return Object.freeze(object);
      return object;
    }
    readObject.count = 0;
    if (structure.highByte === 0) {
      return createSecondByteReader(firstId, readObject);
    }
    return readObject;
  }
  var createSecondByteReader = (firstId, read0) => {
    return function() {
      let highByte = src[position++];
      if (highByte === 0)
        return read0();
      let id = firstId < 32 ? -(firstId + (highByte << 5)) : firstId + (highByte << 5);
      let structure = currentStructures[id] || loadStructures()[id];
      if (!structure) {
        throw new Error("Record id is not defined for " + id);
      }
      if (!structure.read)
        structure.read = createStructureReader(structure, firstId);
      return structure.read();
    };
  };
  function loadStructures() {
    let loadedStructures = saveState(() => {
      src = null;
      return currentUnpackr.getStructures();
    });
    return currentStructures = currentUnpackr._mergeStructures(loadedStructures, currentStructures);
  }
  var readFixedString = readStringJS;
  var readString8 = readStringJS;
  var readString16 = readStringJS;
  var readString32 = readStringJS;
  function readStringJS(length) {
    let result;
    if (length < 16) {
      if (result = shortStringInJS(length))
        return result;
    }
    if (length > 64 && decoder)
      return decoder.decode(src.subarray(position, position += length));
    const end = position + length;
    const units = [];
    result = "";
    while (position < end) {
      const byte1 = src[position++];
      if ((byte1 & 128) === 0) {
        units.push(byte1);
      } else if ((byte1 & 224) === 192) {
        const byte2 = src[position++] & 63;
        units.push((byte1 & 31) << 6 | byte2);
      } else if ((byte1 & 240) === 224) {
        const byte2 = src[position++] & 63;
        const byte3 = src[position++] & 63;
        units.push((byte1 & 31) << 12 | byte2 << 6 | byte3);
      } else if ((byte1 & 248) === 240) {
        const byte2 = src[position++] & 63;
        const byte3 = src[position++] & 63;
        const byte4 = src[position++] & 63;
        let unit = (byte1 & 7) << 18 | byte2 << 12 | byte3 << 6 | byte4;
        if (unit > 65535) {
          unit -= 65536;
          units.push(unit >>> 10 & 1023 | 55296);
          unit = 56320 | unit & 1023;
        }
        units.push(unit);
      } else {
        units.push(byte1);
      }
      if (units.length >= 4096) {
        result += fromCharCode.apply(String, units);
        units.length = 0;
      }
    }
    if (units.length > 0) {
      result += fromCharCode.apply(String, units);
    }
    return result;
  }
  function readArray(length) {
    let array = new Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = read();
    }
    if (currentUnpackr.freezeData)
      return Object.freeze(array);
    return array;
  }
  function readMap(length) {
    if (currentUnpackr.mapsAsObjects) {
      let object = {};
      for (let i = 0; i < length; i++) {
        let key = readKey();
        if (key === "__proto__")
          key = "__proto_";
        object[key] = read();
      }
      return object;
    } else {
      let map = /* @__PURE__ */ new Map();
      for (let i = 0; i < length; i++) {
        map.set(read(), read());
      }
      return map;
    }
  }
  var fromCharCode = String.fromCharCode;
  function longStringInJS(length) {
    let start = position;
    let bytes = new Array(length);
    for (let i = 0; i < length; i++) {
      const byte = src[position++];
      if ((byte & 128) > 0) {
        position = start;
        return;
      }
      bytes[i] = byte;
    }
    return fromCharCode.apply(String, bytes);
  }
  function shortStringInJS(length) {
    if (length < 4) {
      if (length < 2) {
        if (length === 0)
          return "";
        else {
          let a = src[position++];
          if ((a & 128) > 1) {
            position -= 1;
            return;
          }
          return fromCharCode(a);
        }
      } else {
        let a = src[position++];
        let b = src[position++];
        if ((a & 128) > 0 || (b & 128) > 0) {
          position -= 2;
          return;
        }
        if (length < 3)
          return fromCharCode(a, b);
        let c = src[position++];
        if ((c & 128) > 0) {
          position -= 3;
          return;
        }
        return fromCharCode(a, b, c);
      }
    } else {
      let a = src[position++];
      let b = src[position++];
      let c = src[position++];
      let d = src[position++];
      if ((a & 128) > 0 || (b & 128) > 0 || (c & 128) > 0 || (d & 128) > 0) {
        position -= 4;
        return;
      }
      if (length < 6) {
        if (length === 4)
          return fromCharCode(a, b, c, d);
        else {
          let e = src[position++];
          if ((e & 128) > 0) {
            position -= 5;
            return;
          }
          return fromCharCode(a, b, c, d, e);
        }
      } else if (length < 8) {
        let e = src[position++];
        let f = src[position++];
        if ((e & 128) > 0 || (f & 128) > 0) {
          position -= 6;
          return;
        }
        if (length < 7)
          return fromCharCode(a, b, c, d, e, f);
        let g = src[position++];
        if ((g & 128) > 0) {
          position -= 7;
          return;
        }
        return fromCharCode(a, b, c, d, e, f, g);
      } else {
        let e = src[position++];
        let f = src[position++];
        let g = src[position++];
        let h = src[position++];
        if ((e & 128) > 0 || (f & 128) > 0 || (g & 128) > 0 || (h & 128) > 0) {
          position -= 8;
          return;
        }
        if (length < 10) {
          if (length === 8)
            return fromCharCode(a, b, c, d, e, f, g, h);
          else {
            let i = src[position++];
            if ((i & 128) > 0) {
              position -= 9;
              return;
            }
            return fromCharCode(a, b, c, d, e, f, g, h, i);
          }
        } else if (length < 12) {
          let i = src[position++];
          let j = src[position++];
          if ((i & 128) > 0 || (j & 128) > 0) {
            position -= 10;
            return;
          }
          if (length < 11)
            return fromCharCode(a, b, c, d, e, f, g, h, i, j);
          let k = src[position++];
          if ((k & 128) > 0) {
            position -= 11;
            return;
          }
          return fromCharCode(a, b, c, d, e, f, g, h, i, j, k);
        } else {
          let i = src[position++];
          let j = src[position++];
          let k = src[position++];
          let l = src[position++];
          if ((i & 128) > 0 || (j & 128) > 0 || (k & 128) > 0 || (l & 128) > 0) {
            position -= 12;
            return;
          }
          if (length < 14) {
            if (length === 12)
              return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l);
            else {
              let m = src[position++];
              if ((m & 128) > 0) {
                position -= 13;
                return;
              }
              return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m);
            }
          } else {
            let m = src[position++];
            let n = src[position++];
            if ((m & 128) > 0 || (n & 128) > 0) {
              position -= 14;
              return;
            }
            if (length < 15)
              return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n);
            let o = src[position++];
            if ((o & 128) > 0) {
              position -= 15;
              return;
            }
            return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
          }
        }
      }
    }
  }
  function readOnlyJSString() {
    let token = src[position++];
    let length;
    if (token < 192) {
      length = token - 160;
    } else {
      switch (token) {
        case 217:
          length = src[position++];
          break;
        case 218:
          length = dataView.getUint16(position);
          position += 2;
          break;
        case 219:
          length = dataView.getUint32(position);
          position += 4;
          break;
        default:
          throw new Error("Expected string");
      }
    }
    return readStringJS(length);
  }
  function readBin(length) {
    return currentUnpackr.copyBuffers ? (
      // specifically use the copying slice (not the node one)
      Uint8Array.prototype.slice.call(src, position, position += length)
    ) : src.subarray(position, position += length);
  }
  function readExt(length) {
    let type = src[position++];
    if (currentExtensions[type]) {
      let end;
      return currentExtensions[type](src.subarray(position, end = position += length), (readPosition) => {
        position = readPosition;
        try {
          return read();
        } finally {
          position = end;
        }
      });
    } else
      throw new Error("Unknown extension type " + type);
  }
  var keyCache = new Array(4096);
  function readKey() {
    let length = src[position++];
    if (length >= 160 && length < 192) {
      length = length - 160;
      if (srcStringEnd >= position)
        return srcString.slice(position - srcStringStart, (position += length) - srcStringStart);
      else if (!(srcStringEnd == 0 && srcEnd < 180))
        return readFixedString(length);
    } else {
      position--;
      return asSafeString(read());
    }
    let key = (length << 5 ^ (length > 1 ? dataView.getUint16(position) : length > 0 ? src[position] : 0)) & 4095;
    let entry = keyCache[key];
    let checkPosition = position;
    let end = position + length - 3;
    let chunk;
    let i = 0;
    if (entry && entry.bytes == length) {
      while (checkPosition < end) {
        chunk = dataView.getUint32(checkPosition);
        if (chunk != entry[i++]) {
          checkPosition = 1879048192;
          break;
        }
        checkPosition += 4;
      }
      end += 3;
      while (checkPosition < end) {
        chunk = src[checkPosition++];
        if (chunk != entry[i++]) {
          checkPosition = 1879048192;
          break;
        }
      }
      if (checkPosition === end) {
        position = checkPosition;
        return entry.string;
      }
      end -= 3;
      checkPosition = position;
    }
    entry = [];
    keyCache[key] = entry;
    entry.bytes = length;
    while (checkPosition < end) {
      chunk = dataView.getUint32(checkPosition);
      entry.push(chunk);
      checkPosition += 4;
    }
    end += 3;
    while (checkPosition < end) {
      chunk = src[checkPosition++];
      entry.push(chunk);
    }
    let string2 = length < 16 ? shortStringInJS(length) : longStringInJS(length);
    if (string2 != null)
      return entry.string = string2;
    return entry.string = readFixedString(length);
  }
  function asSafeString(property) {
    if (typeof property === "string")
      return property;
    if (typeof property === "number" || typeof property === "boolean" || typeof property === "bigint")
      return property.toString();
    if (property == null)
      return property + "";
    if (currentUnpackr.allowArraysInMapKeys && Array.isArray(property) && property.flat().every((item) => ["string", "number", "boolean", "bigint"].includes(typeof item))) {
      return property.flat().toString();
    }
    throw new Error(`Invalid property type for record: ${typeof property}`);
  }
  var recordDefinition = (id, highByte) => {
    let structure = read().map(asSafeString);
    let firstByte = id;
    if (highByte !== void 0) {
      id = id < 32 ? -((highByte << 5) + id) : (highByte << 5) + id;
      structure.highByte = highByte;
    }
    let existingStructure = currentStructures[id];
    if (existingStructure && (existingStructure.isShared || sequentialMode)) {
      (currentStructures.restoreStructures || (currentStructures.restoreStructures = []))[id] = existingStructure;
    }
    currentStructures[id] = structure;
    structure.read = createStructureReader(structure, firstByte);
    return structure.read();
  };
  currentExtensions[0] = () => {
  };
  currentExtensions[0].noBuffer = true;
  currentExtensions[66] = (data) => {
    let length = data.length;
    let value = BigInt(data[0] & 128 ? data[0] - 256 : data[0]);
    for (let i = 1; i < length; i++) {
      value <<= BigInt(8);
      value += BigInt(data[i]);
    }
    return value;
  };
  var errors = { Error, TypeError, ReferenceError };
  currentExtensions[101] = () => {
    let data = read();
    return (errors[data[0]] || Error)(data[1], { cause: data[2] });
  };
  currentExtensions[105] = (data) => {
    if (currentUnpackr.structuredClone === false)
      throw new Error("Structured clone extension is disabled");
    let id = dataView.getUint32(position - 4);
    if (!referenceMap)
      referenceMap = /* @__PURE__ */ new Map();
    let token = src[position];
    let target2;
    if (token >= 144 && token < 160 || token == 220 || token == 221)
      target2 = [];
    else
      target2 = {};
    let refEntry = { target: target2 };
    referenceMap.set(id, refEntry);
    let targetProperties = read();
    if (refEntry.used)
      return Object.assign(target2, targetProperties);
    refEntry.target = targetProperties;
    return targetProperties;
  };
  currentExtensions[112] = (data) => {
    if (currentUnpackr.structuredClone === false)
      throw new Error("Structured clone extension is disabled");
    let id = dataView.getUint32(position - 4);
    let refEntry = referenceMap.get(id);
    refEntry.used = true;
    return refEntry.target;
  };
  currentExtensions[115] = () => new Set(read());
  var typedArrays = ["Int8", "Uint8", "Uint8Clamped", "Int16", "Uint16", "Int32", "Uint32", "Float32", "Float64", "BigInt64", "BigUint64"].map((type) => type + "Array");
  var glbl = typeof globalThis === "object" ? globalThis : window;
  currentExtensions[116] = (data) => {
    let typeCode = data[0];
    let typedArrayName = typedArrays[typeCode];
    if (!typedArrayName) {
      if (typeCode === 16) {
        let ab = new ArrayBuffer(data.length - 1);
        let u8 = new Uint8Array(ab);
        u8.set(data.subarray(1));
        return ab;
      }
      throw new Error("Could not find typed array for code " + typeCode);
    }
    return new glbl[typedArrayName](Uint8Array.prototype.slice.call(data, 1).buffer);
  };
  currentExtensions[120] = () => {
    let data = read();
    return new RegExp(data[0], data[1]);
  };
  var TEMP_BUNDLE = [];
  currentExtensions[98] = (data) => {
    let dataSize = (data[0] << 24) + (data[1] << 16) + (data[2] << 8) + data[3];
    let dataPosition = position;
    position += dataSize - data.length;
    bundledStrings = TEMP_BUNDLE;
    bundledStrings = [readOnlyJSString(), readOnlyJSString()];
    bundledStrings.position0 = 0;
    bundledStrings.position1 = 0;
    bundledStrings.postBundlePosition = position;
    position = dataPosition;
    return read();
  };
  currentExtensions[255] = (data) => {
    if (data.length == 4)
      return new Date((data[0] * 16777216 + (data[1] << 16) + (data[2] << 8) + data[3]) * 1e3);
    else if (data.length == 8)
      return new Date(
        ((data[0] << 22) + (data[1] << 14) + (data[2] << 6) + (data[3] >> 2)) / 1e6 + ((data[3] & 3) * 4294967296 + data[4] * 16777216 + (data[5] << 16) + (data[6] << 8) + data[7]) * 1e3
      );
    else if (data.length == 12)
      return new Date(
        ((data[0] << 24) + (data[1] << 16) + (data[2] << 8) + data[3]) / 1e6 + ((data[4] & 128 ? -281474976710656 : 0) + data[6] * 1099511627776 + data[7] * 4294967296 + data[8] * 16777216 + (data[9] << 16) + (data[10] << 8) + data[11]) * 1e3
      );
    else
      return /* @__PURE__ */ new Date("invalid");
  };
  function saveState(callback) {
    if (onSaveState)
      onSaveState();
    let savedSrcEnd = srcEnd;
    let savedPosition = position;
    let savedStringPosition = stringPosition;
    let savedSrcStringStart = srcStringStart;
    let savedSrcStringEnd = srcStringEnd;
    let savedSrcString = srcString;
    let savedStrings = strings;
    let savedReferenceMap = referenceMap;
    let savedBundledStrings = bundledStrings;
    let savedSrc = new Uint8Array(src.slice(0, srcEnd));
    let savedStructures = currentStructures;
    let savedStructuresContents = currentStructures.slice(0, currentStructures.length);
    let savedPackr = currentUnpackr;
    let savedSequentialMode = sequentialMode;
    let value = callback();
    srcEnd = savedSrcEnd;
    position = savedPosition;
    stringPosition = savedStringPosition;
    srcStringStart = savedSrcStringStart;
    srcStringEnd = savedSrcStringEnd;
    srcString = savedSrcString;
    strings = savedStrings;
    referenceMap = savedReferenceMap;
    bundledStrings = savedBundledStrings;
    src = savedSrc;
    sequentialMode = savedSequentialMode;
    currentStructures = savedStructures;
    currentStructures.splice(0, currentStructures.length, ...savedStructuresContents);
    currentUnpackr = savedPackr;
    dataView = new DataView(src.buffer, src.byteOffset, src.byteLength);
    return value;
  }
  function clearSource() {
    src = null;
    referenceMap = null;
    currentStructures = null;
  }
  var mult10 = new Array(147);
  for (let i = 0; i < 256; i++) {
    mult10[i] = +("1e" + Math.floor(45.15 - i * 0.30103));
  }
  var defaultUnpackr = new Unpackr({ useRecords: false });
  var unpack = defaultUnpackr.unpack;
  var unpackMultiple = defaultUnpackr.unpackMultiple;
  var decode2 = defaultUnpackr.unpack;
  var FLOAT32_OPTIONS = {
    NEVER: 0,
    ALWAYS: 1,
    DECIMAL_ROUND: 3,
    DECIMAL_FIT: 4
  };
  var f32Array = new Float32Array(1);
  var u8Array = new Uint8Array(f32Array.buffer, 0, 4);

  // node_modules/@colyseus/msgpackr/pack.js
  var textEncoder2;
  try {
    textEncoder2 = new TextEncoder();
  } catch (error) {
  }
  var extensions;
  var extensionClasses;
  var hasNodeBuffer = typeof Buffer !== "undefined";
  var ByteArrayAllocate = hasNodeBuffer ? function(length) {
    return Buffer.allocUnsafeSlow(length);
  } : Uint8Array;
  var ByteArray = hasNodeBuffer ? Buffer : Uint8Array;
  var MAX_BUFFER_SIZE = hasNodeBuffer ? 4294967296 : 2144337920;
  var target;
  var keysTarget;
  var targetView;
  var position2 = 0;
  var safeEnd;
  var bundledStrings2 = null;
  var writeStructSlots;
  var MAX_BUNDLE_SIZE = 21760;
  var hasNonLatin = /[\u0080-\uFFFF]/;
  var RECORD_SYMBOL = Symbol("record-id");
  var Packr = class extends Unpackr {
    constructor(options) {
      super(options);
      this.offset = 0;
      let typeBuffer;
      let start;
      let hasSharedUpdate;
      let structures;
      let referenceMap2;
      let encodeUtf8 = ByteArray.prototype.utf8Write ? function(string2, position3) {
        return target.utf8Write(string2, position3, target.byteLength - position3);
      } : textEncoder2 && textEncoder2.encodeInto ? function(string2, position3) {
        return textEncoder2.encodeInto(string2, target.subarray(position3)).written;
      } : false;
      let packr = this;
      if (!options)
        options = {};
      let isSequential = options && options.sequential;
      let hasSharedStructures = options.structures || options.saveStructures;
      let maxSharedStructures = options.maxSharedStructures;
      if (maxSharedStructures == null)
        maxSharedStructures = hasSharedStructures ? 32 : 0;
      if (maxSharedStructures > 8160)
        throw new Error("Maximum maxSharedStructure is 8160");
      if (options.structuredClone && options.moreTypes == void 0) {
        this.moreTypes = true;
      }
      let maxOwnStructures = options.maxOwnStructures;
      if (maxOwnStructures == null)
        maxOwnStructures = hasSharedStructures ? 32 : 64;
      if (!this.structures && options.useRecords != false)
        this.structures = [];
      let useTwoByteRecords = maxSharedStructures > 32 || maxOwnStructures + maxSharedStructures > 64;
      let sharedLimitId = maxSharedStructures + 64;
      let maxStructureId = maxSharedStructures + maxOwnStructures + 64;
      if (maxStructureId > 8256) {
        throw new Error("Maximum maxSharedStructure + maxOwnStructure is 8192");
      }
      let recordIdsToRemove = [];
      let transitionsCount = 0;
      let serializationsSinceTransitionRebuild = 0;
      this.pack = this.encode = function(value, encodeOptions) {
        if (!target) {
          target = new ByteArrayAllocate(8192);
          targetView = target.dataView || (target.dataView = new DataView(target.buffer, 0, 8192));
          position2 = 0;
        }
        safeEnd = target.length - 10;
        if (safeEnd - position2 < 2048) {
          target = new ByteArrayAllocate(target.length);
          targetView = target.dataView || (target.dataView = new DataView(target.buffer, 0, target.length));
          safeEnd = target.length - 10;
          position2 = 0;
        } else
          position2 = position2 + 7 & 2147483640;
        start = position2;
        if (encodeOptions & RESERVE_START_SPACE)
          position2 += encodeOptions & 255;
        referenceMap2 = packr.structuredClone ? /* @__PURE__ */ new Map() : null;
        if (packr.bundleStrings && typeof value !== "string") {
          bundledStrings2 = [];
          bundledStrings2.size = Infinity;
        } else
          bundledStrings2 = null;
        structures = packr.structures;
        if (structures) {
          if (structures.uninitialized)
            structures = packr._mergeStructures(packr.getStructures());
          let sharedLength = structures.sharedLength || 0;
          if (sharedLength > maxSharedStructures) {
            throw new Error("Shared structures is larger than maximum shared structures, try increasing maxSharedStructures to " + structures.sharedLength);
          }
          if (!structures.transitions) {
            structures.transitions = /* @__PURE__ */ Object.create(null);
            for (let i = 0; i < sharedLength; i++) {
              let keys = structures[i];
              if (!keys)
                continue;
              let nextTransition, transition = structures.transitions;
              for (let j = 0, l = keys.length; j < l; j++) {
                let key = keys[j];
                nextTransition = transition[key];
                if (!nextTransition) {
                  nextTransition = transition[key] = /* @__PURE__ */ Object.create(null);
                }
                transition = nextTransition;
              }
              transition[RECORD_SYMBOL] = i + 64;
            }
            this.lastNamedStructuresLength = sharedLength;
          }
          if (!isSequential) {
            structures.nextId = sharedLength + 64;
          }
        }
        if (hasSharedUpdate)
          hasSharedUpdate = false;
        let encodingError;
        try {
          if (packr.randomAccessStructure && value && value.constructor && value.constructor === Object)
            writeStruct(value);
          else
            pack2(value);
          let lastBundle = bundledStrings2;
          if (bundledStrings2)
            writeBundles(start, pack2, 0);
          if (referenceMap2 && referenceMap2.idsToInsert) {
            let idsToInsert = referenceMap2.idsToInsert.sort((a, b) => a.offset > b.offset ? 1 : -1);
            let i = idsToInsert.length;
            let incrementPosition = -1;
            while (lastBundle && i > 0) {
              let insertionPoint = idsToInsert[--i].offset + start;
              if (insertionPoint < lastBundle.stringsPosition + start && incrementPosition === -1)
                incrementPosition = 0;
              if (insertionPoint > lastBundle.position + start) {
                if (incrementPosition >= 0)
                  incrementPosition += 6;
              } else {
                if (incrementPosition >= 0) {
                  targetView.setUint32(
                    lastBundle.position + start,
                    targetView.getUint32(lastBundle.position + start) + incrementPosition
                  );
                  incrementPosition = -1;
                }
                lastBundle = lastBundle.previous;
                i++;
              }
            }
            if (incrementPosition >= 0 && lastBundle) {
              targetView.setUint32(
                lastBundle.position + start,
                targetView.getUint32(lastBundle.position + start) + incrementPosition
              );
            }
            position2 += idsToInsert.length * 6;
            if (position2 > safeEnd)
              makeRoom(position2);
            packr.offset = position2;
            let serialized = insertIds(target.subarray(start, position2), idsToInsert);
            referenceMap2 = null;
            return serialized;
          }
          packr.offset = position2;
          if (encodeOptions & REUSE_BUFFER_MODE) {
            target.start = start;
            target.end = position2;
            return target;
          }
          return target.subarray(start, position2);
        } catch (error) {
          encodingError = error;
          throw error;
        } finally {
          if (structures) {
            resetStructures();
            if (hasSharedUpdate && packr.saveStructures) {
              let sharedLength = structures.sharedLength || 0;
              let returnBuffer = target.subarray(start, position2);
              let newSharedData = prepareStructures(structures, packr);
              if (!encodingError) {
                if (packr.saveStructures(newSharedData, newSharedData.isCompatible) === false) {
                  return packr.pack(value, encodeOptions);
                }
                packr.lastNamedStructuresLength = sharedLength;
                if (target.length > 1073741824)
                  target = null;
                return returnBuffer;
              }
            }
          }
          if (target.length > 1073741824)
            target = null;
          if (encodeOptions & RESET_BUFFER_MODE)
            position2 = start;
        }
      };
      const resetStructures = () => {
        if (serializationsSinceTransitionRebuild < 10)
          serializationsSinceTransitionRebuild++;
        let sharedLength = structures.sharedLength || 0;
        if (structures.length > sharedLength && !isSequential)
          structures.length = sharedLength;
        if (transitionsCount > 1e4) {
          structures.transitions = null;
          serializationsSinceTransitionRebuild = 0;
          transitionsCount = 0;
          if (recordIdsToRemove.length > 0)
            recordIdsToRemove = [];
        } else if (recordIdsToRemove.length > 0 && !isSequential) {
          for (let i = 0, l = recordIdsToRemove.length; i < l; i++) {
            recordIdsToRemove[i][RECORD_SYMBOL] = 0;
          }
          recordIdsToRemove = [];
        }
      };
      const packArray = (value) => {
        var length = value.length;
        if (length < 16) {
          target[position2++] = 144 | length;
        } else if (length < 65536) {
          target[position2++] = 220;
          target[position2++] = length >> 8;
          target[position2++] = length & 255;
        } else {
          target[position2++] = 221;
          targetView.setUint32(position2, length);
          position2 += 4;
        }
        for (let i = 0; i < length; i++) {
          pack2(value[i]);
        }
      };
      const pack2 = (value) => {
        if (position2 > safeEnd)
          target = makeRoom(position2);
        var type = typeof value;
        var length;
        if (type === "string") {
          let strLength = value.length;
          if (bundledStrings2 && strLength >= 4 && strLength < 4096) {
            if ((bundledStrings2.size += strLength) > MAX_BUNDLE_SIZE) {
              let extStart;
              let maxBytes2 = (bundledStrings2[0] ? bundledStrings2[0].length * 3 + bundledStrings2[1].length : 0) + 10;
              if (position2 + maxBytes2 > safeEnd)
                target = makeRoom(position2 + maxBytes2);
              let lastBundle;
              if (bundledStrings2.position) {
                lastBundle = bundledStrings2;
                target[position2] = 200;
                position2 += 3;
                target[position2++] = 98;
                extStart = position2 - start;
                position2 += 4;
                writeBundles(start, pack2, 0);
                targetView.setUint16(extStart + start - 3, position2 - start - extStart);
              } else {
                target[position2++] = 214;
                target[position2++] = 98;
                extStart = position2 - start;
                position2 += 4;
              }
              bundledStrings2 = ["", ""];
              bundledStrings2.previous = lastBundle;
              bundledStrings2.size = 0;
              bundledStrings2.position = extStart;
            }
            let twoByte = hasNonLatin.test(value);
            bundledStrings2[twoByte ? 0 : 1] += value;
            target[position2++] = 193;
            pack2(twoByte ? -strLength : strLength);
            return;
          }
          let headerSize;
          if (strLength < 32) {
            headerSize = 1;
          } else if (strLength < 256) {
            headerSize = 2;
          } else if (strLength < 65536) {
            headerSize = 3;
          } else {
            headerSize = 5;
          }
          let maxBytes = strLength * 3;
          if (position2 + maxBytes > safeEnd)
            target = makeRoom(position2 + maxBytes);
          if (strLength < 64 || !encodeUtf8) {
            let i, c1, c2, strPosition = position2 + headerSize;
            for (i = 0; i < strLength; i++) {
              c1 = value.charCodeAt(i);
              if (c1 < 128) {
                target[strPosition++] = c1;
              } else if (c1 < 2048) {
                target[strPosition++] = c1 >> 6 | 192;
                target[strPosition++] = c1 & 63 | 128;
              } else if ((c1 & 64512) === 55296 && ((c2 = value.charCodeAt(i + 1)) & 64512) === 56320) {
                c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
                i++;
                target[strPosition++] = c1 >> 18 | 240;
                target[strPosition++] = c1 >> 12 & 63 | 128;
                target[strPosition++] = c1 >> 6 & 63 | 128;
                target[strPosition++] = c1 & 63 | 128;
              } else {
                target[strPosition++] = c1 >> 12 | 224;
                target[strPosition++] = c1 >> 6 & 63 | 128;
                target[strPosition++] = c1 & 63 | 128;
              }
            }
            length = strPosition - position2 - headerSize;
          } else {
            length = encodeUtf8(value, position2 + headerSize);
          }
          if (length < 32) {
            target[position2++] = 160 | length;
          } else if (length < 256) {
            if (headerSize < 2) {
              target.copyWithin(position2 + 2, position2 + 1, position2 + 1 + length);
            }
            target[position2++] = 217;
            target[position2++] = length;
          } else if (length < 65536) {
            if (headerSize < 3) {
              target.copyWithin(position2 + 3, position2 + 2, position2 + 2 + length);
            }
            target[position2++] = 218;
            target[position2++] = length >> 8;
            target[position2++] = length & 255;
          } else {
            if (headerSize < 5) {
              target.copyWithin(position2 + 5, position2 + 3, position2 + 3 + length);
            }
            target[position2++] = 219;
            targetView.setUint32(position2, length);
            position2 += 4;
          }
          position2 += length;
        } else if (type === "number") {
          if (value >>> 0 === value) {
            if (value < 32 || value < 128 && this.useRecords === false || value < 64 && !this.randomAccessStructure) {
              target[position2++] = value;
            } else if (value < 256) {
              target[position2++] = 204;
              target[position2++] = value;
            } else if (value < 65536) {
              target[position2++] = 205;
              target[position2++] = value >> 8;
              target[position2++] = value & 255;
            } else {
              target[position2++] = 206;
              targetView.setUint32(position2, value);
              position2 += 4;
            }
          } else if (value >> 0 === value) {
            if (value >= -32) {
              target[position2++] = 256 + value;
            } else if (value >= -128) {
              target[position2++] = 208;
              target[position2++] = value + 256;
            } else if (value >= -32768) {
              target[position2++] = 209;
              targetView.setInt16(position2, value);
              position2 += 2;
            } else {
              target[position2++] = 210;
              targetView.setInt32(position2, value);
              position2 += 4;
            }
          } else {
            let useFloat32;
            if ((useFloat32 = this.useFloat32) > 0 && value < 4294967296 && value >= -2147483648) {
              target[position2++] = 202;
              targetView.setFloat32(position2, value);
              let xShifted;
              if (useFloat32 < 4 || // this checks for rounding of numbers that were encoded in 32-bit float to nearest significant decimal digit that could be preserved
              (xShifted = value * mult10[(target[position2] & 127) << 1 | target[position2 + 1] >> 7]) >> 0 === xShifted) {
                position2 += 4;
                return;
              } else
                position2--;
            }
            target[position2++] = 203;
            targetView.setFloat64(position2, value);
            position2 += 8;
          }
        } else if (type === "object" || type === "function") {
          if (!value)
            target[position2++] = 192;
          else {
            if (referenceMap2) {
              let referee = referenceMap2.get(value);
              if (referee) {
                if (!referee.id) {
                  let idsToInsert = referenceMap2.idsToInsert || (referenceMap2.idsToInsert = []);
                  referee.id = idsToInsert.push(referee);
                }
                target[position2++] = 214;
                target[position2++] = 112;
                targetView.setUint32(position2, referee.id);
                position2 += 4;
                return;
              } else
                referenceMap2.set(value, { offset: position2 - start });
            }
            let constructor = value.constructor;
            if (constructor === Object) {
              writeObject(value);
            } else if (constructor === Array) {
              packArray(value);
            } else if (constructor === Map) {
              if (this.mapAsEmptyObject)
                target[position2++] = 128;
              else {
                length = value.size;
                if (length < 16) {
                  target[position2++] = 128 | length;
                } else if (length < 65536) {
                  target[position2++] = 222;
                  target[position2++] = length >> 8;
                  target[position2++] = length & 255;
                } else {
                  target[position2++] = 223;
                  targetView.setUint32(position2, length);
                  position2 += 4;
                }
                for (let [key, entryValue] of value) {
                  pack2(key);
                  pack2(entryValue);
                }
              }
            } else {
              for (let i = 0, l = extensions.length; i < l; i++) {
                let extensionClass = extensionClasses[i];
                if (value instanceof extensionClass) {
                  let extension = extensions[i];
                  if (extension.write) {
                    if (extension.type) {
                      target[position2++] = 212;
                      target[position2++] = extension.type;
                      target[position2++] = 0;
                    }
                    let writeResult = extension.write.call(this, value);
                    if (writeResult === value) {
                      if (Array.isArray(value)) {
                        packArray(value);
                      } else {
                        writeObject(value);
                      }
                    } else {
                      pack2(writeResult);
                    }
                    return;
                  }
                  let currentTarget = target;
                  let currentTargetView = targetView;
                  let currentPosition = position2;
                  target = null;
                  let result;
                  try {
                    result = extension.pack.call(this, value, (size) => {
                      target = currentTarget;
                      currentTarget = null;
                      position2 += size;
                      if (position2 > safeEnd)
                        makeRoom(position2);
                      return {
                        target,
                        targetView,
                        position: position2 - size
                      };
                    }, pack2);
                  } finally {
                    if (currentTarget) {
                      target = currentTarget;
                      targetView = currentTargetView;
                      position2 = currentPosition;
                      safeEnd = target.length - 10;
                    }
                  }
                  if (result) {
                    if (result.length + position2 > safeEnd)
                      makeRoom(result.length + position2);
                    position2 = writeExtensionData(result, target, position2, extension.type);
                  }
                  return;
                }
              }
              if (Array.isArray(value)) {
                packArray(value);
              } else {
                if (value.toJSON) {
                  const json = value.toJSON();
                  if (json !== value)
                    return pack2(json);
                }
                if (type === "function")
                  return pack2(this.writeFunction && this.writeFunction(value));
                writeObject(value);
              }
            }
          }
        } else if (type === "boolean") {
          target[position2++] = value ? 195 : 194;
        } else if (type === "bigint") {
          if (value < BigInt(1) << BigInt(63) && value >= -(BigInt(1) << BigInt(63))) {
            target[position2++] = 211;
            targetView.setBigInt64(position2, value);
          } else if (value < BigInt(1) << BigInt(64) && value > 0) {
            target[position2++] = 207;
            targetView.setBigUint64(position2, value);
          } else {
            if (this.largeBigIntToFloat) {
              target[position2++] = 203;
              targetView.setFloat64(position2, Number(value));
            } else if (this.largeBigIntToString) {
              return pack2(value.toString());
            } else if (this.useBigIntExtension && value < BigInt(2) ** BigInt(1023) && value > -(BigInt(2) ** BigInt(1023))) {
              target[position2++] = 199;
              position2++;
              target[position2++] = 66;
              let bytes = [];
              let alignedSign;
              do {
                let byte = value & BigInt(255);
                alignedSign = (byte & BigInt(128)) === (value < BigInt(0) ? BigInt(128) : BigInt(0));
                bytes.push(byte);
                value >>= BigInt(8);
              } while (!((value === BigInt(0) || value === BigInt(-1)) && alignedSign));
              target[position2 - 2] = bytes.length;
              for (let i = bytes.length; i > 0; ) {
                target[position2++] = Number(bytes[--i]);
              }
              return;
            } else {
              throw new RangeError(value + " was too large to fit in MessagePack 64-bit integer format, use useBigIntExtension, or set largeBigIntToFloat to convert to float-64, or set largeBigIntToString to convert to string");
            }
          }
          position2 += 8;
        } else if (type === "undefined") {
          if (this.encodeUndefinedAsNil)
            target[position2++] = 192;
          else {
            target[position2++] = 212;
            target[position2++] = 0;
            target[position2++] = 0;
          }
        } else {
          throw new Error("Unknown type: " + type);
        }
      };
      const writePlainObject = this.variableMapSize || this.coercibleKeyAsNumber || this.skipValues ? (object) => {
        let keys;
        if (this.skipValues) {
          keys = [];
          for (let key2 in object) {
            if ((typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key2)) && !this.skipValues.includes(object[key2]))
              keys.push(key2);
          }
        } else {
          keys = Object.keys(object);
        }
        let length = keys.length;
        if (length < 16) {
          target[position2++] = 128 | length;
        } else if (length < 65536) {
          target[position2++] = 222;
          target[position2++] = length >> 8;
          target[position2++] = length & 255;
        } else {
          target[position2++] = 223;
          targetView.setUint32(position2, length);
          position2 += 4;
        }
        let key;
        if (this.coercibleKeyAsNumber) {
          for (let i = 0; i < length; i++) {
            key = keys[i];
            let num = Number(key);
            pack2(isNaN(num) ? key : num);
            pack2(object[key]);
          }
        } else {
          for (let i = 0; i < length; i++) {
            pack2(key = keys[i]);
            pack2(object[key]);
          }
        }
      } : (object) => {
        target[position2++] = 222;
        let objectOffset = position2 - start;
        position2 += 2;
        let size = 0;
        for (let key in object) {
          if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
            pack2(key);
            pack2(object[key]);
            size++;
          }
        }
        if (size > 65535) {
          throw new Error('Object is too large to serialize with fast 16-bit map size, use the "variableMapSize" option to serialize this object');
        }
        target[objectOffset++ + start] = size >> 8;
        target[objectOffset + start] = size & 255;
      };
      const writeRecord = this.useRecords === false ? writePlainObject : options.progressiveRecords && !useTwoByteRecords ? (
        // this is about 2% faster for highly stable structures, since it only requires one for-in loop (but much more expensive when new structure needs to be written)
        (object) => {
          let nextTransition, transition = structures.transitions || (structures.transitions = /* @__PURE__ */ Object.create(null));
          let objectOffset = position2++ - start;
          let wroteKeys;
          for (let key in object) {
            if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
              nextTransition = transition[key];
              if (nextTransition)
                transition = nextTransition;
              else {
                let keys = Object.keys(object);
                let lastTransition = transition;
                transition = structures.transitions;
                let newTransitions = 0;
                for (let i = 0, l = keys.length; i < l; i++) {
                  let key2 = keys[i];
                  nextTransition = transition[key2];
                  if (!nextTransition) {
                    nextTransition = transition[key2] = /* @__PURE__ */ Object.create(null);
                    newTransitions++;
                  }
                  transition = nextTransition;
                }
                if (objectOffset + start + 1 == position2) {
                  position2--;
                  newRecord(transition, keys, newTransitions);
                } else
                  insertNewRecord(transition, keys, objectOffset, newTransitions);
                wroteKeys = true;
                transition = lastTransition[key];
              }
              pack2(object[key]);
            }
          }
          if (!wroteKeys) {
            let recordId = transition[RECORD_SYMBOL];
            if (recordId)
              target[objectOffset + start] = recordId;
            else
              insertNewRecord(transition, Object.keys(object), objectOffset, 0);
          }
        }
      ) : (object) => {
        let nextTransition, transition = structures.transitions || (structures.transitions = /* @__PURE__ */ Object.create(null));
        let newTransitions = 0;
        for (let key in object)
          if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
            nextTransition = transition[key];
            if (!nextTransition) {
              nextTransition = transition[key] = /* @__PURE__ */ Object.create(null);
              newTransitions++;
            }
            transition = nextTransition;
          }
        let recordId = transition[RECORD_SYMBOL];
        if (recordId) {
          if (recordId >= 96 && useTwoByteRecords) {
            target[position2++] = ((recordId -= 96) & 31) + 96;
            target[position2++] = recordId >> 5;
          } else
            target[position2++] = recordId;
        } else {
          newRecord(transition, transition.__keys__ || Object.keys(object), newTransitions);
        }
        for (let key in object)
          if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
            pack2(object[key]);
          }
      };
      const checkUseRecords = typeof this.useRecords == "function" && this.useRecords;
      const writeObject = checkUseRecords ? (object) => {
        checkUseRecords(object) ? writeRecord(object) : writePlainObject(object);
      } : writeRecord;
      const makeRoom = (end) => {
        let newSize;
        if (end > 16777216) {
          if (end - start > MAX_BUFFER_SIZE)
            throw new Error("Packed buffer would be larger than maximum buffer size");
          newSize = Math.min(
            MAX_BUFFER_SIZE,
            Math.round(Math.max((end - start) * (end > 67108864 ? 1.25 : 2), 4194304) / 4096) * 4096
          );
        } else
          newSize = (Math.max(end - start << 2, target.length - 1) >> 12) + 1 << 12;
        let newBuffer = new ByteArrayAllocate(newSize);
        targetView = newBuffer.dataView || (newBuffer.dataView = new DataView(newBuffer.buffer, 0, newSize));
        end = Math.min(end, target.length);
        if (target.copy)
          target.copy(newBuffer, 0, start, end);
        else
          newBuffer.set(target.slice(start, end));
        position2 -= start;
        start = 0;
        safeEnd = newBuffer.length - 10;
        return target = newBuffer;
      };
      const newRecord = (transition, keys, newTransitions) => {
        let recordId = structures.nextId;
        if (!recordId)
          recordId = 64;
        if (recordId < sharedLimitId && this.shouldShareStructure && !this.shouldShareStructure(keys)) {
          recordId = structures.nextOwnId;
          if (!(recordId < maxStructureId))
            recordId = sharedLimitId;
          structures.nextOwnId = recordId + 1;
        } else {
          if (recordId >= maxStructureId)
            recordId = sharedLimitId;
          structures.nextId = recordId + 1;
        }
        let highByte = keys.highByte = recordId >= 96 && useTwoByteRecords ? recordId - 96 >> 5 : -1;
        transition[RECORD_SYMBOL] = recordId;
        transition.__keys__ = keys;
        structures[recordId - 64] = keys;
        if (recordId < sharedLimitId) {
          keys.isShared = true;
          structures.sharedLength = recordId - 63;
          hasSharedUpdate = true;
          if (highByte >= 0) {
            target[position2++] = (recordId & 31) + 96;
            target[position2++] = highByte;
          } else {
            target[position2++] = recordId;
          }
        } else {
          if (highByte >= 0) {
            target[position2++] = 213;
            target[position2++] = 114;
            target[position2++] = (recordId & 31) + 96;
            target[position2++] = highByte;
          } else {
            target[position2++] = 212;
            target[position2++] = 114;
            target[position2++] = recordId;
          }
          if (newTransitions)
            transitionsCount += serializationsSinceTransitionRebuild * newTransitions;
          if (recordIdsToRemove.length >= maxOwnStructures)
            recordIdsToRemove.shift()[RECORD_SYMBOL] = 0;
          recordIdsToRemove.push(transition);
          pack2(keys);
        }
      };
      const insertNewRecord = (transition, keys, insertionOffset, newTransitions) => {
        let mainTarget = target;
        let mainPosition = position2;
        let mainSafeEnd = safeEnd;
        let mainStart = start;
        target = keysTarget;
        position2 = 0;
        start = 0;
        if (!target)
          keysTarget = target = new ByteArrayAllocate(8192);
        safeEnd = target.length - 10;
        newRecord(transition, keys, newTransitions);
        keysTarget = target;
        let keysPosition = position2;
        target = mainTarget;
        position2 = mainPosition;
        safeEnd = mainSafeEnd;
        start = mainStart;
        if (keysPosition > 1) {
          let newEnd = position2 + keysPosition - 1;
          if (newEnd > safeEnd)
            makeRoom(newEnd);
          let insertionPosition = insertionOffset + start;
          target.copyWithin(insertionPosition + keysPosition, insertionPosition + 1, position2);
          target.set(keysTarget.slice(0, keysPosition), insertionPosition);
          position2 = newEnd;
        } else {
          target[insertionOffset + start] = keysTarget[0];
        }
      };
      const writeStruct = (object) => {
        let newPosition = writeStructSlots(object, target, start, position2, structures, makeRoom, (value, newPosition2, notifySharedUpdate) => {
          if (notifySharedUpdate)
            return hasSharedUpdate = true;
          position2 = newPosition2;
          let startTarget = target;
          pack2(value);
          resetStructures();
          if (startTarget !== target) {
            return { position: position2, targetView, target };
          }
          return position2;
        }, this);
        if (newPosition === 0)
          return writeObject(object);
        position2 = newPosition;
      };
    }
    useBuffer(buffer) {
      target = buffer;
      target.dataView || (target.dataView = new DataView(target.buffer, target.byteOffset, target.byteLength));
      position2 = 0;
    }
    set position(value) {
      position2 = value;
    }
    get position() {
      return position2;
    }
    set buffer(buffer) {
      target = buffer;
    }
    get buffer() {
      return target;
    }
    clearSharedData() {
      if (this.structures)
        this.structures = [];
      if (this.typedStructs)
        this.typedStructs = [];
    }
  };
  extensionClasses = [Date, Set, Error, RegExp, ArrayBuffer, Object.getPrototypeOf(Uint8Array.prototype).constructor, C1Type];
  extensions = [{
    pack(date, allocateForWrite, pack2) {
      let seconds = date.getTime() / 1e3;
      if ((this.useTimestamp32 || date.getMilliseconds() === 0) && seconds >= 0 && seconds < 4294967296) {
        let { target: target2, targetView: targetView2, position: position3 } = allocateForWrite(6);
        target2[position3++] = 214;
        target2[position3++] = 255;
        targetView2.setUint32(position3, seconds);
      } else if (seconds > 0 && seconds < 4294967296) {
        let { target: target2, targetView: targetView2, position: position3 } = allocateForWrite(10);
        target2[position3++] = 215;
        target2[position3++] = 255;
        targetView2.setUint32(position3, date.getMilliseconds() * 4e6 + (seconds / 1e3 / 4294967296 >> 0));
        targetView2.setUint32(position3 + 4, seconds);
      } else if (isNaN(seconds)) {
        if (this.onInvalidDate) {
          allocateForWrite(0);
          return pack2(this.onInvalidDate());
        }
        let { target: target2, targetView: targetView2, position: position3 } = allocateForWrite(3);
        target2[position3++] = 212;
        target2[position3++] = 255;
        target2[position3++] = 255;
      } else {
        let { target: target2, targetView: targetView2, position: position3 } = allocateForWrite(15);
        target2[position3++] = 199;
        target2[position3++] = 12;
        target2[position3++] = 255;
        targetView2.setUint32(position3, date.getMilliseconds() * 1e6);
        targetView2.setBigInt64(position3 + 4, BigInt(Math.floor(seconds)));
      }
    }
  }, {
    pack(set, allocateForWrite, pack2) {
      if (this.setAsEmptyObject) {
        allocateForWrite(0);
        return pack2({});
      }
      let array = Array.from(set);
      let { target: target2, position: position3 } = allocateForWrite(this.moreTypes ? 3 : 0);
      if (this.moreTypes) {
        target2[position3++] = 212;
        target2[position3++] = 115;
        target2[position3++] = 0;
      }
      pack2(array);
    }
  }, {
    pack(error, allocateForWrite, pack2) {
      let { target: target2, position: position3 } = allocateForWrite(this.moreTypes ? 3 : 0);
      if (this.moreTypes) {
        target2[position3++] = 212;
        target2[position3++] = 101;
        target2[position3++] = 0;
      }
      pack2([error.name, error.message, error.cause]);
    }
  }, {
    pack(regex, allocateForWrite, pack2) {
      let { target: target2, position: position3 } = allocateForWrite(this.moreTypes ? 3 : 0);
      if (this.moreTypes) {
        target2[position3++] = 212;
        target2[position3++] = 120;
        target2[position3++] = 0;
      }
      pack2([regex.source, regex.flags]);
    }
  }, {
    pack(arrayBuffer, allocateForWrite) {
      if (this.moreTypes)
        writeExtBuffer(arrayBuffer, 16, allocateForWrite);
      else
        writeBuffer(hasNodeBuffer ? Buffer.from(arrayBuffer) : new Uint8Array(arrayBuffer), allocateForWrite);
    }
  }, {
    pack(typedArray, allocateForWrite) {
      let constructor = typedArray.constructor;
      if (constructor !== ByteArray && this.moreTypes)
        writeExtBuffer(typedArray, typedArrays.indexOf(constructor.name), allocateForWrite);
      else
        writeBuffer(typedArray, allocateForWrite);
    }
  }, {
    pack(c1, allocateForWrite) {
      let { target: target2, position: position3 } = allocateForWrite(1);
      target2[position3] = 193;
    }
  }];
  function writeExtBuffer(typedArray, type, allocateForWrite, encode3) {
    let length = typedArray.byteLength;
    if (length + 1 < 256) {
      var { target: target2, position: position3 } = allocateForWrite(4 + length);
      target2[position3++] = 199;
      target2[position3++] = length + 1;
    } else if (length + 1 < 65536) {
      var { target: target2, position: position3 } = allocateForWrite(5 + length);
      target2[position3++] = 200;
      target2[position3++] = length + 1 >> 8;
      target2[position3++] = length + 1 & 255;
    } else {
      var { target: target2, position: position3, targetView: targetView2 } = allocateForWrite(7 + length);
      target2[position3++] = 201;
      targetView2.setUint32(position3, length + 1);
      position3 += 4;
    }
    target2[position3++] = 116;
    target2[position3++] = type;
    if (!typedArray.buffer)
      typedArray = new Uint8Array(typedArray);
    target2.set(new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength), position3);
  }
  function writeBuffer(buffer, allocateForWrite) {
    let length = buffer.byteLength;
    var target2, position3;
    if (length < 256) {
      var { target: target2, position: position3 } = allocateForWrite(length + 2);
      target2[position3++] = 196;
      target2[position3++] = length;
    } else if (length < 65536) {
      var { target: target2, position: position3 } = allocateForWrite(length + 3);
      target2[position3++] = 197;
      target2[position3++] = length >> 8;
      target2[position3++] = length & 255;
    } else {
      var { target: target2, position: position3, targetView: targetView2 } = allocateForWrite(length + 5);
      target2[position3++] = 198;
      targetView2.setUint32(position3, length);
      position3 += 4;
    }
    target2.set(buffer, position3);
  }
  function writeExtensionData(result, target2, position3, type) {
    let length = result.length;
    switch (length) {
      case 1:
        target2[position3++] = 212;
        break;
      case 2:
        target2[position3++] = 213;
        break;
      case 4:
        target2[position3++] = 214;
        break;
      case 8:
        target2[position3++] = 215;
        break;
      case 16:
        target2[position3++] = 216;
        break;
      default:
        if (length < 256) {
          target2[position3++] = 199;
          target2[position3++] = length;
        } else if (length < 65536) {
          target2[position3++] = 200;
          target2[position3++] = length >> 8;
          target2[position3++] = length & 255;
        } else {
          target2[position3++] = 201;
          target2[position3++] = length >> 24;
          target2[position3++] = length >> 16 & 255;
          target2[position3++] = length >> 8 & 255;
          target2[position3++] = length & 255;
        }
    }
    target2[position3++] = type;
    target2.set(result, position3);
    position3 += length;
    return position3;
  }
  function insertIds(serialized, idsToInsert) {
    let nextId;
    let distanceToMove = idsToInsert.length * 6;
    let lastEnd = serialized.length - distanceToMove;
    while (nextId = idsToInsert.pop()) {
      let offset = nextId.offset;
      let id = nextId.id;
      serialized.copyWithin(offset + distanceToMove, offset, lastEnd);
      distanceToMove -= 6;
      let position3 = offset + distanceToMove;
      serialized[position3++] = 214;
      serialized[position3++] = 105;
      serialized[position3++] = id >> 24;
      serialized[position3++] = id >> 16 & 255;
      serialized[position3++] = id >> 8 & 255;
      serialized[position3++] = id & 255;
      lastEnd = offset;
    }
    return serialized;
  }
  function writeBundles(start, pack2, incrementPosition) {
    if (bundledStrings2.length > 0) {
      targetView.setUint32(bundledStrings2.position + start, position2 + incrementPosition - bundledStrings2.position - start);
      bundledStrings2.stringsPosition = position2 - start;
      let writeStrings = bundledStrings2;
      bundledStrings2 = null;
      pack2(writeStrings[0]);
      pack2(writeStrings[1]);
    }
  }
  function prepareStructures(structures, packr) {
    structures.isCompatible = (existingStructures) => {
      let compatible = !existingStructures || (packr.lastNamedStructuresLength || 0) === existingStructures.length;
      if (!compatible)
        packr._mergeStructures(existingStructures);
      return compatible;
    };
    return structures;
  }
  var defaultPackr = new Packr({ useRecords: false });
  var pack = defaultPackr.pack;
  var encode2 = defaultPackr.pack;
  var { NEVER, ALWAYS, DECIMAL_ROUND, DECIMAL_FIT } = FLOAT32_OPTIONS;
  var REUSE_BUFFER_MODE = 512;
  var RESET_BUFFER_MODE = 1024;
  var RESERVE_START_SPACE = 2048;

  // node_modules/@colyseus/sdk/build/transport/H3Transport.mjs
  var H3TransportTransport = class {
    // 9 bytes is the maximum length of a length prefix
    constructor(events) {
      __publicField(this, "wt");
      __publicField(this, "isOpen", false);
      __publicField(this, "events");
      __publicField(this, "reader");
      __publicField(this, "writer");
      __publicField(this, "unreliableReader");
      __publicField(this, "unreliableWriter");
      __publicField(this, "lengthPrefixBuffer", new Uint8Array(9));
      this.events = events;
    }
    connect(url, options = {}) {
      const wtOpts = options.fingerprint && {
        // requireUnreliable: true,
        // congestionControl: "default", // "low-latency" || "throughput"
        serverCertificateHashes: [{
          algorithm: "sha-256",
          value: new Uint8Array(options.fingerprint).buffer
        }]
      } || void 0;
      this.wt = new WebTransport(url, wtOpts);
      this.wt.ready.then((e) => {
        console.log("WebTransport ready!", e);
        this.isOpen = true;
        this.unreliableReader = this.wt.datagrams.readable.getReader();
        this.unreliableWriter = this.wt.datagrams.writable.getWriter();
        const incomingBidi = this.wt.incomingBidirectionalStreams.getReader();
        incomingBidi.read().then((stream) => {
          this.reader = stream.value.readable.getReader();
          this.writer = stream.value.writable.getWriter();
          this.sendSeatReservation(options.roomId, options.sessionId, options.reconnectionToken, options.skipHandshake);
          this.readIncomingData();
          this.readIncomingUnreliableData();
        }).catch((e2) => {
          console.error("failed to read incoming stream", e2);
          console.error("TODO: close the connection");
        });
      }).catch((e) => {
        console.log("WebTransport not ready!", e);
        this._close();
      });
      this.wt.closed.then((e) => {
        console.log("WebTransport closed w/ success", e);
        this.events.onclose({ code: e.closeCode, reason: e.reason });
      }).catch((e) => {
        console.log("WebTransport closed w/ error", e);
        this.events.onerror(e);
        this.events.onclose({ code: e.closeCode, reason: e.reason });
      }).finally(() => {
        this._close();
      });
    }
    send(data) {
      const prefixLength = encode.number(this.lengthPrefixBuffer, data.length, { offset: 0 });
      const dataWithPrefixedLength = new Uint8Array(prefixLength + data.length);
      dataWithPrefixedLength.set(this.lengthPrefixBuffer.subarray(0, prefixLength), 0);
      dataWithPrefixedLength.set(data, prefixLength);
      this.writer.write(dataWithPrefixedLength);
    }
    sendUnreliable(data) {
      const prefixLength = encode.number(this.lengthPrefixBuffer, data.length, { offset: 0 });
      const dataWithPrefixedLength = new Uint8Array(prefixLength + data.length);
      dataWithPrefixedLength.set(this.lengthPrefixBuffer.subarray(0, prefixLength), 0);
      dataWithPrefixedLength.set(data, prefixLength);
      this.unreliableWriter.write(dataWithPrefixedLength);
    }
    close(code, reason) {
      try {
        this.wt.close({ closeCode: code, reason });
      } catch (e) {
        console.error(e);
      }
    }
    async readIncomingData() {
      let result;
      while (this.isOpen) {
        try {
          result = await this.reader.read();
          const messages = result.value;
          const it = { offset: 0 };
          do {
            const length = decode.number(messages, it);
            this.events.onmessage({ data: messages.subarray(it.offset, it.offset + length) });
            it.offset += length;
          } while (it.offset < messages.length);
        } catch (e) {
          if (e.message.indexOf("session is closed") === -1) {
            console.error("H3Transport: failed to read incoming data", e);
          }
          break;
        }
        if (result.done) {
          break;
        }
      }
    }
    async readIncomingUnreliableData() {
      let result;
      while (this.isOpen) {
        try {
          result = await this.unreliableReader.read();
          const messages = result.value;
          const it = { offset: 0 };
          do {
            const length = decode.number(messages, it);
            this.events.onmessage({ data: messages.subarray(it.offset, it.offset + length) });
            it.offset += length;
          } while (it.offset < messages.length);
        } catch (e) {
          if (e.message.indexOf("session is closed") === -1) {
            console.error("H3Transport: failed to read incoming data", e);
          }
          break;
        }
        if (result.done) {
          break;
        }
      }
    }
    sendSeatReservation(roomId, sessionId, reconnectionToken, skipHandshake) {
      const it = { offset: 0 };
      const bytes = [];
      encode.string(bytes, roomId, it);
      encode.string(bytes, sessionId, it);
      if (reconnectionToken) {
        encode.string(bytes, reconnectionToken, it);
      }
      if (skipHandshake) {
        encode.boolean(bytes, 1, it);
      }
      this.writer.write(new Uint8Array(bytes).buffer);
    }
    _close() {
      this.isOpen = false;
    }
  };

  // node_modules/@colyseus/sdk/build/transport/WebSocketTransport.mjs
  var import_ws = __toESM(require_browser(), 1);
  var WebSocket = globalThis.WebSocket || import_ws.default;
  var WebSocketTransport = class {
    constructor(events) {
      __publicField(this, "ws");
      __publicField(this, "protocols");
      __publicField(this, "events");
      this.events = events;
    }
    send(data) {
      this.ws.send(data);
    }
    sendUnreliable(data) {
      console.warn("@colyseus/sdk: The WebSocket transport does not support unreliable messages");
    }
    /**
     * @param url URL to connect to
     * @param headers custom headers to send with the connection (only supported in Node.js. Web Browsers do not allow setting custom headers)
     */
    connect(url, headers) {
      try {
        this.ws = new WebSocket(url, { headers, protocols: this.protocols });
      } catch (e) {
        this.ws = new WebSocket(url, this.protocols);
      }
      this.ws.binaryType = "arraybuffer";
      this.ws.onopen = (event) => this.events.onopen?.(event);
      this.ws.onmessage = (event) => this.events.onmessage?.(event);
      this.ws.onclose = (event) => this.events.onclose?.(event);
      this.ws.onerror = (event) => this.events.onerror?.(event);
    }
    close(code, reason) {
      if (code === CloseCode.MAY_TRY_RECONNECT && this.events.onclose) {
        this.ws.onclose = null;
        this.events.onclose({ code, reason });
      }
      this.ws.close(code, reason);
    }
    get isOpen() {
      return this.ws.readyState === WebSocket.OPEN;
    }
  };

  // node_modules/@colyseus/sdk/build/Connection.mjs
  var onOfflineListeners = [];
  var hasGlobalEventListeners = typeof addEventListener === "function" && typeof removeEventListener === "function";
  if (hasGlobalEventListeners) {
    addEventListener("offline", () => {
      console.warn(`@colyseus/sdk: \u{1F6D1} Network offline. Closing ${onOfflineListeners.length} connection(s)`);
      onOfflineListeners.forEach((listener) => listener());
    }, false);
  }
  var __offlineListener;
  var Connection = class {
    constructor(protocol) {
      __publicField(this, "transport");
      __publicField(this, "events", {});
      __publicField(this, "url");
      __publicField(this, "options");
      __privateAdd(this, __offlineListener, hasGlobalEventListeners ? () => this.close(CloseCode.MAY_TRY_RECONNECT) : null);
      switch (protocol) {
        case "h3":
          this.transport = new H3TransportTransport(this.events);
          break;
        default:
          this.transport = new WebSocketTransport(this.events);
          break;
      }
    }
    connect(url, options) {
      if (hasGlobalEventListeners) {
        const onOpen = this.events.onopen;
        this.events.onopen = (ev) => {
          onOfflineListeners.push(__privateGet(this, __offlineListener));
          onOpen?.(ev);
        };
        const onClose = this.events.onclose;
        this.events.onclose = (ev) => {
          onOfflineListeners.splice(onOfflineListeners.indexOf(__privateGet(this, __offlineListener)), 1);
          onClose?.(ev);
        };
      }
      this.url = url;
      this.options = options;
      this.transport.connect(url, options);
    }
    send(data) {
      this.transport.send(data);
    }
    sendUnreliable(data) {
      this.transport.sendUnreliable(data);
    }
    reconnect(queryParams) {
      const url = new URL(this.url);
      for (const key in queryParams) {
        url.searchParams.set(key, queryParams[key]);
      }
      this.transport.connect(url.toString(), this.options);
    }
    close(code, reason) {
      this.transport.close(code, reason);
    }
    get isOpen() {
      return this.transport.isOpen;
    }
  };
  __offlineListener = new WeakMap();

  // node_modules/@colyseus/sdk/build/serializer/Serializer.mjs
  var serializers = {};
  function registerSerializer(id, serializer) {
    serializers[id] = serializer;
  }
  function getSerializer(id) {
    const serializer = serializers[id];
    if (!serializer) {
      throw new Error("missing serializer: " + id);
    }
    return serializer;
  }

  // node_modules/@colyseus/sdk/build/core/nanoevents.mjs
  var createNanoEvents = () => ({
    emit(event, ...args) {
      let callbacks = this.events[event] || [];
      for (let i = 0, length = callbacks.length; i < length; i++) {
        callbacks[i](...args);
      }
    },
    events: {},
    on(event, cb) {
      this.events[event]?.push(cb) || (this.events[event] = [cb]);
      return () => {
        this.events[event] = this.events[event]?.filter((i) => cb !== i);
      };
    }
  });

  // node_modules/@colyseus/sdk/build/core/signal.mjs
  var EventEmitter = class {
    constructor() {
      __publicField(this, "handlers", []);
    }
    register(cb, once = false) {
      this.handlers.push(cb);
      return this;
    }
    invoke(...args) {
      this.handlers.forEach((handler) => handler.apply(this, args));
    }
    invokeAsync(...args) {
      return Promise.all(this.handlers.map((handler) => handler.apply(this, args)));
    }
    remove(cb) {
      const index = this.handlers.indexOf(cb);
      this.handlers[index] = this.handlers[this.handlers.length - 1];
      this.handlers.pop();
    }
    clear() {
      this.handlers = [];
    }
  };
  function createSignal() {
    const emitter = new EventEmitter();
    function register(cb) {
      return emitter.register(cb, this === null);
    }
    ;
    register.once = (cb) => {
      const callback = function(...args) {
        cb.apply(this, args);
        emitter.remove(callback);
      };
      emitter.register(callback);
    };
    register.remove = (cb) => emitter.remove(cb);
    register.invoke = (...args) => emitter.invoke(...args);
    register.invokeAsync = (...args) => emitter.invokeAsync(...args);
    register.clear = () => emitter.clear();
    return register;
  }

  // node_modules/@colyseus/sdk/build/serializer/SchemaSerializer.mjs
  var SchemaSerializer = class {
    constructor() {
      __publicField(this, "state");
      __publicField(this, "decoder");
    }
    setState(encodedState, it) {
      this.decoder.decode(encodedState, it);
    }
    getState() {
      return this.state;
    }
    patch(patches, it) {
      return this.decoder.decode(patches, it);
    }
    teardown() {
      this.decoder.root.clearRefs();
    }
    handshake(bytes, it) {
      if (this.state) {
        Reflection.decode(bytes, it);
        this.decoder = new Decoder(this.state);
      } else {
        this.decoder = Reflection.decode(bytes, it);
        this.state = this.decoder.state;
      }
    }
  };

  // node_modules/@colyseus/sdk/build/core/utils.mjs
  function now() {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  }

  // node_modules/@colyseus/sdk/build/Room.mjs
  var _lastPingTime, _pingCallback;
  var Room = class {
    constructor(name, rootSchema) {
      __publicField(this, "roomId");
      __publicField(this, "sessionId");
      __publicField(this, "reconnectionToken");
      __publicField(this, "name");
      __publicField(this, "connection");
      // Public signals
      __publicField(this, "onStateChange", createSignal());
      __publicField(this, "onError", createSignal());
      __publicField(this, "onLeave", createSignal());
      __publicField(this, "onReconnect", createSignal());
      __publicField(this, "onDrop", createSignal());
      __publicField(this, "onJoin", createSignal());
      __publicField(this, "serializerId");
      __publicField(this, "serializer");
      // reconnection logic
      __publicField(this, "reconnection", {
        retryCount: 0,
        maxRetries: 15,
        delay: 100,
        minDelay: 100,
        maxDelay: 5e3,
        minUptime: 5e3,
        backoff: exponentialBackoff,
        maxEnqueuedMessages: 10,
        enqueuedMessages: [],
        isReconnecting: false
      });
      __publicField(this, "joinedAtTime", 0);
      __publicField(this, "onMessageHandlers", createNanoEvents());
      __publicField(this, "packr");
      __privateAdd(this, _lastPingTime, 0);
      __privateAdd(this, _pingCallback, void 0);
      this.name = name;
      this.packr = new Packr();
      this.packr.encode(void 0);
      if (rootSchema) {
        const serializer = new (getSerializer("schema"))();
        this.serializer = serializer;
        const state = new rootSchema();
        serializer.state = state;
        serializer.decoder = new Decoder(state);
      }
      this.onLeave(() => {
        this.removeAllListeners();
        this.destroy();
      });
    }
    connect(endpoint, options, headers) {
      this.connection = new Connection(options.protocol);
      this.connection.events.onmessage = this.onMessageCallback.bind(this);
      this.connection.events.onclose = (e) => {
        if (this.joinedAtTime === 0) {
          console.warn?.(`Room connection was closed unexpectedly (${e.code}): ${e.reason}`);
          this.onError.invoke(e.code, e.reason);
          return;
        }
        if (e.code === CloseCode.NO_STATUS_RECEIVED || e.code === CloseCode.ABNORMAL_CLOSURE || e.code === CloseCode.GOING_AWAY || e.code === CloseCode.MAY_TRY_RECONNECT) {
          this.onDrop.invoke(e.code, e.reason);
          this.handleReconnection();
        } else {
          this.onLeave.invoke(e.code, e.reason);
        }
      };
      this.connection.events.onerror = (e) => {
        this.onError.invoke(e.code, e.reason);
      };
      const skipHandshake = this.serializer?.getState() !== void 0;
      if (options.protocol === "h3") {
        const url = new URL(endpoint);
        this.connection.connect(url.origin, { ...options, skipHandshake });
      } else {
        this.connection.connect(`${endpoint}${skipHandshake ? "?skipHandshake=1" : ""}`, headers);
      }
    }
    leave(consented = true) {
      return new Promise((resolve) => {
        this.onLeave((code) => resolve(code));
        if (this.connection) {
          if (consented) {
            this.packr.buffer[0] = Protocol.LEAVE_ROOM;
            this.connection.send(this.packr.buffer.subarray(0, 1));
          } else {
            this.connection.close();
          }
        } else {
          this.onLeave.invoke(CloseCode.CONSENTED);
        }
      });
    }
    onMessage(type, callback) {
      return this.onMessageHandlers.on(this.getMessageHandlerKey(type), callback);
    }
    ping(callback) {
      if (!this.connection?.isOpen) {
        return;
      }
      __privateSet(this, _lastPingTime, now());
      __privateSet(this, _pingCallback, callback);
      this.packr.buffer[0] = Protocol.PING;
      this.connection.send(this.packr.buffer.subarray(0, 1));
    }
    send(messageType, payload) {
      const it = { offset: 1 };
      this.packr.buffer[0] = Protocol.ROOM_DATA;
      if (typeof messageType === "string") {
        encode.string(this.packr.buffer, messageType, it);
      } else {
        encode.number(this.packr.buffer, messageType, it);
      }
      this.packr.position = 0;
      const data = payload !== void 0 ? this.packr.pack(payload, 2048 + it.offset) : this.packr.buffer.subarray(0, it.offset);
      if (!this.connection.isOpen) {
        enqueueMessage(this, new Uint8Array(data));
      } else {
        this.connection.send(data);
      }
    }
    sendUnreliable(type, message) {
      if (!this.connection.isOpen) {
        return;
      }
      const it = { offset: 1 };
      this.packr.buffer[0] = Protocol.ROOM_DATA;
      if (typeof type === "string") {
        encode.string(this.packr.buffer, type, it);
      } else {
        encode.number(this.packr.buffer, type, it);
      }
      this.packr.position = 0;
      const data = message !== void 0 ? this.packr.pack(message, 2048 + it.offset) : this.packr.buffer.subarray(0, it.offset);
      this.connection.sendUnreliable(data);
    }
    sendBytes(type, bytes) {
      const it = { offset: 1 };
      this.packr.buffer[0] = Protocol.ROOM_DATA_BYTES;
      if (typeof type === "string") {
        encode.string(this.packr.buffer, type, it);
      } else {
        encode.number(this.packr.buffer, type, it);
      }
      if (bytes.byteLength + it.offset > this.packr.buffer.byteLength) {
        const newBuffer = new Uint8Array(it.offset + bytes.byteLength);
        newBuffer.set(this.packr.buffer);
        this.packr.useBuffer(newBuffer);
      }
      this.packr.buffer.set(bytes, it.offset);
      if (!this.connection.isOpen) {
        enqueueMessage(this, this.packr.buffer.subarray(0, it.offset + bytes.byteLength));
      } else {
        this.connection.send(this.packr.buffer.subarray(0, it.offset + bytes.byteLength));
      }
    }
    get state() {
      return this.serializer.getState();
    }
    removeAllListeners() {
      this.onJoin.clear();
      this.onStateChange.clear();
      this.onError.clear();
      this.onLeave.clear();
      this.onReconnect.clear();
      this.onDrop.clear();
      this.onMessageHandlers.events = {};
      if (this.serializer instanceof SchemaSerializer) {
        this.serializer.decoder.root.callbacks = {};
      }
    }
    onMessageCallback(event) {
      var _a6;
      const buffer = new Uint8Array(event.data);
      const it = { offset: 1 };
      const code = buffer[0];
      if (code === Protocol.JOIN_ROOM) {
        const reconnectionToken = decode.utf8Read(buffer, it, buffer[it.offset++]);
        this.serializerId = decode.utf8Read(buffer, it, buffer[it.offset++]);
        if (!this.serializer) {
          const serializer = getSerializer(this.serializerId);
          this.serializer = new serializer();
        }
        if (buffer.byteLength > it.offset && this.serializer.handshake) {
          this.serializer.handshake(buffer, it);
        }
        if (this.joinedAtTime === 0) {
          this.joinedAtTime = Date.now();
          this.onJoin.invoke();
        } else {
          console.info(`[Colyseus reconnection]: ${String.fromCodePoint(9989)} reconnection successful!`);
          this.reconnection.isReconnecting = false;
          this.onReconnect.invoke();
        }
        this.reconnectionToken = `${this.roomId}:${reconnectionToken}`;
        this.packr.buffer[0] = Protocol.JOIN_ROOM;
        this.connection.send(this.packr.buffer.subarray(0, 1));
        if (this.reconnection.enqueuedMessages.length > 0) {
          for (const message of this.reconnection.enqueuedMessages) {
            this.connection.send(message.data);
          }
          this.reconnection.enqueuedMessages = [];
        }
      } else if (code === Protocol.ERROR) {
        const code2 = decode.number(buffer, it);
        const message = decode.string(buffer, it);
        this.onError.invoke(code2, message);
      } else if (code === Protocol.LEAVE_ROOM) {
        this.leave();
      } else if (code === Protocol.ROOM_STATE) {
        this.serializer.setState(buffer, it);
        this.onStateChange.invoke(this.serializer.getState());
      } else if (code === Protocol.ROOM_STATE_PATCH) {
        this.serializer.patch(buffer, it);
        this.onStateChange.invoke(this.serializer.getState());
      } else if (code === Protocol.ROOM_DATA) {
        const type = decode.stringCheck(buffer, it) ? decode.string(buffer, it) : decode.number(buffer, it);
        const message = buffer.byteLength > it.offset ? unpack(buffer, { start: it.offset }) : void 0;
        this.dispatchMessage(type, message);
      } else if (code === Protocol.ROOM_DATA_BYTES) {
        const type = decode.stringCheck(buffer, it) ? decode.string(buffer, it) : decode.number(buffer, it);
        this.dispatchMessage(type, buffer.subarray(it.offset));
      } else if (code === Protocol.PING) {
        (_a6 = __privateGet(this, _pingCallback)) == null ? void 0 : _a6.call(this, Math.round(now() - __privateGet(this, _lastPingTime)));
        __privateSet(this, _pingCallback, void 0);
      }
    }
    dispatchMessage(type, message) {
      const messageType = this.getMessageHandlerKey(type);
      if (this.onMessageHandlers.events[messageType]) {
        this.onMessageHandlers.emit(messageType, message);
      } else if (this.onMessageHandlers.events["*"]) {
        this.onMessageHandlers.emit("*", type, message);
      } else if (!messageType.startsWith("__")) {
        console.warn?.(`@colyseus/sdk: onMessage() not registered for type '${type}'.`);
      }
    }
    destroy() {
      if (this.serializer) {
        this.serializer.teardown();
      }
    }
    getMessageHandlerKey(type) {
      switch (typeof type) {
        case "string":
          return type;
        case "number":
          return `i${type}`;
        default:
          throw new Error("invalid message type.");
      }
    }
    handleReconnection() {
      if (Date.now() - this.joinedAtTime < this.reconnection.minUptime) {
        console.info(`[Colyseus reconnection]: ${String.fromCodePoint(10060)} Room has not been up for long enough for automatic reconnection. (min uptime: ${this.reconnection.minUptime}ms)`);
        this.onLeave.invoke(CloseCode.ABNORMAL_CLOSURE, "Room uptime too short for reconnection.");
        return;
      }
      if (!this.reconnection.isReconnecting) {
        this.reconnection.retryCount = 0;
        this.reconnection.isReconnecting = true;
      }
      this.retryReconnection();
    }
    retryReconnection() {
      if (this.reconnection.retryCount >= this.reconnection.maxRetries) {
        console.info(`[Colyseus reconnection]: ${String.fromCodePoint(10060)} \u274C Reconnection failed after ${this.reconnection.maxRetries} attempts.`);
        this.reconnection.isReconnecting = false;
        this.onLeave.invoke(CloseCode.FAILED_TO_RECONNECT, "No more retries. Reconnection failed.");
        return;
      }
      this.reconnection.retryCount++;
      const delay = Math.min(this.reconnection.maxDelay, Math.max(this.reconnection.minDelay, this.reconnection.backoff(this.reconnection.retryCount, this.reconnection.delay)));
      console.info(`[Colyseus reconnection]: ${String.fromCodePoint(9203)} will retry in ${(delay / 1e3).toFixed(1)} seconds...`);
      setTimeout(() => {
        try {
          console.info(`[Colyseus reconnection]: ${String.fromCodePoint(128260)} Re-establishing sessionId '${this.sessionId}' with roomId '${this.roomId}'... (attempt ${this.reconnection.retryCount} of ${this.reconnection.maxRetries})`);
          this.connection.reconnect({
            reconnectionToken: this.reconnectionToken.split(":")[1],
            skipHandshake: true
            // we already applied the handshake on first join
          });
        } catch (e) {
          this.retryReconnection();
        }
      }, delay);
    }
  };
  _lastPingTime = new WeakMap();
  _pingCallback = new WeakMap();
  var exponentialBackoff = (attempt, delay) => {
    return Math.floor(Math.pow(2, attempt) * delay);
  };
  function enqueueMessage(room, message) {
    room.reconnection.enqueuedMessages.push({ data: message });
    if (room.reconnection.enqueuedMessages.length > room.reconnection.maxEnqueuedMessages) {
      room.reconnection.enqueuedMessages.shift();
    }
  }

  // node_modules/@colyseus/sdk/build/HTTP.mjs
  function isJSONSerializable(value) {
    if (value === void 0) {
      return false;
    }
    const t = typeof value;
    if (t === "string" || t === "number" || t === "boolean" || t === null) {
      return true;
    }
    if (t !== "object") {
      return false;
    }
    if (Array.isArray(value)) {
      return true;
    }
    if (value.buffer) {
      return false;
    }
    return value.constructor && value.constructor.name === "Object" || typeof value.toJSON === "function";
  }
  function getURLWithQueryParams(url, option) {
    const { params, query } = option || {};
    const [urlPath, urlQuery] = url.split("?");
    let path = urlPath;
    if (params) {
      if (Array.isArray(params)) {
        const paramPaths = path.split("/").filter((p) => p.startsWith(":"));
        for (const [index, key] of paramPaths.entries()) {
          const value = params[index];
          path = path.replace(key, value);
        }
      } else {
        for (const [key, value] of Object.entries(params)) {
          path = path.replace(`:${key}`, String(value));
        }
      }
    }
    const queryParams = new URLSearchParams(urlQuery);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value == null)
          continue;
        queryParams.set(key, String(value));
      }
    }
    let queryParamString = queryParams.toString();
    queryParamString = queryParamString.length > 0 ? `?${queryParamString}`.replace(/\+/g, "%20") : "";
    return `${path}${queryParamString}`;
  }
  var HTTP = class {
    constructor(sdk, baseOptions) {
      __publicField(this, "authToken");
      __publicField(this, "options");
      __publicField(this, "sdk");
      // alias "del()" to "delete()"
      __publicField(this, "del", this.delete);
      this.sdk = sdk;
      this.options = baseOptions;
    }
    async request(method, path, options) {
      return this.executeRequest(method, path, options);
    }
    get(path, options) {
      return this.request("GET", path, options);
    }
    post(path, options) {
      return this.request("POST", path, options);
    }
    delete(path, options) {
      return this.request("DELETE", path, options);
    }
    patch(path, options) {
      return this.request("PATCH", path, options);
    }
    put(path, options) {
      return this.request("PUT", path, options);
    }
    async executeRequest(method, path, requestOptions) {
      let body = this.options.body ? { ...this.options.body, ...requestOptions?.body || {} } : requestOptions?.body;
      const query = this.options.query ? { ...this.options.query, ...requestOptions?.query || {} } : requestOptions?.query;
      const params = this.options.params ? { ...this.options.params, ...requestOptions?.params || {} } : requestOptions?.params;
      const headers = new Headers(this.options.headers ? { ...this.options.headers, ...requestOptions?.headers || {} } : requestOptions?.headers);
      if (this.authToken && !headers.has("authorization")) {
        headers.set("authorization", `Bearer ${this.authToken}`);
      }
      if (isJSONSerializable(body) && typeof body === "object" && body !== null) {
        if (!headers.has("content-type")) {
          headers.set("content-type", "application/json");
        }
        for (const [key, value] of Object.entries(body)) {
          if (value instanceof Date) {
            body[key] = value.toISOString();
          }
        }
        body = JSON.stringify(body);
      }
      const mergedOptions = {
        credentials: requestOptions?.credentials || "include",
        ...this.options,
        ...requestOptions,
        query,
        params,
        headers,
        body,
        method
      };
      const url = getURLWithQueryParams(this.sdk["getHttpEndpoint"](path.toString()), mergedOptions);
      let raw;
      try {
        raw = await fetch(url, mergedOptions);
      } catch (err) {
        if (err.name === "AbortError") {
          throw err;
        }
        const networkError = new ServerError(err.cause?.code || err.code, err.message);
        networkError.response = raw;
        networkError.cause = err.cause;
        throw networkError;
      }
      const contentType = raw.headers.get("content-type");
      let data;
      if (contentType?.indexOf("json")) {
        data = await raw.json();
      } else if (contentType?.indexOf("text")) {
        data = await raw.text();
      } else {
        data = await raw.blob();
      }
      if (!raw.ok) {
        throw new ServerError(data.code ?? raw.status, data.message ?? raw.statusText, {
          headers: raw.headers,
          status: raw.status,
          response: raw,
          data
        });
      }
      return {
        raw,
        data,
        headers: raw.headers,
        status: raw.status,
        statusText: raw.statusText
      };
    }
  };

  // node_modules/@colyseus/sdk/build/Storage.mjs
  var storage;
  function getStorage() {
    if (!storage) {
      try {
        storage = typeof cc !== "undefined" && cc.sys && cc.sys.localStorage ? cc.sys.localStorage : window.localStorage;
      } catch (e) {
      }
    }
    if (!storage && typeof globalThis.indexedDB !== "undefined") {
      storage = new IndexedDBStorage();
    }
    if (!storage) {
      storage = {
        cache: {},
        setItem: function(key, value) {
          this.cache[key] = value;
        },
        getItem: function(key) {
          this.cache[key];
        },
        removeItem: function(key) {
          delete this.cache[key];
        }
      };
    }
    return storage;
  }
  function setItem(key, value) {
    getStorage().setItem(key, value);
  }
  function removeItem(key) {
    getStorage().removeItem(key);
  }
  function getItem(key, callback) {
    const value = getStorage().getItem(key);
    if (typeof Promise === "undefined" || // old browsers
    !(value instanceof Promise)) {
      callback(value);
    } else {
      value.then((id) => callback(id));
    }
  }
  var IndexedDBStorage = class {
    constructor() {
      __publicField(this, "dbPromise", new Promise((resolve) => {
        const request = indexedDB.open("_colyseus_storage", 1);
        request.onupgradeneeded = () => request.result.createObjectStore("store");
        request.onsuccess = () => resolve(request.result);
      }));
    }
    async tx(mode, fn) {
      const db = await this.dbPromise;
      const store = db.transaction("store", mode).objectStore("store");
      return fn(store);
    }
    setItem(key, value) {
      return this.tx("readwrite", (store) => store.put(value, key)).then();
    }
    async getItem(key) {
      const request = await this.tx("readonly", (store) => store.get(key));
      return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result);
      });
    }
    removeItem(key) {
      return this.tx("readwrite", (store) => store.delete(key)).then();
    }
  };

  // node_modules/@colyseus/sdk/build/Auth.mjs
  var __initialized, __signInWindow, __events;
  var Auth = class {
    constructor(http) {
      __publicField(this, "settings", {
        path: "/auth",
        key: "colyseus-auth-token"
      });
      __privateAdd(this, __initialized, false);
      __privateAdd(this, __signInWindow, null);
      __privateAdd(this, __events, createNanoEvents());
      __publicField(this, "http");
      this.http = http;
      getItem(this.settings.key, (token) => this.token = token);
    }
    set token(token) {
      this.http.authToken = token;
    }
    get token() {
      return this.http.authToken;
    }
    onChange(callback) {
      const unbindChange = __privateGet(this, __events).on("change", callback);
      if (!__privateGet(this, __initialized)) {
        this.getUserData().then((userData) => {
          this.emitChange({ ...userData, token: this.token });
        }).catch((e) => {
          this.emitChange({ user: null, token: void 0 });
        });
      }
      __privateSet(this, __initialized, true);
      return unbindChange;
    }
    async getUserData() {
      if (this.token) {
        return (await this.http.get(`${this.settings.path}/userdata`)).data;
      } else {
        throw new Error("missing auth.token");
      }
    }
    async registerWithEmailAndPassword(email, password, options) {
      const data = (await this.http.post(`${this.settings.path}/register`, {
        body: { email, password, options }
      })).data;
      this.emitChange(data);
      return data;
    }
    async signInWithEmailAndPassword(email, password) {
      const data = (await this.http.post(`${this.settings.path}/login`, {
        body: { email, password }
      })).data;
      this.emitChange(data);
      return data;
    }
    async signInAnonymously(options) {
      const data = (await this.http.post(`${this.settings.path}/anonymous`, {
        body: { options }
      })).data;
      this.emitChange(data);
      return data;
    }
    async sendPasswordResetEmail(email) {
      return (await this.http.post(`${this.settings.path}/forgot-password`, {
        body: { email }
      })).data;
    }
    async signInWithProvider(providerName, settings = {}) {
      return new Promise((resolve, reject) => {
        const w = settings.width || 480;
        const h = settings.height || 768;
        const upgradingToken = this.token ? `?token=${this.token}` : "";
        const title = `Login with ${providerName[0].toUpperCase() + providerName.substring(1)}`;
        const url = this.http["sdk"]["getHttpEndpoint"](`${settings.prefix || `${this.settings.path}/provider`}/${providerName}${upgradingToken}`);
        const left = screen.width / 2 - w / 2;
        const top = screen.height / 2 - h / 2;
        __privateSet(this, __signInWindow, window.open(url, title, "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=" + w + ", height=" + h + ", top=" + top + ", left=" + left));
        const onMessage = (event) => {
          if (event.data.user === void 0 && event.data.token === void 0) {
            return;
          }
          clearInterval(rejectionChecker);
          __privateGet(this, __signInWindow)?.close();
          __privateSet(this, __signInWindow, null);
          window.removeEventListener("message", onMessage);
          if (event.data.error !== void 0) {
            reject(event.data.error);
          } else {
            resolve(event.data);
            this.emitChange(event.data);
          }
        };
        const rejectionChecker = setInterval(() => {
          if (!__privateGet(this, __signInWindow) || __privateGet(this, __signInWindow).closed) {
            __privateSet(this, __signInWindow, null);
            reject("cancelled");
            window.removeEventListener("message", onMessage);
          }
        }, 200);
        window.addEventListener("message", onMessage);
      });
    }
    async signOut() {
      this.emitChange({ user: null, token: null });
    }
    emitChange(authData) {
      if (authData.token !== void 0) {
        this.token = authData.token;
        if (authData.token === null) {
          removeItem(this.settings.key);
        } else {
          setItem(this.settings.key, authData.token);
        }
      }
      __privateGet(this, __events).emit("change", authData);
    }
  };
  __initialized = new WeakMap();
  __signInWindow = new WeakMap();
  __events = new WeakMap();

  // node_modules/@colyseus/sdk/build/3rd_party/discord.mjs
  function discordURLBuilder(url) {
    const localHostname = window?.location?.hostname || "localhost";
    const remoteHostnameSplitted = url.hostname.split(".");
    const subdomain = !url.hostname.includes("trycloudflare.com") && // ignore cloudflared subdomains
    !url.hostname.includes("discordsays.com") && // ignore discordsays.com subdomains
    remoteHostnameSplitted.length > 2 ? `/${remoteHostnameSplitted[0]}` : "";
    return url.pathname.startsWith("/.proxy") ? `${url.protocol}//${localHostname}${subdomain}${url.pathname}${url.search}` : `${url.protocol}//${localHostname}/.proxy/colyseus${subdomain}${url.pathname}${url.search}`;
  }

  // node_modules/@colyseus/sdk/build/Client.mjs
  var DEFAULT_ENDPOINT = typeof window !== "undefined" && typeof window?.location?.hostname !== "undefined" ? `${window.location.protocol.replace("http", "ws")}//${window.location.hostname}${window.location.port && `:${window.location.port}`}` : "ws://127.0.0.1:2567";
  var _ColyseusSDK = class _ColyseusSDK {
    constructor(settings = DEFAULT_ENDPOINT, options) {
      /**
       * The HTTP client to make requests to the server.
       */
      __publicField(this, "http");
      /**
       * The authentication module to authenticate into requests and rooms.
       */
      __publicField(this, "auth");
      /**
       * The settings used to connect to the server.
       */
      __publicField(this, "settings");
      __publicField(this, "urlBuilder");
      if (typeof settings === "string") {
        const url = settings.startsWith("/") ? new URL(settings, DEFAULT_ENDPOINT) : new URL(settings);
        const secure = url.protocol === "https:" || url.protocol === "wss:";
        const port = Number(url.port || (secure ? 443 : 80));
        this.settings = {
          hostname: url.hostname,
          pathname: url.pathname,
          port,
          secure,
          searchParams: url.searchParams.toString() || void 0
        };
      } else {
        if (settings.port === void 0) {
          settings.port = settings.secure ? 443 : 80;
        }
        if (settings.pathname === void 0) {
          settings.pathname = "";
        }
        this.settings = settings;
      }
      if (this.settings.pathname.endsWith("/")) {
        this.settings.pathname = this.settings.pathname.slice(0, -1);
      }
      if (options?.protocol) {
        this.settings.protocol = options.protocol;
      }
      this.http = new HTTP(this, {
        headers: options?.headers || {}
      });
      this.auth = new Auth(this.http);
      this.urlBuilder = options?.urlBuilder;
      if (!this.urlBuilder && typeof window !== "undefined" && window?.location?.hostname?.includes("discordsays.com")) {
        this.urlBuilder = discordURLBuilder;
        console.log("Colyseus SDK: Discord Embedded SDK detected. Using custom URL builder.");
      }
    }
    /**
     * Select the endpoint with the lowest latency.
     * @param endpoints Array of endpoints to select from.
     * @param options Client options.
     * @param latencyOptions Latency measurement options (protocol, pingCount).
     * @returns The client with the lowest latency.
     */
    static async selectByLatency(endpoints, options, latencyOptions = {}) {
      const clients = endpoints.map((endpoint) => new _ColyseusSDK(endpoint, options));
      const latencies = (await Promise.allSettled(clients.map((client, index) => client.getLatency(latencyOptions).then((latency) => {
        const settings = clients[index].settings;
        console.log(`\u{1F6DC} Endpoint Latency: ${latency}ms - ${settings.hostname}:${settings.port}${settings.pathname}`);
        return [index, latency];
      })))).filter((result) => result.status === "fulfilled").map((result) => result.value);
      if (latencies.length === 0) {
        throw new Error("All endpoints failed to respond");
      }
      return clients[latencies.sort((a, b) => a[1] - b[1])[0][0]];
    }
    // Implementation
    async joinOrCreate(roomName, options = {}, rootSchema) {
      return await this.createMatchMakeRequest("joinOrCreate", roomName, options, rootSchema);
    }
    // Implementation
    async create(roomName, options = {}, rootSchema) {
      return await this.createMatchMakeRequest("create", roomName, options, rootSchema);
    }
    // Implementation
    async join(roomName, options = {}, rootSchema) {
      return await this.createMatchMakeRequest("join", roomName, options, rootSchema);
    }
    // Implementation
    async joinById(roomId, options = {}, rootSchema) {
      return await this.createMatchMakeRequest("joinById", roomId, options, rootSchema);
    }
    // Implementation
    async reconnect(reconnectionToken, rootSchema) {
      if (typeof reconnectionToken === "string" && typeof rootSchema === "string") {
        throw new Error("DEPRECATED: .reconnect() now only accepts 'reconnectionToken' as argument.\nYou can get this token from previously connected `room.reconnectionToken`");
      }
      const [roomId, token] = reconnectionToken.split(":");
      if (!roomId || !token) {
        throw new Error("Invalid reconnection token format.\nThe format should be roomId:reconnectionToken");
      }
      return await this.createMatchMakeRequest("reconnect", roomId, { reconnectionToken: token }, rootSchema);
    }
    async consumeSeatReservation(response, rootSchema) {
      const room = this.createRoom(response.name, rootSchema);
      room.roomId = response.roomId;
      room.sessionId = response.sessionId;
      const options = { sessionId: room.sessionId };
      if (response.reconnectionToken) {
        options.reconnectionToken = response.reconnectionToken;
      }
      room.connect(this.buildEndpoint(response, options), response, this.http.options.headers);
      return new Promise((resolve, reject) => {
        const onError = (code, message) => reject(new ServerError(code, message));
        room.onError.once(onError);
        room["onJoin"].once(() => {
          room.onError.remove(onError);
          resolve(room);
        });
      });
    }
    /**
     * Create a new connection with the server, and measure the latency.
     * @param options Latency measurement options (protocol, pingCount).
     */
    getLatency(options = {}) {
      const protocol = options.protocol ?? "ws";
      const pingCount = options.pingCount ?? 1;
      return new Promise((resolve, reject) => {
        const conn = new Connection(protocol);
        const latencies = [];
        let pingStart = 0;
        conn.events.onopen = () => {
          pingStart = Date.now();
          conn.send(new Uint8Array([Protocol.PING]));
        };
        conn.events.onmessage = (_) => {
          latencies.push(Date.now() - pingStart);
          if (latencies.length < pingCount) {
            pingStart = Date.now();
            conn.send(new Uint8Array([Protocol.PING]));
          } else {
            conn.close();
            const average = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
            resolve(average);
          }
        };
        conn.events.onerror = (event) => {
          reject(new ServerError(CloseCode.ABNORMAL_CLOSURE, `Failed to get latency: ${event.message}`));
        };
        conn.connect(this.getHttpEndpoint());
      });
    }
    async createMatchMakeRequest(method, roomName, options = {}, rootSchema) {
      try {
        const httpResponse = await this.http.post(`/matchmake/${method}/${roomName}`, {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: options
        });
        const response = httpResponse.data;
        if (method === "reconnect") {
          response.reconnectionToken = options.reconnectionToken;
        }
        return await this.consumeSeatReservation(response, rootSchema);
      } catch (error) {
        if (error instanceof ServerError) {
          throw new MatchMakeError(error.message, error.code);
        }
        throw error;
      }
    }
    createRoom(roomName, rootSchema) {
      return new Room(roomName, rootSchema);
    }
    buildEndpoint(seatReservation, options = {}) {
      let protocol = this.settings.protocol || "ws";
      let searchParams = this.settings.searchParams || "";
      if (this.http.authToken) {
        options["_authToken"] = this.http.authToken;
      }
      for (const name in options) {
        if (!options.hasOwnProperty(name)) {
          continue;
        }
        searchParams += (searchParams ? "&" : "") + `${name}=${options[name]}`;
      }
      if (protocol === "h3") {
        protocol = "http";
      }
      let endpoint = this.settings.secure ? `${protocol}s://` : `${protocol}://`;
      if (seatReservation.publicAddress) {
        endpoint += `${seatReservation.publicAddress}`;
      } else {
        endpoint += `${this.settings.hostname}${this.getEndpointPort()}${this.settings.pathname}`;
      }
      const endpointURL = `${endpoint}/${seatReservation.processId}/${seatReservation.roomId}?${searchParams}`;
      return this.urlBuilder ? this.urlBuilder(new URL(endpointURL)) : endpointURL;
    }
    getHttpEndpoint(segments = "") {
      const path = segments.startsWith("/") ? segments : `/${segments}`;
      let endpointURL = `${this.settings.secure ? "https" : "http"}://${this.settings.hostname}${this.getEndpointPort()}${this.settings.pathname}${path}`;
      if (this.settings.searchParams) {
        endpointURL += `?${this.settings.searchParams}`;
      }
      return this.urlBuilder ? this.urlBuilder(new URL(endpointURL)) : endpointURL;
    }
    getEndpointPort() {
      return this.settings.port !== 80 && this.settings.port !== 443 ? `:${this.settings.port}` : "";
    }
  };
  __publicField(_ColyseusSDK, "VERSION", "0.17");
  var ColyseusSDK = _ColyseusSDK;
  var Client = ColyseusSDK;

  // node_modules/@colyseus/sdk/build/serializer/NoneSerializer.mjs
  var NoneSerializer = class {
    setState(rawState) {
    }
    getState() {
      return null;
    }
    patch(patches) {
    }
    teardown() {
    }
    handshake(bytes) {
    }
  };

  // node_modules/@colyseus/sdk/build/index.mjs
  registerSerializer("schema", SchemaSerializer);
  registerSerializer("none", NoneSerializer);

  // src/net/createMpClient.js
  function clampNumber(n, min, max, fallback = 0) {
    const v = Number(n);
    if (!Number.isFinite(v))
      return fallback;
    return Math.max(min, Math.min(max, v));
  }
  function nowMs() {
    if (typeof performance !== "undefined" && typeof performance.now === "function")
      return performance.now();
    return Date.now();
  }
  function makeRingBuffer(capacity) {
    const cap = Math.max(2, Math.floor(capacity));
    const buf = [];
    return {
      push(value) {
        buf.push(value);
        if (buf.length > cap)
          buf.splice(0, buf.length - cap);
      },
      values() {
        return buf.slice();
      },
      clear() {
        buf.length = 0;
      },
      size() {
        return buf.length;
      },
      capacity: cap
    };
  }
  function normalizeEndpoint(endpoint) {
    const raw = String(endpoint || "").trim();
    if (!raw)
      return "ws://localhost:2567";
    if (raw.startsWith("ws://") || raw.startsWith("wss://"))
      return raw;
    if (raw.startsWith("http://"))
      return `ws://${raw.slice("http://".length)}`;
    if (raw.startsWith("https://"))
      return `wss://${raw.slice("https://".length)}`;
    return raw;
  }
  function readPlayersSnapshot(schemaState) {
    const players = [];
    const map = schemaState?.players;
    if (map && typeof map.forEach === "function") {
      map.forEach((p, id) => {
        if (!p)
          return;
        players.push({
          id: String(p.id ?? id ?? ""),
          x: Number(p.x) || 0,
          y: Number(p.y) || 0,
          vx: Number(p.vx) || 0,
          vy: Number(p.vy) || 0,
          angle: Number(p.angle) || 0,
          tier: String(p.tier ?? "small"),
          score: Number(p.score) || 0,
          gemScore: Number(p.gemScore) || 0
        });
      });
    }
    players.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    return players;
  }
  function createMpClient({
    getInput = null,
    consumeInput = null,
    getViewRect = null,
    sendHz = 30,
    viewSendHz = 10,
    snapshotBufferSize = 32
  } = {}) {
    const buffer = makeRingBuffer(snapshotBufferSize);
    let client = null;
    let room = null;
    let endpoint = "ws://localhost:2567";
    let roomName = "blasteroids";
    let inputTimer = null;
    let viewTimer = null;
    let lastInputSample = null;
    function isConnected() {
      return !!(room && room.connection && room.connection.isOpen);
    }
    function sampleInput() {
      const inputRef = typeof getInput === "function" ? getInput() : null;
      const i = inputRef && typeof inputRef === "object" ? inputRef : {};
      return {
        inputRef,
        left: !!i.left,
        right: !!i.right,
        up: !!i.up,
        down: !!i.down,
        burst: !!i.burst,
        ping: !!i.ping,
        turnAnalog: clampNumber(i.turnAnalog, -1, 1, 0),
        thrustAnalog: clampNumber(i.thrustAnalog, 0, 1, 0)
      };
    }
    function buildInputMessage(sample, prev) {
      const p = prev || {};
      return {
        left: sample.left,
        right: sample.right,
        up: sample.up,
        down: sample.down,
        turnAnalog: sample.turnAnalog,
        thrustAnalog: sample.thrustAnalog,
        burst: sample.burst && !p.burst,
        ping: sample.ping && !p.ping
      };
    }
    function stopInputLoop() {
      if (inputTimer)
        clearInterval(inputTimer);
      inputTimer = null;
      lastInputSample = null;
    }
    function stopViewLoop() {
      if (viewTimer)
        clearInterval(viewTimer);
      viewTimer = null;
    }
    function startInputLoop() {
      stopInputLoop();
      const hz = clampNumber(sendHz, 1, 120, 30);
      const intervalMs = Math.round(1e3 / hz);
      inputTimer = setInterval(() => {
        if (!room)
          return;
        const sample = sampleInput();
        const msg = buildInputMessage(sample, lastInputSample);
        lastInputSample = sample;
        try {
          room.send("input", msg);
          if (typeof consumeInput === "function")
            consumeInput(sample.inputRef, msg);
          else if (sample.inputRef && typeof sample.inputRef === "object") {
            if (msg.burst)
              sample.inputRef.burst = false;
            if (msg.ping)
              sample.inputRef.ping = false;
          }
        } catch {
        }
      }, intervalMs);
    }
    function startViewLoop() {
      stopViewLoop();
      if (typeof getViewRect !== "function")
        return;
      const hz = clampNumber(viewSendHz, 1, 60, 10);
      const intervalMs = Math.round(1e3 / hz);
      viewTimer = setInterval(() => {
        if (!room)
          return;
        let rect = null;
        try {
          rect = getViewRect();
        } catch {
          rect = null;
        }
        if (!rect || typeof rect !== "object")
          return;
        try {
          room.send("view", rect);
        } catch {
        }
      }, intervalMs);
    }
    function attachStateBuffer() {
      if (!room)
        return;
      room.onStateChange((schemaState) => {
        buffer.push({
          receivedAtMs: nowMs(),
          tick: Number(schemaState?.tick) || 0,
          simTimeMs: Number(schemaState?.simTimeMs) || 0,
          players: readPlayersSnapshot(schemaState),
          counts: {
            players: schemaState?.players?.size ?? void 0,
            asteroids: schemaState?.asteroids?.size ?? void 0,
            gems: schemaState?.gems?.size ?? void 0
          }
        });
      });
    }
    async function connect({
      endpoint: nextEndpoint = endpoint,
      roomName: nextRoomName = roomName,
      joinOptions = {}
    } = {}) {
      if (room)
        await disconnect();
      endpoint = normalizeEndpoint(nextEndpoint);
      roomName = String(nextRoomName || "blasteroids");
      client = new Client(endpoint);
      buffer.clear();
      room = await client.joinOrCreate(roomName, joinOptions);
      attachStateBuffer();
      startInputLoop();
      startViewLoop();
      room.onLeave(() => {
        stopInputLoop();
        stopViewLoop();
      });
      return {
        endpoint,
        roomName,
        roomId: room.roomId,
        sessionId: room.sessionId
      };
    }
    async function disconnect() {
      stopInputLoop();
      stopViewLoop();
      buffer.clear();
      const r = room;
      room = null;
      if (r) {
        try {
          await r.leave();
        } catch {
        }
      }
      client = null;
    }
    function getStatus() {
      return {
        connected: isConnected(),
        endpoint,
        roomName,
        roomId: room?.roomId ?? null,
        sessionId: room?.sessionId ?? null,
        snapshots: buffer.size(),
        snapshotCapacity: buffer.capacity
      };
    }
    function getSnapshots() {
      return buffer.values();
    }
    function getRoom() {
      return room;
    }
    return {
      connect,
      disconnect,
      isConnected,
      getStatus,
      getSnapshots,
      getRoom
    };
  }

  // src/net/createMpWorldView.js
  function nowMs2() {
    if (typeof performance !== "undefined" && typeof performance.now === "function")
      return performance.now();
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
    if (!c)
      return null;
    if (!b)
      return { p0: c, p1: c, t: 1 };
    if (!a) {
      const dt2 = Math.max(1e-6, c.t - b.t);
      const tt2 = clamp((targetT - b.t) / dt2, 0, 1);
      return { p0: b, p1: c, t: tt2 };
    }
    if (targetT <= b.t) {
      const dt2 = Math.max(1e-6, b.t - a.t);
      const tt2 = clamp((targetT - a.t) / dt2, 0, 1);
      return { p0: a, p1: b, t: tt2 };
    }
    const dt = Math.max(1e-6, c.t - b.t);
    const tt = clamp((targetT - b.t) / dt, 0, 1);
    return { p0: b, p1: c, t: tt };
  }
  function sortedStringKeys(obj) {
    return Object.keys(obj || {}).sort();
  }
  function shipTierKey(raw) {
    if (raw === "medium" || raw === "large")
      return raw;
    return "small";
  }
  function createMpWorldView({
    engine,
    interpolationDelayMs = 40,
    historySize = 3
    // fixed at 3 for now (a,b,c)
  } = {}) {
    if (!engine || !engine.state)
      throw new Error("createMpWorldView requires { engine }");
    if (historySize !== 3)
      throw new Error("createMpWorldView currently supports historySize=3 only");
    const state = engine.state;
    let room = null;
    let localSessionId = "";
    let onStateChangeHandler = null;
    let latestSimTimeMs = 0;
    let latestReceivedAtMs = 0;
    const recvSamples = [];
    const recvSampleCap = 64;
    const playerTracks = /* @__PURE__ */ new Map();
    const asteroidTracks = /* @__PURE__ */ new Map();
    const gemTracks = /* @__PURE__ */ new Map();
    const asteroidObjectsById = /* @__PURE__ */ new Map();
    const gemObjectsById = /* @__PURE__ */ new Map();
    let asteroidIdsSorted = [];
    let gemIdsSorted = [];
    function attach({ room: nextRoom, localSessionId: nextLocalSessionId } = {}) {
      detach();
      room = nextRoom;
      localSessionId = String(nextLocalSessionId ?? "");
      if (!room)
        throw new Error("attach requires { room }");
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
      if (!schemaState)
        return;
      latestReceivedAtMs = nowMs2();
      latestSimTimeMs = Number(schemaState.simTimeMs) || latestSimTimeMs || 0;
      const tick = Number(schemaState.tick) || 0;
      recvSamples.push({ receivedAtMs: latestReceivedAtMs, simTimeMs: latestSimTimeMs, tick });
      if (recvSamples.length > recvSampleCap)
        recvSamples.splice(0, recvSamples.length - recvSampleCap);
      const seenPlayers = /* @__PURE__ */ new Set();
      const players = schemaState.players;
      if (players && typeof players.forEach === "function") {
        players.forEach((p, id) => {
          const pid = String(p?.id ?? id ?? "");
          if (!pid)
            return;
          seenPlayers.add(pid);
          let track = playerTracks.get(pid);
          if (!track) {
            track = { hist: makeHistory(), tier: "small", score: 0, gemScore: 0, paletteIdx: null };
            playerTracks.set(pid, track);
          }
          const tier = shipTierKey(p?.tier);
          track.tier = tier;
          track.score = Number(p?.score) || 0;
          track.gemScore = Number(p?.gemScore) || 0;
          const paletteRaw = Number(p?.paletteIdx);
          track.paletteIdx = Number.isFinite(paletteRaw) && paletteRaw >= 0 ? paletteRaw | 0 : null;
          pushHistory(track.hist, {
            t: latestSimTimeMs,
            x: Number(p?.x) || 0,
            y: Number(p?.y) || 0,
            vx: Number(p?.vx) || 0,
            vy: Number(p?.vy) || 0,
            angle: Number(p?.angle) || 0
          });
        });
      }
      for (const id of playerTracks.keys()) {
        if (!seenPlayers.has(id))
          playerTracks.delete(id);
      }
      const seenAsteroids = /* @__PURE__ */ new Set();
      const asteroids = schemaState.asteroids;
      if (asteroids && typeof asteroids.forEach === "function") {
        asteroids.forEach((a, id) => {
          const aid = String(a?.id ?? id ?? "");
          if (!aid)
            return;
          seenAsteroids.add(aid);
          let track = asteroidTracks.get(aid);
          if (!track) {
            track = {
              hist: makeHistory(),
              static: {
                id: aid,
                size: String(a?.size ?? "small"),
                radius: Number(a?.radius) || 0
              }
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
            rotVel: Number(a?.rotVel) || 0
          });
        });
      }
      for (const id of asteroidTracks.keys()) {
        if (!seenAsteroids.has(id))
          asteroidTracks.delete(id);
      }
      const seenGems = /* @__PURE__ */ new Set();
      const gems = schemaState.gems;
      if (gems && typeof gems.forEach === "function") {
        gems.forEach((g, id) => {
          const gid = String(g?.id ?? id ?? "");
          if (!gid)
            return;
          seenGems.add(gid);
          let track = gemTracks.get(gid);
          if (!track) {
            track = {
              hist: makeHistory(),
              static: {
                id: gid,
                kind: String(g?.kind ?? ""),
                radius: Number(g?.radius) || 0
              }
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
            vy: Number(g?.vy) || 0
          });
        });
      }
      for (const id of gemTracks.keys()) {
        if (!seenGems.has(id))
          gemTracks.delete(id);
      }
      asteroidIdsSorted = Array.from(asteroidTracks.keys()).sort();
      gemIdsSorted = Array.from(gemTracks.keys()).sort();
    }
    function computeRecvStats(atMs, windowMs = 2e3) {
      const nTotal = recvSamples.length;
      if (nTotal < 2)
        return null;
      const now2 = Number(atMs) || nowMs2();
      let start = nTotal - 1;
      while (start > 0 && now2 - recvSamples[start - 1].receivedAtMs <= windowMs)
        start--;
      const n = nTotal - start;
      if (n < 2)
        return null;
      const first = recvSamples[start];
      const last = recvSamples[nTotal - 1];
      const dtMs = last.receivedAtMs - first.receivedAtMs;
      if (!(dtMs > 0))
        return null;
      let dtMinMs = Infinity;
      let dtMaxMs = 0;
      let prev = first.receivedAtMs;
      for (let i = start + 1; i < nTotal; i++) {
        const cur = recvSamples[i].receivedAtMs;
        const d = cur - prev;
        if (d < dtMinMs)
          dtMinMs = d;
        if (d > dtMaxMs)
          dtMaxMs = d;
        prev = cur;
      }
      const hz = (n - 1) * 1e3 / dtMs;
      const dtAvgMs = dtMs / (n - 1);
      const simSpeed = (last.simTimeMs - first.simTimeMs) / dtMs;
      const tickHz = (last.tick - first.tick) * 1e3 / dtMs;
      return { hz, dtAvgMs, dtMinMs, dtMaxMs, simSpeed, tickHz };
    }
    function estimateRemoteSimTimeMs({ atMs, recvStats } = {}) {
      if (!latestSimTimeMs)
        return 0;
      const now2 = Number.isFinite(Number(atMs)) ? Number(atMs) : nowMs2();
      const ageMsRaw = now2 - (Number(latestReceivedAtMs) || 0);
      const ageMs = clamp(ageMsRaw, 0, 250);
      const speed = recvStats && Number.isFinite(recvStats.simSpeed) ? recvStats.simSpeed : 1;
      const remote = latestSimTimeMs + ageMs * clamp(speed, 0, 2);
      return Math.min(latestSimTimeMs + 250, remote);
    }
    function ensureEnginePlayers() {
      if (!state.playersById || typeof state.playersById !== "object")
        state.playersById = /* @__PURE__ */ Object.create(null);
      const ids = Array.from(playerTracks.keys()).sort();
      const allowed = new Set(ids);
      for (const id of sortedStringKeys(state.playersById)) {
        if (!allowed.has(id))
          delete state.playersById[id];
      }
      for (const id of ids) {
        if (!state.playersById[id])
          engine.addPlayer(id, { makeLocalIfFirst: false });
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
      if (minCamX <= maxCamX)
        state.camera.x = clamp(state.camera.x, minCamX, maxCamX);
      else
        state.camera.x = 0;
      if (minCamY <= maxCamY)
        state.camera.y = clamp(state.camera.y, minCamY, maxCamY);
      else
        state.camera.y = 0;
    }
    function applyInterpolatedState({ atMs = nowMs2(), delayMs = interpolationDelayMs } = {}) {
      if (!latestSimTimeMs)
        return false;
      ensureEnginePlayers();
      const recvStats = computeRecvStats(atMs, 2e3);
      const remoteSimTimeMs = estimateRemoteSimTimeMs({ atMs, recvStats });
      const targetSimTime = remoteSimTimeMs - clamp(Number(delayMs) || 0, 0, 500);
      for (const [id, track] of playerTracks) {
        const player = state.playersById[id];
        if (!player?.ship)
          continue;
        const span = pickSpan(track.hist, targetSimTime);
        if (!span)
          continue;
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
        if (!player.progression)
          player.progression = { gemScore: 0, currentTier: tierKey, tierShiftT: 0 };
        player.progression.gemScore = track.gemScore;
        player.progression.currentTier = tierKey;
        player.paletteIdx = track.paletteIdx;
      }
      const localPlayer = state.playersById[state.localPlayerId];
      if (localPlayer?.ship && state.camera) {
        state.camera.x = localPlayer.ship.pos.x;
        state.camera.y = localPlayer.ship.pos.y;
        clampCameraToWorld();
      }
      if (!Array.isArray(state.asteroids))
        state.asteroids = [];
      state.asteroids.length = 0;
      for (const id of asteroidIdsSorted) {
        const track = asteroidTracks.get(id);
        if (!track)
          continue;
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
            techPartId: null
          };
          asteroidObjectsById.set(id, obj);
        }
        const span = pickSpan(track.hist, targetSimTime);
        if (!span)
          continue;
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
      if (!Array.isArray(state.gems))
        state.gems = [];
      state.gems.length = 0;
      for (const id of gemIdsSorted) {
        const track = gemTracks.get(id);
        if (!track)
          continue;
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
            pulseAlpha: 1
          };
          gemObjectsById.set(id, obj);
        }
        const span = pickSpan(track.hist, targetSimTime);
        if (!span)
          continue;
        const { p0, p1, t } = span;
        obj.kind = track.static.kind;
        obj.radius = track.static.radius;
        obj.pos.x = lerp(p0.x, p1.x, t);
        obj.pos.y = lerp(p0.y, p1.y, t);
        obj.vel.x = lerp(p0.vx, p1.vx, t);
        obj.vel.y = lerp(p0.vy, p1.vy, t);
        state.gems.push(obj);
      }
      state.time = targetSimTime / 1e3;
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
        serverSimSpeed: recvStats ? recvStats.simSpeed : null,
        // 1.0 ~= real-time sim
        serverTickHz: recvStats ? recvStats.tickHz : null
        // ~=60Hz when sim keeps up
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
        gems: gemTracks.size
      })
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
    function restartGame() {
      ui.applyAllFromMenu();
      game.resetWorld();
      game.state.mode = "playing";
      ui.setMenuVisible(false);
    }
    function setKey(e, isDown) {
      const menuOpen = ui.isMenuVisible();
      const input = game.state.input;
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
      const input = game.state.input;
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
    let mpDelayMs = 120;
    function stepRealTime(ts) {
      const dtMs = Math.min(50, ts - last);
      last = ts;
      accumulator += dtMs / 1e3;
      ui.applyTouchControls?.();
      const mpConnected = mp.isConnected();
      const pausedByMenu = !mpConnected && ui.isMenuVisible() && game.state.mode === "playing" && !!game.state.settings.pauseOnMenuOpen && !externalStepping;
      if (mpConnected) {
        mpWorld.applyInterpolatedState({ atMs: ts, delayMs: mpDelayMs });
        const mpHud = game.state?._mp;
        const dtMax = mpHud && Number.isFinite(mpHud.snapshotDtMaxMs) ? mpHud.snapshotDtMaxMs : null;
        const targetDelay = dtMax != null ? Math.max(60, Math.min(220, dtMax + 20)) : 120;
        mpDelayMs += (targetDelay - mpDelayMs) * 0.08;
        accumulator = 0;
      } else if (!externalStepping) {
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
      if (mp.isConnected())
        return;
      externalStepping = true;
      const steps = Math.max(1, Math.round(ms / (1e3 / 60)));
      for (let i = 0; i < steps; i++)
        game.update(1 / 60);
      game.render(ctx);
      ui.updateHudScore();
      ui.syncRuntimeDebugUi();
    }
    const mp = createMpClient({
      getInput: () => game.state.input,
      consumeInput: (inputRef, msg) => {
        if (!inputRef || typeof inputRef !== "object")
          return;
        if (msg?.burst)
          inputRef.burst = false;
        if (msg?.ping)
          inputRef.ping = false;
      },
      getViewRect: () => {
        const s = game.state || {};
        const view2 = s.view || {};
        const cam = s.camera || {};
        const w = Number(view2.w) || 0;
        const h = Number(view2.h) || 0;
        const zoom = Math.max(0.1, Number(cam.zoom) || 1);
        const cx = Number(cam.x) || 0;
        const cy = Number(cam.y) || 0;
        return {
          cx,
          cy,
          halfW: w * 0.5 / zoom,
          halfH: h * 0.5 / zoom,
          // Keep margin >= renderer cull margin to avoid pop-in near edges.
          margin: 240
        };
      },
      sendHz: 30,
      viewSendHz: 10,
      snapshotBufferSize: 32
    });
    const mpWorld = createMpWorldView({ engine: game, interpolationDelayMs: 120 });
    const existingApi = window.Blasteroids && typeof window.Blasteroids === "object" ? window.Blasteroids : {};
    window.Blasteroids = {
      ...existingApi,
      renderGameToText,
      setShipSvgRenderer,
      advanceTime,
      mpConnect: async (opts = {}) => {
        const joinOpts = opts && typeof opts === "object" ? opts.joinOptions : null;
        const requestedWorldScale = joinOpts && Object.prototype.hasOwnProperty.call(joinOpts, "worldScale") ? Number(joinOpts.worldScale) : Number.NaN;
        const worldScale = Number.isFinite(requestedWorldScale) ? requestedWorldScale : Number(game.state.world?.scale) || 3;
        game.setArenaConfig({ worldScale });
        const info = await mp.connect(opts);
        const room = mp.getRoom();
        mpWorld.attach({ room, localSessionId: info.sessionId });
        room?.onLeave?.(() => mpWorld.detach());
        game.state.mode = "playing";
        ui.setMenuVisible(false);
        return info;
      },
      mpDisconnect: async () => {
        mpWorld.detach();
        await mp.disconnect();
        game.resetWorld();
        game.state.mode = "menu";
        ui.setMenuVisible(true);
      },
      mpStatus: () => mp.getStatus(),
      mpSnapshots: () => mp.getSnapshots(),
      mpRoom: () => mp.getRoom(),
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
