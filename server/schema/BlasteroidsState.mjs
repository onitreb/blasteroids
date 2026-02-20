import { ArraySchema, MapSchema, Schema, type, view } from "@colyseus/schema";

export class PlayerState extends Schema {}
type("string")(PlayerState.prototype, "id");
type("number")(PlayerState.prototype, "x");
type("number")(PlayerState.prototype, "y");
type("number")(PlayerState.prototype, "vx");
type("number")(PlayerState.prototype, "vy");
type("number")(PlayerState.prototype, "angle");
type("string")(PlayerState.prototype, "tier");
type("number")(PlayerState.prototype, "paletteIdx"); // 0..N (MP cosmetic)
type("number")(PlayerState.prototype, "score");
type("number")(PlayerState.prototype, "gemScore");

export class RoundStarState extends Schema {}
type("number")(RoundStarState.prototype, "present"); // 0/1
type("string")(RoundStarState.prototype, "edge"); // left|right|top|bottom
type("string")(RoundStarState.prototype, "axis"); // x|y
type("number")(RoundStarState.prototype, "dir"); // -1|1
type("number")(RoundStarState.prototype, "t"); // 0..1 (progress)
type("number")(RoundStarState.prototype, "boundary"); // px (world-space kill-wall)

export class RoundGateState extends Schema {
  constructor() {
    super();
    this.slots = new ArraySchema();
  }
}
type("number")(RoundGateState.prototype, "present"); // 0/1
type("string")(RoundGateState.prototype, "id");
type("string")(RoundGateState.prototype, "edge"); // left|right|top|bottom
type("number")(RoundGateState.prototype, "x");
type("number")(RoundGateState.prototype, "y");
type("number")(RoundGateState.prototype, "radius");
type("number")(RoundGateState.prototype, "active"); // 0/1
type("number")(RoundGateState.prototype, "chargeSec");
type("number")(RoundGateState.prototype, "chargeElapsedSec"); // -1 when none
type([ "string" ])(RoundGateState.prototype, "slots"); // "" for empty

export class RoundTechPartState extends Schema {}
type("string")(RoundTechPartState.prototype, "id");
type("string")(RoundTechPartState.prototype, "state"); // in_asteroid|dropped|carried|installed|lost
type("number")(RoundTechPartState.prototype, "x");
type("number")(RoundTechPartState.prototype, "y");
type("number")(RoundTechPartState.prototype, "vx");
type("number")(RoundTechPartState.prototype, "vy");
type("number")(RoundTechPartState.prototype, "radius");
type("string")(RoundTechPartState.prototype, "containerAsteroidId"); // "" when none
type("string")(RoundTechPartState.prototype, "carrierPlayerId"); // "" when none
type("number")(RoundTechPartState.prototype, "installedSlot"); // -1 when none
type("number")(RoundTechPartState.prototype, "respawnCount");

export class RoundState extends Schema {
  constructor() {
    super();
    this.star = new RoundStarState();
    this.gate = new RoundGateState();
    this.techParts = new ArraySchema();
  }
}
type("number")(RoundState.prototype, "durationSec");
type("number")(RoundState.prototype, "elapsedSec");
type("string")(RoundState.prototype, "carriedPartId"); // legacy/singleplayer-oriented (empty when none)
type("number")(RoundState.prototype, "escapeActive"); // 0/1
type(RoundStarState)(RoundState.prototype, "star");
type(RoundGateState)(RoundState.prototype, "gate");
type([ RoundTechPartState ])(RoundState.prototype, "techParts");

export class AsteroidState extends Schema {}
type("string")(AsteroidState.prototype, "id");
type("string")(AsteroidState.prototype, "size");
type("number")(AsteroidState.prototype, "x");
type("number")(AsteroidState.prototype, "y");
type("number")(AsteroidState.prototype, "vx");
type("number")(AsteroidState.prototype, "vy");
type("number")(AsteroidState.prototype, "radius");
type("number")(AsteroidState.prototype, "rot");
type("number")(AsteroidState.prototype, "rotVel");
type("string")(AsteroidState.prototype, "attachedTo"); // "" when none
type("string")(AsteroidState.prototype, "pullOwnerId"); // "" when none
type("number")(AsteroidState.prototype, "shipLaunched"); // 0/1

export class GemState extends Schema {}
type("string")(GemState.prototype, "id");
type("string")(GemState.prototype, "kind");
type("number")(GemState.prototype, "x");
type("number")(GemState.prototype, "y");
type("number")(GemState.prototype, "vx");
type("number")(GemState.prototype, "vy");
type("number")(GemState.prototype, "radius");

export class BlasteroidsState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.asteroids = new MapSchema();
    this.gems = new MapSchema();
    this.playerOrder = new ArraySchema();
    this.round = new RoundState();
  }
}

type("string")(BlasteroidsState.prototype, "seed");
type("number")(BlasteroidsState.prototype, "tick");
type("number")(BlasteroidsState.prototype, "simTimeMs");
type({ map: PlayerState })(BlasteroidsState.prototype, "players");
type([ "string" ])(BlasteroidsState.prototype, "playerOrder");
type({ map: AsteroidState })(BlasteroidsState.prototype, "asteroids");
type({ map: GemState })(BlasteroidsState.prototype, "gems");
type(RoundState)(BlasteroidsState.prototype, "round");

// Interest management: asteroids/gems are sent only to clients that include
// each AsteroidState/GemState instance in their `client.view` StateView.
view()(BlasteroidsState.prototype, "asteroids");
view()(BlasteroidsState.prototype, "gems");
