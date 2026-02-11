import test from "node:test";
import assert from "node:assert/strict";

import { createEngine } from "../src/engine/createEngine.js";
import { asteroidMassForRadius, asteroidRadiusForSize } from "../src/util/asteroid.js";

function runDeterministicScenario(engine) {
  engine.startGame();
  for (let i = 0; i < 20; i++) engine.update(1 / 60);

  engine.state.input.up = true;
  for (let i = 0; i < 35; i++) engine.update(1 / 60);
  engine.state.input.up = false;

  engine.state.input.left = true;
  for (let i = 0; i < 15; i++) engine.update(1 / 60);
  engine.state.input.left = false;

  for (let i = 0; i < 25; i++) engine.update(1 / 60);
  return engine.renderGameToText();
}

function makeTestAsteroid(engine, { id, size, x, y, vx = 0, vy = 0 }) {
  const radius = asteroidRadiusForSize(engine.state.params, size);
  return {
    id,
    size,
    pos: { x, y },
    vel: { x: vx, y: vy },
    radius,
    mass: asteroidMassForRadius(radius),
    rot: 0,
    rotVel: 0,
    shape: [{ a: 0, r: radius }],
    attached: false,
    shipLaunched: false,
    orbitA: 0,
    fractureCooldownT: 0,
    hitFxT: 0,
    pullFx: 0,
  };
}

test("engine output is deterministic for identical timelines", () => {
  const a = createEngine({ width: 1280, height: 720 });
  const b = createEngine({ width: 1280, height: 720 });
  const outA = runDeterministicScenario(a);
  const outB = runDeterministicScenario(b);
  assert.equal(outA, outB);
});

test("arena config clamps world scale and sets camera mode", () => {
  const engine = createEngine({ width: 1000, height: 700 });
  engine.startGame();

  engine.setArenaConfig({ cameraMode: "deadzone", worldScale: 0.25 });
  assert.equal(engine.state.camera.mode, "deadzone");
  assert.equal(engine.state.world.scale, 1);

  engine.setArenaConfig({ cameraMode: "centered", worldScale: 42 });
  assert.equal(engine.state.camera.mode, "centered");
  assert.equal(engine.state.world.scale, 10);
});

test("renderGameToText payload stays parseable and includes core fields", () => {
  const engine = createEngine({ width: 900, height: 540 });
  engine.startGame();
  for (let i = 0; i < 30; i++) engine.update(1 / 60);

  const payload = JSON.parse(engine.renderGameToText());
  assert.equal(payload.mode, "playing");
  assert.ok(payload.ship && typeof payload.ship.x === "number");
  assert.ok(payload.counts && typeof payload.counts.small === "number");
  assert.ok(payload.world && typeof payload.world.w === "number");
  assert.ok(Array.isArray(payload.sample_asteroids));
});

test("setShipSvgRenderer accepts custom path and can restore defaults", () => {
  const engine = createEngine({ width: 800, height: 600 });
  const setOk = engine.setShipSvgRenderer("small", "M 0 0 L 1 0 L 0 1 Z", 2);
  const resetOk = engine.setShipSvgRenderer("small", "");
  assert.equal(setOk, true);
  assert.equal(resetOk, false);
});

test("medium tier radius is increased to 57", () => {
  const engine = createEngine({ width: 800, height: 600 });
  engine.startGame();
  engine.state.settings.tierOverrideEnabled = true;
  engine.state.settings.tierOverrideIndex = 2;
  engine.refreshProgression({ animateZoom: false });
  assert.equal(engine.state.ship.tier, "medium");
  assert.equal(engine.state.ship.radius, 57);
});

