export function polygonHullRadius(points) {
  if (!Array.isArray(points) || points.length === 0) return 0;
  let max2 = 0;
  for (const p of points) {
    const d2 = p.x * p.x + p.y * p.y;
    if (d2 > max2) max2 = d2;
  }
  return Math.sqrt(max2);
}
