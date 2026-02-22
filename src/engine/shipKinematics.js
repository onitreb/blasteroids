import { clamp } from "../util/math.js";

function clampFinite(n, lo, hi, fallback = 0) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(lo, Math.min(hi, v));
}

export function stepShipKinematics({ ship, input, params, world, dt } = {}) {
  if (!ship || !input || !params || !world) return false;
  const stepDt = Number(dt);
  if (!Number.isFinite(stepDt) || stepDt <= 0) return false;

  if (!ship.pos || typeof ship.pos !== "object") ship.pos = { x: 0, y: 0 };
  if (!ship.vel || typeof ship.vel !== "object") ship.vel = { x: 0, y: 0 };

  const turnDigital = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const turnAnalog = clampFinite(input.turnAnalog ?? 0, -1, 1, 0);
  const turn = clamp(turnDigital + turnAnalog, -1, 1);
  if (Math.abs(turn) > 1e-6) {
    const shipTurnRate = Number(params.shipTurnRate) || 0;
    ship.angle = (Number(ship.angle) || 0) + turn * shipTurnRate * stepDt;
  }

  const ang = Number(ship.angle) || 0;
  const fwdX = Math.cos(ang);
  const fwdY = Math.sin(ang);

  const thrustDigital = input.up ? 1 : 0;
  const thrustAnalog = clampFinite(input.thrustAnalog ?? 0, 0, 1, 0);
  const thrust = Math.max(thrustDigital, thrustAnalog);
  if (thrust > 1e-6) {
    const shipThrust = Number(params.shipThrust) || 0;
    const dv = shipThrust * thrust * stepDt;
    ship.vel.x = (Number(ship.vel?.x) || 0) + fwdX * dv;
    ship.vel.y = (Number(ship.vel?.y) || 0) + fwdY * dv;
  }

  if (input.down) {
    const vx = Number(ship.vel?.x) || 0;
    const vy = Number(ship.vel?.y) || 0;
    const vLen = Math.hypot(vx, vy);
    if (vLen > 1e-6) {
      const shipBrake = Number(params.shipBrake) || 0;
      const brake = shipBrake * stepDt;
      const newLen = Math.max(0, vLen - brake);
      const s = newLen / vLen;
      ship.vel.x = vx * s;
      ship.vel.y = vy * s;
    }
  }

  const shipLinearDamp = Number(params.shipLinearDamp) || 0;
  const damp = Math.max(0, 1 - shipLinearDamp * stepDt);
  ship.vel.x = (Number(ship.vel?.x) || 0) * damp;
  ship.vel.y = (Number(ship.vel?.y) || 0) * damp;

  const spd = Math.hypot(ship.vel.x, ship.vel.y);
  const maxSpeed = Number(params.shipMaxSpeed) || 0;
  if (maxSpeed > 1e-6 && spd > maxSpeed) {
    const s = maxSpeed / Math.max(1e-6, spd);
    ship.vel.x *= s;
    ship.vel.y *= s;
  }

  ship.pos.x = (Number(ship.pos?.x) || 0) + ship.vel.x * stepDt;
  ship.pos.y = (Number(ship.pos?.y) || 0) + ship.vel.y * stepDt;

  const worldW = Number(world.w) || 0;
  const worldH = Number(world.h) || 0;
  const halfW = worldW / 2;
  const halfH = worldH / 2;
  const r = Math.max(0, Number(ship.radius) || 0);
  const minX = -halfW + r;
  const maxX = halfW - r;
  const minY = -halfH + r;
  const maxY = halfH - r;

  if (ship.pos.x < minX) {
    ship.pos.x = minX;
    if (ship.vel.x < 0) ship.vel.x = 0;
  } else if (ship.pos.x > maxX) {
    ship.pos.x = maxX;
    if (ship.vel.x > 0) ship.vel.x = 0;
  }

  if (ship.pos.y < minY) {
    ship.pos.y = minY;
    if (ship.vel.y < 0) ship.vel.y = 0;
  } else if (ship.pos.y > maxY) {
    ship.pos.y = maxY;
    if (ship.vel.y > 0) ship.vel.y = 0;
  }

  return true;
}
