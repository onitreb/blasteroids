export function vec(x = 0, y = 0) {
  return { x, y };
}

export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function mul(a, s) {
  return { x: a.x * s, y: a.y * s };
}

export function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

export function len2(a) {
  return a.x * a.x + a.y * a.y;
}

export function len(a) {
  return Math.sqrt(len2(a));
}

export function norm(a) {
  const l = len(a);
  if (l <= 1e-9) return { x: 0, y: 0 };
  return { x: a.x / l, y: a.y / l };
}

export function rot(a, radians) {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  return { x: a.x * c - a.y * s, y: a.x * s + a.y * c };
}

