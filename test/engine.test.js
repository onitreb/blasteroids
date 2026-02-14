import test from "node:test";
import assert from "node:assert/strict";

import { createEngine } from "../src/engine/createEngine.js";
import { asteroidMassForRadius, asteroidRadiusForSize, asteroidSizeRank } from "../src/util/asteroid.js";

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

test("engine accepts a seed and reports it in renderGameToText", () => {
  const engine = createEngine({ width: 900, height: 540, seed: 123 });
  engine.startGame();
  const payload = JSON.parse(engine.renderGameToText());
  assert.equal(payload.round.seed, 123);
});

test("round spawns red giant and gate deterministically for the same seed", () => {
  const a = createEngine({ width: 900, height: 540, seed: 123 });
  const b = createEngine({ width: 900, height: 540, seed: 123 });
  a.startGame();
  b.startGame();

  const opposite = { left: "right", right: "left", top: "bottom", bottom: "top" };
  assert.equal(a.state.round.star.edge, b.state.round.star.edge);
  assert.equal(a.state.round.gate.edge, b.state.round.gate.edge);
  assert.equal(a.state.round.gate.edge, opposite[a.state.round.star.edge]);
  assert.equal(Math.round(a.state.round.gate.pos.x), Math.round(b.state.round.gate.pos.x));
  assert.equal(Math.round(a.state.round.gate.pos.y), Math.round(b.state.round.gate.pos.y));
});

test("red giant contact ends the round as a loss", () => {
  const engine = createEngine({ width: 900, height: 540, seed: 7 });
  engine.startGame();
  engine.state.ship.pos = { x: 0, y: 0 };
  engine.state.ship.vel = { x: 0, y: 0 };
  engine.state.round.elapsedSec = 0;
  engine.state.round.durationSec = 2;

  engine.update(1);
  assert.equal(engine.state.mode, "gameover");
  assert.equal(engine.state.round.outcome.kind, "lose");
  assert.equal(engine.state.round.outcome.reason, "star_contact");
});

test("round ends as a loss when the star reaches the far edge", () => {
  const engine = createEngine({ width: 900, height: 540, seed: 7 });
  engine.startGame();
  engine.state.round.elapsedSec = 0;
  engine.state.round.durationSec = 1;

  engine.update(1);
  assert.equal(engine.state.mode, "gameover");
  assert.equal(engine.state.round.outcome.kind, "lose");
  assert.equal(engine.state.round.outcome.reason, "star_reached_far_edge");
});

test("carried tech part installs into the gate when in range", () => {
  const engine = createEngine({ width: 900, height: 540, seed: 8 });
  engine.startGame();
  engine.state.asteroids = [];
  engine.state.gems = [];
  engine.state.saucer = null;
  engine.state.saucerLasers = [];

  const gate = engine.state.round.gate;
  const part = engine.state.round.techParts[0];
  assert.ok(gate && part);

  engine.state.round.carriedPartId = part.id;
  part.state = "carried";
  part.containerAsteroidId = null;
  part.installedSlot = null;

  engine.state.ship.pos = { x: gate.pos.x, y: gate.pos.y };
  engine.state.ship.vel = { x: 0, y: 0 };

  engine.update(0);
  assert.equal(engine.state.mode, "playing");
  assert.equal(engine.state.round.carriedPartId, null);
  assert.equal(part.state, "installed");
  assert.equal(part.installedSlot, 0);
  assert.equal(engine.state.round.gate.slots[0], part.id);
  assert.equal(engine.state.round.gate.active, false);
});

