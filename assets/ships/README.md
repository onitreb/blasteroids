# Ship Presets

This folder contains SVG-path-based ship silhouettes (no fill, stroke only).

**Edit Ships**

- Edit the SVG files in `assets/ships/svg/` with any vector editor.
- Re-import into the game presets JSON:

```sh
node scripts/sync_ship_svgs.mjs
```

This regenerates `assets/ships/presets.json` from the `.svg` files.

**How To Use In-Game**

1. Open the game.
2. In the browser console:

```js
// tierKey: "small" | "medium" | "large"
// hullRadius: silhouette radius in the SVG's coordinate space (enables auto-scaling to ship radius)
window.Blasteroids.setShipSvgRenderer("small", "<PATH_D>", 1, 18);
```

To restore the default polygon ship for a tier:

```js
window.Blasteroids.setShipSvgRenderer("small", null);
```

**Generate A Screenshot Gallery**

```sh
node scripts/render_ship_gallery.mjs
```

Screenshots are written to `output/ship-gallery/`.