test("medium tier applies pullFx to nearby medium asteroids", () => {
  const engine = createEngine({ width: 1280, height: 720 });
  engine.startGame();
  engine.state.settings.tierOverrideEnabled = true;
  engine.state.settings.tierOverrideIndex = 2;
  engine.refreshProgression({ animateZoom: false });

  engine.state.ship.pos = { x: 0, y: 0 };
  engine.state.ship.vel = { x: 0, y: 0 };
  const med = makeTestAsteroid(engine, { id: "pull-med", size: "med", x: 180, y: 0 });
  engine.state.asteroids = [med];

  engine.update(1 / 60);
  assert.ok(engine.state.asteroids[0].pullFx > 0, "expected medium asteroid pullFx > 0 for medium ship");
});

test("large tier applies pullFx to nearby large asteroids", () => {
  const engine = createEngine({ width: 1280, height: 720 });
  engine.startGame();
  engine.state.settings.tierOverrideEnabled = true;
  engine.state.settings.tierOverrideIndex = 3;
  engine.refreshProgression({ animateZoom: false });

  engine.state.ship.pos = { x: 0, y: 0 };
  engine.state.ship.vel = { x: 0, y: 0 };
  const large = makeTestAsteroid(engine, { id: "pull-large", size: "large", x: 250, y: 0 });
  engine.state.asteroids = [large];

  engine.update(1 / 60);
  assert.ok(engine.state.asteroids[0].pullFx > 0, "expected large asteroid pullFx > 0 for large ship");
});

test("non-attractable asteroid sizes do not gain pullFx", () => {
  const engine = createEngine({ width: 1280, height: 720 });
  engine.startGame();
  engine.state.settings.tierOverrideEnabled = true;
  engine.state.settings.tierOverrideIndex = 2;
  engine.refreshProgression({ animateZoom: false });

  engine.state.ship.pos = { x: 0, y: 0 };
  engine.state.ship.vel = { x: 0, y: 0 };
  const large = makeTestAsteroid(engine, { id: "no-pull-large", size: "large", x: 180, y: 0 });
  engine.state.asteroids = [large];

  engine.update(1 / 60);
  assert.equal(engine.state.asteroids[0].pullFx, 0);
});

function launchSpeedForTier(tierIndex) {
  const engine = createEngine({ width: 1280, height: 720 });
  engine.startGame();
  engine.state.settings.tierOverrideEnabled = true;
  engine.state.settings.tierOverrideIndex = tierIndex;
  engine.refreshProgression({ animateZoom: false });
  engine.state.ship.pos = { x: 0, y: 0 };
  engine.state.ship.vel = { x: 0, y: 0 };
  engine.state.ship.angle = 0;

  const a = makeTestAsteroid(engine, { id: `attached-${tierIndex}`, size: "small", x: 0, y: 0 });
  a.attached = true;
  a.orbitA = 0;
  engine.state.asteroids = [a];

  engine.state.input.burst = true;
  engine.update(1 / 60);
  const launched = engine.state.asteroids[0];
  return Math.hypot(launched.vel.x, launched.vel.y);
}

test("burst launch force scales up with ship tier", () => {
  const smallLaunch = launchSpeedForTier(1);
  const mediumLaunch = launchSpeedForTier(2);
  const largeLaunch = launchSpeedForTier(3);
  assert.ok(mediumLaunch > smallLaunch, "expected medium tier burst speed > small tier");
  assert.ok(largeLaunch > mediumLaunch, "expected large tier burst speed > medium tier");
});

test("launched small can fracture co-moving medium target", () => {
  const engine = createEngine({ width: 1280, height: 720 });
  engine.startGame();
  engine.state.settings.tierOverrideEnabled = true;
  engine.state.settings.tierOverrideIndex = 2;
  engine.refreshProgression({ animateZoom: false });
  engine.state.ship.pos = { x: -1000, y: 0 };
  engine.state.ship.vel = { x: 0, y: 0 };
  const p = engine.state.params;
  const mk = (id, size, x, y, vx, vy, launched) => {
    const radius = asteroidRadiusForSize(p, size);
    return {
      id,
      size,
      pos: { x, y },
      vel: { x: vx, y: vy },
      radius,
      mass: asteroidMassForRadius(radius),
      rot: 0,
      rotVel: 0,
      shape: [{ a: 0, r: radius }],
      attached: false,
      shipLaunched: launched,
      orbitA: 0,
      fractureCooldownT: 0,
      hitFxT: 0,
      pullFx: 0,
    };
  };

  // Co-moving overlap: low relative speed but high launched projectile speed.
  const projectile = mk("proj-small", "small", 0, 0, 520, 0, true);
  const target = mk("target-med", "med", 26, 0, 490, 0, false);
  engine.state.asteroids = [projectile, target];

  engine.update(1 / 60);
  const mediumCount = engine.state.asteroids.filter((a) => a.size === "med").length;
  assert.equal(mediumCount, 0, "expected medium target to fracture under co-moving launched impact");
});

