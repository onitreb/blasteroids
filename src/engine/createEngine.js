import { clamp, lerp } from "../util/math.js";
import { angleOf, angleToVec, wrapAngle } from "../util/angle.js";
import { seededRng } from "../util/rng.js";
import { circleCollide, circleHit } from "../util/collision.js";
import {
  asteroidMassForRadius,
  asteroidNextSize,
  asteroidRadiusForSize,
  asteroidSizeRank,
  asteroidSpawnWeightForSize,
  sizeSetHas,
} from "../util/asteroid.js";
import { polygonHullRadius } from "../util/ship.js";
import { add, dot, len, len2, mul, norm, rot, sub, vec } from "../util/vec2.js";
import { DEFAULT_SHIP_SVGS } from "./shipPresetDefaults.js";

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


const ASTEROID_SIZE_ORDER = ["small", "med", "large", "xlarge", "xxlarge"];
const ASTEROID_BASE_SPEED = {
  small: 68,
  med: 50,
  large: 36,
  xlarge: 30,
  xxlarge: 24,
};
const ASTEROID_VERTS = {
  small: 9,
  med: 11,
  large: 12,
  xlarge: 13,
  xxlarge: 14,
};
const ASTEROID_ROT_VEL_MAX = {
  small: 1.2,
  med: 0.9,
  large: 0.55,
  xlarge: 0.38,
  xxlarge: 0.25,
};
const FRACTURE_SIZE_BIAS_PER_RANK = 0.06;

const ROUND_PART_COUNT = 4;
const STAR_EDGE_ORDER = ["left", "right", "top", "bottom"];

function oppositeStarEdge(edge) {
  if (edge === "left") return "right";
  if (edge === "right") return "left";
  if (edge === "top") return "bottom";
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
  const base = (Number(seed) >>> 0) || 0xdecafbad;
  const mix = base ^ hashStringToU32(salt) ^ 0x9e3779b9;
  // 32-bit finalizer to avoid obvious correlations between derived seeds.
  let x = mix >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return (x >>> 0) || 0xdecafbad;
}

const DEFAULT_SHIP_RENDERERS = {
  small: {
    type: "polygon",
    points: [
      { x: 16, y: 0 },
      { x: -12, y: -10 },
      { x: -7, y: 0 },
      { x: -12, y: 10 },
    ],
    engines: [{ x: -12, y: 0, len: 11 }],
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
      { x: -18, y: -14 },
    ],
    engines: [
      { x: -24, y: -7, len: 12 },
      { x: -24, y: 7, len: 12 },
    ],
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
      { x: 12, y: 24 },
    ],
    engines: [
      { x: -34, y: -12, len: 14 },
      { x: -36, y: 0, len: 16 },
      { x: -34, y: 12, len: 14 },
    ],
  },
};

function cloneRenderer(renderer) {
  return {
    type: renderer.type,
    points: Array.isArray(renderer.points) ? renderer.points.map((p) => ({ x: p.x, y: p.y })) : undefined,
    engines: Array.isArray(renderer.engines)
      ? renderer.engines.map((e) => ({ x: e.x, y: e.y, len: e.len }))
      : undefined,
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
    hullRadius: Number.isFinite(hullR) && hullR > 0 ? hullR : undefined,
    mirrorX: mx ? true : undefined,
    engines: Array.isArray(engines) ? engines.map((e) => ({ x: e.x, y: e.y, len: e.len })) : [],
  };
}

export const SHIP_TIERS = {
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
      engines: Array.isArray(DEFAULT_SHIP_SVGS.small.engines) ? DEFAULT_SHIP_SVGS.small.engines : DEFAULT_SHIP_RENDERERS.small.engines,
    }),
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
      engines: Array.isArray(DEFAULT_SHIP_SVGS.medium.engines)
        ? DEFAULT_SHIP_SVGS.medium.engines
        : DEFAULT_SHIP_RENDERERS.medium.engines,
    }),
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
      engines: Array.isArray(DEFAULT_SHIP_SVGS.large.engines) ? DEFAULT_SHIP_SVGS.large.engines : DEFAULT_SHIP_RENDERERS.large.engines,
    }),
  },
};
const SHIP_TIER_ORDER = ["small", "medium", "large"];
const SHIP_BASE_BY_TIER_INDEX = ["small", "medium", "large"];

function shipTierByKey(key) {
  return SHIP_TIERS[key] || SHIP_TIERS.small;
}

function forceFieldScaleForTierKey(params, tierKey) {
  if (tierKey === "large") return clamp(Number(params?.tier3ForceFieldScale ?? SHIP_TIERS.large.forcefieldScale), 0.2, 6);
  if (tierKey === "medium") return clamp(Number(params?.tier2ForceFieldScale ?? SHIP_TIERS.medium.forcefieldScale), 0.2, 6);
  return clamp(Number(params?.tier1ForceFieldScale ?? SHIP_TIERS.small.forcefieldScale), 0.2, 6);
}

