import { Client } from "@colyseus/sdk";

function clampNumber(n, min, max, fallback = 0) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, v));
}

function nowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
  return Date.now();
}

function makeRingBuffer(capacity) {
  const cap = Math.max(2, Math.floor(capacity));
  const buf = [];
  return {
    push(value) {
      buf.push(value);
      if (buf.length > cap) buf.splice(0, buf.length - cap);
    },
    values() {
      return buf.slice();
    },
    clear() {
      buf.length = 0;
    },
    size() {
      return buf.length;
    },
    capacity: cap,
  };
}

function normalizeEndpoint(endpoint) {
  const raw = String(endpoint || "").trim();
  if (!raw) return "ws://localhost:2567";
  if (raw.startsWith("ws://") || raw.startsWith("wss://")) return raw;
  if (raw.startsWith("http://")) return `ws://${raw.slice("http://".length)}`;
  if (raw.startsWith("https://")) return `wss://${raw.slice("https://".length)}`;
  return raw;
}

function readPlayersSnapshot(schemaState) {
  const players = [];
  const map = schemaState?.players;
  if (map && typeof map.forEach === "function") {
    map.forEach((p, id) => {
      if (!p) return;
      players.push({
        id: String(p.id ?? id ?? ""),
        x: Number(p.x) || 0,
        y: Number(p.y) || 0,
        vx: Number(p.vx) || 0,
        vy: Number(p.vy) || 0,
        angle: Number(p.angle) || 0,
        tier: String(p.tier ?? "small"),
        score: Number(p.score) || 0,
        gemScore: Number(p.gemScore) || 0,
      });
    });
  }
  players.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return players;
}

export function createMpClient({
  getInput = null,
  sendHz = 30,
  snapshotBufferSize = 32,
} = {}) {
  const buffer = makeRingBuffer(snapshotBufferSize);

  let client = null;
  let room = null;
  let endpoint = "ws://localhost:2567";
  let roomName = "blasteroids";

  let inputTimer = null;
  let lastInputSample = null;

  function isConnected() {
    return !!(room && room.connection && room.connection.isOpen);
  }

  function sampleInput() {
    const input = typeof getInput === "function" ? getInput() : null;
    const i = input && typeof input === "object" ? input : {};
    return {
      left: !!i.left,
      right: !!i.right,
      up: !!i.up,
      down: !!i.down,
      burst: !!i.burst,
      ping: !!i.ping,
      turnAnalog: clampNumber(i.turnAnalog, -1, 1, 0),
      thrustAnalog: clampNumber(i.thrustAnalog, 0, 1, 0),
    };
  }

  function buildInputMessage(sample, prev) {
    const p = prev || {};
    return {
      left: sample.left,
      right: sample.right,
      up: sample.up,
      down: sample.down,
      turnAnalog: sample.turnAnalog,
      thrustAnalog: sample.thrustAnalog,
      burst: sample.burst && !p.burst,
      ping: sample.ping && !p.ping,
    };
  }

  function stopInputLoop() {
    if (inputTimer) clearInterval(inputTimer);
    inputTimer = null;
    lastInputSample = null;
  }

  function startInputLoop() {
    stopInputLoop();
    const hz = clampNumber(sendHz, 1, 120, 30);
    const intervalMs = Math.round(1000 / hz);
    inputTimer = setInterval(() => {
      if (!room) return;
      const sample = sampleInput();
      const msg = buildInputMessage(sample, lastInputSample);
      lastInputSample = sample;
      try {
        room.send("input", msg);
      } catch {
        // ignore (room may be closing)
      }
    }, intervalMs);
  }

  function attachStateBuffer() {
    if (!room) return;
    room.onStateChange((schemaState) => {
      buffer.push({
        receivedAtMs: nowMs(),
        tick: Number(schemaState?.tick) || 0,
        simTimeMs: Number(schemaState?.simTimeMs) || 0,
        players: readPlayersSnapshot(schemaState),
        counts: {
          players: schemaState?.players?.size ?? undefined,
          asteroids: schemaState?.asteroids?.size ?? undefined,
          gems: schemaState?.gems?.size ?? undefined,
        },
      });
    });
  }

  async function connect({
    endpoint: nextEndpoint = endpoint,
    roomName: nextRoomName = roomName,
    joinOptions = {},
  } = {}) {
    if (room) await disconnect();

    endpoint = normalizeEndpoint(nextEndpoint);
    roomName = String(nextRoomName || "blasteroids");
    client = new Client(endpoint);
    buffer.clear();

    room = await client.joinOrCreate(roomName, joinOptions);
    attachStateBuffer();
    startInputLoop();

    room.onLeave(() => {
      stopInputLoop();
    });

    return {
      endpoint,
      roomName,
      roomId: room.roomId,
      sessionId: room.sessionId,
    };
  }

  async function disconnect() {
    stopInputLoop();
    buffer.clear();

    const r = room;
    room = null;
    if (r) {
      try {
        await r.leave();
      } catch {
        // ignore
      }
    }

    client = null;
  }

  function getStatus() {
    return {
      connected: isConnected(),
      endpoint,
      roomName,
      roomId: room?.roomId ?? null,
      sessionId: room?.sessionId ?? null,
      snapshots: buffer.size(),
      snapshotCapacity: buffer.capacity,
    };
  }

  function getSnapshots() {
    return buffer.values();
  }

  function getRoom() {
    return room;
  }

  return {
    connect,
    disconnect,
    isConnected,
    getStatus,
    getSnapshots,
    getRoom,
  };
}

