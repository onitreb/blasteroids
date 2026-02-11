import { clamp, lerp } from "../util/math.js";
import { angleOf, angleToVec, wrapAngle } from "../util/angle.js";
import { seededRng } from "../util/rng.js";
import { circleCollide, circleHit } from "../util/collision.js";
import {
  asteroidCanBreakTarget,
  asteroidDamageSpeedForSize,
  asteroidMassForRadius,
  asteroidNextSize,
  asteroidRadiusForSize,
  asteroidSizeRank,
  asteroidSpawnWeightForSize,
  sizeSetHas,
} from "../util/asteroid.js";
import { add, dot, len, len2, mul, norm, rot, sub, vec } from "../util/vec2.js";

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

export const SHIP_TIERS = {
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
    renderer: cloneRenderer(DEFAULT_SHIP_RENDERERS.small),
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
    renderer: cloneRenderer(DEFAULT_SHIP_RENDERERS.medium),
  },
  large: {
    key: "large",
    label: "Large",
    scale: 4,
    radius: 56,
    mass: 4160,
    forcefieldScale: 1.62,
    attractScale: 1.42,
    ringRgb: [255, 112, 127],
    ringColor: "rgba(255,112,127,0.42)",
    attractSizes: ["small", "med", "large"],
    renderer: cloneRenderer(DEFAULT_SHIP_RENDERERS.large),
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
    const hullR = Number(renderer.hullRadius);
    const svgScale = Number.isFinite(Number(renderer.svgScale)) ? Number(renderer.svgScale) : 1;
    if (Number.isFinite(hullR) && hullR > 0) return Math.max(tier.radius, hullR * svgScale);
    // Fallback: approximate from the tier's polygon hull.
  }
  const points = Array.isArray(renderer.points) ? renderer.points : DEFAULT_SHIP_RENDERERS[tier.key]?.points;
  let max2 = 0;
  if (Array.isArray(points)) {
    for (const p of points) {
      const d2 = p.x * p.x + p.y * p.y;
      if (d2 > max2) max2 = d2;
    }
  }
  const baseR = Math.sqrt(max2);
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

export function createEngine({ width, height }) {
  const rng = seededRng(0xdecafbad);
  const starRng = seededRng(0x51a7f00d);
  const state = {
    mode: "menu", // menu | playing | gameover
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
      mode: "deadzone", // centered | deadzone
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

      attractRadius: 252, // +5%
      forceFieldRadius: 75,
      tier1ForceFieldScale: SHIP_TIERS.small.forcefieldScale,
      tier2ForceFieldScale: SHIP_TIERS.medium.forcefieldScale,
      tier3ForceFieldScale: SHIP_TIERS.large.forcefieldScale,
      forceFieldHullGap: 14,
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
      maxAsteroids: 4000,
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
      tier3UnlockGemScore: 1000,
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
      saucerBurstPauseMinSec: 1.0,
      saucerBurstPauseMaxSec: 3.0,
      saucerLaserSpeed: 520,
      saucerLaserRadius: 4,
    },
  };
  const worldCellAsteroidCounts = new Map();
  const worldCellActiveKeys = new Set();
  ensureAttractRadiusCoversForcefield(state.params);

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
      orbitA: 0, // ship-local angle (radians) when attached
      fractureCooldownT: 0,
      hitFxT: 0,
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
    for (let i = 0; i < burst && state.asteroids.length < max; i++) {
      if (!trySpawnAmbientAsteroid({ excludeViews })) break;
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
        state.mode = "gameover";
        return;
      }
      const pushDir = norm(b.vel);
      state.ship.vel = add(state.ship.vel, mul(pushDir, 170));
    }
  }

  function isDamagingProjectile(a, impactSpeed) {
    if (!a?.shipLaunched) return false;
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
    if (!shipCanAttractSize(a.size) || a.attached) return false;
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
    const tier = currentShipTier();
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

      if (shipCanAttractSize(a.size)) {
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

          // Attraction visualization: start with small ship pulling small asteroids.
          if (tier.key === "small" && a.size === "small") {
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
    const smallBreakSpeed = asteroidDamageSpeedForSize(state.params, "small");
    for (const a of state.asteroids) {
      if (a.attached) continue;
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
      if (a.size === "small") continue;
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
      const velAlongNormal = dot(rv, hit.n);
      const impactSpeed = -velAlongNormal;
      const relSpeed = len(rv);
      const aFastAmbientSmall = !a.shipLaunched && a.size === "small" && relSpeed >= smallBreakSpeed;
      const bFastAmbientSmall = !b.shipLaunched && b.size === "small" && relSpeed >= smallBreakSpeed;
      if (aFastAmbientSmall || bFastAmbientSmall) {
        if (aFastAmbientSmall) breakSmallAsteroid(a, { velHint: a.vel, removeSet: toRemove });
        if (bFastAmbientSmall) breakSmallAsteroid(b, { velHint: b.vel, removeSet: toRemove });
        return;
      }

      const aDamaging = isDamagingProjectile(a, relSpeed);
      const bDamaging = isDamagingProjectile(b, relSpeed);
      if (aDamaging || bDamaging) {
        const interactions = [];
        if (aDamaging) interactions.push({ projectile: a, target: b, impactDir: hit.n });
        if (bDamaging) interactions.push({ projectile: b, target: a, impactDir: mul(hit.n, -1) });

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
    if (toAdd.length) state.asteroids.push(...toAdd);
  }

  function update(dt) {
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
      counts: { ...counts, attached, score: state.score, asteroids_on_screen: asteroidsOnScreen },
      gems_on_field: gemsOnField,
      gems_collected: { ...state.gemsCollected },
      sample_asteroids: sample,
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
      svgScale: Number.isFinite(Number(svgScale)) ? Number(svgScale) : 1,
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
    getCurrentAttractRadius: () => currentAttractRadius(),
  };
}
