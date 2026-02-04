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
