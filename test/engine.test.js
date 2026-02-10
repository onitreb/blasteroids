import test from "node:test";
import assert from "node:assert/strict";

import { createEngine } from "../src/engine/createEngine.js";

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
