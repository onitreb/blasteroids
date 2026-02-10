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
- Ship size scales by tier (`1x`, `2x`, `4x`) and each tier has a distinct hull/engine silhouette.
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
- XL/XXL asteroid radii + spawn weights
- Star density / parallax strength
- Star accent chance / twinkle chance / twinkle strength / twinkle speed

## Multiplayer Status
- The simulation is still **single-client authoritative** today.
- The spawn model is global within one client, but there is no networked server authority yet.
- Future multiplayer should move asteroid spawning/simulation authority to a shared server (or deterministic lockstep authority) so all players see the same asteroid state.

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
