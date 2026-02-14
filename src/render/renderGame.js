import { clamp, lerp, posMod } from "../util/math.js";
import { angleOf } from "../util/angle.js";
import { asteroidSizeRank } from "../util/asteroid.js";
import { polygonHullRadius } from "../util/ship.js";
import { add, len, mul, sub } from "../util/vec2.js";
import { SHIP_TIERS } from "../engine/createEngine.js";

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

function drawThrusterJets(ctx, engines, { tierKey = "small", exhaustSign = -1, t = 0 } = {}) {
  if (!Array.isArray(engines) || engines.length === 0) return;
  const size = tierKey === "large" ? 1.6 : tierKey === "medium" ? 1.25 : 1;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  // 'butt' avoids little circular caps at the nozzle (ship geometry already shows the ports).
  ctx.lineCap = "butt";

  for (const e of engines) {
    const sx = Number(e.x) || 0;
    const sy = Number(e.y) || 0;
    const baseLen = Math.max(6, Number(e.len) || 14);
    const flicker =
      0.78 + 0.22 * Math.sin(t * 28 + sy * 0.35) + 0.12 * Math.sin(t * 61 + sx * 0.09) + 0.06 * Math.sin(t * 97);
    const len = baseLen * (1.05 + flicker * 0.75) * size;
    // Start the flame slightly behind the hull so we don't get a bright blob on the ship outline.
    const nozzle = 1.8 * size;
    const nx = sx + exhaustSign * nozzle;
    const ex = nx + exhaustSign * len;
    const jetSign = sy >= 0 ? 1 : -1;
    const aim = (1.0 + 0.55 * Math.sin(t * 13 + sy * 0.2) + 0.25 * Math.sin(t * 7.5 + sx * 0.08)) * size;
    const ey = sy + jetSign * aim;

    // Outer glow (soft + wide).
    const g0 = ctx.createLinearGradient(nx, sy, ex, ey);
    // "Hot rocket" palette: white/yellow core with orange/red envelope.
    g0.addColorStop(0, "rgba(255,248,220,0.08)");
    g0.addColorStop(0.12, "rgba(255,210,145,0.12)");
    g0.addColorStop(0.30, "rgba(255,135,70,0.15)");
    g0.addColorStop(0.60, "rgba(255,75,35,0.11)");
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
      ctx.quadraticCurveTo(nx + exhaustSign * len * 0.42, sy + wob * 0.25, ex, ey + wob + bend);
      ctx.stroke();
    }

    // Mid flame (hot orange).
    const g1 = ctx.createLinearGradient(nx, sy, ex, ey);
    g1.addColorStop(0, "rgba(255,255,245,0.24)");
    g1.addColorStop(0.14, "rgba(255,235,185,0.28)");
    g1.addColorStop(0.30, "rgba(255,170,95,0.25)");
    g1.addColorStop(0.62, "rgba(255,105,55,0.18)");
    g1.addColorStop(1, "rgba(255,70,30,0)");
    ctx.strokeStyle = g1;
    ctx.lineWidth = 4.1 * size;
    ctx.shadowBlur = 14 * size;
    ctx.beginPath();
    ctx.moveTo(nx, sy);
    ctx.quadraticCurveTo(
      nx + exhaustSign * len * 0.50,
      sy,
      ex,
      ey + Math.sin(t * 22 + sy * 0.5) * 0.8 * size,
    );
    ctx.stroke();

    // Bright core (white-ish).
    const g2 = ctx.createLinearGradient(nx, sy, ex, ey);
    // Tiny hint of blue at the nozzle reads as "very hot", but the jet should stay mostly warm.
    g2.addColorStop(0, "rgba(210,245,255,0.20)");
    g2.addColorStop(0.10, "rgba(255,255,255,0.52)");
    g2.addColorStop(0.26, "rgba(255,250,225,0.30)");
    g2.addColorStop(1, "rgba(255,205,130,0)");
    ctx.shadowBlur = 0;
    ctx.strokeStyle = g2;
    ctx.lineWidth = 1.7 * size;
    ctx.beginPath();
    ctx.moveTo(nx, sy);
    ctx.lineTo(nx + exhaustSign * len * 0.78, sy);
    ctx.stroke();

    // Shock diamonds (tiny bright plates) to give the exhaust some structure.
    ctx.fillStyle = "rgba(255,240,205,0.24)";
    const diamonds = tierKey === "large" ? 4 : 3;
    for (let i = 0; i < diamonds; i++) {
      const u = (0.18 + i * 0.16) * len;
      const wob = Math.sin(t * (18 + i * 6) + sy * 0.4) * 0.5 * size;
      const px = nx + exhaustSign * u;
      const py = sy + wob;
      const ww = (3.8 - i * 0.55) * size;
      const hh = (1.8 - i * 0.25) * size;
      ctx.fillRect(px - ww * 0.5, py - hh * 0.5, ww, hh);
    }

    // Tiny heat streaks (no circles) near the tail of the flame.
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,230,180,0.30)";
    ctx.lineWidth = 1.1 * size;
    for (let i = 0; i < 5; i++) {
      const tt = (0.52 + 0.42 * Math.sin(t * (26 + i * 7) + sx * 0.02 + sy * 0.17 + i * 0.7)) * len;
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
  if (!Array.isArray(particles) || particles.length === 0) return;
  const flameSprite = sprites?.flame || null;
  const sparkSprite = sprites?.spark || null;
  if (!flameSprite && !sparkSprite) return;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (const p of particles) {
    const age = Number(p?.age) || 0;
    const ttl = Math.max(1e-6, Number(p?.ttl) || 0.001);
    const t = clamp(age / ttl, 0, 1);
    const life = 1 - t;
    if (life <= 0.001) continue;

    const seed = Number(p?.seed) || 0;
    const flicker = 0.85 + 0.15 * Math.sin(timeSec * 38 + (seed % 997) * 0.07);
    const r = clamp(Number(p?.r) || 2, 0.25, 12);
    const x = Number(p?.pos?.x) || 0;
    const y = Number(p?.pos?.y) || 0;

    if (p.kind !== "spark") {
      if (!flameSprite) continue;
      const alpha = clamp(life * (0.55 + 0.45 * flicker), 0, 1);
      // Sprite is authored ~unit radius; scale by particle radius.
      const sizePx = r * 7.5;
      ctx.globalAlpha = alpha;
      ctx.drawImage(flameSprite, x - sizePx * 0.5, y - sizePx * 0.5, sizePx, sizePx);
      continue;
    }

    if (!sparkSprite) continue;
    const alpha = clamp(life * (0.75 + 0.25 * flicker), 0, 1);
    const sizePx = Math.max(2, r * 6.0);
    ctx.globalAlpha = alpha;
    ctx.drawImage(sparkSprite, x - sizePx * 0.5, y - sizePx * 0.5, sizePx, sizePx);

    // Tiny “puff” behind the spark to hint at motion without drawing expensive streaks.
    const vx = Number(p?.vel?.x) || 0;
    const vy = Number(p?.vel?.y) || 0;
    const offX = -vx * 0.010;
    const offY = -vy * 0.010;
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
    Math.round(lerp(a[2], b[2], tt)),
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
  return (s / 0xffffffff) * 2 - 1;
}

function drawElectricTether(
  ctx,
  from,
  to,
  rgb,
  intensity,
  timeSec,
  seedBase,
  { thicknessScale = 1, alphaScale = 1, wobbleScale = 1 } = {},
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (!Number.isFinite(dist) || dist < 2) return;
  const inv = 1 / dist;
  const nx = -dy * inv;
  const ny = dx * inv;
  const segs = clamp(Math.round(dist / 22), 4, 12);
  const amp = lerp(1.5, 9.0, intensity) * wobbleScale;
  const phase = timeSec * 18;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  // Soft glow pass.
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
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Bright core pass with flowing dash.
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

export function pullTetherLineCountForSize(size) {
  // Keep one baseline line and scale up by asteroid size rank for readability.
  return clamp(asteroidSizeRank(size) + 1, 1, 8);
}

export function pullFxVisualScaleForTier(tierKey) {
  if (tierKey === "large") return { thickness: 1.45, alpha: 1.35, wobble: 1.2, spread: 1.35 };
  if (tierKey === "medium") return { thickness: 1.22, alpha: 1.18, wobble: 1.1, spread: 1.15 };
  return { thickness: 1, alpha: 1, wobble: 1, spread: 1 };
}

export function attachedAsteroidColorForTierRgb(ringRgb) {
  return rgbToRgba(ringRgb, 0.95);
}

function drawBurstWaveletsEffect(ctx, e, waveletCrowd) {
  const ttl = Math.max(1e-6, Number(e.ttl) || 0.55);
  const age = clamp((Number(e.t) || 0) / ttl, 0, 1);
  const fadeOut = 1 - age;
  const speed = Math.max(0, Number(e.speed) || 520);
  const travelDist = speed * (Number(e.t) || 0);
  const fadeIn = smoothstep(18, 78, travelDist); // delay until the rock has clearly left the ring
  const baseFade = fadeIn * fadeOut;
  if (baseFade <= 1e-3) return;

  const angle = Number.isFinite(e.angle) ? e.angle : 0;
  const dirx = Math.cos(angle);
  const diry = Math.sin(angle);

  // Crowding guard: reduce detail and deterministically sample under extreme counts.
  const many = waveletCrowd >= 12;
  const extreme = waveletCrowd >= 22;
  if (extreme && (e.seed ?? 0) % 2 !== 0) return;

  // These live just outside the forcefield surface (anchored at e.x/e.y) and do NOT move with the asteroid.
  // They should read as ripples on the surface, not rocket exhaust.
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
    // Closest to the forcefield is brightest; fade out as it goes away from the ring.
    const local = Math.pow(1 - i / Math.max(1, waves - 1), 1.15);
    const a = Math.min(1, aBase * local);
    if (a <= 0.01) continue;

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
  if (kind === "gold") return [255, 221, 88];
  if (kind === "diamond") return [86, 183, 255];
  if (kind === "ruby") return [255, 89, 100];
  return [84, 240, 165];
}

function installedCountFromSlots(slots) {
  if (!Array.isArray(slots)) return 0;
  return slots.reduce((n, slot) => n + (slot ? 1 : 0), 0);
}

export function createRenderer(engine) {
  const state = engine.state;
  const currentShipTier = () => engine.getCurrentShipTier();
  const currentForceFieldRadius = () => engine.getCurrentForceFieldRadius();
  const currentAttractRadius = () => engine.getCurrentAttractRadius();
  const svgPathCache = new Map();
  let exhaustSpritesCacheKey = "";
  let exhaustSpritesCache = null;
  function getExhaustSprites() {
    try {
      if (typeof document === "undefined") return null;
      const p = state.params || {};
      const palette = Math.max(0, Math.min(4, Math.round(Number(p.exhaustPalette ?? 0))));
      const core = clamp(Number(p.exhaustCoreScale ?? 1), 0, 2.5);
      const glow = clamp(Number(p.exhaustGlowScale ?? 1), 0, 2.5);
      const key = `${palette}:${core.toFixed(2)}:${glow.toFixed(2)}`;
      if (key === exhaustSpritesCacheKey && exhaustSpritesCache) return exhaustSpritesCache;

      const makeRadialSprite = (sizePx, stops) => {
        const c = document.createElement("canvas");
        c.width = sizePx;
        c.height = sizePx;
        const g = c.getContext("2d");
        if (!g) return null;
        const cx = sizePx * 0.5;
        const cy = sizePx * 0.5;
        const r = sizePx * 0.5;
        const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
        for (const s of stops) grad.addColorStop(s[0], s[1]);
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
            sparkOuter: [120, 200, 255],
          };
        }
        if (palette === 2) {
          return {
            flameMid: [215, 150, 255],
            flameOuter: [165, 85, 255],
            sparkMid: [240, 210, 255],
            sparkOuter: [210, 160, 255],
          };
        }
        if (palette === 3) {
          return {
            flameMid: [170, 255, 190],
            flameOuter: [70, 255, 150],
            sparkMid: [215, 255, 230],
            sparkOuter: [140, 255, 200],
          };
        }
        if (palette === 4) {
          return {
            flameMid: [255, 165, 140],
            flameOuter: [255, 85, 70],
            sparkMid: [255, 230, 220],
            sparkOuter: [255, 170, 150],
          };
        }
        return {
          flameMid: [255, 190, 125],
          flameOuter: [255, 120, 70],
          sparkMid: [255, 230, 200],
          sparkOuter: [255, 200, 125],
        };
      })();

      const flame = makeRadialSprite(64, [
        [0.0, `rgba(255,255,255,${clamp(0.95 * core, 0, 1).toFixed(3)})`],
        [0.12, `rgba(255,245,220,${clamp(0.90 * core, 0, 1).toFixed(3)})`],
        [0.30, `rgba(${pal.flameMid[0]},${pal.flameMid[1]},${pal.flameMid[2]},${clamp(0.55 * glow, 0, 1).toFixed(3)})`],
        [0.58, `rgba(${pal.flameOuter[0]},${pal.flameOuter[1]},${pal.flameOuter[2]},${clamp(0.22 * glow, 0, 1).toFixed(3)})`],
        [1.0, "rgba(0,0,0,0.00)"],
      ]);
      const spark = makeRadialSprite(48, [
        [0.0, `rgba(255,255,255,${clamp(0.95 * core, 0, 1).toFixed(3)})`],
        [0.22, `rgba(${pal.sparkMid[0]},${pal.sparkMid[1]},${pal.sparkMid[2]},${clamp(0.85 * core, 0, 1).toFixed(3)})`],
        [0.60, `rgba(${pal.sparkOuter[0]},${pal.sparkOuter[1]},${pal.sparkOuter[2]},${clamp(0.22 * glow, 0, 1).toFixed(3)})`],
        [1.0, "rgba(0,0,0,0.00)"],
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
    if (!star) return;

    const halfW = state.world.w / 2;
    const halfH = state.world.h / 2;
    const b = Number(star.boundary) || 0;
    const safeDir = star.dir === 1 ? 1 : -1;
    const arcAmp = clamp(Math.min(halfW, halfH) * 0.06, 18, 80);
    const segs = 34;
    const seed = fnv1aSeed(`red-giant:${star.edge}`);
    const shimmerPhase = (seed % 1000) * 0.001 * Math.PI * 2;
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
    // "Sun material" fill behind the boundary (unsafe region).
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
      for (let i = curve.length - 1; i >= 0; i--) ctx.lineTo(curve[i].x, curve[i].y);
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
      for (let i = curve.length - 1; i >= 0; i--) ctx.lineTo(curve[i].x, curve[i].y);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function drawTechPing(ctx) {
    const ping = state.round?.techPing;
    if (!ping) return;
    const origin = ping.origin;
    if (!origin) return;

    const r = Math.max(0, Number(ping.radius) || 0);
    const thickness = clamp(Number(state.params.techPingThicknessPx ?? 22), 4, 240);
    const wave = 0.5 + 0.5 * Math.sin(state.time * 6.2);

    ctx.save();
    ctx.translate(Number(origin.x) || 0, Number(origin.y) || 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = "rgba(215,150,255,0.95)";
    ctx.shadowBlur = clamp(thickness * 0.8, 10, 28);
    ctx.strokeStyle = `rgba(215,150,255,${(0.10 + wave * 0.10).toFixed(3)})`;
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
    if (!star) return;

    const halfW = state.world.w / 2;
    const halfH = state.world.h / 2;
    const b = Number(star.boundary) || 0;
    const bandW = clamp(Number(state.params.starSafeBufferPx ?? 320), 80, Math.min(state.world.w, state.world.h));
    const safeDir = star.dir === 1 ? 1 : -1;
    const arcAmp = clamp(Math.min(halfW, halfH) * 0.06, 18, 80);
    const segs = 34;
    const seed = fnv1aSeed(`red-giant:${star.edge}`);
    const shimmerPhase = (seed % 1000) * 0.001 * Math.PI * 2;
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

    // Gradient band that bleeds into the safe zone.
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
    for (let i = 1; i < curve0.length; i++) ctx.lineTo(curve0[i].x, curve0[i].y);
    for (let i = curve1.length - 1; i >= 0; i--) ctx.lineTo(curve1[i].x, curve1[i].y);
    ctx.closePath();
    ctx.fill();

    // Boundary line (bright + warm). Multi-stroke so it reads less "solid".
    ctx.globalCompositeOperation = "lighter";
    const flicker = 0.5 + 0.5 * Math.sin(state.time * 5.1 + shimmerPhase * 1.7);
    ctx.shadowColor = "rgba(255,120,70,0.95)";
    ctx.shadowBlur = lerp(16, 26, flicker);

    ctx.strokeStyle = `rgba(255,170,150,${(0.50 + flicker * 0.18).toFixed(3)})`;
    ctx.lineWidth = lerp(12, 16, flicker);
    ctx.beginPath();
    ctx.moveTo(curve0[0].x, curve0[0].y);
    for (let i = 1; i < curve0.length; i++) ctx.lineTo(curve0[i].x, curve0[i].y);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(255,245,230,${(0.18 + flicker * 0.12).toFixed(3)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(curve0[0].x, curve0[0].y);
    for (let i = 1; i < curve0.length; i++) ctx.lineTo(curve0[i].x, curve0[i].y);
    ctx.stroke();

    ctx.restore();
  }

  function drawJumpGate(ctx) {
    const gate = state.round?.gate;
    if (!gate) return;

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
      180,
    );
    const segCount = 4;
    const segSpan = (Math.PI * 2) / segCount;
    const segInset = segSpan * 0.08;
    const slotInnerR = slotR * 0.62;

    ctx.save();
    ctx.translate(gate.pos.x, gate.pos.y);

    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgbToRgba(baseRgb, active ? 0.34 : 0.26);
    const ringW = clamp(gate.radius * 0.12, 12, 30);
    ctx.lineWidth = active ? ringW * 1.15 : charging ? ringW * 1.05 : ringW;
    ctx.shadowColor = rgbToRgba(baseRgb, 0.85);
    ctx.shadowBlur = active
      ? clamp(gate.radius * 0.22, 20, 46)
      : charging
        ? clamp(gate.radius * 0.2, 18, 44)
        : clamp(gate.radius * 0.18, 18, 40);
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

    // Portal part slots: same shape/size as the parts. Empty slots are outline-only.
    const slotDist = gate.radius + slotR * 0.62 + ringW * 0.15;
    for (let i = 0; i < total; i++) {
      const ang = -Math.PI / 2 + (i / total) * Math.PI * 2;
      const px = Math.cos(ang) * slotDist;
      const py = Math.sin(ang) * slotDist;
      const filled = !!slots[i];
      const t = active ? 0.65 : 0.4;

      ctx.save();
      ctx.translate(px, py);
      // Orient the wedge so its center points outward along the slot angle.
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

    // Subtle inner shimmer when active.
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

    // Optional readability label (world-space).
    ctx.fillStyle = "rgba(231,240,255,0.70)";
    ctx.font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      active ? "GATE ACTIVE" : charging ? `CHARGING ${(chargeT * 100).toFixed(0)}%` : `${installed}/${total}`,
      0,
      gate.radius + slotR * 1.55,
    );

    ctx.restore();
  }

  function drawTechPart(ctx, part, { carried = false } = {}) {
    if (!part) return;
    const r = clamp(Number(part.radius) || 12, 4, 180);
    const seed = fnv1aSeed(part.id);
    const phase = (seed % 1000) * 0.001 * Math.PI * 2;
    const spin = phase + state.time * (carried ? 2.2 : 1.6);
    const coreRgb = carried ? [231, 240, 255] : [215, 150, 255];
    const index = Number(String(part.id).split("-").pop() || 0) || 0;
    const segCount = 4;
    const segSpan = (Math.PI * 2) / segCount;
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

    // Simple "tech" details (grooves + bolts), deterministic per id.
    const detail = clamp((seed % 1000) / 1000, 0, 1);
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
    if (!Array.isArray(parts) || parts.length === 0) return;
    for (const part of parts) {
      if (!part) continue;
      if (part.state === "dropped") drawTechPart(ctx, part, { carried: false });
      else if (part.state === "carried") drawTechPart(ctx, part, { carried: true });
    }
  }

  function drawForcefieldRings(ctx) {
    if (state.mode !== "playing") return;

    // Force field ring (where collected asteroids stick).
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
      // Quick KISS blast feedback: white-hot ring + faint red ring.
      ctx.strokeStyle = `rgba(255,255,255,${lerp(0.0, 0.85, pulse).toFixed(3)})`;
      ctx.lineWidth = lerp(2, 6, pulse);
      ctx.beginPath();
      ctx.arc(state.ship.pos.x, state.ship.pos.y, fieldR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255,89,100,${lerp(0.0, 0.55, pulse).toFixed(3)})`;
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

    // Debug-only attraction radius.
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

  function drawAsteroid(ctx, a, { tier, ship }) {
    const canShowForTier = Array.isArray(tier.attractSizes) ? tier.attractSizes.includes(a.size) : false;
    const showPullFx = state.mode === "playing" && canShowForTier && !a.attached && !a.shipLaunched;
    const pullFx = showPullFx ? clamp(a.pullFx ?? 0, 0, 1) : 0;

    if (pullFx > 0.01) {
      const visScale = pullFxVisualScaleForTier(tier.key);
      const fieldR = currentForceFieldRadius();
      const outward = sub(a.pos, ship.pos);
      const outwardLen = Math.max(1e-6, len(outward));
      const ringPoint = add(ship.pos, mul(outward, fieldR / outwardLen));
      const seed = fnv1aSeed(a.id);
      const lineCount = pullTetherLineCountForSize(a.size);
      const tether = sub(ringPoint, a.pos);
      const tetherLen = Math.max(1e-6, len(tether));
      const perp = { x: -tether.y / tetherLen, y: tether.x / tetherLen };
      const lineSpread =
        lineCount > 1 ? lerp(2.2, 3.6, Math.min(1, (lineCount - 2) / 4)) * visScale.spread : 0;
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
          wobbleScale: visScale.wobble,
        });
      }

      // Soft glow around the asteroid.
      const stackScale = lineCount > 1 ? lerp(1, 0.7, Math.min(1, (lineCount - 1) / 4)) : 1;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = rgbToRgba(tier.ringRgb, lerp(0.05, 0.35, pullFx) * stackScale * visScale.alpha);
      ctx.lineWidth = lerp(2, 7, pullFx) * stackScale * visScale.thickness;
      ctx.shadowColor = rgbToRgba(tier.ringRgb, 0.9);
      ctx.shadowBlur = lerp(3, 14, pullFx) * stackScale * visScale.thickness;
      drawPolyline(ctx, a.shape, a.pos.x, a.pos.y, a.rot, ctx.strokeStyle, ctx.lineWidth);
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
      drawPolyline(ctx, a.shape, a.pos.x, a.pos.y, a.rot, `rgba(215,150,255,${alpha.toFixed(3)})`, lerp(4, 9, intensity));
      ctx.restore();
    }

    const starHeat = clamp(Number(a.starHeat) || 0, 0, 1);
    if (starHeat > 1e-3) {
      const hotRgb = lerpRgb([255, 130, 80], [255, 255, 255], clamp(starHeat * starHeat, 0, 1));
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.shadowColor = rgbToRgba([255, 120, 70], 0.9);
      ctx.shadowBlur = lerp(6, 24, starHeat);
      ctx.strokeStyle = rgbToRgba(hotRgb, 0.06 + 0.22 * starHeat);
      ctx.lineWidth = lerp(2, 9, starHeat);
      drawPolyline(ctx, a.shape, a.pos.x, a.pos.y, a.rot, ctx.strokeStyle, ctx.lineWidth);
      ctx.restore();
    }

    const base =
      a.size === "xxlarge"
        ? "rgba(231,240,255,0.62)"
        : a.size === "xlarge"
          ? "rgba(231,240,255,0.68)"
          : a.size === "large"
            ? "rgba(231,240,255,0.74)"
            : a.size === "med"
              ? "rgba(231,240,255,0.80)"
              : "rgba(231,240,255,0.88)";
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
    drawPolyline(ctx, a.shape, a.pos.x, a.pos.y, a.rot, color, 2, "rgba(0,0,0,0.92)");
  }

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
      // SVG path support for easy future ship replacement.
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
      if (mirrorX) ctx.scale(-1, 1);
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
      if (hullRadius > 1e-6) drawScale = shipRadius / hullRadius;
      ctx.save();
      ctx.scale(drawScale, drawScale);
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
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
    // World-space rendering: camera position maps to screen center with zoom.
    const zoom = Math.max(0.1, state.camera.zoom || 1);
    ctx.translate(w * 0.5, h * 0.5);
    ctx.scale(zoom, zoom);
    ctx.translate(-state.camera.x, -state.camera.y);

    // Arena edge (phase LA-06 first pass): simple boundary line.
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.26)";
    ctx.lineWidth = 2;
    ctx.strokeRect(-state.world.w / 2, -state.world.h / 2, state.world.w, state.world.h);
    ctx.restore();

    drawRedGiantUnderlay(ctx);
    drawTechPing(ctx);

    // Asteroid sorting: draw non-attached first (behind), then the forcefield ring,
    // then attached asteroids so the "trapped" rocks always read as in front.
    const tier = currentShipTier();
    const ship = state.ship;
    for (const a of state.asteroids) {
      if (a.attached) continue;
      drawAsteroid(ctx, a, { tier, ship });
    }

    drawForcefieldRings(ctx);

    for (const a of state.asteroids) {
      if (!a.attached) continue;
      drawAsteroid(ctx, a, { tier, ship });
    }

    drawJumpGate(ctx);

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

    drawTechParts(ctx);
    drawRedGiantOverlay(ctx);

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

    let waveletCrowd = 0;
    for (const e of state.effects) {
      if (e.kind === "wavelets") waveletCrowd++;
    }

    // Effects pass 1: burst wavelets (batch state changes once for perf).
    if (waveletCrowd > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      for (const e of state.effects) {
        if (e.kind !== "wavelets") continue;
        drawBurstWaveletsEffect(ctx, e, waveletCrowd);
      }
      ctx.restore();
    }

    // Effects pass 2: KISS explosions.
    for (const e of state.effects) {
      if (e.kind === "wavelets") continue;
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

    drawExhaustParticles(ctx, state.exhaust, getExhaustSprites(), state.time);
    const thrusting =
      state.mode === "playing" && (state.input.up || (Number(state.input?.thrustAnalog ?? 0) > 0.02));
    drawShipModel(ctx, state.ship, thrusting);

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
      const gateLine =
        gate && totalSlots > 0
          ? `Gate: ${installed}/${totalSlots}${gate.active ? " ACTIVE" : ""}   Carry: ${state.round.carriedPartId || "—"}`
          : "";
      const starLine = star ? `Star: ${String(star.edge).toUpperCase()}` : "";
      ctx.fillText(
        `Tier: ${currentShipTier().label}   Attached: ${attached}   S:${small} M:${med} L:${large} XL:${xlarge} XXL:${xxlarge}   Gems: ${state.progression.gemScore}   Score: ${state.score}`,
        14,
        18,
      );
      if (gateLine) ctx.fillText(gateLine, 14, 34);
      if (starLine) ctx.fillText(starLine, 14, 50);
    } else if (state.mode === "gameover") {
      // Game-over overlay: clearer restart prompt without requiring the debug menu.
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
      if (outcomeReason) ctx.fillText(`Reason: ${outcomeReason}`, w * 0.5, h * 0.5 - 4);
      ctx.fillText("Press R or click to restart", w * 0.5, h * 0.5 + 18);

      ctx.fillStyle = "rgba(231,240,255,0.70)";
      ctx.fillText("Press M for debug/tuning", w * 0.5, h * 0.5 + 46);
      ctx.restore();
    }
    ctx.restore();
  }


  return {
    render,
  };
}
