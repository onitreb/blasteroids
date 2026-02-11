# Module Map

This map is for reviewability: where logic lives, what each module owns, and what dependencies are expected.

## Runtime Entry and Build

| Path | Responsibility | Direct Imports |
| --- | --- | --- |
| `index.html` | Runtime shell and required DOM IDs for UI bindings | `styles.css`, `dist/blasteroids.js` |
| `styles.css` | Visual layout/styling for canvas, menu, and tuning UI | none |
| `scripts/build.mjs` | Build/watch/clean pipeline | `esbuild`, Node fs/process |
| `src/app/index.js` | Browser composition entrypoint | `src/main.js` |
| `src/main.js` | Browser wiring (input, loop, fullscreen, global hooks) | engine, renderer, ui bindings |

## Core Runtime Modules

| Path | Responsibility | Direct Imports |
| --- | --- | --- |
| `src/engine/createEngine.js` | Deterministic simulation and gameplay rules | util modules |
| `src/render/renderGame.js` | Canvas rendering from engine state | util modules, `SHIP_TIERS` |
| `src/ui/createUiBindings.js` | DOM bindings, debug/tuning UI, persistence | `clamp`, engine tier helpers |

## Utility Modules

| Path | Responsibility | Direct Imports |
| --- | --- | --- |
| `src/util/math.js` | Scalar helpers (`clamp`, `lerp`, `posMod`) | none |
| `src/util/vec2.js` | Vector math helpers | none |
| `src/util/angle.js` | Angle conversion/normalization helpers | none |
| `src/util/rng.js` | Seeded deterministic RNG | none |
| `src/util/collision.js` | Circle hit/collision resolution helpers | `vec2` |
| `src/util/asteroid.js` | Asteroid size/radius/mass/rank and size-mapping helpers | none |
| `src/util/ship.js` | Shared ship hull geometry helpers | none |

## Tests

| Path | Responsibility | Direct Imports |
| --- | --- | --- |
| `test/engine.test.js` | Deterministic engine and API surface regression checks | `createEngine` |
| `test/util.test.js` | Baseline util helper regression checks | util modules |

## Dependency Rules (Expected)

- `src/engine/*` should not import DOM/browser modules.
- `src/render/*` should not import UI modules.
- `src/ui/*` should not embed gameplay rules.
- `src/main.js` is the only runtime file that should write hook APIs to `window`.
