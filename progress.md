Original prompt: Build an Asteroids-like 2D web game where the ship attracts small asteroids into a magnet/forcefield radius, they stick to the ship (snowball), and the player can burst them outward; ejected small asteroids break large asteroids into small pieces; small-vs-small annihilates.

Notes
- Keep a single canvas, expose `window.render_game_to_text()` and a deterministic `window.advanceTime(ms)` for Playwright.
- Controls target: rotate + thrust like classic Asteroids; burst on Space or left mouse.

TODO
- Add game over / restart UX polish.
- Tune magnet strength and burst speed.
- Add simple sound effects (optional).

Updates
- Implemented a first playable version (ship movement, magnet ring, attachment, burst, splitting + annihilation, basic HUD, fullscreen toggle).
- Switched to a single non-module JS file so the game can be opened via `file://` (the sandbox disallows binding a local dev server port).
- Playwright validation is currently blocked in this sandbox because the `playwright` npm package can’t be installed (no network) and isn’t preinstalled.
- Added 3 asteroid sizes (small/med/large), 25% more starting asteroids, elastic-ish collisions, and a velocity-gated fracture rule (fast burst-thrown smalls can fracture med/large and get consumed).
- Small asteroids now stick to the surface of the forcefield ring (half the attraction radius), and the larger attraction circle is a debug toggle in the menu (default on). Ship collision behavior (explode vs bounce) is also a menu toggle.
- Updated attraction to a gravity-well model (stronger when closer), increased attraction radius +5%, increased burst speed +5%, and added simple KISS explosion visuals on burst + collisions. Burst-thrown smalls now self-destruct on impact; they fracture large→2 med and med→2 small (when fast enough).
- Removed the “time window” for fast small impacts: whether a small self-destructs / fractures now depends on current impact speed (velocity-based), and smalls attach to the inner forcefield ring (not the outer attraction radius).
- Clarified visuals + tuning: outer dashed blue ring = gravity radius (debug), inner yellow ring = forcefield surface that smalls stick to; added menu sliders (gravity/burst/capture/damage/fracture) and made ring “capture” forces fade out for high-speed smalls so bursts actually fling outward.
- Added gem drops + scoring: every broken small asteroid spawns a gem (emerald/ruby/diamond at 50%/40%/10%), gems glow and get pulled in/absorbed by the ship for points; score also shown in an HTML HUD overlay.
- Added per-slider “Set default” persistence for tuning via localStorage and added plain-English descriptions under each tuning slider.
- Tweaked gem sizes (green baseline; red ~15% larger; blue ~30% larger) and increased gravity inside the forcefield ring (50% stronger) with extra damping to reduce “slip by” captures.
- Added a debug tuning slider for ship thrust.
- Added a debug tuning slider for inner ring gravity multiplier (how much stronger gravity becomes once inside the forcefield ring).
- Added gem expiration: gems now expire after a tunable lifetime (default 6s) and strobe faster and faster before disappearing (Gem lifetime slider).
- Updated gem expiry visuals: gems now *blink* (no gradual fade) with faster strobing near expiry.
- Tuned gem blinking: no blinking for first half of gem life, then a smooth ramp up to a tunable max blink rate (Gem blink max slider, default 5/s).
- Refactored gem blinking (KISS): blinking now uses an accumulated phase updated in `updateGems` so frequency ramps feel steady (no irregular flicker from time-based modulo with changing frequency).
- Added an occasional blue flying saucer enemy: it spawns offscreen from any edge, glides across without wrapping, fires 2 yellow laser shots toward the ship, and despawns once it exits the playfield.
- Updated saucer behavior pass: doubled saucer size, switched firing to continuous random burst cycles (1-2 shots per burst with ~1-3s pauses), made lasers despawn at the exact canvas edge, and added gentle swerving/lazy flight instead of a rigid straight path.
- Fixed saucer laser visibility regression: beam alpha was tied to removed `ttlSec`, causing effectively invisible shots; refactored to a stable bright yellow beam with stronger core + additive outer glow and verified in-browser screenshot/state.
- Added saucer destruction behavior: asteroid impact destroys saucer, plays yellow explosion/ring FX, removes saucer, awards score, and drops a large yellow/gold gem.
- Refactored gem expiry visuals from hard blink-off to continuous throbbing (bright↔dim) so gems never fully disappear before expiry.
- Strengthened gem pickup feel: larger gem attraction radius, stronger gem gravity + ring capture/funneling, higher in-ring pull, and larger collection radius; gold gem TTL increased to keep it collectible.
- Tightened saucer kill rule: saucer now only dies to ship-launched asteroids (rocks ejected from the player burst), not ambient field rocks.
- Refactored gem gravity/capture math to match the small-asteroid model exactly (same attract radius, gravity, ring capture, radial damping, and inner-ring damping) to remove lurchy behavior.
- Reduced saucer gold-drop size (smaller base radius and lower drop jitter) while keeping the same yellow/gold identity.
- Simplified gem pull again per feedback: gems now ignore shield/ring capture logic entirely and are continuously accelerated directly toward ship center with stronger close-range pull (smooth inverse-square + soft core boost), so they no longer stall at forcefield radius.
- Began large-arena enhancement track: added `state.world` and `state.camera` scaffolding in `src/main.js` (plus `syncCameraToShip()`), with world intentionally still coupled to viewport in this step to avoid gameplay/render behavior changes. Validation: `node --check src/main.js` passes; Playwright client remains blocked because `playwright` package is not installed in this sandbox.
- Large-arena LA-02 pass: removed viewport wrapping (`wrapPos`) and added world-bound helpers (`confineShipToWorld`, `confineBodyToWorld`). Ship now clamps/stops at world edge; asteroids and gems now bounce off world edges with damping; saucer/laser bounds now use `state.world`. Validation: `node --check src/main.js` passes. Per user request, browser run is paused until explicitly resumed.
- Large-arena LA-03/LA-04 pass: render pipeline now applies camera offset (`ctx.translate(w/2 - camera.x, h/2 - camera.y)`), and centered camera mode is active via `syncCameraToShip()` each update. Also updated `render_game_to_text` metadata to include `world` and `camera` fields plus corrected coordinate-system description. Validation: `node --check src/main.js` passes; browser run still paused per user request.
- Large-arena LA-05..LA-09 pass: implemented dead-zone camera logic (`camera.mode === "deadzone"`), camera world-clamping, first-pass arena boundary line render, world-aware spawn/despawn bounds, and timed off-screen asteroid replenishment with a dynamic min/target/max population budget (scaled by world/view area and capped by `maxAsteroids`). Validation: `node --check src/main.js` passes; browser run still paused per user request.
- Browser smoke run resumed and completed (DevTools): start/menu flow works, controls respond, ship correctly clamps at world edge, and console shows no errors. Current default camera mode remains `centered`; dead-zone mode exists in code but is not wired to UI/toggle yet.
- Arena behavior update (small step): removed asteroid/gem boundary bounce behavior and switched both to out-of-bounds despawn (`isOutsideWorld(...)`), matching intended design direction. Ship boundary clamp remains unchanged.
- Next small implementation slice: added in-menu arena controls for camera mode (`centered` / `deadzone`) and world size scale (`1x..4x`), with new game-side config hooks (`setArenaConfig`, `applyWorldScale`) so panning can be tested without extra refactors. Kept this step browser-free per user request; validation via `node --check src/main.js`.
- Browser validation of new arena controls (DevTools): selecting `Dead-zone pan` and setting arena scale to `2.00x` updates runtime state (`camera.mode=deadzone`, `world` dimensions doubled). Deterministic movement test confirmed dead-zone behavior (small move keeps camera fixed, longer move causes pan). Switching back to `centered` made camera lock to ship center when not clamped at world edge. Console remained clean.
- LA-10 incremental implementation (terminal-only): added lightweight world cell bookkeeping (`worldCells.sizePx`, `asteroidCounts`, `activeKeys`) rebuilt each tick and used during ambient asteroid spawn to avoid inactive cells and over-dense cells (`cellCount >= 10`). Also exposed cell index stats in `render_game_to_text` under `world_cells`.
- LA-11 incremental implementation (terminal-only): replaced asteroid-vs-asteroid all-pairs loop with a spatial-hash broadphase helper (`forEachNearbyAsteroidPair`) using nearby-cell candidate iteration. Collision resolution logic itself remains the same; only candidate generation changed. Validation: `node --check src/main.js`.
- Browser validation pass for LA-10/LA-11 (DevTools): with `Dead-zone pan` + `2.00x` arena, deterministic movement and long simulation produced no console errors. `render_game_to_text.world_cells` remained consistent (`active_count`/indexed cells nonzero and stable), spawn maintenance continued filling the arena, and collision/burst interactions still behaved correctly (counts and score changed plausibly).
