import { clamp } from "./util/math.js";
import { SHIP_TIERS, createEngine, ensureAttractRadiusCoversForcefield } from "./engine/createEngine.js";
import { createRenderer } from "./render/renderGame.js";

(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const menu = document.getElementById("menu");
  const hudScore = document.getElementById("hud-score");
  const debugToggleBtn = document.getElementById("debug-toggle");
  const startBtn = document.getElementById("start-btn");
  const dbgAttract = document.getElementById("dbg-attract");
  const shipExplode = document.getElementById("ship-explode");
  const dbgCameraMode = document.getElementById("dbg-camera-mode");
  const dbgWorldScale = document.getElementById("dbg-world-scale");
  const dbgWorldScaleOut = document.getElementById("dbg-world-scale-out");
  const dbgPauseOnOpen = document.getElementById("dbg-pause-on-open");
  const dbgTierOverride = document.getElementById("dbg-tier-override");
  const dbgTierOverrideLevel = document.getElementById("dbg-tier-override-level");
  const dbgTierOverrideOut = document.getElementById("dbg-tier-override-out");
  const dbgGemScore = document.getElementById("dbg-gem-score");
  const dbgGemScoreOut = document.getElementById("dbg-gem-score-out");
  const dbgCurrentTierOut = document.getElementById("dbg-current-tier-out");
  const tuneAttract = document.getElementById("tune-attract");
  const tuneAttractOut = document.getElementById("tune-attract-out");
  const tuneAttractSave = document.getElementById("tune-attract-save");
  const tuneAttractDefault = document.getElementById("tune-attract-default");
  const tuneField = document.getElementById("tune-field");
  const tuneFieldOut = document.getElementById("tune-field-out");
  const tuneFieldSave = document.getElementById("tune-field-save");
  const tuneFieldDefault = document.getElementById("tune-field-default");
  const tuneFieldScale1 = document.getElementById("tune-field-scale1");
  const tuneFieldScale1Out = document.getElementById("tune-field-scale1-out");
  const tuneFieldScale1Save = document.getElementById("tune-field-scale1-save");
  const tuneFieldScale1Default = document.getElementById("tune-field-scale1-default");
  const tuneFieldScale2 = document.getElementById("tune-field-scale2");
  const tuneFieldScale2Out = document.getElementById("tune-field-scale2-out");
  const tuneFieldScale2Save = document.getElementById("tune-field-scale2-save");
  const tuneFieldScale2Default = document.getElementById("tune-field-scale2-default");
  const tuneFieldScale3 = document.getElementById("tune-field-scale3");
  const tuneFieldScale3Out = document.getElementById("tune-field-scale3-out");
  const tuneFieldScale3Save = document.getElementById("tune-field-scale3-save");
  const tuneFieldScale3Default = document.getElementById("tune-field-scale3-default");
  const tuneFieldGap = document.getElementById("tune-field-gap");
  const tuneFieldGapOut = document.getElementById("tune-field-gap-out");
  const tuneFieldGapSave = document.getElementById("tune-field-gap-save");
  const tuneFieldGapDefault = document.getElementById("tune-field-gap-default");
  const tuneGravity = document.getElementById("tune-gravity");
  const tuneGravityOut = document.getElementById("tune-gravity-out");
  const tuneGravitySave = document.getElementById("tune-gravity-save");
  const tuneGravityDefault = document.getElementById("tune-gravity-default");
  const tuneInnerGrav = document.getElementById("tune-inner-grav");
  const tuneInnerGravOut = document.getElementById("tune-inner-grav-out");
  const tuneInnerGravSave = document.getElementById("tune-inner-grav-save");
  const tuneInnerGravDefault = document.getElementById("tune-inner-grav-default");
  const tuneGemTtl = document.getElementById("tune-gem-ttl");
  const tuneGemTtlOut = document.getElementById("tune-gem-ttl-out");
  const tuneGemTtlSave = document.getElementById("tune-gem-ttl-save");
  const tuneGemTtlDefault = document.getElementById("tune-gem-ttl-default");
  const tuneGemBlink = document.getElementById("tune-gem-blink");
  const tuneGemBlinkOut = document.getElementById("tune-gem-blink-out");
  const tuneGemBlinkSave = document.getElementById("tune-gem-blink-save");
  const tuneGemBlinkDefault = document.getElementById("tune-gem-blink-default");
  const tuneCapture = document.getElementById("tune-capture");
  const tuneCaptureOut = document.getElementById("tune-capture-out");
  const tuneCaptureSave = document.getElementById("tune-capture-save");
  const tuneCaptureDefault = document.getElementById("tune-capture-default");
  const tuneBurst = document.getElementById("tune-burst");
  const tuneBurstOut = document.getElementById("tune-burst-out");
  const tuneBurstSave = document.getElementById("tune-burst-save");
  const tuneBurstDefault = document.getElementById("tune-burst-default");
  const tuneThrust = document.getElementById("tune-thrust");
  const tuneThrustOut = document.getElementById("tune-thrust-out");
  const tuneThrustSave = document.getElementById("tune-thrust-save");
  const tuneThrustDefault = document.getElementById("tune-thrust-default");
  const tuneDmg = document.getElementById("tune-dmg");
  const tuneDmgOut = document.getElementById("tune-dmg-out");
  const tuneDmgSave = document.getElementById("tune-dmg-save");
  const tuneDmgDefault = document.getElementById("tune-dmg-default");
  const tuneFracture = document.getElementById("tune-fracture");
  const tuneFractureOut = document.getElementById("tune-fracture-out");
  const tuneFractureSave = document.getElementById("tune-fracture-save");
  const tuneFractureDefault = document.getElementById("tune-fracture-default");
  const tuneWorldDensity = document.getElementById("tune-world-density");
  const tuneWorldDensityOut = document.getElementById("tune-world-density-out");
  const tuneWorldDensitySave = document.getElementById("tune-world-density-save");
  const tuneWorldDensityDefault = document.getElementById("tune-world-density-default");
  const tuneXlRadius = document.getElementById("tune-xl-radius");
  const tuneXlRadiusOut = document.getElementById("tune-xl-radius-out");
  const tuneXlRadiusSave = document.getElementById("tune-xl-radius-save");
  const tuneXlRadiusDefault = document.getElementById("tune-xl-radius-default");
  const tuneXxlRadius = document.getElementById("tune-xxl-radius");
  const tuneXxlRadiusOut = document.getElementById("tune-xxl-radius-out");
  const tuneXxlRadiusSave = document.getElementById("tune-xxl-radius-save");
  const tuneXxlRadiusDefault = document.getElementById("tune-xxl-radius-default");
  const tuneXlCount = document.getElementById("tune-xl-count");
  const tuneXlCountOut = document.getElementById("tune-xl-count-out");
  const tuneXlCountSave = document.getElementById("tune-xl-count-save");
  const tuneXlCountDefault = document.getElementById("tune-xl-count-default");
  const tuneXxlCount = document.getElementById("tune-xxl-count");
  const tuneXxlCountOut = document.getElementById("tune-xxl-count-out");
  const tuneXxlCountSave = document.getElementById("tune-xxl-count-save");
  const tuneXxlCountDefault = document.getElementById("tune-xxl-count-default");
  const tuneTier2Unlock = document.getElementById("tune-tier2-unlock");
  const tuneTier2UnlockOut = document.getElementById("tune-tier2-unlock-out");
  const tuneTier2UnlockSave = document.getElementById("tune-tier2-unlock-save");
  const tuneTier2UnlockDefault = document.getElementById("tune-tier2-unlock-default");
  const tuneTier3Unlock = document.getElementById("tune-tier3-unlock");
  const tuneTier3UnlockOut = document.getElementById("tune-tier3-unlock-out");
  const tuneTier3UnlockSave = document.getElementById("tune-tier3-unlock-save");
  const tuneTier3UnlockDefault = document.getElementById("tune-tier3-unlock-default");
  const tuneTier1Zoom = document.getElementById("tune-tier1-zoom");
  const tuneTier1ZoomOut = document.getElementById("tune-tier1-zoom-out");
  const tuneTier1ZoomSave = document.getElementById("tune-tier1-zoom-save");
  const tuneTier1ZoomDefault = document.getElementById("tune-tier1-zoom-default");
  const tuneTier2Zoom = document.getElementById("tune-tier2-zoom");
  const tuneTier2ZoomOut = document.getElementById("tune-tier2-zoom-out");
  const tuneTier2ZoomSave = document.getElementById("tune-tier2-zoom-save");
  const tuneTier2ZoomDefault = document.getElementById("tune-tier2-zoom-default");
  const tuneTier3Zoom = document.getElementById("tune-tier3-zoom");
  const tuneTier3ZoomOut = document.getElementById("tune-tier3-zoom-out");
  const tuneTier3ZoomSave = document.getElementById("tune-tier3-zoom-save");
  const tuneTier3ZoomDefault = document.getElementById("tune-tier3-zoom-default");
  const tuneTierZoomSec = document.getElementById("tune-tier-zoom-sec");
  const tuneTierZoomSecOut = document.getElementById("tune-tier-zoom-sec-out");
  const tuneTierZoomSecSave = document.getElementById("tune-tier-zoom-sec-save");
  const tuneTierZoomSecDefault = document.getElementById("tune-tier-zoom-sec-default");
  const tuneStarDensity = document.getElementById("tune-star-density");
  const tuneStarDensityOut = document.getElementById("tune-star-density-out");
  const tuneStarDensitySave = document.getElementById("tune-star-density-save");
  const tuneStarDensityDefault = document.getElementById("tune-star-density-default");
  const tuneParallax = document.getElementById("tune-parallax");
  const tuneParallaxOut = document.getElementById("tune-parallax-out");
  const tuneParallaxSave = document.getElementById("tune-parallax-save");
  const tuneParallaxDefault = document.getElementById("tune-parallax-default");
  const tuneStarAccentChance = document.getElementById("tune-star-accent-chance");
  const tuneStarAccentChanceOut = document.getElementById("tune-star-accent-chance-out");
  const tuneStarAccentChanceSave = document.getElementById("tune-star-accent-chance-save");
  const tuneStarAccentChanceDefault = document.getElementById("tune-star-accent-chance-default");
  const tuneTwinkleChance = document.getElementById("tune-twinkle-chance");
  const tuneTwinkleChanceOut = document.getElementById("tune-twinkle-chance-out");
  const tuneTwinkleChanceSave = document.getElementById("tune-twinkle-chance-save");
  const tuneTwinkleChanceDefault = document.getElementById("tune-twinkle-chance-default");
  const tuneTwinkleStrength = document.getElementById("tune-twinkle-strength");
  const tuneTwinkleStrengthOut = document.getElementById("tune-twinkle-strength-out");
  const tuneTwinkleStrengthSave = document.getElementById("tune-twinkle-strength-save");
  const tuneTwinkleStrengthDefault = document.getElementById("tune-twinkle-strength-default");
  const tuneTwinkleSpeed = document.getElementById("tune-twinkle-speed");
  const tuneTwinkleSpeedOut = document.getElementById("tune-twinkle-speed-out");
  const tuneTwinkleSpeedSave = document.getElementById("tune-twinkle-speed-save");
  const tuneTwinkleSpeedDefault = document.getElementById("tune-twinkle-speed-default");

  const engine = createEngine({ width: canvas.width, height: canvas.height });
  const renderer = createRenderer(engine);
  const game = {
    ...engine,
    render: (drawCtx) => renderer.render(drawCtx),
    engine,
    renderer,
  };

  const nf = new Intl.NumberFormat();
  function setOut(outEl, value, suffix = "") {
    if (!outEl) return;
    outEl.textContent = `${nf.format(Math.round(value))}${suffix}`;
  }

  function readNum(el, fallback) {
    const v = el ? Number(el.value) : Number.NaN;
    return Number.isFinite(v) ? v : fallback;
  }

  const TUNING_DEFAULTS_STORAGE_KEY = "blasteroids.tuningDefaults.v1";
  const TUNING_FIELDS = [
    {
      key: "attractRadius",
      input: tuneAttract,
      saveBtn: tuneAttractSave,
      savedOut: tuneAttractDefault,
      suffix: " px",
    },
    {
      key: "forceFieldRadius",
      input: tuneField,
      saveBtn: tuneFieldSave,
      savedOut: tuneFieldDefault,
      suffix: " px",
    },
    {
      key: "tier1ForceFieldScale",
      input: tuneFieldScale1,
      saveBtn: tuneFieldScale1Save,
      savedOut: tuneFieldScale1Default,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "tier2ForceFieldScale",
      input: tuneFieldScale2,
      saveBtn: tuneFieldScale2Save,
      savedOut: tuneFieldScale2Default,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "tier3ForceFieldScale",
      input: tuneFieldScale3,
      saveBtn: tuneFieldScale3Save,
      savedOut: tuneFieldScale3Default,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "forceFieldHullGap",
      input: tuneFieldGap,
      saveBtn: tuneFieldGapSave,
      savedOut: tuneFieldGapDefault,
      suffix: " px",
    },
    {
      key: "gravityK",
      input: tuneGravity,
      saveBtn: tuneGravitySave,
      savedOut: tuneGravityDefault,
      suffix: "",
    },
    {
      key: "innerGravityMult",
      input: tuneInnerGrav,
      saveBtn: tuneInnerGravSave,
      savedOut: tuneInnerGravDefault,
      suffix: "",
      format: (v) => `x${Number(v).toFixed(2)}`,
    },
    {
      key: "gemTtlSec",
      input: tuneGemTtl,
      saveBtn: tuneGemTtlSave,
      savedOut: tuneGemTtlDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(1)} s`,
    },
    {
      key: "gemBlinkMaxHz",
      input: tuneGemBlink,
      saveBtn: tuneGemBlinkSave,
      savedOut: tuneGemBlinkDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(1)} /s`,
    },
    {
      key: "captureSpeed",
      input: tuneCapture,
      saveBtn: tuneCaptureSave,
      savedOut: tuneCaptureDefault,
      suffix: " px/s",
    },
    {
      key: "burstSpeed",
      input: tuneBurst,
      saveBtn: tuneBurstSave,
      savedOut: tuneBurstDefault,
      suffix: " px/s",
    },
    {
      key: "shipThrust",
      input: tuneThrust,
      saveBtn: tuneThrustSave,
      savedOut: tuneThrustDefault,
      suffix: " px/s^2",
    },
    {
      key: "smallDamageSpeedMin",
      input: tuneDmg,
      saveBtn: tuneDmgSave,
      savedOut: tuneDmgDefault,
      suffix: " px/s",
    },
    {
      key: "xlargeRadius",
      input: tuneXlRadius,
      saveBtn: tuneXlRadiusSave,
      savedOut: tuneXlRadiusDefault,
      suffix: " px",
    },
    {
      key: "xxlargeRadius",
      input: tuneXxlRadius,
      saveBtn: tuneXxlRadiusSave,
      savedOut: tuneXxlRadiusDefault,
      suffix: " px",
    },
    {
      key: "xlargeCount",
      input: tuneXlCount,
      saveBtn: tuneXlCountSave,
      savedOut: tuneXlCountDefault,
      suffix: "",
    },
    {
      key: "xxlargeCount",
      input: tuneXxlCount,
      saveBtn: tuneXxlCountSave,
      savedOut: tuneXxlCountDefault,
      suffix: "",
    },
    {
      key: "fractureImpactSpeed",
      input: tuneFracture,
      saveBtn: tuneFractureSave,
      savedOut: tuneFractureDefault,
      suffix: " px/s",
    },
    {
      key: "tier2UnlockGemScore",
      input: tuneTier2Unlock,
      saveBtn: tuneTier2UnlockSave,
      savedOut: tuneTier2UnlockDefault,
      suffix: "",
    },
    {
      key: "tier3UnlockGemScore",
      input: tuneTier3Unlock,
      saveBtn: tuneTier3UnlockSave,
      savedOut: tuneTier3UnlockDefault,
      suffix: "",
    },
    {
      key: "tier1Zoom",
      input: tuneTier1Zoom,
      saveBtn: tuneTier1ZoomSave,
      savedOut: tuneTier1ZoomDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "tier2Zoom",
      input: tuneTier2Zoom,
      saveBtn: tuneTier2ZoomSave,
      savedOut: tuneTier2ZoomDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "tier3Zoom",
      input: tuneTier3Zoom,
      saveBtn: tuneTier3ZoomSave,
      savedOut: tuneTier3ZoomDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "tierZoomTweenSec",
      input: tuneTierZoomSec,
      saveBtn: tuneTierZoomSecSave,
      savedOut: tuneTierZoomSecDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)} s`,
    },
    {
      key: "asteroidWorldDensityScale",
      input: tuneWorldDensity,
      saveBtn: tuneWorldDensitySave,
      savedOut: tuneWorldDensityDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "starDensityScale",
      input: tuneStarDensity,
      saveBtn: tuneStarDensitySave,
      savedOut: tuneStarDensityDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "starParallaxStrength",
      input: tuneParallax,
      saveBtn: tuneParallaxSave,
      savedOut: tuneParallaxDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "starAccentChance",
      input: tuneStarAccentChance,
      saveBtn: tuneStarAccentChanceSave,
      savedOut: tuneStarAccentChanceDefault,
      suffix: "",
      format: (v) => `${(Number(v) * 100).toFixed(0)}%`,
    },
    {
      key: "starTwinkleChance",
      input: tuneTwinkleChance,
      saveBtn: tuneTwinkleChanceSave,
      savedOut: tuneTwinkleChanceDefault,
      suffix: "",
      format: (v) => `${(Number(v) * 100).toFixed(0)}%`,
    },
    {
      key: "starTwinkleStrength",
      input: tuneTwinkleStrength,
      saveBtn: tuneTwinkleStrengthSave,
      savedOut: tuneTwinkleStrengthDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "starTwinkleSpeed",
      input: tuneTwinkleSpeed,
      saveBtn: tuneTwinkleSpeedSave,
      savedOut: tuneTwinkleSpeedDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
  ];

  function readTuningDefaultsFromStorage() {
    try {
      const raw = localStorage.getItem(TUNING_DEFAULTS_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      const out = {};
      for (const f of TUNING_FIELDS) {
        const v = parsed[f.key];
        if (Number.isFinite(Number(v))) out[f.key] = Number(v);
      }
      return out;
    } catch {
      return null;
    }
  }

  function writeTuningDefaultsToStorage(obj) {
    try {
      localStorage.setItem(TUNING_DEFAULTS_STORAGE_KEY, JSON.stringify(obj));
    } catch {
      // ignore (private mode / blocked storage)
    }
  }

  function setTuningDefault(key, value) {
    const next = { ...(readTuningDefaultsFromStorage() || {}) };
    next[key] = value;
    writeTuningDefaultsToStorage(next);
    return next;
  }

  function applyTuningDefaultsToParams() {
    const defaults = readTuningDefaultsFromStorage();
    if (!defaults) return;
    const p = game.state.params;
    for (const f of TUNING_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(defaults, f.key)) continue;
      p[f.key] = defaults[f.key];
    }

    // Normalize and keep storage sane if an old combo is invalid.
    const before = {
      attractRadius: p.attractRadius,
      forceFieldRadius: p.forceFieldRadius,
    };
    p.forceFieldRadius = clamp(p.forceFieldRadius, 40, 420);
    p.tier1ForceFieldScale = clamp(Number(p.tier1ForceFieldScale ?? SHIP_TIERS.small.forcefieldScale), 0.2, 6);
    p.tier2ForceFieldScale = clamp(Number(p.tier2ForceFieldScale ?? SHIP_TIERS.medium.forcefieldScale), 0.2, 6);
    p.tier3ForceFieldScale = clamp(Number(p.tier3ForceFieldScale ?? SHIP_TIERS.large.forcefieldScale), 0.2, 6);
    p.forceFieldHullGap = clamp(Number(p.forceFieldHullGap ?? 14), 0, 200);
    ensureAttractRadiusCoversForcefield(p);
    p.xlargeRadius = clamp(p.xlargeRadius, p.largeRadius + 6, 220);
    p.xxlargeRadius = clamp(p.xxlargeRadius, p.xlargeRadius + 6, 320);
    p.xlargeCount = clamp(Math.round(p.xlargeCount), 0, 50);
    p.xxlargeCount = clamp(Math.round(p.xxlargeCount), 0, 50);
    p.tier2UnlockGemScore = clamp(Math.round(p.tier2UnlockGemScore), 1, 10000);
    p.tier3UnlockGemScore = clamp(Math.round(p.tier3UnlockGemScore), p.tier2UnlockGemScore + 50, 10000);
    p.tier1Zoom = clamp(p.tier1Zoom, 0.35, 1.2);
    p.tier2Zoom = clamp(p.tier2Zoom, 0.35, 1.2);
    p.tier3Zoom = clamp(p.tier3Zoom, 0.35, 1.2);
    p.tierZoomTweenSec = clamp(p.tierZoomTweenSec, 0.05, 1.2);
    if (
      Object.prototype.hasOwnProperty.call(defaults, "forceFieldRadius") &&
      before.forceFieldRadius !== p.forceFieldRadius
    ) {
      defaults.forceFieldRadius = p.forceFieldRadius;
      writeTuningDefaultsToStorage(defaults);
    }
    if (Object.prototype.hasOwnProperty.call(defaults, "attractRadius") && before.attractRadius !== p.attractRadius) {
      defaults.attractRadius = p.attractRadius;
      writeTuningDefaultsToStorage(defaults);
    }
  }

  function syncTuningDefaultLabels() {
    const defaults = readTuningDefaultsFromStorage() || {};
    for (const f of TUNING_FIELDS) {
      const v = defaults[f.key];
      if (Number.isFinite(v)) {
        if (f.format && f.savedOut) f.savedOut.textContent = f.format(v);
        else setOut(f.savedOut, v, f.suffix);
      }
      else if (f.savedOut) f.savedOut.textContent = "—";
    }
  }

  function syncTuningUiFromParams() {
    const p = game.state.params;
    if (tuneAttract) {
      const maxNow = Number(tuneAttract.max || 0);
      if (Number.isFinite(maxNow) && maxNow > 0 && p.attractRadius > maxNow) tuneAttract.max = String(Math.ceil(p.attractRadius));
      tuneAttract.value = String(Math.round(p.attractRadius));
    }
    if (tuneField) tuneField.value = String(Math.round(p.forceFieldRadius));
    if (tuneFieldScale1) tuneFieldScale1.value = String(p.tier1ForceFieldScale);
    if (tuneFieldScale2) tuneFieldScale2.value = String(p.tier2ForceFieldScale);
    if (tuneFieldScale3) tuneFieldScale3.value = String(p.tier3ForceFieldScale);
    if (tuneFieldGap) tuneFieldGap.value = String(Math.round(p.forceFieldHullGap));
    if (tuneGravity) tuneGravity.value = String(Math.round(p.gravityK));
    if (tuneInnerGrav) tuneInnerGrav.value = String(p.innerGravityMult);
    if (tuneGemTtl) tuneGemTtl.value = String(p.gemTtlSec);
    if (tuneGemBlink) tuneGemBlink.value = String(p.gemBlinkMaxHz);
    if (tuneCapture) tuneCapture.value = String(Math.round(p.captureSpeed));
    if (tuneBurst) tuneBurst.value = String(Math.round(p.burstSpeed));
    if (tuneThrust) tuneThrust.value = String(Math.round(p.shipThrust));
    if (tuneDmg) tuneDmg.value = String(Math.round(p.smallDamageSpeedMin));
    if (tuneXlRadius) tuneXlRadius.value = String(Math.round(p.xlargeRadius));
    if (tuneXxlRadius) tuneXxlRadius.value = String(Math.round(p.xxlargeRadius));
    if (tuneXlCount) tuneXlCount.value = String(Math.round(p.xlargeCount));
    if (tuneXxlCount) tuneXxlCount.value = String(Math.round(p.xxlargeCount));
    if (tuneFracture) tuneFracture.value = String(Math.round(p.fractureImpactSpeed));
    if (tuneTier2Unlock) tuneTier2Unlock.value = String(Math.round(p.tier2UnlockGemScore));
    if (tuneTier3Unlock) tuneTier3Unlock.value = String(Math.round(p.tier3UnlockGemScore));
    if (tuneTier1Zoom) tuneTier1Zoom.value = String(p.tier1Zoom);
    if (tuneTier2Zoom) tuneTier2Zoom.value = String(p.tier2Zoom);
    if (tuneTier3Zoom) tuneTier3Zoom.value = String(p.tier3Zoom);
    if (tuneTierZoomSec) tuneTierZoomSec.value = String(p.tierZoomTweenSec);
    if (tuneWorldDensity) tuneWorldDensity.value = String(p.asteroidWorldDensityScale);
    if (tuneStarDensity) tuneStarDensity.value = String(p.starDensityScale);
    if (tuneParallax) tuneParallax.value = String(p.starParallaxStrength);
    if (tuneStarAccentChance) tuneStarAccentChance.value = String(p.starAccentChance);
    if (tuneTwinkleChance) tuneTwinkleChance.value = String(p.starTwinkleChance);
    if (tuneTwinkleStrength) tuneTwinkleStrength.value = String(p.starTwinkleStrength);
    if (tuneTwinkleSpeed) tuneTwinkleSpeed.value = String(p.starTwinkleSpeed);
    syncTuningUiLabels();
  }

  function syncTuningUiLabels() {
    const p = game.state.params;
    setOut(tuneAttractOut, readNum(tuneAttract, p.attractRadius), " px");
    setOut(tuneFieldOut, readNum(tuneField, p.forceFieldRadius), " px");
    if (tuneFieldScale1Out) tuneFieldScale1Out.textContent = `${readNum(tuneFieldScale1, p.tier1ForceFieldScale).toFixed(2)}x`;
    if (tuneFieldScale2Out) tuneFieldScale2Out.textContent = `${readNum(tuneFieldScale2, p.tier2ForceFieldScale).toFixed(2)}x`;
    if (tuneFieldScale3Out) tuneFieldScale3Out.textContent = `${readNum(tuneFieldScale3, p.tier3ForceFieldScale).toFixed(2)}x`;
    setOut(tuneFieldGapOut, readNum(tuneFieldGap, p.forceFieldHullGap), " px");
    setOut(tuneGravityOut, readNum(tuneGravity, p.gravityK));
    if (tuneInnerGravOut) tuneInnerGravOut.textContent = `x${readNum(tuneInnerGrav, p.innerGravityMult).toFixed(2)}`;
    if (tuneGemTtlOut) tuneGemTtlOut.textContent = `${readNum(tuneGemTtl, p.gemTtlSec).toFixed(1)} s`;
    if (tuneGemBlinkOut) tuneGemBlinkOut.textContent = `${readNum(tuneGemBlink, p.gemBlinkMaxHz).toFixed(1)} /s`;
    setOut(tuneCaptureOut, readNum(tuneCapture, p.captureSpeed), " px/s");
    setOut(tuneBurstOut, readNum(tuneBurst, p.burstSpeed), " px/s");
    setOut(tuneThrustOut, readNum(tuneThrust, p.shipThrust), " px/s^2");
    setOut(tuneDmgOut, readNum(tuneDmg, p.smallDamageSpeedMin), " px/s");
    setOut(tuneXlRadiusOut, readNum(tuneXlRadius, p.xlargeRadius), " px");
    setOut(tuneXxlRadiusOut, readNum(tuneXxlRadius, p.xxlargeRadius), " px");
    setOut(tuneXlCountOut, readNum(tuneXlCount, p.xlargeCount));
    setOut(tuneXxlCountOut, readNum(tuneXxlCount, p.xxlargeCount));
    setOut(tuneFractureOut, readNum(tuneFracture, p.fractureImpactSpeed), " px/s");
    setOut(tuneTier2UnlockOut, readNum(tuneTier2Unlock, p.tier2UnlockGemScore));
    setOut(tuneTier3UnlockOut, readNum(tuneTier3Unlock, p.tier3UnlockGemScore));
    if (tuneTier1ZoomOut) tuneTier1ZoomOut.textContent = `${readNum(tuneTier1Zoom, p.tier1Zoom).toFixed(2)}x`;
    if (tuneTier2ZoomOut) tuneTier2ZoomOut.textContent = `${readNum(tuneTier2Zoom, p.tier2Zoom).toFixed(2)}x`;
    if (tuneTier3ZoomOut) tuneTier3ZoomOut.textContent = `${readNum(tuneTier3Zoom, p.tier3Zoom).toFixed(2)}x`;
    if (tuneTierZoomSecOut) tuneTierZoomSecOut.textContent = `${readNum(tuneTierZoomSec, p.tierZoomTweenSec).toFixed(2)} s`;
    if (tuneWorldDensityOut) {
      tuneWorldDensityOut.textContent = `${readNum(tuneWorldDensity, p.asteroidWorldDensityScale).toFixed(2)}x`;
    }
    if (tuneStarDensityOut) tuneStarDensityOut.textContent = `${readNum(tuneStarDensity, p.starDensityScale).toFixed(2)}x`;
    if (tuneParallaxOut) tuneParallaxOut.textContent = `${readNum(tuneParallax, p.starParallaxStrength).toFixed(2)}x`;
    if (tuneStarAccentChanceOut) {
      tuneStarAccentChanceOut.textContent = `${(readNum(tuneStarAccentChance, p.starAccentChance) * 100).toFixed(0)}%`;
    }
    if (tuneTwinkleChanceOut) {
      tuneTwinkleChanceOut.textContent = `${(readNum(tuneTwinkleChance, p.starTwinkleChance) * 100).toFixed(0)}%`;
    }
    if (tuneTwinkleStrengthOut) {
      tuneTwinkleStrengthOut.textContent = `${readNum(tuneTwinkleStrength, p.starTwinkleStrength).toFixed(2)}x`;
    }
    if (tuneTwinkleSpeedOut) {
      tuneTwinkleSpeedOut.textContent = `${readNum(tuneTwinkleSpeed, p.starTwinkleSpeed).toFixed(2)}x`;
    }
  }

  function bindTuneInput(el) {
    if (!el) return;
    el.addEventListener("input", () => {
      syncTuningUiLabels();
      applyTuningFromMenu();
    });
  }
  bindTuneInput(tuneAttract);
  bindTuneInput(tuneField);
  bindTuneInput(tuneFieldScale1);
  bindTuneInput(tuneFieldScale2);
  bindTuneInput(tuneFieldScale3);
  bindTuneInput(tuneFieldGap);
  bindTuneInput(tuneGravity);
  bindTuneInput(tuneInnerGrav);
  bindTuneInput(tuneGemTtl);
  bindTuneInput(tuneGemBlink);
  bindTuneInput(tuneCapture);
  bindTuneInput(tuneBurst);
  bindTuneInput(tuneThrust);
  bindTuneInput(tuneDmg);
  bindTuneInput(tuneXlRadius);
  bindTuneInput(tuneXxlRadius);
  bindTuneInput(tuneXlCount);
  bindTuneInput(tuneXxlCount);
  bindTuneInput(tuneFracture);
  bindTuneInput(tuneTier2Unlock);
  bindTuneInput(tuneTier3Unlock);
  bindTuneInput(tuneTier1Zoom);
  bindTuneInput(tuneTier2Zoom);
  bindTuneInput(tuneTier3Zoom);
  bindTuneInput(tuneTierZoomSec);
  bindTuneInput(tuneWorldDensity);
  bindTuneInput(tuneStarDensity);
  bindTuneInput(tuneParallax);
  bindTuneInput(tuneStarAccentChance);
  bindTuneInput(tuneTwinkleChance);
  bindTuneInput(tuneTwinkleStrength);
  bindTuneInput(tuneTwinkleSpeed);

  function applyTuningFromMenu() {
    const p = game.state.params;
    p.attractRadius = readNum(tuneAttract, p.attractRadius);
    p.forceFieldRadius = readNum(tuneField, p.forceFieldRadius);
    p.forceFieldRadius = clamp(p.forceFieldRadius, 40, 420);
    p.tier1ForceFieldScale = clamp(readNum(tuneFieldScale1, p.tier1ForceFieldScale), 0.2, 6);
    p.tier2ForceFieldScale = clamp(readNum(tuneFieldScale2, p.tier2ForceFieldScale), 0.2, 6);
    p.tier3ForceFieldScale = clamp(readNum(tuneFieldScale3, p.tier3ForceFieldScale), 0.2, 6);
    p.forceFieldHullGap = clamp(Math.round(readNum(tuneFieldGap, p.forceFieldHullGap)), 0, 200);
    ensureAttractRadiusCoversForcefield(p);
    p.gravityK = readNum(tuneGravity, p.gravityK);
    p.innerGravityMult = clamp(readNum(tuneInnerGrav, p.innerGravityMult), 1, 8);
    p.gemTtlSec = clamp(readNum(tuneGemTtl, p.gemTtlSec), 0.5, 60);
    p.gemBlinkMaxHz = clamp(readNum(tuneGemBlink, p.gemBlinkMaxHz), 0.25, 12);
    p.captureSpeed = readNum(tuneCapture, p.captureSpeed);
    p.burstSpeed = readNum(tuneBurst, p.burstSpeed);
    p.shipThrust = readNum(tuneThrust, p.shipThrust);
    p.smallDamageSpeedMin = readNum(tuneDmg, p.smallDamageSpeedMin);
    p.xlargeRadius = clamp(readNum(tuneXlRadius, p.xlargeRadius), p.largeRadius + 6, 220);
    p.xxlargeRadius = clamp(readNum(tuneXxlRadius, p.xxlargeRadius), p.xlargeRadius + 6, 320);
    p.xlargeCount = clamp(Math.round(readNum(tuneXlCount, p.xlargeCount)), 0, 50);
    p.xxlargeCount = clamp(Math.round(readNum(tuneXxlCount, p.xxlargeCount)), 0, 50);
    p.fractureImpactSpeed = readNum(tuneFracture, p.fractureImpactSpeed);
    p.tier2UnlockGemScore = clamp(Math.round(readNum(tuneTier2Unlock, p.tier2UnlockGemScore)), 1, 10000);
    p.tier3UnlockGemScore = clamp(Math.round(readNum(tuneTier3Unlock, p.tier3UnlockGemScore)), 1, 10000);
    if (p.tier3UnlockGemScore <= p.tier2UnlockGemScore) p.tier3UnlockGemScore = p.tier2UnlockGemScore + 50;
    p.tier1Zoom = clamp(readNum(tuneTier1Zoom, p.tier1Zoom), 0.35, 1.2);
    p.tier2Zoom = clamp(readNum(tuneTier2Zoom, p.tier2Zoom), 0.35, 1.2);
    p.tier3Zoom = clamp(readNum(tuneTier3Zoom, p.tier3Zoom), 0.35, 1.2);
    p.tierZoomTweenSec = clamp(readNum(tuneTierZoomSec, p.tierZoomTweenSec), 0.05, 1.2);
    p.asteroidWorldDensityScale = clamp(readNum(tuneWorldDensity, p.asteroidWorldDensityScale), 0.08, 2.5);
    p.starDensityScale = clamp(readNum(tuneStarDensity, p.starDensityScale), 0.4, 2.2);
    p.starParallaxStrength = clamp(readNum(tuneParallax, p.starParallaxStrength), 0, 1.8);
    p.starAccentChance = clamp(readNum(tuneStarAccentChance, p.starAccentChance), 0, 0.35);
    p.starTwinkleChance = clamp(readNum(tuneTwinkleChance, p.starTwinkleChance), 0, 1);
    p.starTwinkleStrength = clamp(readNum(tuneTwinkleStrength, p.starTwinkleStrength), 0, 0.8);
    p.starTwinkleSpeed = clamp(readNum(tuneTwinkleSpeed, p.starTwinkleSpeed), 0.2, 3);
    game.state.settings.tierOverrideEnabled = !!dbgTierOverride?.checked;
    game.state.settings.tierOverrideIndex = clamp(Math.round(readNum(dbgTierOverrideLevel, 1)), 1, 3);
    game.state.settings.pauseOnMenuOpen = !!dbgPauseOnOpen?.checked;
    game.refreshBackground();
    game.refreshProgression({ animateZoom: false });
    syncTuningUiFromParams();
  }

  function syncArenaUi() {
    if (dbgCameraMode) dbgCameraMode.value = game.state.camera.mode || "centered";
    if (dbgWorldScale) dbgWorldScale.value = String(game.state.world.scale || 1);
    if (dbgWorldScaleOut) dbgWorldScaleOut.textContent = `${Number(game.state.world.scale || 1).toFixed(2)}x`;
    if (dbgPauseOnOpen) dbgPauseOnOpen.checked = !!game.state.settings.pauseOnMenuOpen;
    if (dbgTierOverride) dbgTierOverride.checked = !!game.state.settings.tierOverrideEnabled;
    if (dbgTierOverrideLevel) dbgTierOverrideLevel.value = String(Math.round(game.state.settings.tierOverrideIndex || 1));
    if (dbgTierOverrideOut) dbgTierOverrideOut.textContent = `${Math.round(game.state.settings.tierOverrideIndex || 1)}`;
  }

  function applyArenaFromMenu() {
    const mode = dbgCameraMode?.value === "deadzone" ? "deadzone" : "centered";
    const scale = clamp(readNum(dbgWorldScale, game.state.world.scale || 1), 1, 10);
    game.setArenaConfig({ cameraMode: mode, worldScale: scale });
    if (dbgWorldScale) dbgWorldScale.value = String(scale);
    if (dbgWorldScaleOut) dbgWorldScaleOut.textContent = `${scale.toFixed(2)}x`;
    game.state.settings.pauseOnMenuOpen = !!dbgPauseOnOpen?.checked;
    game.state.settings.tierOverrideEnabled = !!dbgTierOverride?.checked;
    game.state.settings.tierOverrideIndex = clamp(Math.round(readNum(dbgTierOverrideLevel, 1)), 1, 3);
    if (dbgTierOverrideOut) dbgTierOverrideOut.textContent = `${Math.round(game.state.settings.tierOverrideIndex)}`;
    game.refreshProgression({ animateZoom: false });
  }

  function applyDebugFlagsFromMenu() {
    game.state.settings.showAttractRadius = !!dbgAttract?.checked;
    game.state.settings.shipExplodesOnImpact = !!shipExplode?.checked;
    game.state.settings.pauseOnMenuOpen = !!dbgPauseOnOpen?.checked;
    game.state.settings.tierOverrideEnabled = !!dbgTierOverride?.checked;
    game.state.settings.tierOverrideIndex = clamp(Math.round(readNum(dbgTierOverrideLevel, 1)), 1, 3);
    if (dbgTierOverrideOut) dbgTierOverrideOut.textContent = `${Math.round(game.state.settings.tierOverrideIndex)}`;
  }

  function syncRuntimeDebugUi() {
    if (dbgGemScoreOut) dbgGemScoreOut.textContent = `${Math.round(game.state.score)}`;
    if (dbgCurrentTierOut) dbgCurrentTierOut.textContent = `${game.state.progression.currentTier}`;
    if (dbgGemScore && document.activeElement !== dbgGemScore) {
      dbgGemScore.value = String(clamp(Math.round(game.state.score), 0, 5000));
    }
  }

  function isMenuVisible() {
    return menu.style.display !== "none";
  }

  function clearHeldInput() {
    const i = game.state.input;
    i.left = false;
    i.right = false;
    i.up = false;
    i.down = false;
    i.burst = false;
  }

  function syncMenuButtons() {
    const playing = game.state.mode === "playing";
    if (startBtn) startBtn.textContent = playing ? "Apply + Resume" : "Start";
    if (debugToggleBtn) {
      const visible = isMenuVisible();
      debugToggleBtn.textContent = visible ? "Close Debug (M)" : "Open Debug (M)";
      debugToggleBtn.setAttribute("aria-expanded", visible ? "true" : "false");
    }
  }

  function setMenuVisible(visible) {
    menu.style.display = visible ? "grid" : "none";
    if (visible) clearHeldInput();
    if (visible) syncRuntimeDebugUi();
    syncMenuButtons();
  }

  function startOrResume() {
    applyTuningFromMenu();
    applyDebugFlagsFromMenu();
    applyArenaFromMenu();
    if (game.state.mode === "menu") {
      game.startGame();
    } else if (game.state.mode === "gameover") {
      game.resetWorld();
      game.state.mode = "playing";
    }
    setMenuVisible(false);
  }

  function toggleDebugMenu() {
    if (isMenuVisible()) setMenuVisible(false);
    else {
      syncTuningUiFromParams();
      syncArenaUi();
      setMenuVisible(true);
    }
  }

  startBtn.addEventListener("click", () => startOrResume());
  if (debugToggleBtn) debugToggleBtn.addEventListener("click", () => toggleDebugMenu());
  applyTuningDefaultsToParams();
  syncTuningUiFromParams();
  applyTuningFromMenu();
  syncArenaUi();
  applyArenaFromMenu();
  applyDebugFlagsFromMenu();
  syncMenuButtons();
  syncRuntimeDebugUi();
  syncTuningDefaultLabels();

  if (dbgCameraMode) dbgCameraMode.addEventListener("change", () => applyArenaFromMenu());
  if (dbgWorldScale) dbgWorldScale.addEventListener("input", () => applyArenaFromMenu());
  if (dbgPauseOnOpen) dbgPauseOnOpen.addEventListener("change", () => applyDebugFlagsFromMenu());
  if (dbgTierOverride) dbgTierOverride.addEventListener("change", () => {
    applyDebugFlagsFromMenu();
    game.refreshProgression({ animateZoom: false });
  });
  if (dbgTierOverrideLevel) {
    dbgTierOverrideLevel.addEventListener("input", () => {
      applyDebugFlagsFromMenu();
      game.refreshProgression({ animateZoom: false });
    });
  }
  if (dbgGemScore) {
    dbgGemScore.addEventListener("input", () => {
      game.state.score = clamp(Math.round(readNum(dbgGemScore, game.state.score)), 0, 5000);
      game.refreshProgression({ animateZoom: true });
      syncRuntimeDebugUi();
    });
  }
  if (dbgAttract) dbgAttract.addEventListener("change", () => applyDebugFlagsFromMenu());
  if (shipExplode) shipExplode.addEventListener("change", () => applyDebugFlagsFromMenu());

  for (const f of TUNING_FIELDS) {
    if (!f.saveBtn || !f.input) continue;
    f.saveBtn.addEventListener("click", () => {
      const p = game.state.params;
      const v = readNum(f.input, p[f.key]);
      setTuningDefault(f.key, v);
      syncTuningDefaultLabels();
      const prev = f.saveBtn.textContent;
      f.saveBtn.textContent = "Saved";
      window.setTimeout(() => {
        f.saveBtn.textContent = prev;
      }, 800);
    });
  }

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

  window.addEventListener("resize", () => resizeCanvasToCss());
  resizeCanvasToCss();

  const input = game.state.input;
  function setKey(e, isDown) {
    const menuOpen = isMenuVisible();
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
      case "KeyR":
        if (isDown) {
          applyTuningFromMenu();
          applyDebugFlagsFromMenu();
          applyArenaFromMenu();
          game.resetWorld();
          game.state.mode = "playing";
          setMenuVisible(false);
        }
        break;
      case "KeyF":
        if (isDown) toggleFullscreen();
        break;
      case "KeyM":
      case "Backquote":
        if (isDown) {
          if (game.state.mode === "playing" || game.state.mode === "gameover") toggleDebugMenu();
        }
        e.preventDefault();
        break;
      case "Escape":
        if (isDown && isMenuVisible() && (game.state.mode === "playing" || game.state.mode === "gameover")) {
          setMenuVisible(false);
          e.preventDefault();
        }
        break;
    }
  }

  window.addEventListener("keydown", (e) => setKey(e, true));
  window.addEventListener("keyup", (e) => setKey(e, false));

  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0 && game.state.mode === "playing") input.burst = true;
  });

  function toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  document.addEventListener("fullscreenchange", () => resizeCanvasToCss());

  let externalStepping = false;
  let last = performance.now();
  let accumulator = 0;
  const fixedDt = 1 / 60;

  function stepRealTime(ts) {
    const dtMs = Math.min(50, ts - last);
    last = ts;
    accumulator += dtMs / 1000;

    const pausedByMenu =
      isMenuVisible() &&
      game.state.mode === "playing" &&
      !!game.state.settings.pauseOnMenuOpen &&
      !externalStepping;

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
    if (hudScore) hudScore.textContent = `Score: ${nf.format(game.state.score)}`;
    syncRuntimeDebugUi();
    requestAnimationFrame(stepRealTime);
  }
  requestAnimationFrame(stepRealTime);

  window.render_game_to_text = () => game.renderGameToText();
  window.set_ship_svg_renderer = (tierKey, svgPathData, svgScale = 1) =>
    game.setShipSvgRenderer(tierKey, svgPathData, svgScale);
  window.advanceTime = (ms) => {
    externalStepping = true;
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let i = 0; i < steps; i++) game.update(1 / 60);
    game.render(ctx);
    if (hudScore) hudScore.textContent = `Score: ${nf.format(game.state.score)}`;
    syncRuntimeDebugUi();
  };

  canvas.addEventListener("click", () => {
    if (game.state.mode === "menu") startOrResume();
  });
})();