function shipHullRadiusForTierKey(tierKey) {
  const tier = shipTierByKey(tierKey);
  const renderer = tier.renderer || {};
  if (renderer.type === "svg") {
    const svgScale = Number.isFinite(Number(renderer.svgScale)) ? Number(renderer.svgScale) : 1;
    const hullR = Number(renderer.hullRadius);
    // If hullRadius is provided, render auto-scales the SVG to `tier.radius` and then applies `svgScale`.
    if (Number.isFinite(hullR) && hullR > 0) return Math.max(tier.radius, tier.radius * svgScale);
    // Fallback: approximate from the tier's polygon hull.
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

export function ensureAttractRadiusCoversForcefield(params) {
  if (!params) return;
  const margin = 40; // keep ring comfortably inside gravity radius
  let requiredBaseAttract = Number(params.attractRadius ?? 0);
  for (const tierKey of SHIP_TIER_ORDER) {
    const tier = shipTierByKey(tierKey);
    const attractScale = Number(tier.attractScale || 1);
    const fieldR = requiredForceFieldRadiusForTier(params, tierKey);
    const need = (fieldR + margin) / Math.max(0.1, attractScale);
    if (need > requiredBaseAttract) requiredBaseAttract = need;
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
  };
}

function shipForward(ship) {
  return angleToVec(ship.angle);
}

export function createEngine({ width, height, seed } = {}) {
  const baseSeedRaw = Number.isFinite(Number(seed)) ? Number(seed) : 0xdecafbad;
  const baseSeed = (baseSeedRaw >>> 0) || 0xdecafbad;
  let rng = seededRng(baseSeed);
  const starRng = seededRng(0x51a7f00d);
  let exhaustRng = seededRng(0x1ee7beef);
  const exhaustPool = [];
  const state = {
    mode: "menu", // menu | playing | gameover
    time: 0,
    round: {
      seed: baseSeed,
      durationSec: 300,
      elapsedSec: 0,
      outcome: null, // { kind: "win"|"lose", reason: string } | null
      star: null,
      gate: null,
      techParts: [],
      carriedPartId: null,
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
      tierOverrideIndex: 1,
    },
    progression: {
      gemScore: 0,
      currentTier: "small",
      tierShiftT: 0,
    },
    input: {
      left: false,
      right: false,
      up: false,
      down: false,
      burst: false,
      turnAnalog: 0, // [-1,1] optional analog turn input (UI/touch)
      thrustAnalog: 0, // [0,1] optional analog thrust input (UI/touch)
    },
    view: {
      w: width,
      h: height,
    },
    // Large-arena scaffold (phase LA-01). Kept equal to view for now.
    world: {
      scale: 10,
      w: width,
      h: height,
    },
    worldCells: {
      sizePx: 320,
      indexedAsteroidCells: 0,
      activeCount: 0,
    },
    background: {
      tilePx: 1024,
      layers: [],
    },
    // Camera scaffold (phase LA-01). Render transform changes come later.
    camera: {
      x: 0,
      y: 0,
      mode: "centered", // centered | deadzone
      deadZoneFracX: 0.35,
      deadZoneFracY: 0.3,
      zoom: 1,
      zoomFrom: 1,
      zoomTo: 1,
      zoomAnimElapsed: 0,
      zoomAnimDur: 0,
    },
    params: {
      shipTurnRate: 3.6, // rad/s
      shipThrust: 260, // px/s^2
      shipBrake: 220,
      shipMaxSpeed: 420,
      shipLinearDamp: 0.15,
      exhaustIntensity: 1, // VFX only: scales thruster particle emission
      exhaustSparkScale: 1, // VFX only: scales spark emission chance
      exhaustPalette: 0, // VFX only: 0..N palette id
      exhaustCoreScale: 1, // VFX only: core brightness scale
      exhaustGlowScale: 1, // VFX only: glow strength scale
      exhaustLegacyJets: 0, // VFX only: show old gradient jet overlay

      attractRadius: 252, // +5%
      forceFieldRadius: 75,
      tier1ForceFieldScale: SHIP_TIERS.small.forcefieldScale,
      tier2ForceFieldScale: SHIP_TIERS.medium.forcefieldScale,
      tier3ForceFieldScale: SHIP_TIERS.large.forcefieldScale,
      forceFieldHullGap: 14,
      gravityK: 1150000, // gravity-well strength (tuned)
      gravitySoftening: 70,
      innerGravityMult: 1.5, // extra gravity inside the forcefield ring
      innerDrag: 4.0, // damp velocity inside ring to reduce "slingshot" escapes
      ringK: 6.5, // pulls smalls toward the ring surface
      ringRadialDamp: 6.5,
      captureSpeed: 360, // ring forces fade out by this speed
      attachBand: 14,
      attachSpeedMax: 220,
      attachPadding: 6,

      burstSpeed: 580, // tuned
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
      projectileImpactScale: 1.35,
      maxAsteroids: 4000,
      asteroidWorldDensityScale: 0.32,
      asteroidSpawnRateScale: 1,
      asteroidSpawnMinSec: 0.18,
      asteroidSpawnMaxSec: 0.45,
      asteroidSpawnUrgentMinSec: 0.05,
      asteroidSpawnUrgentMaxSec: 0.12,

      tier2UnlockGemScore: 500,
      tier3UnlockGemScore: 1000,
      tier1Zoom: 1,
      tier2Zoom: 0.78,
      tier3Zoom: 0.58,
      tierZoomTweenSec: 0.45,

      gemTtlSec: 6,
      gemBlinkMaxHz: 5,

      // Round loop (RL-01..04) — deterministic star/gate/parts.
      roundDurationSec: 300,
      starSafeBufferPx: 320,
      jumpGateRadius: 160,
      jumpGateEdgeInsetExtraPx: 110,
      jumpGateInstallPad: 60,
      techPartRadius: 72,
      techPartPickupPad: 20,

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
  const worldCellAsteroidCounts = new Map();
  const worldCellActiveKeys = new Set();
  ensureAttractRadiusCoversForcefield(state.params);

  function setRoundSeed(nextSeed) {
    const raw = Number.isFinite(Number(nextSeed)) ? Number(nextSeed) : 0xdecafbad;
    const s = (raw >>> 0) || 0xdecafbad;
    state.round.seed = s;
    rng = seededRng(s);
  }

  function makeRoundRng(tag) {
    return seededRng(deriveSeed(state.round.seed, tag));
  }

  function shipTierForProgression() {
    if (state.settings.tierOverrideEnabled) {
      const idx = clamp(Math.round(state.settings.tierOverrideIndex || 1), 1, SHIP_BASE_BY_TIER_INDEX.length);
      return SHIP_BASE_BY_TIER_INDEX[idx - 1];
    }
    if (state.score >= state.params.tier3UnlockGemScore) return "large";
    if (state.score >= state.params.tier2UnlockGemScore) return "medium";
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

  function currentBurstSpeed() {
    const tier = currentShipTier();
    const scale = Math.max(0.2, Number(tier.burstForceScale) || 1);
    return state.params.burstSpeed * scale;
  }

  function currentShipAttractSizes() {
    return currentShipTier().attractSizes;
  }

  function shipCanAttractSize(size) {
    return sizeSetHas(currentShipAttractSizes(), size);
  }

  function cameraZoomForTier(tierKey) {
    if (tierKey === "large") return clamp(state.params.tier3Zoom, 0.35, 1.2);
    if (tierKey === "medium") return clamp(state.params.tier2Zoom, 0.35, 1.2);
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
    if (state.camera.zoomAnimDur <= 0) return;
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
    if (state.ship.tier === next.key && state.progression.currentTier === next.key) return false;
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
    // Detach out-of-tier asteroids if tier was reduced by override toggles.
    for (const a of state.asteroids) {
      if (!a.attached) continue;
      if (shipCanAttractSize(a.size)) continue;
      a.attached = false;
      a.shipLaunched = false;
    }
    return changed;
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
      shipLaunched: false,
      orbitA: 0, // ship-local angle (radians) when attached
      fractureCooldownT: 0,
      hitFxT: 0,
      techPartId: null,
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

  function randomPointInWorld({ margin = 0, rngFn = null } = {}) {
    const halfW = state.world.w / 2;
    const halfH = state.world.h / 2;
    const m = clamp(Number(margin) || 0, 0, Math.min(halfW, halfH));
    const rr = typeof rngFn === "function" ? rngFn : rng;
    const x = lerp(-halfW + m, halfW - m, rr());
    const y = lerp(-halfH + m, halfH - m, rr());
    return vec(x, y);
  }

  function generateSpawnPoints(
    count,
    { margin = 120, minSeparation = 420, maxAttemptsPerPoint = 1200, relaxFactor = 0.82, seed = state.round.seed } = {},
  ) {
    const n = Math.max(0, Math.floor(count));
    const points = [];
    if (n === 0) return points;

    const m = clamp(Number(margin) || 0, 0, Math.min(state.world.w, state.world.h) * 0.45);
    const seedRaw = Number.isFinite(Number(seed)) ? Number(seed) : state.round.seed;
    const seedU32 = (seedRaw >>> 0) || 0xdecafbad;
    const pointRng = seededRng((seedU32 ^ 0x9e3779b9) >>> 0 || 0x12345678);
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
        // Extended search: try harder before we relax separation (spawns are low-frequency, so this is fine).
        const extendedAttempts = Math.min(12000, maxAttempts * 6);
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
        // Fallback: pick a point that maximizes distance to existing spawns, then relax separation.
        let best = null;
        let bestMinD2 = -1;
        const fallbackAttempts = Math.min(120, maxAttempts);
        for (let attempt = 0; attempt < fallbackAttempts; attempt++) {
          const cand = randomPointInWorld({ margin: m, rngFn: pointRng });
          let minD2 = Infinity;
          for (let j = 0; j < points.length; j++) {
            const d2 = dist2(cand, points[j]);
            if (d2 < minD2) minD2 = d2;
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

  function generateSeparatedPoints(
    count,
    rect,
    { minSeparation = 0, maxAttemptsPerPoint = 1200, relaxFactor = 0.82, rngFn = null } = {},
  ) {
    const n = Math.max(0, Math.floor(count));
    const points = [];
    if (!rect || n === 0) return points;

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
        // Fallback: choose the candidate with maximum minimum distance, then relax separation.
        let best = null;
        let bestMinD2 = -1;
        const fallbackAttempts = Math.min(200, maxAttempts);
        for (let attempt = 0; attempt < fallbackAttempts; attempt++) {
          const cand = randomPointInRect(rect, rr);
          let minD2 = Infinity;
          for (let j = 0; j < points.length; j++) {
            const d2 = dist2(cand, points[j]);
            if (d2 < minD2) minD2 = d2;
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
    if (!star) return;
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

  function starConsumesBody(body, star) {
    if (!body || !star) return false;
    const r = Math.max(0, Number(body.radius) || 0);
    const x = Number(body.pos?.x) || 0;
    const y = Number(body.pos?.y) || 0;
    const b = Number(star.boundary) || 0;

    if (star.axis === "x") {
      if (star.dir === 1) return x - r < b;
      return x + r > b;
    }
    if (star.dir === 1) return y - r < b;
    return y + r > b;
  }

  function starSafeRect(star, { bufferPx = 0, marginPx = 0 } = {}) {
    if (!star) return null;
    const halfW = state.world.w / 2;
    const halfH = state.world.h / 2;
    const m = clamp(Number(marginPx) || 0, 0, Math.min(halfW, halfH));
    const buf = Math.max(0, Number(bufferPx) || 0);

    let xMin = -halfW + m;
    let xMax = halfW - m;
    let yMin = -halfH + m;
    let yMax = halfH - m;

    if (star.axis === "x") {
      if (star.dir === 1) xMin = Math.max(xMin, star.boundary + buf);
      else xMax = Math.min(xMax, star.boundary - buf);
    } else {
      if (star.dir === 1) yMin = Math.max(yMin, star.boundary + buf);
      else yMax = Math.min(yMax, star.boundary - buf);
    }

    if (xMin > xMax || yMin > yMax) return null;
    return { xMin, xMax, yMin, yMax };
  }

  function starSafeRectRelaxed(star, { bufferPx = 0, marginPx = 0 } = {}) {
    const rect = starSafeRect(star, { bufferPx, marginPx });
    if (rect) return rect;
    if (bufferPx > 0) return starSafeRect(star, { bufferPx: 0, marginPx });
    return null;
  }

  function makeJumpGate(edge) {
    const rr = makeRoundRng("jump-gate");
    const radiusRaw = Number(state.params.jumpGateRadius ?? 160);
    const edgeInsetExtraPx = Number(state.params.jumpGateEdgeInsetExtraPx ?? 0);
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
      slots: new Array(ROUND_PART_COUNT).fill(null),
    };
  }

  function makeTechPart(index) {
    const radiusRaw = Number(state.params.techPartRadius ?? 72);
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
      respawnCount: 0,
    };
  }

  function getTechPartById(id) {
    const parts = state.round.techParts;
    if (!Array.isArray(parts)) return null;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].id === id) return parts[i];
    }
    return null;
  }

  function endRound(kind, reason) {
    if (state.mode !== "playing") return;
    state.round.outcome = { kind, reason };
    state.mode = "gameover";
  }

  function dropTechPartFromAsteroid(asteroid, { lost = false } = {}) {
    if (!asteroid || !asteroid.techPartId) return false;
    const part = getTechPartById(asteroid.techPartId);
    const partId = asteroid.techPartId;
    asteroid.techPartId = null;

    if (!part || part.state === "installed") return false;
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

    if (state.round.carriedPartId === partId) state.round.carriedPartId = null;
    return true;
  }

  function setTechPartLost(part, { reason = "lost" } = {}) {
    if (!part || part.state === "installed") return false;
    part.state = "lost";
    part.containerAsteroidId = null;
    part.vel = vec(0, 0);
    if (state.round.carriedPartId === part.id) state.round.carriedPartId = null;
    if (reason && typeof reason === "string") part.lostReason = reason;
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
    if (!star || !Array.isArray(parts) || parts.length === 0) return;

    const halfW = state.world.w / 2;
    const halfH = state.world.h / 2;
    const asteroidR = asteroidRadiusForSize(state.params, "xlarge");
    const bufferMax = Math.min(state.world.w, state.world.h) * 0.45;
    const buffer = clamp(Number(state.params.starSafeBufferPx ?? 0), 0, bufferMax);
    const margin = clamp(Math.max(asteroidR + 60, 180), 0, Math.min(halfW, halfH) * 0.45);
    const fallbackRect = { xMin: -halfW + margin, xMax: halfW - margin, yMin: -halfH + margin, yMax: halfH - margin };
    const rect = starSafeRectRelaxed(star, { bufferPx: buffer, marginPx: margin }) || fallbackRect;

    const placementRng = makeRoundRng("tech-part-placement");
    const minSep = clamp(Math.min(state.world.w, state.world.h) * 0.22, asteroidR * 2.4, Math.min(state.world.w, state.world.h) * 0.65);
    const points = generateSeparatedPoints(parts.length, rect, { minSeparation: minSep, rngFn: placementRng });

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const p = points[i] || randomPointInRect(rect, placementRng);
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
      part.lostReason = undefined;
    }
  }

  function resetRoundState() {
    state.round.durationSec = roundDurationSec();
    state.round.elapsedSec = 0;
    state.round.outcome = null;
    state.round.carriedPartId = null;

    const starEdge = pickRoundStarEdge();
    const star = makeRedGiant(starEdge);
    updateRedGiant(star, 0);
    state.round.star = star;

    const gateEdge = oppositeStarEdge(starEdge);
    state.round.gate = makeJumpGate(gateEdge);

    state.round.techParts = [];
    for (let i = 0; i < ROUND_PART_COUNT; i++) state.round.techParts.push(makeTechPart(i));
    seedInitialTechParts();
  }

  function updateRound(dt) {
    const dur = Math.max(0.001, Number(state.round.durationSec) || roundDurationSec());
    state.round.elapsedSec = Math.max(0, Number(state.round.elapsedSec) || 0) + dt;
    const t = clamp(state.round.elapsedSec / dur, 0, 1);
    updateRedGiant(state.round.star, t);
    if (t >= 1) endRound("lose", "star_reached_far_edge");
  }

  function applyRedGiantHazard() {
    const star = state.round.star;
    if (!star) return;

    // Ship: instant loss on contact.
    if (starConsumesBody(state.ship, star)) {
      spawnExplosion(state.ship.pos, { kind: "pop", rgb: [255, 89, 100], r0: 10, r1: 54, ttl: 0.22 });
      endRound("lose", "star_contact");
      return;
    }

    // Asteroids: destroyed when consumed; tech parts inside are lost (respawned later).
    for (let i = state.asteroids.length - 1; i >= 0; i--) {
      const a = state.asteroids[i];
      if (!starConsumesBody(a, star)) continue;
      if (a.techPartId) dropTechPartFromAsteroid(a, { lost: true });
      state.asteroids.splice(i, 1);
    }

    // Gems: despawned when consumed.
    for (let i = state.gems.length - 1; i >= 0; i--) {
      if (starConsumesBody(state.gems[i], star)) state.gems.splice(i, 1);
    }

    // Saucer + lasers: deleted when consumed.
    if (state.saucer && starConsumesBody(state.saucer, star)) {
      state.saucer = null;
      state.saucerLasers = [];
    } else {
      for (let i = state.saucerLasers.length - 1; i >= 0; i--) {
        if (starConsumesBody(state.saucerLasers[i], star)) state.saucerLasers.splice(i, 1);
      }
    }

    // Dropped parts: lost when consumed.
    const parts = state.round.techParts;
    if (Array.isArray(parts)) {
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.state !== "dropped") continue;
        if (!starConsumesBody(part, star)) continue;
        setTechPartLost(part, { reason: "star" });
      }
    }
  }

  function updateTechParts() {
    const parts = state.round.techParts;
    if (!Array.isArray(parts) || parts.length === 0) return;

    const ship = state.ship;
    const gate = state.round.gate;
    const star = state.round.star;

    // Keep in-asteroid parts aligned with their container for telemetry/rendering.
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part || part.state !== "in_asteroid") continue;
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

    // Respawn invariant: any uninstalled lost part immediately respawns inside a new XL asteroid
    // in the star safe region (derived RNG; independent of gameplay RNG consumption).
    if (star) {
      const halfW = state.world.w / 2;
      const halfH = state.world.h / 2;
      const asteroidR = asteroidRadiusForSize(state.params, "xlarge");
      const bufferMax = Math.min(state.world.w, state.world.h) * 0.45;
      const baseBuffer = clamp(Number(state.params.starSafeBufferPx ?? 0), 0, bufferMax);

      // Ensure the spawned asteroid is actually safe for its radius.
      const bufferWanted = baseBuffer + asteroidR + 20;
      const bufferMin = asteroidR + 4;
      const margin = clamp(asteroidR + 2, 0, Math.min(halfW, halfH));
      const rect =
        starSafeRect(star, { bufferPx: bufferWanted, marginPx: margin }) ||
        starSafeRect(star, { bufferPx: bufferMin, marginPx: margin });
      if (rect) {
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (!part || part.state !== "lost") continue;

          const nextCount = Math.max(0, Number(part.respawnCount) || 0) + 1;
          const rr = makeRoundRng(`tech-part-respawn-${part.id}-${nextCount}`);
          const picked = randomPointInRect(rect, rr);

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
          part.lostReason = undefined;
        }
      }
    }

    // Sanity: if the carried id doesn't exist (or isn't carried), clear it.
    if (state.round.carriedPartId) {
      const carried = getTechPartById(state.round.carriedPartId);
      if (!carried || carried.state !== "carried") state.round.carriedPartId = null;
    }

    // Pickup (one at a time).
    if (!state.round.carriedPartId) {
      const pad = clamp(Number(state.params.techPartPickupPad ?? 20), 0, 800);
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part || part.state !== "dropped") continue;
        const pickR = Math.max(0, Number(ship.radius) || 0) + Math.max(0, Number(part.radius) || 0) + pad;
        if (len2(sub(part.pos, ship.pos)) > pickR * pickR) continue;
        part.state = "carried";
        part.containerAsteroidId = null;
        part.installedSlot = null;
        part.vel = vec(0, 0);
        state.round.carriedPartId = part.id;
        break;
      }
    }

    // Install (auto) when carrying and in range of the gate.
    if (gate && state.round.carriedPartId) {
      const part = getTechPartById(state.round.carriedPartId);
      const slots = Array.isArray(gate.slots) ? gate.slots : null;
      if (part && part.state === "carried" && slots) {
        const pad = clamp(Number(state.params.jumpGateInstallPad ?? 60), 0, 2000);
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

    // Gate activation: 4 installed.
    if (gate && Array.isArray(gate.slots)) {
      gate.active = gate.slots.every((slot) => !!slot);
    }

    // Attach carried part to ship nose.
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

    // Win condition: enter active gate.
    if (gate?.active) {
      const r = Math.max(0, Number(gate.radius) || 0) + Math.max(0, Number(ship.radius) || 0);
      if (len2(sub(ship.pos, gate.pos)) <= r * r) endRound("win", "escaped");
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

    const s = Math.max(64, state.worldCells.sizePx || 320);
    const zoom = Math.max(0.1, state.camera.zoom || 1);
    const radiusX = Math.ceil((state.view.w * 0.5) / (s * zoom)) + 1;
    const radiusY = Math.ceil((state.view.h * 0.5) / (s * zoom)) + 1;
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
    // At very large world scales, cap population scaling so 10x doesn't imply 100x asteroids.
    const worldFactor = Math.min(worldArea / viewArea, 25);
    const scaledTarget = Math.round(seed * worldFactor * densityScale);
    const max = Math.max(1, Math.floor(state.params.maxAsteroids));
    const target = clamp(scaledTarget, Math.min(seed, max), max);
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

  function currentSpawnExclusionViews() {
    const zoom = Math.max(0.1, state.camera.zoom || 1);
    return [
      {
        x: state.camera.x,
        y: state.camera.y,
        halfW: state.view.w * 0.5 / zoom,
        halfH: state.view.h * 0.5 / zoom,
      },
    ];
  }

  function pickSpawnAsteroidSize() {
    const weights = ASTEROID_SIZE_ORDER.map((size) => ({
      size,
      w: Math.max(0, asteroidSpawnWeightForSize(state.params, size)),
    }));
    const sum = weights.reduce((acc, it) => acc + it.w, 0);
    if (sum <= 0) return "small";
    const r = rng() * sum;
    let accum = 0;
    for (const it of weights) {
      accum += it.w;
      if (r <= accum) return it.size;
    }
    return weights[weights.length - 1].size;
  }

  function trySpawnAmbientAsteroid({
    nearPos = null,
    nearRadius = null,
    minDistFromShip = 260,
    maxCellCount = 10,
    excludeViews = [],
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
        if (minX > maxX || minY > maxY) continue;
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
      if (blockedByView) continue;

      const cell = worldCellCoordsForPos(p);
      const cellKey = worldCellKey(cell.cx, cell.cy);
      const cellCount = worldCellAsteroidCounts.get(cellKey) || 0;
      if (cellCount >= maxCellCount) continue;

      const shipClear = len2(sub(p, state.ship.pos)) > minDistFromShip * minDistFromShip;
      if (!shipClear) continue;

      let overlap = false;
      for (const other of state.asteroids) {
        const dx = Math.abs(other.pos.x - p.x);
        const dy = Math.abs(other.pos.y - p.y);
        const min = radius + other.radius + 8;
        if (dx > min || dy > min) continue;
        if (dx * dx + dy * dy < min * min) {
          overlap = true;
          break;
        }
      }
      if (overlap) continue;

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
    if (count >= target) return;
    if (count >= max) return;

    state.asteroidSpawnT -= dt;
    if (state.asteroidSpawnT > 0) return;

    const urgent = count < min;
    const deficit = Math.max(1, target - count);
    const burst = clamp(Math.ceil(deficit / 120), 1, urgent ? 56 : 20);
    const excludeViews = currentSpawnExclusionViews();
    let spawned = false;
    const zoom = Math.max(0.1, state.camera.zoom || 1);
    const halfViewW = state.view.w * 0.5 / zoom;
    const halfViewH = state.view.h * 0.5 / zoom;
    const viewDiag = Math.hypot(halfViewW, halfViewH);
    const worldHalfMin = Math.min(state.world.w, state.world.h) * 0.5;
    const nearPos = vec(state.camera.x, state.camera.y);
    const nearRadius = Math.min(worldHalfMin, viewDiag + 520);
    const minDistFromShip = clamp(Math.max(260, viewDiag * 0.82), 120, Math.max(140, nearRadius - 60));
    const canSpawnNearCamera = nearRadius > minDistFromShip + 40;
    const spawnExcludeViews = worldHalfMin <= viewDiag + 140 ? [] : excludeViews;
    for (let i = 0; i < burst && state.asteroids.length < max; i++) {
      const preferNearCamera = urgent || rng() < 0.75;
      const useNearCamera = canSpawnNearCamera && preferNearCamera;
      if (
        !trySpawnAmbientAsteroid(
          useNearCamera
            ? {
                nearPos,
                nearRadius,
                minDistFromShip,
                maxCellCount: urgent ? 14 : 12,
                excludeViews: spawnExcludeViews,
              }
            : { excludeViews: spawnExcludeViews },
        )
      ) {
        break;
      }
      spawned = true;
    }
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
    return (a * b) / (a + b);
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
    // Interpret fractureImpactSpeed as the equal-mass break speed (physics-ish).
    return 0.25 * targetMass * speed * speed;
  }

  function impactEnergy(projectile, target, relativeSpeed) {
    const rel = Math.max(0, Number(relativeSpeed) || 0);
    const mu = reducedMass(projectile?.mass, target?.mass);
    const base = 0.5 * mu * rel * rel;
    const boostRaw = Number(state.params.projectileImpactScale ?? 1);
    const boost = projectile?.shipLaunched ? clamp(boostRaw, 0.2, 4) : 1;
    return base * boost;
  }

  function impactEnergyAgainstFixed(projectile, impactSpeed) {
    const speed = Math.max(0, Number(impactSpeed) || 0);
    const mass = Math.max(1, Number(projectile?.mass) || 1);
    const base = 0.5 * mass * speed * speed;
    const boostRaw = Number(state.params.projectileImpactScale ?? 1);
    const boost = projectile?.shipLaunched ? clamp(boostRaw, 0.2, 4) : 1;
    return base * boost;
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

  function spawnBurstWavelets({ pos, angle, speed, ttl = 0.55 * 1.1, rgb = [255, 221, 88] }) {
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
    // Small-break gem drops should appear exactly at impact and not drift away.
    spawnGem(a.pos, vec(0, 0), { jitterMag: 0 });
  }

  function spawnShipAt(pos) {
    if (!pos || typeof pos !== "object") return false;
    const ship = state.ship;
    if (!ship) return false;
    const halfW = state.world.w / 2;
    const halfH = state.world.h / 2;
    const r = Math.max(1, Number(ship.radius) || 1);
    ship.pos.x = clamp(Number(pos.x) || 0, -halfW + r, halfW - r);
    ship.pos.y = clamp(Number(pos.y) || 0, -halfH + r, halfH - r);
    ship.vel.x = 0;
    ship.vel.y = 0;
    syncCameraToShip();
    return true;
  }

  function resetWorld() {
    setRoundSeed(state.round.seed);
    state.time = 0;
    state.score = 0;
    state.progression.gemScore = 0;
    state.progression.currentTier = "small";
    state.progression.tierShiftT = 0;
    state.burstCooldown = 0;
    state.blastPulseT = 0;
    state.effects = [];
    state.exhaust = [];
    exhaustRng = seededRng(0x1ee7beef);
    exhaustPool.length = 0;
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
    state.input.turnAnalog = 0;
    state.input.thrustAnalog = 0;
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

    // Ensure game start never feels empty around the player/camera.
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
      if (onScreenNow >= minOnscreenAtStart) break;
      trySpawnAmbientAsteroid({
        nearPos: state.ship.pos,
        nearRadius,
        minDistFromShip: 210,
        maxCellCount: 12,
      });
      localAttempts++;
    }

    resetRoundState();
    rebuildWorldCellIndex();
  }

  function startGame(options = {}) {
    if (options && Object.prototype.hasOwnProperty.call(options, "seed")) {
      setRoundSeed(options.seed);
    }
    resetWorld();
    if (options && options.shipSpawn && typeof options.shipSpawn === "object") {
      spawnShipAt(options.shipSpawn);
    }
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
    if (!shipCanAttractSize(a.size) || a.attached || a.shipLaunched) return false;
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
    if (state.mode !== "playing") return;
    if (state.burstCooldown > 0) return;
    state.burstCooldown = state.params.burstCooldownSec;
    state.blastPulseT = 0.22;
    const fieldR = currentForceFieldRadius();
    spawnExplosion(state.ship.pos, {
      kind: "ring",
      rgb: [255, 255, 255],
      r0: fieldR - 2,
      r1: fieldR + 26,
      ttl: 0.18,
    });

    let attachedCount = 0;
    for (const a of state.asteroids) {
      if (a.attached) attachedCount++;
    }

    // Perf guard: when many rocks burst at once, spawn wavelets for a bounded subset.
    const maxWavelets = 14;
    const stride = attachedCount > 0 ? Math.max(1, Math.ceil(attachedCount / maxWavelets)) : 1;
    const strideOffset = stride > 1 ? Math.floor(rng() * stride) : 0;
    const waveletTtl = attachedCount >= 16 ? 0.42 * 1.1 : 0.55 * 1.1;

    const shipV = state.ship.vel;
    let attachedIndex = 0;
    for (const a of state.asteroids) {
      if (!a.attached) continue;
      a.attached = false;
      a.shipLaunched = true;
      a.pos = orbitPosFor(a);
      const dir = norm(sub(a.pos, state.ship.pos));
      const base = mul(dir, currentBurstSpeed());
      a.vel = add(base, mul(shipV, 0.55));
      a.rotVel += (rng() * 2 - 1) * 1.8;

      // Burst wavelets are anchored at the forcefield surface and oriented along the *actual* launch direction.
      // This keeps the effect aligned even when the ship's velocity biases the outbound trajectory.
      const shouldSpawnWavelets = stride === 1 || (attachedIndex + strideOffset) % stride === 0;
      if (shouldSpawnWavelets) {
        const vDir = len(a.vel) > 1e-6 ? norm(a.vel) : dir;
        const ringP = add(state.ship.pos, mul(vDir, fieldR));
        const ang = angleOf(vDir);
        const spd = len(a.vel);
        spawnBurstWavelets({ pos: ringP, angle: ang, speed: spd * 0.9, ttl: waveletTtl, rgb: [255, 221, 88] });
      }
      attachedIndex++;
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

    if (minCamX <= maxCamX) state.camera.x = clamp(state.camera.x, minCamX, maxCamX);
    else state.camera.x = 0;
    if (minCamY <= maxCamY) state.camera.y = clamp(state.camera.y, minCamY, maxCamY);
    else state.camera.y = 0;
  }

  function syncCameraToShip() {
    const zoom = Math.max(0.1, state.camera.zoom || 1);
    if (state.camera.mode === "deadzone") {
      const ship = state.ship;
      const dzHalfW = Math.max(0, (state.view.w * state.camera.deadZoneFracX) / (2 * zoom));
      const dzHalfH = Math.max(0, (state.view.h * state.camera.deadZoneFracY) / (2 * zoom));
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
    const turnDigital = (state.input.right ? 1 : 0) - (state.input.left ? 1 : 0);
    const turnAnalog = clamp(Number(state.input.turnAnalog ?? 0), -1, 1);
    const turn = clamp(turnDigital + turnAnalog, -1, 1);
    if (Math.abs(turn) > 1e-6) ship.angle += turn * state.params.shipTurnRate * dt;

    const fwd = shipForward(ship);
    const thrustDigital = state.input.up ? 1 : 0;
    const thrustAnalog = clamp(Number(state.input.thrustAnalog ?? 0), 0, 1);
    const thrust = Math.max(thrustDigital, thrustAnalog);
    if (thrust > 1e-6) ship.vel = add(ship.vel, mul(fwd, state.params.shipThrust * thrust * dt));
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

  function spawnExhaustParticle(kind, x, y, vx, vy, { ttl, r, seed }) {
    const p = exhaustPool.length
      ? exhaustPool.pop()
      : { kind: "flame", pos: vec(0, 0), vel: vec(0, 0), age: 0, ttl: 0, r: 1, seed: 0 };
    p.kind = kind;
    p.pos.x = x;
    p.pos.y = y;
    p.vel.x = vx;
    p.vel.y = vy;
    p.age = 0;
    p.ttl = ttl;
    p.r = r;
    p.seed = seed;
    state.exhaust.push(p);
  }

  function updateExhaust(dt) {
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
    if (!ship) return;
    const thrustAmt = Math.max(state.input.up ? 1 : 0, clamp(Number(state.input.thrustAnalog ?? 0), 0, 1));
    if (thrustAmt <= 1e-6) return;
    const tier = currentShipTier();
    const renderer = tier?.renderer || {};
    const engines = Array.isArray(renderer.engines) ? renderer.engines : [];
    if (engines.length === 0) return;

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
    if (intensity <= 1e-6 && sparkScale <= 1e-6) return;
    const dtScale = clamp(dt * 60, 0.1, 4);

    const tierScale = tier.key === "large" ? 1.35 : tier.key === "medium" ? 1.15 : 1;
    const flamesPerEngineBase = tier.key === "large" ? 3 : tier.key === "medium" ? 2 : 1;
    const sparkChanceBase = tier.key === "large" ? 0.16 : tier.key === "medium" ? 0.14 : 0.12;
    const maxParticles = clamp(Math.round(650 + 550 * intensity), 220, 1400);

    for (let ei = 0; ei < engines.length; ei++) {
      const e = engines[ei];
      let lx = (Number(e?.x) || 0) * scale;
      const ly = (Number(e?.y) || 0) * scale;
      if (mirrorX) lx = -lx;

      // Slight offset backward so we don't spawn bright particles on the hull stroke.
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
        const seed = Math.floor(exhaustRng() * 0xffffffff) >>> 0;
        const sideJitter = (exhaustRng() * 2 - 1) * 52 * tierScale;
        const backJitter = (exhaustRng() * 2 - 1) * 22 * tierScale;
        const speed = (180 + exhaustRng() * 150) * tierScale;
        const vx = baseVelX + backX * (speed + backJitter) + sideX * sideJitter;
        const vy = baseVelY + backY * (speed + backJitter) + sideY * sideJitter;
        const ttl = 0.28 + exhaustRng() * 0.26;
        const r = (2.0 + exhaustRng() * 2.2) * tierScale * (0.85 + 0.25 * intensity);
        const posX =
          nozzleX + sideX * ((exhaustRng() * 2 - 1) * 2.2 * tierScale) + backX * (exhaustRng() * 2.8);
        const posY =
          nozzleY + sideY * ((exhaustRng() * 2 - 1) * 2.2 * tierScale) + backY * (exhaustRng() * 2.8);
        spawnExhaustParticle("flame", posX, posY, vx, vy, { ttl, r, seed });
      }

      const sparkChance = clamp(sparkChanceBase * sparkScale * dtScale, 0, 1);
      if (sparkChance > 1e-6 && exhaustRng() < sparkChance) {
        const seed = Math.floor(exhaustRng() * 0xffffffff) >>> 0;
        const sideJitter = (exhaustRng() * 2 - 1) * 120 * tierScale;
        const speed = (300 + exhaustRng() * 220) * tierScale;
        const vx = baseVelX + backX * speed + sideX * sideJitter;
        const vy = baseVelY + backY * speed + sideY * sideJitter;
        const ttl = 0.12 + exhaustRng() * 0.20;
        const r = (1.0 + exhaustRng() * 1.4) * tierScale;
        spawnExhaustParticle("spark", nozzleX, nozzleY, vx, vy, { ttl, r, seed });
      }
    }

    if (particles.length > maxParticles) {
      while (particles.length > maxParticles) {
        exhaustPool.push(particles.pop());
      }
    }
  }

  function updateAsteroids(dt) {
    const ship = state.ship;
    const attractRadius = currentAttractRadius();
    const forceFieldRadius = currentForceFieldRadius();
    const attractRadius2 = attractRadius * attractRadius;

    // Keep attached asteroids distributed around the ring.
    // Simple angular repulsion so they don't overlap.
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
      if (!Number.isFinite(a.pullFx)) a.pullFx = 0;
      const pullEaseIn = 1 - Math.exp(-dt * 10);
      const pullEaseOut = 1 - Math.exp(-dt * 6);
      let pullTarget = 0;

      if (shipCanAttractSize(a.size) && !a.shipLaunched) {
        const toShip = sub(ship.pos, a.pos);
        const d2 = len2(toShip);
        if (d2 < attractRadius2) {
          const d = Math.max(10, Math.sqrt(d2));
          const dirIn = mul(toShip, 1 / d); // toward ship

          // Gravity well: stronger as you get closer (1 / (d^2 + soft^2)).
          const soft = state.params.gravitySoftening;
          const grav = state.params.gravityK / (d2 + soft * soft);
          const insideRing = d < forceFieldRadius;
          const innerMult = insideRing ? state.params.innerGravityMult : 1;
          const innerT = insideRing ? clamp(1 - d / Math.max(1, forceFieldRadius), 0, 1) : 0;
          a.vel = add(a.vel, mul(dirIn, grav * innerMult * dt));

          // Extra damping inside the ring to help captures settle and reduce slingshot escapes.
          if (innerT > 0) {
            a.vel = mul(a.vel, Math.max(0, 1 - state.params.innerDrag * innerT * dt));
          }

          // Forcefield surface: pull toward r = forceFieldRadius and repel inside it.
          const targetRingRadius = orbitRadiusForAsteroid(a);
          const err = d - targetRingRadius; // + outside, - inside
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

          // Attraction visualization: show pull strength for any attractable, non-launched asteroid.
          if (!a.shipLaunched) {
            const denom = Math.max(1, attractRadius - forceFieldRadius);
            pullTarget = clamp(1 - (d - forceFieldRadius) / denom, 0, 1);
            if (d < forceFieldRadius) pullTarget = 1;
          }
        }

        tryAttachAsteroid(a);
      }

      const blend = pullTarget > a.pullFx ? pullEaseIn : pullEaseOut;
      a.pullFx = lerp(a.pullFx, pullTarget, blend);
      if (a.pullFx < 1e-4) a.pullFx = 0;

      a.pos = add(a.pos, mul(a.vel, dt));
      if (isOutsideWorld(a, 8)) {
        if (a.techPartId) dropTechPartFromAsteroid(a, { lost: true });
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
      const pts = gemPoints(g.kind);
      state.score += pts;
      state.progression.gemScore += pts;
      refreshShipTierProgression({ animateZoom: true });
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
    if (target.size === "med") {
      const baseR = Math.max(1, target.radius || asteroidRadiusForSize(state.params, "med"));
      spawnExplosion(target.pos, {
        kind: "pop",
        rgb: [255, 255, 255],
        r0: 10,
        r1: Math.max(26, baseR * 1.45),
        ttl: 0.22,
      });
      // Medium breaks drop gems instead of spawning small asteroids.
      const dir = len2(impactDir) > 1e-6 ? norm(impactDir) : vec(1, 0);
      const axis = rot(dir, Math.PI / 2);
      const sep = gemRadius("emerald") * 1.6;
      spawnGem(add(target.pos, mul(axis, sep)), vec(0, 0), { jitterMag: 0 });
      spawnGem(add(target.pos, mul(axis, -sep)), vec(0, 0), { jitterMag: 0 });
      const rankGain = Math.max(1, asteroidSizeRank(target.size));
      state.score += 4 + rankGain * 3;
      return [];
    }
    const next = asteroidNextSize(target.size);
    if (!next) return null;

    // KISS fracture: size -> 2 next smaller.
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
      ttl: 0.22,
    });

    const rankGain = Math.max(1, asteroidSizeRank(target.size));
    state.score += 4 + rankGain * 3;
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
    const cellSize = Math.max(180, Math.round((state.params.xxlargeRadius || 150) * 2.2));
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

    // Ship vs asteroids.
    const shipRemovals = new Set();
    const shipAdds = [];
    for (const a of state.asteroids) {
      if (a.attached) continue;
      const impactSpeed = len(a.vel);
      if (a.shipLaunched && circleHit(state.ship, a)) {
        if (a.size === "small") {
          breakSmallAsteroid(a, { velHint: a.vel, removeSet: shipRemovals });
        } else {
          const energy = impactEnergyAgainstFixed(a, impactSpeed);
          const threshold = fractureEnergyThreshold(a);
          if (energy >= threshold) {
            const frags = fractureAsteroid(a, norm(a.vel), impactSpeed);
            if (frags) {
              if (a.techPartId) dropTechPartFromAsteroid(a);
              shipRemovals.add(a.id);
              const room = Math.max(0, state.params.maxAsteroids - (state.asteroids.length + shipAdds.length - shipRemovals.size));
              shipAdds.push(...frags.slice(0, room));
            }
          } else {
            if (a.techPartId) dropTechPartFromAsteroid(a);
            shipRemovals.add(a.id);
            spawnExplosion(a.pos, { kind: "tiny", rgb: [255, 89, 100], r0: 5, r1: 18, ttl: 0.14 });
          }
        }
        continue;
      }
      if (a.size === "small") {
        if (circleHit(state.ship, a)) {
          const energy = impactEnergyAgainstFixed(a, impactSpeed);
          const threshold = fractureEnergyThreshold(a);
          if (energy >= threshold) {
            breakSmallAsteroid(a, { velHint: a.vel, removeSet: shipRemovals });
          }
        }
        continue;
      }
      const hit = circleCollide(state.ship, a);
      if (!hit) continue;
      if (state.settings.shipExplodesOnImpact) {
        endRound("lose", "ship_impact");
        return;
      }
      resolveElasticCollision(state.ship, a, hit.n, hit.penetration);
    }
    if (shipRemovals.size) {
      state.asteroids = state.asteroids.filter((a) => !shipRemovals.has(a.id));
    }
    if (shipAdds.length) state.asteroids.push(...shipAdds);

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
      const relSpeed = len(rv);
      const aEnergy = impactEnergy(a, b, relSpeed);
      const bEnergy = impactEnergy(b, a, relSpeed);
      const aThreshold = fractureEnergyThreshold(b);
      const bThreshold = fractureEnergyThreshold(a);
      const aCanFracture = aEnergy >= aThreshold;
      const bCanFracture = bEnergy >= bThreshold;
      if (aCanFracture || bCanFracture) {
        // Transfer momentum even when a fracture occurs.
        resolveElasticCollision(a, b, hit.n, hit.penetration);
        const interactions = [];
        if (aCanFracture) interactions.push({ projectile: a, target: b, impactDir: hit.n, energy: aEnergy });
        if (bCanFracture) interactions.push({ projectile: b, target: a, impactDir: mul(hit.n, -1), energy: bEnergy });

        for (const it of interactions) {
          const projectile = it.projectile;
          const target = it.target;
          if (!projectile || !target) continue;
          if (toRemove.has(projectile.id) || toRemove.has(target.id)) continue;

          if (projectile.size === "small") {
            // Fast smalls still self-destruct on impact.
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

          const frags = fractureAsteroid(target, it.impactDir, relSpeed);
          if (frags) {
            if (target.techPartId) dropTechPartFromAsteroid(target);
            toRemove.add(target.id);
            const room = Math.max(0, state.params.maxAsteroids - (state.asteroids.length + toAdd.length - toRemove.size));
            toAdd.push(...frags.slice(0, room));
            continue;
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
    if (toAdd.length) state.asteroids.push(...toAdd);
  }

  function update(dt) {
    if (state.mode !== "playing") return;
    updateRound(dt);
    if (state.mode !== "playing") return;
    state.time += dt;
    state.burstCooldown = Math.max(0, state.burstCooldown - dt);
    state.blastPulseT = Math.max(0, state.blastPulseT - dt);
    state.progression.tierShiftT = Math.max(0, state.progression.tierShiftT - dt);
    refreshShipTierProgression({ animateZoom: true });
    updateCameraZoom(dt);
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
    updateExhaust(dt);
    syncCameraToShip();
    updateAsteroids(dt);
    updateGems(dt);
    updateSaucer(dt);
    updateSaucerLasers(dt);
    applyRedGiantHazard();
    if (state.mode !== "playing") return;
    handleSaucerAsteroidCollisions();
    handleGemShipCollisions();
    handleSaucerLaserShipCollisions();
    handleCollisions();
    if (state.mode !== "playing") return;
    updateTechParts();
    if (state.mode !== "playing") return;
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
      { small: 0, med: 0, large: 0, xlarge: 0, xxlarge: 0 },
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
    const asteroidsOnScreen = state.asteroids.reduce((n, a) => {
      const inX = Math.abs(a.pos.x - state.camera.x) <= state.view.w * 0.5 / zoom + a.radius;
      const inY = Math.abs(a.pos.y - state.camera.y) <= state.view.h * 0.5 / zoom + a.radius;
      return n + (inX && inY ? 1 : 0);
    }, 0);
    return JSON.stringify({
      coordinate_system:
        "World coords are pixels with origin at world center; screen center follows camera. +x right, +y down.",
      round: {
        seed: state.round.seed >>> 0,
        duration_sec: +Number(state.round.durationSec || 0).toFixed(3),
        elapsed_sec: +Number(state.round.elapsedSec || 0).toFixed(3),
        outcome: state.round.outcome ? { ...state.round.outcome } : null,
        star: state.round.star
          ? {
              edge: state.round.star.edge,
              axis: state.round.star.axis,
              dir: state.round.star.dir,
              t: +Number(state.round.star.t || 0).toFixed(6),
              boundary: +Number(state.round.star.boundary || 0).toFixed(3),
            }
          : null,
        gate: state.round.gate
          ? {
              edge: state.round.gate.edge,
              x: Math.round(state.round.gate.pos?.x || 0),
              y: Math.round(state.round.gate.pos?.y || 0),
              radius: +Number(state.round.gate.radius || 0).toFixed(2),
              active: !!state.round.gate.active,
              installed: Array.isArray(state.round.gate.slots)
                ? state.round.gate.slots.reduce((n, slot) => n + (slot ? 1 : 0), 0)
                : 0,
            }
          : null,
        tech_parts: Array.isArray(state.round.techParts)
          ? state.round.techParts.map((p) => ({
              id: p.id,
              state: p.state,
              x: Math.round(p.pos?.x || 0),
              y: Math.round(p.pos?.y || 0),
              container: p.containerAsteroidId,
              installed_slot: p.installedSlot,
              respawns: p.respawnCount || 0,
            }))
          : [],
        carried_part: state.round.carriedPartId || null,
      },
      mode: state.mode,
      view: { w: state.view.w, h: state.view.h },
      world: { w: state.world.w, h: state.world.h },
      world_cells: {
        size_px: state.worldCells.sizePx,
        active_count: state.worldCells.activeCount,
        indexed_asteroid_cells: state.worldCells.indexedAsteroidCells,
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
        zoom: +zoom.toFixed(3),
      },
      ship: {
        x: Math.round(ship.pos.x),
        y: Math.round(ship.pos.y),
        vx: Math.round(ship.vel.x),
        vy: Math.round(ship.vel.y),
        angle: +ship.angle.toFixed(3),
        tier: ship.tier,
        radius: +ship.radius.toFixed(2),
      },
      saucer: state.saucer
        ? {
            x: Math.round(state.saucer.pos.x),
            y: Math.round(state.saucer.pos.y),
            shots_remaining: state.saucer.burstShotsRemaining,
            lasers: state.saucerLasers.length,
          }
        : null,
      field: { radius: +currentForceFieldRadius().toFixed(2) },
      attract: { radius: +currentAttractRadius().toFixed(2), debug: state.settings.showAttractRadius },
      progression: {
        gem_score: state.progression.gemScore,
        current_tier: state.progression.currentTier,
        tier2_unlock: state.params.tier2UnlockGemScore,
        tier3_unlock: state.params.tier3UnlockGemScore,
        override: state.settings.tierOverrideEnabled ? clamp(Math.round(state.settings.tierOverrideIndex), 1, 3) : 0,
      },
      population: {
        current: state.asteroids.length,
        min: popBudget.min,
        target: popBudget.target,
        max: popBudget.max,
        spawn_t: +Math.max(0, state.asteroidSpawnT).toFixed(3),
        spawn_rate_scale: +spawnRateScale.toFixed(2),
      },
      counts: { ...counts, attached, score: state.score, asteroids_on_screen: asteroidsOnScreen },
      gems_on_field: gemsOnField,
      gems_collected: { ...state.gemsCollected },
      sample_asteroids: sample,
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
      hullRadius: Number.isFinite(hullR) && hullR > 0 ? hullR : undefined,
      mirrorX: undefined,
      engines: cloneRenderer(DEFAULT_SHIP_RENDERERS[key]).engines || [],
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
  };
}
