import { createEngine } from "./engine/createEngine.js";
import { createRenderer } from "./render/renderGame.js";
import { createUiBindings } from "./ui/createUiBindings.js";

(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });

  const engine = createEngine({ width: canvas.width, height: canvas.height });
  const renderer = createRenderer(engine);
  const game = {
    ...engine,
    render: (drawCtx) => renderer.render(drawCtx),
    engine,
    renderer,
  };

  const ui = createUiBindings({ game, canvas, documentRef: document, windowRef: window });

  function resizeCanvasToCss() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = Math.max(2, Math.floor(rect.width * dpr));
    const h = Math.max(2, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      game.resize(w, h);
    }
  }

  function toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  window.addEventListener("resize", () => resizeCanvasToCss());
  document.addEventListener("fullscreenchange", () => resizeCanvasToCss());
  resizeCanvasToCss();

  const input = game.state.input;
  function restartGame() {
    ui.applyAllFromMenu();
    game.resetWorld();
    game.state.mode = "playing";
    ui.setMenuVisible(false);
  }
  function setKey(e, isDown) {
    const menuOpen = ui.isMenuVisible();
    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        if (!menuOpen) input.left = isDown;
        e.preventDefault();
        break;
      case "ArrowRight":
      case "KeyD":
        if (!menuOpen) input.right = isDown;
        e.preventDefault();
        break;
      case "ArrowUp":
      case "KeyW":
        if (!menuOpen) input.up = isDown;
        e.preventDefault();
        break;
      case "ArrowDown":
      case "KeyS":
        if (!menuOpen) input.down = isDown;
        e.preventDefault();
        break;
      case "Space":
        if (isDown && !menuOpen) input.burst = true;
        e.preventDefault();
        break;
      case "KeyQ":
        if (isDown && !menuOpen) input.ping = true;
        e.preventDefault();
        break;
      case "KeyR":
        if (isDown) {
          restartGame();
        }
        break;
      case "KeyF":
        if (isDown) toggleFullscreen();
        break;
      case "KeyM":
      case "Backquote":
        if (isDown) {
          if (game.state.mode === "playing" || game.state.mode === "gameover") ui.toggleDebugMenu();
        }
        e.preventDefault();
        break;
      case "Escape":
        if (isDown && ui.isMenuVisible() && (game.state.mode === "playing" || game.state.mode === "gameover")) {
          ui.setMenuVisible(false);
          e.preventDefault();
        }
        break;
    }
  }

  window.addEventListener("keydown", (e) => setKey(e, true));
  window.addEventListener("keyup", (e) => setKey(e, false));

  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    if (game.state.mode === "playing") {
      if (!ui.isMenuVisible()) input.burst = true;
      return;
    }
    if (game.state.mode === "gameover") {
      if (!ui.isMenuVisible()) restartGame();
    }
  });

  let externalStepping = false;
  let last = performance.now();
  let accumulator = 0;
  const fixedDt = 1 / 60;

  function stepRealTime(ts) {
    const dtMs = Math.min(50, ts - last);
    last = ts;
    accumulator += dtMs / 1000;

    ui.applyTouchControls?.();
    const pausedByMenu =
      ui.isMenuVisible() && game.state.mode === "playing" && !!game.state.settings.pauseOnMenuOpen && !externalStepping;

    if (!externalStepping) {
      while (!pausedByMenu && accumulator >= fixedDt) {
        game.update(fixedDt);
        accumulator -= fixedDt;
      }
      if (pausedByMenu) accumulator = 0;
    } else {
      accumulator = 0;
    }

    game.render(ctx);
    ui.updateHudScore();
    ui.syncRuntimeDebugUi();
    requestAnimationFrame(stepRealTime);
  }
  requestAnimationFrame(stepRealTime);

  function renderGameToText() {
    return game.renderGameToText();
  }

  function setShipSvgRenderer(tierKey, svgPathData, svgScale = 1, hullRadius = null) {
    game.setShipSvgRenderer(tierKey, svgPathData, svgScale, hullRadius);
  }

  function advanceTime(ms) {
    externalStepping = true;
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let i = 0; i < steps; i++) game.update(1 / 60);
    game.render(ctx);
    ui.updateHudScore();
    ui.syncRuntimeDebugUi();
  }

  const existingApi = window.Blasteroids && typeof window.Blasteroids === "object" ? window.Blasteroids : {};
  window.Blasteroids = {
    ...existingApi,
    renderGameToText,
    setShipSvgRenderer,
    advanceTime,
    // Debug helpers for visual iteration (intentionally undocumented).
    getGame: () => game,
    debugSpawnBurstWavelets: ({ count = 6, speed = 520, ttl = 0.55 * 1.1 } = {}) => {
      const n = Math.max(1, Math.min(32, Math.floor(count)));
      const fieldR = game.getCurrentForceFieldRadius();
      const ship = game.state.ship;
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2 + (game.state.time % 1) * 0.4;
        const x = ship.pos.x + Math.cos(angle) * fieldR;
        const y = ship.pos.y + Math.sin(angle) * fieldR;
        game.state.effects.push({
          kind: "wavelets",
          x,
          y,
          angle,
          speed,
          t: 0,
          ttl,
          rgb: [255, 221, 88],
          seed: Math.floor(Math.random() * 1e9),
        });
      }
    },
  };

  // Back-compat aliases kept during RF-09 transition.
  window.render_game_to_text = () => window.Blasteroids.renderGameToText();
  window.set_ship_svg_renderer = (tierKey, svgPathData, svgScale = 1) =>
    window.Blasteroids.setShipSvgRenderer(tierKey, svgPathData, svgScale);
  window.advanceTime = (ms) => window.Blasteroids.advanceTime(ms);
})();
