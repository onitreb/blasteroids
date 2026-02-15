import { Client } from "@colyseus/sdk";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function joinOne(endpoint, name) {
  const client = new Client(endpoint);
  const room = await client.joinOrCreate("blasteroids", { name });
  room.onStateChange((state) => {
    const players = state?.players ? Array.from(state.players.keys()).length : 0;
    const asteroids = state?.asteroids ? Array.from(state.asteroids.keys()).length : 0;
    const gems = state?.gems ? Array.from(state.gems.keys()).length : 0;
    console.log(`[${name}] tick=${state?.tick ?? "?"} players=${players} asteroids=${asteroids} gems=${gems}`);
  });
  return { client, room };
}

const endpoint = process.argv[2] || "ws://localhost:2567";

const a = await joinOne(endpoint, "A");
const b = await joinOne(endpoint, "B");

a.room.send("input", { up: true, turnAnalog: -0.5, thrustAnalog: 1 });
b.room.send("input", { up: true, turnAnalog: 0.5, thrustAnalog: 1 });

await sleep(800);

a.room.send("input", { burst: true });
b.room.send("input", { burst: true });

await sleep(800);

await a.room.leave();
await b.room.leave();

await sleep(100);
process.exit(0);
