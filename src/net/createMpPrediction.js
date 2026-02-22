import { stepShipKinematics } from "../engine/shipKinematics.js";

function safeStr(v) {
  return String(v ?? "");
}

export function createMpPrediction({ engine, mpClient, mpWorldView, enabled = true, fixedDtSec = 1 / 60 } = {}) {
  if (!engine || !engine.state) throw new Error("createMpPrediction requires { engine }");
  if (!mpClient) throw new Error("createMpPrediction requires { mpClient }");
  if (!mpWorldView) throw new Error("createMpPrediction requires { mpWorldView }");

  const dt = Number(fixedDtSec);
  if (!Number.isFinite(dt) || dt <= 0) throw new Error("createMpPrediction requires a positive fixedDtSec");

  let localSessionId = "";
  let lastReconciledSeq = 0;
  let hasAuthPose = false;
  let isEnabled = enabled !== false;

  function getLocalShip() {
    const pid = localSessionId;
    if (!pid) return null;
    const p = engine.state.playersById?.[pid];
    return p?.ship ? p.ship : null;
  }

  function onConnect({ sessionId } = {}) {
    localSessionId = safeStr(sessionId);
    lastReconciledSeq = 0;
    hasAuthPose = false;
  }

  function onDisconnect() {
    localSessionId = "";
    lastReconciledSeq = 0;
    hasAuthPose = false;
  }

  function setEnabled(next) {
    isEnabled = next !== false;
  }

  function isActive() {
    return !!(isEnabled && localSessionId);
  }

  function hasAuthoritativePose() {
    return hasAuthPose;
  }

  function onInputSent({ msg, dtSec } = {}) {
    if (!isEnabled) return;
    if (!hasAuthPose) return;
    const ship = getLocalShip();
    if (!ship) return;
    const input = msg && typeof msg === "object" ? msg : null;
    if (!input) return;
    const stepDt = Number(dtSec);
    // Trust the mp client tick cadence for prediction steps.
    const step = Number.isFinite(stepDt) && stepDt > 0 ? stepDt : dt;
    stepShipKinematics({ ship, input, params: engine.state.params, world: engine.state.world, dt: step });
  }

  function reconcile() {
    if (!isEnabled) return false;
    if (!localSessionId) return false;
    if (!mpClient.isConnected?.()) return false;

    const auth = mpWorldView.getLatestPlayerSample?.(localSessionId);
    if (!auth) return false;
    const hadAuthPose = hasAuthPose;
    hasAuthPose = true;

    const ship = getLocalShip();
    if (!ship) return false;

    const ackSeq = (Number(auth.lastProcessedInputSeq) | 0) || 0;
    if (hadAuthPose && ackSeq <= lastReconciledSeq) return false;

    // Roll back to authoritative pose (latest server sample), then replay unacked commands.
    ship.pos.x = Number(auth.x) || 0;
    ship.pos.y = Number(auth.y) || 0;
    ship.vel.x = Number(auth.vx) || 0;
    ship.vel.y = Number(auth.vy) || 0;
    ship.angle = Number(auth.angle) || 0;

    mpClient.ackInputSeq?.(ackSeq);
    const unacked = mpClient.getUnackedInputs?.() || [];
    for (let i = 0; i < unacked.length; i++) {
      const entry = unacked[i];
      const input = entry?.msg;
      if (!input || typeof input !== "object") continue;
      stepShipKinematics({ ship, input, params: engine.state.params, world: engine.state.world, dt });
    }

    lastReconciledSeq = ackSeq;
    return true;
  }

  return {
    onConnect,
    onDisconnect,
    setEnabled,
    isActive,
    hasAuthoritativePose,
    onInputSent,
    reconcile,
  };
}
