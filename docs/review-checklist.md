# Refactor Review Checklist

Use this checklist for refactors that touch runtime code, UI wiring, or module boundaries.

## Invariants

- `index.html` still runs with `file://` (no server, no browser flags).
- `index.html` loads only `./dist/blasteroids.js` as the runtime script.
- If runtime code changed, `dist/blasteroids.js` was rebuilt and included in the change.
- Hook surfaces are still present:
  - `window.Blasteroids.renderGameToText`
  - `window.Blasteroids.advanceTime`
  - `window.Blasteroids.setShipSvgRenderer`
  - legacy aliases (`window.render_game_to_text`, `window.advanceTime`, `window.set_ship_svg_renderer`)

## Automated Checks

- `npm test` passes.
- `npm run build` passes.

## Manual Smoke (`file://`)

- No console errors on load.
- Start flow works.
- Movement (`W/A/D/S` or arrows), burst (`Space` or click), restart (`R`), fullscreen (`F`) work.
- Debug menu toggles (`M`) and pause-on-open behavior still work.
- Both namespace and legacy hook calls are callable and return parseable state.

## Boundary Review

- Engine changes remain DOM-free.
- Renderer changes remain visual-only.
- UI changes only call explicit game APIs.
- New reusable math/geometry logic is considered for `src/util/*`.

## Docs and Handoff

- Update `progress.md` with what changed and how it was validated.
- Update `repo-refactor-plan.md` status for completed/in-progress workstreams.
- Update architecture/module docs if module ownership or boundaries changed.
