import test from "node:test";
import assert from "node:assert/strict";

import {
  attachedAsteroidColorForTierRgb,
  pullFxVisualScaleForTier,
  pullTetherLineCountForSize,
} from "../src/render/renderGame.js";

test("pull tether line count scales by asteroid size rank", () => {
  assert.equal(pullTetherLineCountForSize("small"), 1);
  assert.equal(pullTetherLineCountForSize("med"), 2);
  assert.equal(pullTetherLineCountForSize("large"), 3);
  assert.equal(pullTetherLineCountForSize("xlarge"), 4);
  assert.equal(pullTetherLineCountForSize("xxlarge"), 5);
});

test("attached asteroid color is derived from ring rgb", () => {
  assert.equal(attachedAsteroidColorForTierRgb([92, 235, 255]), "rgba(92,235,255,0.950)");
  assert.equal(attachedAsteroidColorForTierRgb([255, 112, 127]), "rgba(255,112,127,0.950)");
});

test("pull visual scale increases by tier for readability", () => {
  const small = pullFxVisualScaleForTier("small");
  const medium = pullFxVisualScaleForTier("medium");
  const large = pullFxVisualScaleForTier("large");
  assert.ok(medium.thickness > small.thickness);
  assert.ok(large.thickness > medium.thickness);
  assert.ok(medium.alpha > small.alpha);
  assert.ok(large.alpha > medium.alpha);
});
