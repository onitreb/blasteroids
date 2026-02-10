import { len2, mul, sub } from "./vec2.js";

export function circleHit(a, b) {
  const d2 = len2(sub(a.pos, b.pos));
  const r = a.radius + b.radius;
  return d2 <= r * r;
}

export function circleCollide(a, b) {
  const delta = sub(b.pos, a.pos);
  const dist2 = len2(delta);
  const minDist = a.radius + b.radius;
  if (dist2 <= 1e-9 || dist2 >= minDist * minDist) return null;
  const dist = Math.sqrt(dist2);
  const n = mul(delta, 1 / dist);
  return { n, dist, penetration: minDist - dist };
}
