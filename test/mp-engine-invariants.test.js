import test from "node:test";
import assert from "node:assert/strict";

import { createEngine } from "../src/engine/createEngine.js";
import { asteroidMassForRadius, asteroidRadiusForSize } from "../src/util/asteroid.js";

function round3(n) {
  const v = Number(n) || 0;
  return Math.round(v * 1000) / 1000;
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
    attachedTo: null,
    pullOwnerId: null,
    shipLaunched: false,
    orbitA: 0,
    fractureCooldownT: 0,
    hitFxT: 0,
    pullFx: 0,
    starBurnSec: 0,
  };
}

function makeTestGem({ id, kind = "diamond", x, y, vx = 0, vy = 0, radius = 10 }) {
  return {
    id,
    kind,
    pos: { x, y },
    vel: { x: vx, y: vy },
    radius,
    spin: 0,
    spinVel: 0,
    ageSec: 0,
    ttlSec: 999,
    pulsePhase: 0,
    pulseAlpha: 1,
  };
}

function setupTwoPlayers({ seed = 123, addOrder = ["a", "b"] } = {}) {
  const engine = createEngine({
    width: 900,
    height: 540,
    seed,
    features: { roundLoop: false, saucer: false },
  });

  for (const id of addOrder) engine.addPlayer(id, { tierKey: "small", makeLocalIfFirst: false });
  engine.removePlayer("local");

  engine.startGame({ seed });

  engine.state.asteroids = [];
  engine.state.gems = [];
  engine.state.effects = [];
  engine.state.exhaust = [];
  engine.state.saucer = null;
  engine.state.saucerLasers = [];

  // Freeze spawns for deterministic, small test worlds.
  engine.state.asteroidSpawnT = 1e9;
  if (Object.prototype.hasOwnProperty.call(engine.state, "saucerSpawnT")) engine.state.saucerSpawnT = 1e9;

  engine.spawnShipAtForPlayer("a", { x: -80, y: 0 });
  engine.spawnShipAtForPlayer("b", { x: 80, y: 0 });

  return engine;
}

function stableMpSnapshot(engine) {
  const s = engine.state;
  const playerIds = Object.keys(s.playersById || {}).sort();
  const players = playerIds.map((id) => {
    const p = s.playersById[id];
    const ship = p?.ship || {};
    const vel = ship.vel || {};
    const pos = ship.pos || {};
    const prog = p?.progression || {};
    return {
      id,
      tier: String(ship.tier || ""),
      x: round3(pos.x),
      y: round3(pos.y),
      vx: round3(vel.x),
      vy: round3(vel.y),
      angle: round3(ship.angle),
      score: Math.round(Number(p?.score) || 0),
      gemScore: Math.round(Number(prog.gemScore) || 0),
      currentTier: String(prog.currentTier || ""),
    };
  });

  const asteroids = (s.asteroids || [])
    .slice()
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .map((a) => ({
      id: String(a.id || ""),
      size: String(a.size || ""),
      x: round3(a.pos?.x),
      y: round3(a.pos?.y),
      vx: round3(a.vel?.x),
      vy: round3(a.vel?.y),
      attachedTo: a.attachedTo ? String(a.attachedTo) : null,
      pullOwnerId: a.pullOwnerId ? String(a.pullOwnerId) : null,
      shipLaunched: !!a.shipLaunched,
    }));

  return {
    localPlayerId: String(s.localPlayerId || ""),
    mode: String(s.mode || ""),
    players,
    asteroids,
    gems: (s.gems || []).map((g) => ({ id: String(g.id || ""), kind: String(g.kind || ""), x: round3(g.pos?.x), y: round3(g.pos?.y) })),
  };
}

test("multiplayer: 2p timeline is deterministic regardless of add order", () => {
  const a = setupTwoPlayers({ seed: 555, addOrder: ["a", "b"] });
  const b = setupTwoPlayers({ seed: 555, addOrder: ["b", "a"] });

  // Add a couple asteroids so ownership/pull math runs.
  a.state.asteroids.push(makeTestAsteroid(a, { id: "ast-0", size: "small", x: 0, y: 0 }));
  a.state.asteroids.push(makeTestAsteroid(a, { id: "ast-1", size: "small", x: 120, y: 0 }));
  b.state.asteroids.push(makeTestAsteroid(b, { id: "ast-0", size: "small", x: 0, y: 0 }));
  b.state.asteroids.push(makeTestAsteroid(b, { id: "ast-1", size: "small", x: 120, y: 0 }));

  for (let frame = 0; frame < 90; frame++) {
    const aInA = a.state.playersById.a.input;
    const aInB = a.state.playersById.b.input;
    const bInA = b.state.playersById.a.input;
    const bInB = b.state.playersById.b.input;

    const thrust = frame < 24;
    const turn = frame >= 24 && frame < 50;

    aInA.up = thrust;
    aInB.up = thrust;
    bInA.up = thrust;
    bInB.up = thrust;

    aInA.left = turn;
    aInB.right = turn;
    bInA.left = turn;
    bInB.right = turn;

    if (frame === 60) {
      aInA.burst = true;
      aInB.burst = true;
      bInA.burst = true;
      bInB.burst = true;
    } else {
      aInA.burst = false;
      aInB.burst = false;
      bInA.burst = false;
      bInB.burst = false;
    }

    a.update(1 / 60);
    b.update(1 / 60);
  }

  assert.deepEqual(stableMpSnapshot(a), stableMpSnapshot(b));
});

test("multiplayer: asteroid pullOwnerId tie-breaks by player id on equal distance", () => {
  const engine = setupTwoPlayers({ seed: 9, addOrder: ["b", "a"] });
  engine.state.asteroids.push(makeTestAsteroid(engine, { id: "ast-eq", size: "small", x: 0, y: 0 }));

  engine.update(1 / 60);

  const a = engine.state.asteroids.find((it) => it.id === "ast-eq");
  assert.ok(a);
  assert.equal(a.pullOwnerId, "a");
});

test("multiplayer: gem pickup tie-breaks by player id on equal distance", () => {
  const engine = setupTwoPlayers({ seed: 10, addOrder: ["b", "a"] });
  engine.spawnShipAtForPlayer("a", { x: -30, y: 0 });
  engine.spawnShipAtForPlayer("b", { x: 30, y: 0 });
  engine.state.gems.push(makeTestGem({ id: "gem-eq", kind: "diamond", x: 0, y: 0, radius: 10 }));

  const scoreA0 = engine.state.playersById.a.score;
  const scoreB0 = engine.state.playersById.b.score;

  engine.update(1 / 60);

  assert.equal(engine.state.gems.length, 0);
  assert.ok(engine.state.playersById.a.score > scoreA0);
  assert.equal(engine.state.playersById.b.score, scoreB0);
});