test("escape through an active gate ends the round as a win", () => {
  const engine = createEngine({ width: 900, height: 540, seed: 9 });
  engine.startGame();
  engine.state.asteroids = [];
  engine.state.gems = [];
  engine.state.saucer = null;
  engine.state.saucerLasers = [];

  engine.state.round.gate.slots = ["part-0", "part-1", "part-2", "part-3"];
  engine.state.ship.pos = { x: engine.state.round.gate.pos.x, y: engine.state.round.gate.pos.y };
  engine.state.ship.vel = { x: 0, y: 0 };

  engine.update(0);
  assert.equal(engine.state.mode, "gameover");
  assert.equal(engine.state.round.outcome.kind, "win");
  assert.equal(engine.state.round.outcome.reason, "escaped");
});

test("lost tech parts respawn inside new XL asteroids in the star safe region", () => {
  const engine = createEngine({ width: 900, height: 540, seed: 10 });
  engine.startGame();
  engine.state.asteroids = [];
  engine.state.gems = [];
  engine.state.saucer = null;
  engine.state.saucerLasers = [];

  for (const part of engine.state.round.techParts) {
    part.state = "lost";
    part.containerAsteroidId = null;
    part.respawnCount = 0;
  }

  engine.update(0);

  const star = engine.state.round.star;
  const bufferMax = Math.min(engine.state.world.w, engine.state.world.h) * 0.45;
  const buffer = Math.max(0, Math.min(engine.state.params.starSafeBufferPx, bufferMax));

  for (const part of engine.state.round.techParts) {
    assert.equal(part.state, "in_asteroid");
    assert.ok(part.containerAsteroidId);
    const a = engine.state.asteroids.find((it) => it.id === part.containerAsteroidId);
    assert.ok(a, `expected respawn asteroid for ${part.id}`);
    assert.equal(a.size, "xlarge");
    assert.equal(a.techPartId, part.id);

    if (star.axis === "x") {
      if (star.dir === 1) assert.ok(a.pos.x - a.radius >= star.boundary + buffer);
      else assert.ok(a.pos.x + a.radius <= star.boundary - buffer);
    } else {
      if (star.dir === 1) assert.ok(a.pos.y - a.radius >= star.boundary + buffer);
      else assert.ok(a.pos.y + a.radius <= star.boundary - buffer);
    }
  }
});

test("tech part respawn placement is deterministic and ignores gameplay RNG consumption", () => {
  const a = createEngine({ width: 900, height: 540, seed: 11 });
  const b = createEngine({ width: 900, height: 540, seed: 11 });
  a.startGame();
  b.startGame();

  // Consume gameplay RNG/time in A.
  for (let i = 0; i < 240; i++) a.update(1 / 60);

  // Realign both engines to the same round-time and neutral state.
  a.state.round.elapsedSec = 0;
  b.state.round.elapsedSec = 0;
  a.state.ship.pos = { x: 0, y: 0 };
  b.state.ship.pos = { x: 0, y: 0 };
  a.state.ship.vel = { x: 0, y: 0 };
  b.state.ship.vel = { x: 0, y: 0 };
  a.state.asteroids = [];
  b.state.asteroids = [];

  for (const engine of [a, b]) {
    for (const part of engine.state.round.techParts) {
      part.state = "lost";
      part.containerAsteroidId = null;
      part.respawnCount = 0;
    }
  }

  a.update(0);
  b.update(0);

  const partA = a.state.round.techParts[0];
  const partB = b.state.round.techParts[0];
  const asteroidA = a.state.asteroids.find((it) => it.id === partA.containerAsteroidId);
  const asteroidB = b.state.asteroids.find((it) => it.id === partB.containerAsteroidId);
  assert.ok(asteroidA && asteroidB);
  assert.equal(Math.round(asteroidA.pos.x), Math.round(asteroidB.pos.x));
  assert.equal(Math.round(asteroidA.pos.y), Math.round(asteroidB.pos.y));
});

