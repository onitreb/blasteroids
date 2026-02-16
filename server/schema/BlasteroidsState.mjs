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
  }
}

type("string")(BlasteroidsState.prototype, "seed");
type("number")(BlasteroidsState.prototype, "tick");
type("number")(BlasteroidsState.prototype, "simTimeMs");
type({ map: PlayerState })(BlasteroidsState.prototype, "players");
type([ "string" ])(BlasteroidsState.prototype, "playerOrder");
type({ map: AsteroidState })(BlasteroidsState.prototype, "asteroids");
type({ map: GemState })(BlasteroidsState.prototype, "gems");

// Interest management: asteroids/gems are sent only to clients that include
// each AsteroidState/GemState instance in their `client.view` StateView.
view()(BlasteroidsState.prototype, "asteroids");
view()(BlasteroidsState.prototype, "gems");
