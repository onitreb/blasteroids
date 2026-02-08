# Ship Growth + Size Progression Plan

Last updated: 2026-02-08  
Project: Blasteroids  
Scope: Add ship size tiers, expanded asteroid sizes, tiered forcefield behavior, in-game debug/tuning overlay improvements, and growth-driven camera zoom-out.

## Goal
- Make ship progression meaningful at 500 and 1000 gem points.
- Keep size systems data-driven so more tiers can be added later without major rewrites.
- Make tuning fast during live gameplay (open/close debug menu, tweak, resume, tweak again).

## Status Legend
- `NOT_STARTED`: No implementation yet.
- `IN_PROGRESS`: Started but not complete.
- `BLOCKED`: Waiting on dependency or decision.
- `DONE`: Implemented and validated.

## Requested Defaults (First Pass)
- Ship tiers
  - Tier 1 `small`: `1.0x` scale, triangle-ish hull, 1 engine.
  - Tier 2 `medium`: `2.0x` scale, rectangle hull, 2 engines.
  - Tier 3 `large`: `4.0x` scale, heavy wedge hull, 3 engines.
- Unlock thresholds (gem points)
  - Tier 2 at `500`.
  - Tier 3 at `1000`.
- Forcefield tiers
  - Tier 1: amber ring, can attract/burst `small`.
  - Tier 2: cyan ring, can attract/burst `small + med`.
  - Tier 3: red ring, can attract/burst `small + med + large`.
- Asteroid size ladder
  - `small`, `med`, `large`, `xlarge`, `xxlarge`.
  - Default fracture chain: `xxlarge -> 2 xlarge -> 2 large -> 2 med -> 2 small`.
- Camera growth zoom
  - Zoom targets by tier: `1.00`, `0.78`, `0.58`.
  - Smooth tween on tier-up: `0.45s`, ease-out.

## Architecture Decisions (Lock Before Coding)
- Create ship tier registry (`SHIP_TIERS`) and asteroid size registry (`ASTEROID_SIZES`) as arrays/maps, not hardcoded `if/else`.
- Replace hardcoded fracture logic with a data fracture graph (`splitInto`, `splitCount`, `minFractureSpeed` per size).
- Add ship art abstraction (`renderer.type = polygon | svg`) so ship assets can be swapped easily.
- Enforce "no hidden tunables": any runtime switch/slider must be represented in the debug menu metadata.
- Keep current score model as "gem points" for unlock checks in first pass; expose thresholds in debug controls.

## Debug Menu Target Structure (2 Columns)
- Column A groups
  - Session: start/resume, restart, pause-while-menu-open toggle.
  - Progression: current tier, threshold sliders, optional tier override toggle.
  - Ship + Forcefield: per-tier radius/colors/attract limits and ship movement knobs.
- Column B groups
  - Asteroids: size radii, counts/density, fracture speeds, split behavior.
  - Camera + Arena: camera mode, world scale, per-tier zoom targets, zoom duration.
  - Visual FX: stars/twinkle and growth pulse visuals.
- Mobile fallback
  - Collapse to one column below breakpoint (for example `< 980px`) while keeping group order.

## Implementation Plan and Step Status