test("setRoundSeed resets spawn point generation deterministically", () => {
  const engine = createEngine({ width: 1000, height: 700, seed: 999 });
  engine.startGame();

  const canon = (pts) => pts.map((p) => ({ x: +p.x.toFixed(6), y: +p.y.toFixed(6) }));
  const a = canon(engine.generateSpawnPoints(4, { margin: 200, minSeparation: 600 }));

  // Advance simulation to consume gameplay RNG; spawn generation should still be stable for the same round seed.
  for (let i = 0; i < 120; i++) engine.update(1 / 60);
  const b = canon(engine.generateSpawnPoints(4, { margin: 200, minSeparation: 600 }));
  assert.deepEqual(a, b);

  for (let i = 0; i < b.length; i++) {
    for (let j = i + 1; j < b.length; j++) {
      const dx = b[i].x - b[j].x;
      const dy = b[i].y - b[j].y;
      const d = Math.hypot(dx, dy);
      assert.ok(d >= 600, `expected spawn separation >= 600, got ${d.toFixed(2)}`);
    }
  }
});

test("spawnShipAt clamps to world bounds", () => {
  const engine = createEngine({ width: 800, height: 600, seed: 42 });
  engine.startGame();
  const halfW = engine.state.world.w / 2;
  const halfH = engine.state.world.h / 2;
  const r = engine.state.ship.radius;

  engine.spawnShipAt({ x: 1e9, y: -1e9 });
  assert.ok(engine.state.ship.pos.x <= halfW - r);
  assert.ok(engine.state.ship.pos.x >= -halfW + r);
  assert.ok(engine.state.ship.pos.y <= halfH - r);
  assert.ok(engine.state.ship.pos.y >= -halfH + r);
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

test("ambient collision can fracture medium targets", () => {
  const engine = createEngine({ width: 1280, height: 720 });
  engine.startGame();
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

  const projectile = mk("proj-med", "med", 0, 0, 320, 0, false);
  const target = mk("target-med", "med", 52, 0, 0, 0, false);
  engine.state.asteroids = [projectile, target];

  engine.update(1 / 60);
  const mediumCount = engine.state.asteroids.filter((a) => a.size === "med").length;
  assert.equal(mediumCount, 1, "expected one medium to fracture under high-energy ambient impact");
  assert.ok(engine.state.gems.length >= 2, "expected fractured medium to spawn gems");
});

test("ship-launched impact boost enables fractures below ambient threshold", () => {
  const engine = createEngine({ width: 1280, height: 720 });
  engine.startGame();
  const p = engine.state.params;
  const projRadius = asteroidRadiusForSize(p, "small");
  const targetRadius = asteroidRadiusForSize(p, "med");
  const projMass = asteroidMassForRadius(projRadius);
  const targetMass = asteroidMassForRadius(targetRadius);
  const sizeBias = 1 + asteroidSizeRank("med") * 0.06;
  const thresholdEnergy = 0.25 * targetMass * (p.fractureImpactSpeed * sizeBias) ** 2;
  const mu = (projMass * targetMass) / (projMass + targetMass);
  const relSpeed = Math.sqrt((2 * thresholdEnergy) / (mu * p.projectileImpactScale)) * 1.02;

  const runScenario = (shipLaunched) => {
    const sim = createEngine({ width: 1280, height: 720 });
    sim.startGame();
    sim.state.ship.pos = { x: -1000, y: 0 };
    sim.state.ship.vel = { x: 0, y: 0 };
    const mk = (id, size, x, y, vx, vy, launched) => {
      const radius = asteroidRadiusForSize(sim.state.params, size);
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

    const projectile = mk("proj-small", "small", 0, 0, relSpeed, 0, shipLaunched);
    const target = mk("target-med", "med", 40, 0, 0, 0, false);
    sim.state.asteroids = [projectile, target];

    sim.update(1 / 60);
    return sim.state.asteroids.filter((a) => a.size === "med").length;
  };

  const medLeftLaunched = runScenario(true);
  const medLeftAmbient = runScenario(false);
  assert.equal(medLeftLaunched, 0, "expected launched small to fracture medium target");
  assert.equal(medLeftAmbient, 1, "expected ambient small to fail at the same relative speed");
});
