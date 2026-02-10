const ASTEROID_SPLIT_NEXT = {
  small: null,
  med: "small",
  large: "med",
  xlarge: "large",
  xxlarge: "xlarge",
};

const ASTEROID_SIZE_INDEX = {
  small: 0,
  med: 1,
  large: 2,
  xlarge: 3,
  xxlarge: 4,
};

export function asteroidSizeRank(size) {
  return ASTEROID_SIZE_INDEX[size] ?? 0;
}

export function asteroidNextSize(size) {
  return ASTEROID_SPLIT_NEXT[size] || null;
}

export function sizeSetHas(sizeSet, size) {
  return Array.isArray(sizeSet) ? sizeSet.includes(size) : false;
}

export function asteroidCanBreakTarget(projectileSize, targetSize) {
  const projectileRank = ASTEROID_SIZE_INDEX[projectileSize];
  const targetRank = ASTEROID_SIZE_INDEX[targetSize];
  if (!Number.isFinite(projectileRank) || !Number.isFinite(targetRank)) return false;
  // Rule: a launched asteroid can break same size, any smaller size, or one size larger.
  return targetRank <= projectileRank + 1;
}

export function asteroidRadiusForSize(params, size) {
  if (size === "xxlarge") return params.xxlargeRadius;
  if (size === "xlarge") return params.xlargeRadius;
  if (size === "large") return params.largeRadius;
  if (size === "med") return params.medRadius;
  return params.smallRadius;
}

export function asteroidMassForRadius(radius) {
  // 2D-ish: mass proportional to area.
  return Math.max(1, radius * radius);
}

export function asteroidSpawnWeightForSize(params, size) {
  if (size === "xxlarge") return Math.max(0, params.xxlargeCount);
  if (size === "xlarge") return Math.max(0, params.xlargeCount);
  if (size === "large") return Math.max(0, params.largeCount);
  if (size === "med") return Math.max(0, params.medCount);
  return Math.max(0, params.smallCount);
}

export function asteroidDamageSpeedForSize(params, size) {
  if (size === "xxlarge") return params.xxlargeDamageSpeedMin;
  if (size === "xlarge") return params.xlargeDamageSpeedMin;
  if (size === "large") return params.largeDamageSpeedMin;
  if (size === "med") return params.medDamageSpeedMin;
  return params.smallDamageSpeedMin;
}
