import test from "node:test";
import assert from "node:assert/strict";

import { angleOf, angleToVec, wrapAngle } from "../src/util/angle.js";
import { circleCollide, circleHit } from "../src/util/collision.js";
import { clamp, lerp, posMod } from "../src/util/math.js";
import { seededRng } from "../src/util/rng.js";
import { add, dot, len, len2, mul, norm, rot, sub, vec } from "../src/util/vec2.js";

function near(actual, expected, epsilon = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} ~= ${expected}`);
}

test("math helpers clamp/lerp/posMod", () => {
  assert.equal(clamp(10, 0, 5), 5);
  assert.equal(clamp(-2, 0, 5), 0);
  assert.equal(clamp(3, 0, 5), 3);

  near(lerp(10, 30, 0.25), 15);
  near(lerp(-10, 10, 0.5), 0);

  assert.equal(posMod(5, 4), 1);
  assert.equal(posMod(-1, 4), 3);
});

test("vec2 helpers", () => {
  const a = vec(3, 4);
  const b = vec(-2, 5);

  assert.deepEqual(add(a, b), { x: 1, y: 9 });
  assert.deepEqual(sub(a, b), { x: 5, y: -1 });
  assert.deepEqual(mul(a, 2), { x: 6, y: 8 });
  assert.equal(dot(a, b), 14);
  assert.equal(len2(a), 25);
  near(len(a), 5);

  const n = norm(vec(10, 0));
  near(n.x, 1);
  near(n.y, 0);

  const r = rot(vec(1, 0), Math.PI / 2);
  near(r.x, 0);
  near(r.y, 1);
});

test("angle helpers", () => {
  const v = angleToVec(Math.PI / 2);
  near(v.x, 0);
  near(v.y, 1);
  near(angleOf(v), Math.PI / 2);
  near(wrapAngle(Math.PI * 3), Math.PI);
  near(wrapAngle(-Math.PI * 3), Math.PI);
});

test("seededRng is deterministic for same seed", () => {
  const a = seededRng(0x1234abcd);
  const b = seededRng(0x1234abcd);
  for (let i = 0; i < 20; i++) {
    near(a(), b(), 0);
  }
});

test("circle collision helpers", () => {
  const a = { pos: vec(0, 0), radius: 10 };
  const b = { pos: vec(15, 0), radius: 6 };
  const c = { pos: vec(40, 0), radius: 6 };

  assert.equal(circleHit(a, b), true);
  assert.equal(circleHit(a, c), false);

  const hit = circleCollide(a, b);
  assert.ok(hit);
  near(hit.n.x, 1);
  near(hit.n.y, 0);
  near(hit.penetration, 1);
  near(hit.dist, 15);

  assert.equal(circleCollide(a, c), null);
});
