# Blasteroids

Asteroids-ish arcade game: fly near small asteroids to pull them into your forcefield ring, then burst them out to smash bigger ones. Small asteroids can drop gems for points.

## Run (no server)
- Open `index.html` directly (double-click). The repo includes a prebuilt `dist/blasteroids.js` so there’s no install step required to play.

## Play
- **W / ↑** thrust
- **A,D / ←,→** rotate
- **S / ↓** brake
- **Space** or **Left Click** burst
- **R** restart
- **F** fullscreen
- **M** (or **`**) open/close debug menu while playing

## Arena + Camera
- The game runs in a large bounded arena (not wraparound).
- Default camera mode is **Dead-zone pan**.
- Default world scale is **3.00x**.
- Arena scale can be adjusted in the menu from **1.00x** to **10.00x**.
- The ship is confined to world bounds.
- Asteroids and gems despawn when they go out of bounds (no wall bounce).
- Camera zoom is tier-aware and can tween on ship growth.

## Ship Growth + Progression
- The ship now has three tiers: **small**, **medium**, and **large**.
- Default unlocks are based on **total score**:
  - Tier 2 (medium) at **500** points.
  - Tier 3 (large) at **1000** points.
- Ship size scales by tier (defaults: hull radii `28 / 57 / 112`) and each tier has a distinct hull/engine silhouette.
- Tier forcefield behavior:
  - Small attracts/bursts `small` asteroids.
  - Medium attracts/bursts `small + med`.
  - Large attracts/bursts `small + med + large`.

## Asteroid Sizes
- Supported asteroid sizes: `small`, `med`, `large`, `xlarge`, `xxlarge`.
- Default fracture chain: `xxlarge -> xlarge -> large -> med -> small` (two fragments at each split step).
- XL/XXL radii and spawn weights are exposed in debug tuning.

## Ship SVG Swapping
- You can swap a ship tier renderer at runtime:
  - `window.set_ship_svg_renderer("small" | "medium" | "large", "<svg path d>", scale)`
- Pass an empty/invalid path to restore the default polygon renderer for that tier.

## Spawning Model (Current)
- Asteroid population is now handled by a **global arena-level authority** in this client simulation.
- Startup fills toward a world-scaled target population and guarantees visible asteroids near the player at game start.
- Runtime replenishment spawns across arena cells and excludes the active camera view, so asteroids should not pop into visible space.
- Population scales with arena size and a debug tuning multiplier.

## Tuning (debug)
Open the in-game menu to tweak sliders/switches and click **Set default** to save your preferred values (stored in your browser).

### Notable Debug Controls
- Pause-on-open toggle for live tweak loops
- Tier override (`off` / forced tier 1-3)
- Gem score progression slider (fast tier/zoom testing)
- Tier unlock thresholds and per-tier zoom targets
- Camera mode (`Centered` / `Dead-zone pan`)
- Arena size (`1.00x` .. `10.00x`)
- Global asteroid density
- Spawn rate scale (refill pacing)
- XL/XXL asteroid radii + spawn weights
- Ring feel: gravity softening, inner drag, ring pull, ring radial damping
- Star density / parallax strength
- Star accent chance / twinkle chance / twinkle strength / twinkle speed

## Multiplayer Status
- Singleplayer remains **file://-first** and runs by double-clicking `index.html` (offline, no server).
  - LAN multiplayer is in progress:
  - A Colyseus LAN server exists (`npm run lan:server`) and hosts an authoritative room (`blasteroids`) with Schema state sync.
  - Browser multiplayer is currently driven via DevTools hooks (menu UI/Quick Play button is still TODO):
    - Start server: `BLASTEROIDS_WORLD_SCALE=10 BLASTEROIDS_PATCH_RATE_MS=33 npm run lan:server`
    - Join in each tab: `await window.Blasteroids.mpConnect({ endpoint: "ws://" + location.host, joinOptions: { worldScale: 10 } })`
  - Interest management is implemented (clients receive only in-view asteroids/gems + margin); server sim scaling is in progress (far asteroids skip expensive work); client prediction is not implemented yet.
  - Multiplayer ships/forcefields/owned asteroids are tinted per-player (pastel palettes; deterministic by player id).
- Quick smoke:
  - Node join: `npm run lan:server` then `node scripts/mp-lan-smoke.mjs ws://localhost:2567`
  - Browser connect: `node scripts/mp-browser-smoke.mjs`

## GitHub Pages
Once Pages is enabled, the game will be available at:
`https://onitreb.github.io/blasteroids/`

## Development
- Install deps: `npm install`  
  - If you hit an npm cache permissions error, use: `npm install --cache ./.npm-cache`
- Build bundle: `npm run build`
- Watch (rebuild on change): `npm run build:watch` (then refresh `index.html`)
- Run regression checks: `npm test`

## Project Docs
- Architecture: `docs/architecture.md`
- Module ownership map: `docs/module-map.md`
- Refactor review checklist: `docs/review-checklist.md`
- Multiplayer PRD: `multiplayer-prd.md`
- Multiplayer implementation plan (tracker): `multiplayer-implementation-plan.md`
