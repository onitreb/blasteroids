export function angleToVec(radians) {
  return { x: Math.cos(radians), y: Math.sin(radians) };
}

export function angleOf(v) {
  return Math.atan2(v.y, v.x);
}

export function wrapAngle(a) {
  while (a <= -Math.PI) a += Math.PI * 2;
  while (a > Math.PI) a -= Math.PI * 2;
  return a;
}

