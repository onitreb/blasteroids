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

function byteLengthOfWsData(data) {
  if (data == null) return 0;
  if (typeof data === "string") {
    try {
      return new TextEncoder().encode(data).length;
    } catch {
      return data.length;
    }
  }
  if (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer) return data.byteLength;
  if (typeof Blob !== "undefined" && data instanceof Blob) return data.size;
  if (ArrayBuffer.isView && ArrayBuffer.isView(data)) return data.byteLength;
  if (data && typeof data === "object" && typeof data.byteLength === "number") return data.byteLength;
  return 0;
}

function tryGetRoomWebSocket(room) {
  const conn = room?.connection;
  const transport = conn?.transport || conn?._transport || conn?.["transport"] || null;
  const ws =
    transport?.ws ||
    transport?._ws ||
    transport?.["ws"] ||
    conn?.ws ||
    conn?._ws ||
    conn?.["ws"] ||
    null;
  const hasSend = ws && typeof ws.send === "function";
  const hasOnMessage =
    ws &&
    (typeof ws.addEventListener === "function" ||
      typeof ws.onmessage === "function" ||
      typeof ws.on === "function" ||
      typeof ws.addListener === "function");
  if (!hasSend || !hasOnMessage) return null;
  return ws;
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
  consumeInput = null,
  getViewRect = null,
  sendHz = 30,
  viewSendHz = 10,
  snapshotBufferSize = 32,
} = {}) {
  const buffer = makeRingBuffer(snapshotBufferSize);

  let client = null;
  let room = null;
  let endpoint = "ws://localhost:2567";
  let roomName = "blasteroids";

  let inputTimer = null;
  let viewTimer = null;
  let lastInputSample = null;

  let traffic = null; // { ws, rxBytes, txBytes, samples, detach }

  function isConnected() {
    return !!(room && room.connection && room.connection.isOpen);
  }

  function sampleInput() {
    const inputRef = typeof getInput === "function" ? getInput() : null;
    const i = inputRef && typeof inputRef === "object" ? inputRef : {};
    return {
      inputRef,
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

  function stopViewLoop() {
    if (viewTimer) clearInterval(viewTimer);
    viewTimer = null;
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
        if (typeof consumeInput === "function") consumeInput(sample.inputRef, msg);
        else if (sample.inputRef && typeof sample.inputRef === "object") {
          // When running in multiplayer mode, the local engine simulation is paused,
          // so impulse inputs must be cleared on send (otherwise edge-triggered messages
          // become permanently "stuck" after the first press).
          if (msg.burst) sample.inputRef.burst = false;
          if (msg.ping) sample.inputRef.ping = false;
        }
      } catch {
        // ignore (room may be closing)
      }
    }, intervalMs);
  }

  function startViewLoop() {
    stopViewLoop();
    if (typeof getViewRect !== "function") return;
    const hz = clampNumber(viewSendHz, 1, 60, 10);
    const intervalMs = Math.round(1000 / hz);
    viewTimer = setInterval(() => {
      if (!room) return;
      let rect = null;
      try {
        rect = getViewRect();
      } catch {
        rect = null;
      }
      if (!rect || typeof rect !== "object") return;
      try {
        room.send("view", rect);
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

  function stopTrafficMonitor() {
    if (traffic?.detach) {
      try {
        traffic.detach();
      } catch {
        // ignore
      }
    }
    traffic = null;
  }

  function startTrafficMonitor() {
    stopTrafficMonitor();
    if (!room) return;
    const ws = tryGetRoomWebSocket(room);
    if (!ws) return;

    const samples = [];
    const windowMs = 2000;
    const counters = { rxBytes: 0, txBytes: 0 };
    const origSend = ws.send ? ws.send.bind(ws) : null;

    const onWsMessage = (ev) => {
      const data = ev && typeof ev === "object" && "data" in ev ? ev.data : ev;
      counters.rxBytes += byteLengthOfWsData(data);
    };

    let nodeHandler = null;
    let prevOnMessage = null;

    if (typeof ws.addEventListener === "function") {
      ws.addEventListener("message", onWsMessage);
    } else if (typeof ws.on === "function") {
      nodeHandler = (data) => onWsMessage({ data });
      ws.on("message", nodeHandler);
    } else if (typeof ws.addListener === "function") {
      nodeHandler = (data) => onWsMessage({ data });
      ws.addListener("message", nodeHandler);
    } else if ("onmessage" in ws) {
      prevOnMessage = ws.onmessage;
      ws.onmessage = (ev) => {
        try {
          onWsMessage(ev);
        } finally {
          if (typeof prevOnMessage === "function") prevOnMessage(ev);
        }
      };
    }

    if (origSend) {
      ws.send = (...args) => {
        counters.txBytes += byteLengthOfWsData(args[0]);
        return origSend(...args);
      };
    }

    const detach = () => {
      if (origSend) ws.send = origSend;
      if (typeof ws.removeEventListener === "function") ws.removeEventListener("message", onWsMessage);
      // best-effort for node ws; not all transports expose remove/off in a consistent way
      if (nodeHandler) {
        if (typeof ws.off === "function") ws.off("message", nodeHandler);
        if (typeof ws.removeListener === "function") ws.removeListener("message", nodeHandler);
      }
      if (prevOnMessage) ws.onmessage = prevOnMessage;
    };

    traffic = { ws, counters, samples, windowMs, detach };
  }

  function getNetStats(atMs = nowMs()) {
    if (!traffic) return { connected: isConnected(), rxBps: null, txBps: null, rxTotalBytes: null, txTotalBytes: null };

    const now = Number(atMs) || nowMs();
    const rxBytes = traffic.counters.rxBytes;
    const txBytes = traffic.counters.txBytes;
    traffic.samples.push({ t: now, rx: rxBytes, tx: txBytes });
    while (traffic.samples.length > 2 && now - traffic.samples[0].t > traffic.windowMs) traffic.samples.shift();
    if (traffic.samples.length < 2) {
      return { connected: isConnected(), rxBps: 0, txBps: 0, rxTotalBytes: rxBytes, txTotalBytes: txBytes };
    }
    const first = traffic.samples[0];
    const last = traffic.samples[traffic.samples.length - 1];
    const dt = Math.max(1, last.t - first.t);
    const rxBps = ((last.rx - first.rx) * 1000) / dt;
    const txBps = ((last.tx - first.tx) * 1000) / dt;
    return {
      connected: isConnected(),
      rxBps,
      txBps,
      rxTotalBytes: rxBytes,
      txTotalBytes: txBytes,
    };
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
    startTrafficMonitor();
    startInputLoop();
    startViewLoop();

    room.onLeave(() => {
      stopInputLoop();
      stopViewLoop();
      stopTrafficMonitor();
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
    stopViewLoop();
    stopTrafficMonitor();
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
    getNetStats,
  };
}