| ID | Step | Status | Notes |
|---|---|---|---|
| SG-00 | Create persistent tracker for ship growth feature | DONE | This file. |
| SG-01 | Build control-schema foundation for debug menu (switch/slider metadata) | DONE | Added expanded tuning/control metadata in `src/main.js` (`TUNING_FIELDS`) including growth, zoom, and XL/XXL asteroid controls with default persistence. |
| SG-02 | Add in-game debug overlay toggle + resume flow | DONE | Added hotkey/button toggle (`M`/`~` + top-right button), pause-on-open behavior, and apply+resume flow while playing. |
| SG-03 | Rework debug/tweak UI into 2-column grouped layout | DONE | `index.html` debug panel now grouped into two columns with logical sections and mobile single-column fallback. |
| SG-04 | Introduce data-driven ship-tier and asteroid-size registries | DONE | Added `SHIP_TIERS`, asteroid size order/maps, and helper utilities replacing hardcoded size branching in core loops. |
| SG-05 | Add `xlarge` + `xxlarge` asteroid sizes and fracture graph | DONE | Added XL/XXL radii/weights, rendering, spawn weighting, collision support, and generalized `size -> next size` fracture chain. |
| SG-06 | Implement 3 ship tiers (small/medium/large) with pluggable renderers | DONE | Added three distinct hulls and engine layouts plus `window.set_ship_svg_renderer(...)` for easy SVG replacement per tier. |
| SG-07 | Implement progression unlocks at 500/1000 gem points | DONE | Gem-score progression with tier transitions and debug overrides (tier checkbox + tier level slider + gem-score slider). |
| SG-08 | Generalize forcefield to tier-based size attraction/burst rules | DONE | Tier-specific attraction target sizes and scaled attract/field radii are now applied across update, attach, and burst logic. |
| SG-09 | Add camera zoom state + smooth tier-up zoom transitions | DONE | Added camera zoom state and tweening with per-tier zoom targets and duration controls. |
| SG-10 | Growth FX + balancing pass (spawn pressure, speeds, ring feel) | IN_PROGRESS | First-pass growth pulse visuals and defaults are implemented; tuning pass across long sessions is still pending. |
| SG-11 | Telemetry + docs sync + playtest checklist closure | IN_PROGRESS | `render_game_to_text` now reports tier/progression/zoom; docs and tuning notes updated, with deeper playtest matrix still open. |

## Dependency Order Rationale
- Do SG-01 to SG-03 first (high leverage): menu architecture and in-game toggle speed up every later tuning pass.
- Do SG-04 before SG-05 to SG-08: registries avoid repeated rewrites as sizes/tier rules expand.
- Do SG-09 after SG-07: zoom transitions should be keyed off finalized tier progression events.
- Do SG-10 last: balancing only makes sense once full mechanics are present.

## Default Values to Expose in Debug Menu
- Progression
  - `tier2UnlockScore`: default `500`.
  - `tier3UnlockScore`: default `1000`.
  - `allowTierOverride`: default `off`.
- Camera growth
  - `tier1Zoom`: `1.00`, `tier2Zoom`: `0.78`, `tier3Zoom`: `0.58`.
  - `zoomTweenSec`: `0.45`.
- Asteroid sizing
  - `xlargeRadius` and `xxlargeRadius` (initial guess: `90`, `150`).
  - Split count per size (initial guess: all `2`).
- Forcefield per tier
  - Radius multiplier and color per tier.
  - Allowed attract sizes per tier as switches or compact multi-select controls.

## Acceptance Checklist (Done = Ready To Merge)
- [x] Debug menu opens/closes during active gameplay via hotkey and UI button.
- [x] Menu stays organized in two columns on desktop and one column on narrow screens.
- [ ] Every gameplay switch/slider used in code appears in debug menu metadata.
- [x] Ship upgrades to medium at 500 and large at 1000 gem points by default.
- [x] Tier visuals are clearly distinct (shape + engine count) and tier colors are obvious.
- [x] Medium tier can attract/burst small+med; large tier can attract/burst small+med+large.
- [x] `xlarge` and `xxlarge` asteroids spawn and fracture correctly through the size chain.
- [x] Camera zooms out smoothly on tier-up and world clamping remains stable.
- [x] `window.render_game_to_text()` reports current ship tier and camera zoom state.
- [x] README + progress log updated with new controls and progression behavior.

## Session Log

| Date | Session Notes |
|---|---|
| 2026-02-08 | Created scoped, resumable implementation tracker for ship size progression, expanded asteroid sizes, tiered forcefields, in-game debug overlay toggling, and growth-driven camera zoom. No gameplay code changes in this step. |
| 2026-02-08 | Implemented SG-01..SG-09 core slice in `src/main.js`/`index.html`: data-driven tiers/sizes, XL+XXL asteroid chain, progression unlocks (500/1000), tier forcefield rules, smooth camera zoom, in-game debug menu toggle, grouped 2-column debug/tuning UI, and runtime debug progression controls. Added `window.set_ship_svg_renderer` for per-tier SVG swap support. Validation: `node --check src/main.js`, in-browser DevTools control/toggle/zoom/progression checks, and no console errors. |
