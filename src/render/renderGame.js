import { clamp, lerp, posMod } from "../util/math.js";
import { angleOf } from "../util/angle.js";
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

function drawElectricTether(ctx, from, to, rgb, intensity, timeSec, seedBase) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (!Number.isFinite(dist) || dist < 2) return;
  const inv = 1 / dist;
  const nx = -dy * inv;
  const ny = dx * inv;
  const segs = clamp(Math.round(dist / 22), 4, 12);
  const amp = lerp(1.5, 9.0, intensity);
  const phase = timeSec * 18;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  // Soft glow pass.
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
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Bright core pass with flowing dash.
  ctx.shadowBlur = 0;
  ctx.setLineDash([8, 12]);
  ctx.lineDashOffset = -timeSec * lerp(40, 110, intensity);
  ctx.strokeStyle = rgbToRgba(rgb, lerp(0.05, 0.9, intensity));
  ctx.lineWidth = lerp(1, 2.5, intensity);
  ctx.stroke();

  ctx.restore();
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / Math.max(1e-6, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
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
  const many = waveletCrowd >= 18;
  const extreme = waveletCrowd >= 30;
  if (extreme && (e.seed ?? 0) % 2 !== 0) return;

  // These live just outside the forcefield surface (anchored at e.x/e.y) and do NOT move with the asteroid.
  // They should read as ripples on the surface, not rocket exhaust.
  const waves = many ? 3 : 4;
  const gap = many ? 11 : 12;
  const arcSpan = many ? 0.5 : 0.56;
  const arcR = many ? 12 : 13;
  const bandStart = many ? 10 : 12;
  const distFade = smoothstep(0, 18, travelDist);
  const aBase = (many ? 0.3 : 0.36) * baseFade * distFade;

  const rgb = Array.isArray(e.rgb) ? e.rgb : [255, 221, 88];
  const doGlow = !many;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

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
      ctx.shadowColor = rgbToRgba(rgb, 0.9);
      ctx.shadowBlur = 8;
      ctx.strokeStyle = rgbToRgba(rgb, a * 0.28);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, arcR, a0, a1);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgbToRgba(rgb, a);
    ctx.lineWidth = 2.25;
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, a0, a1);
    ctx.stroke();
  }

  ctx.restore();
}

function gemRgb(kind) {
  if (kind === "gold") return [255, 221, 88];
  if (kind === "diamond") return [86, 183, 255];
  if (kind === "ruby") return [255, 89, 100];
  return [84, 240, 165];
}

export function createRenderer(engine) {
  const state = engine.state;
  const currentShipTier = () => engine.getCurrentShipTier();
  const currentForceFieldRadius = () => engine.getCurrentForceFieldRadius();
  const currentAttractRadius = () => engine.getCurrentAttractRadius();
  const svgPathCache = new Map();

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
    const showPullFx =
      state.mode === "playing" && tier.key === "small" && a.size === "small" && !a.attached && !a.shipLaunched;
    const pullFx = showPullFx ? clamp(a.pullFx ?? 0, 0, 1) : 0;

    if (pullFx > 0.01) {
      const fieldR = currentForceFieldRadius();
      const outward = sub(a.pos, ship.pos);
      const outwardLen = Math.max(1e-6, len(outward));
      const ringPoint = add(ship.pos, mul(outward, fieldR / outwardLen));
      const seed = fnv1aSeed(a.id);
      drawElectricTether(ctx, a.pos, ringPoint, tier.ringRgb, pullFx, state.time, seed);

      // Soft glow around the asteroid.
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = rgbToRgba(tier.ringRgb, lerp(0.05, 0.35, pullFx));
      ctx.lineWidth = lerp(2, 7, pullFx);
      ctx.shadowColor = rgbToRgba(tier.ringRgb, 0.9);
      ctx.shadowBlur = lerp(3, 14, pullFx);
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
    let color = a.attached ? "rgba(255,221,88,0.95)" : base;
    if (pullFx > 0.01) {
      const baseRgb = [231, 240, 255];
      const mixed = lerpRgb(baseRgb, tier.ringRgb, pullFx);
      const aAlpha = lerp(0.78, 0.98, pullFx);
      color = rgbToRgba(mixed, aAlpha);
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

    let waveletCrowd = 0;
    for (const e of state.effects) {
      if (e.kind === "wavelets") waveletCrowd++;
    }

    // Effects (KISS explosions + burst wavelets).
    for (const e of state.effects) {
      if (e.kind === "wavelets") {
        drawBurstWaveletsEffect(ctx, e, waveletCrowd);
        continue;
      }
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
        18,
      );
    } else if (state.mode === "gameover") {
      // Game-over overlay: clearer restart prompt without requiring the debug menu.
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, w, h);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillStyle = "rgba(255,89,100,0.96)";
      ctx.font = "700 52px ui-sans-serif, system-ui";
      ctx.fillText("GAME OVER", w * 0.5, h * 0.5 - 70);

      ctx.fillStyle = "rgba(231,240,255,0.92)";
      ctx.font = "16px ui-sans-serif, system-ui";
      ctx.fillText(`Score: ${state.score}`, w * 0.5, h * 0.5 - 26);
      ctx.fillText("Press R or click to restart", w * 0.5, h * 0.5 + 6);

      ctx.fillStyle = "rgba(231,240,255,0.70)";
      ctx.fillText("Press M for debug/tuning", w * 0.5, h * 0.5 + 34);
      ctx.restore();
    }
    ctx.restore();
  }


  return {
    render,
  };
}