test("launched medium fractures medium target at moderate speed", () => {
  const engine = createEngine({ width: 1280, height: 720 });
  engine.startGame();
  engine.state.settings.tierOverrideEnabled = true;
  engine.state.settings.tierOverrideIndex = 2;
  engine.refreshProgression({ animateZoom: false });
  engine.state.ship.pos = { x: -1000, y: 0 };
  engine.state.ship.vel = { x: 0, y: 0 };
  const p = engine.state.params;
  const mk = (id, size, x, y, vx, vy, launched) => {
    const radius = asteroidRadiusForSize(p, size);
    return {
      id,
      size,
      pos: { x, y },
      vel: { x: vx, y: vy },
      radius,
      mass: asteroidMassForRadius(radius),
      rot: 0,
      rotVel: 0,
      shape: [{ a: 0, r: radius }],
      attached: false,
      shipLaunched: launched,
      orbitA: 0,
      fractureCooldownT: 0,
      hitFxT: 0,
      pullFx: 0,
    };
  };

  const projectile = mk("proj-med", "med", 0, 0, 300, 0, true);
  const target = mk("target-med", "med", 52, 0, 0, 0, false);
  engine.state.asteroids = [projectile, target];

  engine.update(1 / 60);
  const mediumCount = engine.state.asteroids.filter((a) => a.size === "med").length;
  assert.equal(mediumCount, 1, "expected one medium (projectile) remaining after target fractures into smalls");
  const smallCount = engine.state.asteroids.filter((a) => a.size === "small").length;
  assert.ok(smallCount >= 2, "expected medium target to fracture into small asteroids");
});

test("launched medium fractures large target at moderate speed", () => {
  const engine = createEngine({ width: 1280, height: 720 });
  engine.startGame();
  engine.state.settings.tierOverrideEnabled = true;
  engine.state.settings.tierOverrideIndex = 2;
  engine.refreshProgression({ animateZoom: false });
  engine.state.ship.pos = { x: -1000, y: 0 };
  engine.state.ship.vel = { x: 0, y: 0 };
  const p = engine.state.params;
  const mk = (id, size, x, y, vx, vy, launched) => {
    const radius = asteroidRadiusForSize(p, size);
    return {
      id,
      size,
      pos: { x, y },
      vel: { x: vx, y: vy },
      radius,
      mass: asteroidMassForRadius(radius),
      rot: 0,
      rotVel: 0,
      shape: [{ a: 0, r: radius }],
      attached: false,
      shipLaunched: launched,
      orbitA: 0,
      fractureCooldownT: 0,
      hitFxT: 0,
      pullFx: 0,
    };
  };

  const projectile = mk("proj-med", "med", 0, 0, 420, 0, true);
  const target = mk("target-large", "large", 80, 0, 0, 0, false);
  engine.state.asteroids = [projectile, target];

  engine.update(1 / 60);
  const largeCount = engine.state.asteroids.filter((a) => a.size === "large").length;
  assert.equal(largeCount, 0, "expected large target to fracture under moderate launched-medium impact");
  const mediumCount = engine.state.asteroids.filter((a) => a.size === "med").length;
  assert.ok(mediumCount >= 2, "expected large target to fracture into medium asteroids");
});
