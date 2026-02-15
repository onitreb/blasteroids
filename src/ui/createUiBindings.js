import { clamp } from "../util/math.js";
import { wrapAngle } from "../util/angle.js";
import { SHIP_TIERS, ensureAttractRadiusCoversForcefield } from "../engine/createEngine.js";

export const DEBUG_MENU_CONTROL_IDS = Object.freeze([
  "dbg-attract",
  "ship-explode",
  "dbg-camera-mode",
  "dbg-world-scale",
  "dbg-pause-on-open",
  "dbg-tier-override",
  "dbg-tier-override-level",
  "dbg-gem-score",
  "tune-tier2-unlock",
  "tune-tier3-unlock",
  "tune-tier1-zoom",
  "tune-tier2-zoom",
  "tune-tier3-zoom",
  "tune-tier-zoom-sec",
  "tune-attract",
  "tune-field",
  "tune-field-scale1",
  "tune-field-scale2",
  "tune-field-scale3",
  "tune-field-gap",
  "tune-gravity",
  "tune-inner-grav",
  "tune-gravity-soft",
  "tune-inner-drag",
  "tune-ring-k",
  "tune-ring-damp",
  "tune-capture",
  "tune-burst",
  "tune-thrust",
  "tune-exhaust-intensity",
  "tune-exhaust-sparks",
  "tune-exhaust-palette",
  "tune-exhaust-core",
  "tune-exhaust-glow",
  "tune-exhaust-jets",
  "tune-dmg",
  "tune-fracture",
  "tune-fracture-sizeexp",
  "tune-fracture-chip",
  "tune-fracture-decay",
  "tune-fracture-minspeed",
  "tune-fracture-shear",
  "tune-fracture-shearref",
  "tune-world-density",
  "tune-spawn-rate",
  "tune-xl-radius",
  "tune-xxl-radius",
  "tune-xl-count",
  "tune-xxl-count",
  "tune-gem-ttl",
  "tune-gem-blink",
  "tune-star-density",
  "tune-parallax",
  "tune-star-accent-chance",
  "tune-twinkle-chance",
  "tune-twinkle-strength",
  "tune-twinkle-speed",
  "tune-tech-ping-cooldown",
]);

export function createUiBindings({ game, canvas, documentRef = document, windowRef = window }) {
  const menu = documentRef.getElementById("menu");
  const hudScore = documentRef.getElementById("hud-score");
  const hudMp = documentRef.getElementById("hud-mp");
  const debugToggleBtn = documentRef.getElementById("debug-toggle");
  const startBtn = documentRef.getElementById("start-btn");
  const dbgAttract = documentRef.getElementById("dbg-attract");
  const shipExplode = documentRef.getElementById("ship-explode");
  const dbgCameraMode = documentRef.getElementById("dbg-camera-mode");
  const dbgWorldScale = documentRef.getElementById("dbg-world-scale");
  const dbgWorldScaleOut = documentRef.getElementById("dbg-world-scale-out");
  const dbgPauseOnOpen = documentRef.getElementById("dbg-pause-on-open");
  const dbgTierOverride = documentRef.getElementById("dbg-tier-override");
  const dbgTierOverrideLevel = documentRef.getElementById("dbg-tier-override-level");
  const dbgTierOverrideOut = documentRef.getElementById("dbg-tier-override-out");
  const dbgGemScore = documentRef.getElementById("dbg-gem-score");
  const dbgGemScoreOut = documentRef.getElementById("dbg-gem-score-out");
  const dbgCurrentTierOut = documentRef.getElementById("dbg-current-tier-out");
  const tuneAttract = documentRef.getElementById("tune-attract");
  const tuneAttractOut = documentRef.getElementById("tune-attract-out");
  const tuneAttractSave = documentRef.getElementById("tune-attract-save");
  const tuneAttractDefault = documentRef.getElementById("tune-attract-default");
  const tuneField = documentRef.getElementById("tune-field");
  const tuneFieldOut = documentRef.getElementById("tune-field-out");
  const tuneFieldSave = documentRef.getElementById("tune-field-save");
  const tuneFieldDefault = documentRef.getElementById("tune-field-default");
  const tuneFieldScale1 = documentRef.getElementById("tune-field-scale1");
  const tuneFieldScale1Out = documentRef.getElementById("tune-field-scale1-out");
  const tuneFieldScale1Save = documentRef.getElementById("tune-field-scale1-save");
  const tuneFieldScale1Default = documentRef.getElementById("tune-field-scale1-default");
  const tuneFieldScale2 = documentRef.getElementById("tune-field-scale2");
  const tuneFieldScale2Out = documentRef.getElementById("tune-field-scale2-out");
  const tuneFieldScale2Save = documentRef.getElementById("tune-field-scale2-save");
  const tuneFieldScale2Default = documentRef.getElementById("tune-field-scale2-default");
  const tuneFieldScale3 = documentRef.getElementById("tune-field-scale3");
  const tuneFieldScale3Out = documentRef.getElementById("tune-field-scale3-out");
  const tuneFieldScale3Save = documentRef.getElementById("tune-field-scale3-save");
  const tuneFieldScale3Default = documentRef.getElementById("tune-field-scale3-default");
  const tuneFieldGap = documentRef.getElementById("tune-field-gap");
  const tuneFieldGapOut = documentRef.getElementById("tune-field-gap-out");
  const tuneFieldGapSave = documentRef.getElementById("tune-field-gap-save");
  const tuneFieldGapDefault = documentRef.getElementById("tune-field-gap-default");
  const tuneGravity = documentRef.getElementById("tune-gravity");
  const tuneGravityOut = documentRef.getElementById("tune-gravity-out");
  const tuneGravitySave = documentRef.getElementById("tune-gravity-save");
  const tuneGravityDefault = documentRef.getElementById("tune-gravity-default");
  const tuneInnerGrav = documentRef.getElementById("tune-inner-grav");
  const tuneInnerGravOut = documentRef.getElementById("tune-inner-grav-out");
  const tuneInnerGravSave = documentRef.getElementById("tune-inner-grav-save");
  const tuneInnerGravDefault = documentRef.getElementById("tune-inner-grav-default");
  const tuneGravitySoft = documentRef.getElementById("tune-gravity-soft");
  const tuneGravitySoftOut = documentRef.getElementById("tune-gravity-soft-out");
  const tuneGravitySoftSave = documentRef.getElementById("tune-gravity-soft-save");
  const tuneGravitySoftDefault = documentRef.getElementById("tune-gravity-soft-default");
  const tuneInnerDrag = documentRef.getElementById("tune-inner-drag");
  const tuneInnerDragOut = documentRef.getElementById("tune-inner-drag-out");
  const tuneInnerDragSave = documentRef.getElementById("tune-inner-drag-save");
  const tuneInnerDragDefault = documentRef.getElementById("tune-inner-drag-default");
  const tuneRingK = documentRef.getElementById("tune-ring-k");
  const tuneRingKOut = documentRef.getElementById("tune-ring-k-out");
  const tuneRingKSave = documentRef.getElementById("tune-ring-k-save");
  const tuneRingKDefault = documentRef.getElementById("tune-ring-k-default");
  const tuneRingDamp = documentRef.getElementById("tune-ring-damp");
  const tuneRingDampOut = documentRef.getElementById("tune-ring-damp-out");
  const tuneRingDampSave = documentRef.getElementById("tune-ring-damp-save");
  const tuneRingDampDefault = documentRef.getElementById("tune-ring-damp-default");
  const tuneGemTtl = documentRef.getElementById("tune-gem-ttl");
  const tuneGemTtlOut = documentRef.getElementById("tune-gem-ttl-out");
  const tuneGemTtlSave = documentRef.getElementById("tune-gem-ttl-save");
  const tuneGemTtlDefault = documentRef.getElementById("tune-gem-ttl-default");
  const tuneGemBlink = documentRef.getElementById("tune-gem-blink");
  const tuneGemBlinkOut = documentRef.getElementById("tune-gem-blink-out");
  const tuneGemBlinkSave = documentRef.getElementById("tune-gem-blink-save");
  const tuneGemBlinkDefault = documentRef.getElementById("tune-gem-blink-default");
  const tuneCapture = documentRef.getElementById("tune-capture");
  const tuneCaptureOut = documentRef.getElementById("tune-capture-out");
  const tuneCaptureSave = documentRef.getElementById("tune-capture-save");
  const tuneCaptureDefault = documentRef.getElementById("tune-capture-default");
  const tuneBurst = documentRef.getElementById("tune-burst");
  const tuneBurstOut = documentRef.getElementById("tune-burst-out");
  const tuneBurstSave = documentRef.getElementById("tune-burst-save");
  const tuneBurstDefault = documentRef.getElementById("tune-burst-default");
  const tuneThrust = documentRef.getElementById("tune-thrust");
  const tuneThrustOut = documentRef.getElementById("tune-thrust-out");
  const tuneThrustSave = documentRef.getElementById("tune-thrust-save");
  const tuneThrustDefault = documentRef.getElementById("tune-thrust-default");
  const tuneExhaustIntensity = documentRef.getElementById("tune-exhaust-intensity");
  const tuneExhaustIntensityOut = documentRef.getElementById("tune-exhaust-intensity-out");
  const tuneExhaustIntensitySave = documentRef.getElementById("tune-exhaust-intensity-save");
  const tuneExhaustIntensityDefault = documentRef.getElementById("tune-exhaust-intensity-default");
  const tuneExhaustSparks = documentRef.getElementById("tune-exhaust-sparks");
  const tuneExhaustSparksOut = documentRef.getElementById("tune-exhaust-sparks-out");
  const tuneExhaustSparksSave = documentRef.getElementById("tune-exhaust-sparks-save");
  const tuneExhaustSparksDefault = documentRef.getElementById("tune-exhaust-sparks-default");
  const tuneExhaustPalette = documentRef.getElementById("tune-exhaust-palette");
  const tuneExhaustPaletteOut = documentRef.getElementById("tune-exhaust-palette-out");
  const tuneExhaustPaletteSave = documentRef.getElementById("tune-exhaust-palette-save");
  const tuneExhaustPaletteDefault = documentRef.getElementById("tune-exhaust-palette-default");
  const tuneExhaustCore = documentRef.getElementById("tune-exhaust-core");
  const tuneExhaustCoreOut = documentRef.getElementById("tune-exhaust-core-out");
  const tuneExhaustCoreSave = documentRef.getElementById("tune-exhaust-core-save");
  const tuneExhaustCoreDefault = documentRef.getElementById("tune-exhaust-core-default");
  const tuneExhaustGlow = documentRef.getElementById("tune-exhaust-glow");
  const tuneExhaustGlowOut = documentRef.getElementById("tune-exhaust-glow-out");
  const tuneExhaustGlowSave = documentRef.getElementById("tune-exhaust-glow-save");
  const tuneExhaustGlowDefault = documentRef.getElementById("tune-exhaust-glow-default");
  const tuneExhaustJets = documentRef.getElementById("tune-exhaust-jets");
  const tuneExhaustJetsOut = documentRef.getElementById("tune-exhaust-jets-out");
  const tuneExhaustJetsSave = documentRef.getElementById("tune-exhaust-jets-save");
  const tuneExhaustJetsDefault = documentRef.getElementById("tune-exhaust-jets-default");
  const touchUi = documentRef.getElementById("touch-ui");
  const touchJoystick = documentRef.getElementById("touch-joystick");
  const touchJoystickBase = documentRef.getElementById("touch-joystick-base");
  const touchJoystickKnob = documentRef.getElementById("touch-joystick-knob");
  const touchPingBtn = documentRef.getElementById("touch-ping");
  const touchBurstBtn = documentRef.getElementById("touch-burst");
  const tuneDmg = documentRef.getElementById("tune-dmg");
  const tuneDmgOut = documentRef.getElementById("tune-dmg-out");
  const tuneDmgSave = documentRef.getElementById("tune-dmg-save");
  const tuneDmgDefault = documentRef.getElementById("tune-dmg-default");
  const tuneFracture = documentRef.getElementById("tune-fracture");
  const tuneFractureOut = documentRef.getElementById("tune-fracture-out");
  const tuneFractureSave = documentRef.getElementById("tune-fracture-save");
  const tuneFractureDefault = documentRef.getElementById("tune-fracture-default");
  const tuneFractureSizeExp = documentRef.getElementById("tune-fracture-sizeexp");
  const tuneFractureSizeExpOut = documentRef.getElementById("tune-fracture-sizeexp-out");
  const tuneFractureSizeExpSave = documentRef.getElementById("tune-fracture-sizeexp-save");
  const tuneFractureSizeExpDefault = documentRef.getElementById("tune-fracture-sizeexp-default");
  const tuneFractureChip = documentRef.getElementById("tune-fracture-chip");
  const tuneFractureChipOut = documentRef.getElementById("tune-fracture-chip-out");
  const tuneFractureChipSave = documentRef.getElementById("tune-fracture-chip-save");
  const tuneFractureChipDefault = documentRef.getElementById("tune-fracture-chip-default");
  const tuneFractureDecay = documentRef.getElementById("tune-fracture-decay");
  const tuneFractureDecayOut = documentRef.getElementById("tune-fracture-decay-out");
  const tuneFractureDecaySave = documentRef.getElementById("tune-fracture-decay-save");
  const tuneFractureDecayDefault = documentRef.getElementById("tune-fracture-decay-default");
  const tuneFractureMinSpeed = documentRef.getElementById("tune-fracture-minspeed");
  const tuneFractureMinSpeedOut = documentRef.getElementById("tune-fracture-minspeed-out");
  const tuneFractureMinSpeedSave = documentRef.getElementById("tune-fracture-minspeed-save");
  const tuneFractureMinSpeedDefault = documentRef.getElementById("tune-fracture-minspeed-default");
  const tuneFractureShear = documentRef.getElementById("tune-fracture-shear");
  const tuneFractureShearOut = documentRef.getElementById("tune-fracture-shear-out");
  const tuneFractureShearSave = documentRef.getElementById("tune-fracture-shear-save");
  const tuneFractureShearDefault = documentRef.getElementById("tune-fracture-shear-default");
  const tuneFractureShearRef = documentRef.getElementById("tune-fracture-shearref");
  const tuneFractureShearRefOut = documentRef.getElementById("tune-fracture-shearref-out");
  const tuneFractureShearRefSave = documentRef.getElementById("tune-fracture-shearref-save");
  const tuneFractureShearRefDefault = documentRef.getElementById("tune-fracture-shearref-default");
  const tuneWorldDensity = documentRef.getElementById("tune-world-density");
  const tuneWorldDensityOut = documentRef.getElementById("tune-world-density-out");
  const tuneWorldDensitySave = documentRef.getElementById("tune-world-density-save");
  const tuneWorldDensityDefault = documentRef.getElementById("tune-world-density-default");
  const tuneSpawnRate = documentRef.getElementById("tune-spawn-rate");
  const tuneSpawnRateOut = documentRef.getElementById("tune-spawn-rate-out");
  const tuneSpawnRateSave = documentRef.getElementById("tune-spawn-rate-save");
  const tuneSpawnRateDefault = documentRef.getElementById("tune-spawn-rate-default");
  const tuneXlRadius = documentRef.getElementById("tune-xl-radius");
  const tuneXlRadiusOut = documentRef.getElementById("tune-xl-radius-out");
  const tuneXlRadiusSave = documentRef.getElementById("tune-xl-radius-save");
  const tuneXlRadiusDefault = documentRef.getElementById("tune-xl-radius-default");
  const tuneXxlRadius = documentRef.getElementById("tune-xxl-radius");
  const tuneXxlRadiusOut = documentRef.getElementById("tune-xxl-radius-out");
  const tuneXxlRadiusSave = documentRef.getElementById("tune-xxl-radius-save");
  const tuneXxlRadiusDefault = documentRef.getElementById("tune-xxl-radius-default");
  const tuneXlCount = documentRef.getElementById("tune-xl-count");
  const tuneXlCountOut = documentRef.getElementById("tune-xl-count-out");
  const tuneXlCountSave = documentRef.getElementById("tune-xl-count-save");
  const tuneXlCountDefault = documentRef.getElementById("tune-xl-count-default");
  const tuneXxlCount = documentRef.getElementById("tune-xxl-count");
  const tuneXxlCountOut = documentRef.getElementById("tune-xxl-count-out");
  const tuneXxlCountSave = documentRef.getElementById("tune-xxl-count-save");
  const tuneXxlCountDefault = documentRef.getElementById("tune-xxl-count-default");
  const tuneTier2Unlock = documentRef.getElementById("tune-tier2-unlock");
  const tuneTier2UnlockOut = documentRef.getElementById("tune-tier2-unlock-out");
  const tuneTier2UnlockSave = documentRef.getElementById("tune-tier2-unlock-save");
  const tuneTier2UnlockDefault = documentRef.getElementById("tune-tier2-unlock-default");
  const tuneTier3Unlock = documentRef.getElementById("tune-tier3-unlock");
  const tuneTier3UnlockOut = documentRef.getElementById("tune-tier3-unlock-out");
  const tuneTier3UnlockSave = documentRef.getElementById("tune-tier3-unlock-save");
  const tuneTier3UnlockDefault = documentRef.getElementById("tune-tier3-unlock-default");
  const tuneTier1Zoom = documentRef.getElementById("tune-tier1-zoom");
  const tuneTier1ZoomOut = documentRef.getElementById("tune-tier1-zoom-out");
  const tuneTier1ZoomSave = documentRef.getElementById("tune-tier1-zoom-save");
  const tuneTier1ZoomDefault = documentRef.getElementById("tune-tier1-zoom-default");
  const tuneTier2Zoom = documentRef.getElementById("tune-tier2-zoom");
  const tuneTier2ZoomOut = documentRef.getElementById("tune-tier2-zoom-out");
  const tuneTier2ZoomSave = documentRef.getElementById("tune-tier2-zoom-save");
  const tuneTier2ZoomDefault = documentRef.getElementById("tune-tier2-zoom-default");
  const tuneTier3Zoom = documentRef.getElementById("tune-tier3-zoom");
  const tuneTier3ZoomOut = documentRef.getElementById("tune-tier3-zoom-out");
  const tuneTier3ZoomSave = documentRef.getElementById("tune-tier3-zoom-save");
  const tuneTier3ZoomDefault = documentRef.getElementById("tune-tier3-zoom-default");
  const tuneTierZoomSec = documentRef.getElementById("tune-tier-zoom-sec");
  const tuneTierZoomSecOut = documentRef.getElementById("tune-tier-zoom-sec-out");
  const tuneTierZoomSecSave = documentRef.getElementById("tune-tier-zoom-sec-save");
  const tuneTierZoomSecDefault = documentRef.getElementById("tune-tier-zoom-sec-default");
  const tuneStarDensity = documentRef.getElementById("tune-star-density");
  const tuneStarDensityOut = documentRef.getElementById("tune-star-density-out");
  const tuneStarDensitySave = documentRef.getElementById("tune-star-density-save");
  const tuneStarDensityDefault = documentRef.getElementById("tune-star-density-default");
  const tuneParallax = documentRef.getElementById("tune-parallax");
  const tuneParallaxOut = documentRef.getElementById("tune-parallax-out");
  const tuneParallaxSave = documentRef.getElementById("tune-parallax-save");
  const tuneParallaxDefault = documentRef.getElementById("tune-parallax-default");
  const tuneStarAccentChance = documentRef.getElementById("tune-star-accent-chance");
  const tuneStarAccentChanceOut = documentRef.getElementById("tune-star-accent-chance-out");
  const tuneStarAccentChanceSave = documentRef.getElementById("tune-star-accent-chance-save");
  const tuneStarAccentChanceDefault = documentRef.getElementById("tune-star-accent-chance-default");
  const tuneTwinkleChance = documentRef.getElementById("tune-twinkle-chance");
  const tuneTwinkleChanceOut = documentRef.getElementById("tune-twinkle-chance-out");
  const tuneTwinkleChanceSave = documentRef.getElementById("tune-twinkle-chance-save");
  const tuneTwinkleChanceDefault = documentRef.getElementById("tune-twinkle-chance-default");
  const tuneTwinkleStrength = documentRef.getElementById("tune-twinkle-strength");
  const tuneTwinkleStrengthOut = documentRef.getElementById("tune-twinkle-strength-out");
  const tuneTwinkleStrengthSave = documentRef.getElementById("tune-twinkle-strength-save");
  const tuneTwinkleStrengthDefault = documentRef.getElementById("tune-twinkle-strength-default");
  const tuneTwinkleSpeed = documentRef.getElementById("tune-twinkle-speed");
  const tuneTwinkleSpeedOut = documentRef.getElementById("tune-twinkle-speed-out");
  const tuneTwinkleSpeedSave = documentRef.getElementById("tune-twinkle-speed-save");
  const tuneTwinkleSpeedDefault = documentRef.getElementById("tune-twinkle-speed-default");
  const tuneTechPingCooldown = documentRef.getElementById("tune-tech-ping-cooldown");
  const tuneTechPingCooldownOut = documentRef.getElementById("tune-tech-ping-cooldown-out");
  const tuneTechPingCooldownSave = documentRef.getElementById("tune-tech-ping-cooldown-save");
  const tuneTechPingCooldownDefault = documentRef.getElementById("tune-tech-ping-cooldown-default");

  const nf = new Intl.NumberFormat();

  function nowMs() {
    if (windowRef?.performance && typeof windowRef.performance.now === "function") return windowRef.performance.now();
    return Date.now();
  }

  const hudPerf = { t0: nowMs(), frames: 0, fps: 0 };

  const touch = {
    active: false,
    pointerId: null,
    centerX: 0,
    centerY: 0,
    maxR: 60,
    desiredAngle: 0,
    thrust: 0,
  };

  function setJoystickKnob(dx, dy, dragging) {
    if (!touchJoystick || !touchJoystickKnob) return;
    if (dragging) touchJoystick.classList.add("dragging");
    else touchJoystick.classList.remove("dragging");
    touchJoystickKnob.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
  }

  function resetTouchControls() {
    touch.active = false;
    touch.pointerId = null;
    touch.thrust = 0;
    if (game?.state?.input) {
      game.state.input.thrustAnalog = 0;
      game.state.input.turnAnalog = 0;
    }
    setJoystickKnob(0, 0, false);
  }

  function updateJoystickFromPointer(clientX, clientY) {
    const dx = clientX - touch.centerX;
    const dy = clientY - touch.centerY;
    const dist = Math.hypot(dx, dy);
    const r = touch.maxR;
    const clamped = dist > r && dist > 1e-6 ? r / dist : 1;
    const jx = dx * clamped;
    const jy = dy * clamped;

    const deadZone = r * 0.12;
    const mag = clamp((dist - deadZone) / Math.max(1, r - deadZone), 0, 1);
    touch.thrust = mag;
    touch.desiredAngle = Math.atan2(jy, jx);
    setJoystickKnob(jx, jy, true);
  }

  function applyTouchControls() {
    if (!game?.state?.input) return;
    if (!touch.active) {
      game.state.input.thrustAnalog = 0;
      game.state.input.turnAnalog = 0;
      return;
    }
    const shipA = Number(game.state.ship?.angle) || 0;
    const diff = wrapAngle(touch.desiredAngle - shipA);
    const k = 0.95; // rad -> normalized turn rate
    const dead = 0.04;
    const turn = Math.abs(diff) < dead ? 0 : clamp(diff * k, -1, 1);
    game.state.input.turnAnalog = turn;
    game.state.input.thrustAnalog = clamp(touch.thrust, 0, 1);
  }

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
      key: "gravitySoftening",
      input: tuneGravitySoft,
      saveBtn: tuneGravitySoftSave,
      savedOut: tuneGravitySoftDefault,
      suffix: " px",
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
      key: "innerDrag",
      input: tuneInnerDrag,
      saveBtn: tuneInnerDragSave,
      savedOut: tuneInnerDragDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}`,
    },
    {
      key: "ringK",
      input: tuneRingK,
      saveBtn: tuneRingKSave,
      savedOut: tuneRingKDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}`,
    },
    {
      key: "ringRadialDamp",
      input: tuneRingDamp,
      saveBtn: tuneRingDampSave,
      savedOut: tuneRingDampDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}`,
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
      key: "exhaustIntensity",
      input: tuneExhaustIntensity,
      saveBtn: tuneExhaustIntensitySave,
      savedOut: tuneExhaustIntensityDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "exhaustSparkScale",
      input: tuneExhaustSparks,
      saveBtn: tuneExhaustSparksSave,
      savedOut: tuneExhaustSparksDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "exhaustPalette",
      input: tuneExhaustPalette,
      saveBtn: tuneExhaustPaletteSave,
      savedOut: tuneExhaustPaletteDefault,
      suffix: "",
      format: (v) => {
        const i = Math.round(Number(v) || 0);
        if (i === 1) return "Ion (blue)";
        if (i === 2) return "Plasma (purple)";
        if (i === 3) return "Toxic (green)";
        if (i === 4) return "Ember (red)";
        return "Rocket (warm)";
      },
    },
    {
      key: "exhaustCoreScale",
      input: tuneExhaustCore,
      saveBtn: tuneExhaustCoreSave,
      savedOut: tuneExhaustCoreDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "exhaustGlowScale",
      input: tuneExhaustGlow,
      saveBtn: tuneExhaustGlowSave,
      savedOut: tuneExhaustGlowDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "exhaustLegacyJets",
      input: tuneExhaustJets,
      saveBtn: tuneExhaustJetsSave,
      savedOut: tuneExhaustJetsDefault,
      suffix: "",
      format: (v) => (Number(v) >= 0.5 ? "On" : "Off"),
    },
    {
      key: "projectileImpactScale",
      input: tuneDmg,
      saveBtn: tuneDmgSave,
      savedOut: tuneDmgDefault,
      suffix: "x",
      format: (v) => `${Number(v).toFixed(2)}x`,
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
      key: "fractureSizeStrengthExp",
      input: tuneFractureSizeExp,
      saveBtn: tuneFractureSizeExpSave,
      savedOut: tuneFractureSizeExpDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}`,
    },
    {
      key: "fractureChipScale",
      input: tuneFractureChip,
      saveBtn: tuneFractureChipSave,
      savedOut: tuneFractureChipDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "fractureChipDecaySec",
      input: tuneFractureDecay,
      saveBtn: tuneFractureDecaySave,
      savedOut: tuneFractureDecayDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)} s`,
    },
    {
      key: "fractureChipMinSpeed",
      input: tuneFractureMinSpeed,
      saveBtn: tuneFractureMinSpeedSave,
      savedOut: tuneFractureMinSpeedDefault,
      suffix: " px/s",
    },
    {
      key: "fractureShearWeightLaunched",
      input: tuneFractureShear,
      saveBtn: tuneFractureShearSave,
      savedOut: tuneFractureShearDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)}x`,
    },
    {
      key: "fractureShearNormalRefSpeed",
      input: tuneFractureShearRef,
      saveBtn: tuneFractureShearRefSave,
      savedOut: tuneFractureShearRefDefault,
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
      key: "asteroidSpawnRateScale",
      input: tuneSpawnRate,
      saveBtn: tuneSpawnRateSave,
      savedOut: tuneSpawnRateDefault,
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
    {
      key: "techPingCooldownSec",
      input: tuneTechPingCooldown,
      saveBtn: tuneTechPingCooldownSave,
      savedOut: tuneTechPingCooldownDefault,
      suffix: "",
      format: (v) => `${Number(v).toFixed(2)} s`,
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
    p.gravitySoftening = clamp(Number(p.gravitySoftening ?? 70), 10, 220);
    p.innerGravityMult = clamp(Number(p.innerGravityMult ?? 1.5), 1, 8);
    p.innerDrag = clamp(Number(p.innerDrag ?? 4.0), 0, 20);
    p.ringK = clamp(Number(p.ringK ?? 6.5), 0, 30);
    p.ringRadialDamp = clamp(Number(p.ringRadialDamp ?? 6.5), 0, 40);
    p.exhaustIntensity = clamp(Number(p.exhaustIntensity ?? 1), 0, 2.5);
    p.exhaustSparkScale = clamp(Number(p.exhaustSparkScale ?? 1), 0, 3);
    p.exhaustPalette = clamp(Math.round(Number(p.exhaustPalette ?? 0)), 0, 4);
    p.exhaustCoreScale = clamp(Number(p.exhaustCoreScale ?? 1), 0, 2.5);
    p.exhaustGlowScale = clamp(Number(p.exhaustGlowScale ?? 1), 0, 2.5);
    p.exhaustLegacyJets = clamp(Math.round(Number(p.exhaustLegacyJets ?? 0)), 0, 1);
    p.projectileImpactScale = clamp(Number(p.projectileImpactScale ?? 1), 0.2, 4);
    p.fractureImpactSpeed = clamp(Number(p.fractureImpactSpeed ?? 275), 150, 700);
    p.fractureSizeStrengthExp = clamp(Number(p.fractureSizeStrengthExp ?? -0.8), -1.5, 0.6);
    p.fractureChipScale = clamp(Number(p.fractureChipScale ?? 1), 0, 3);
    p.fractureChipDecaySec = clamp(Number(p.fractureChipDecaySec ?? 3), 0, 12);
    p.fractureChipMinSpeed = clamp(Number(p.fractureChipMinSpeed ?? 140), 0, 520);
    p.fractureShearWeightLaunched = clamp(Number(p.fractureShearWeightLaunched ?? 0.85), 0, 1.6);
    p.fractureShearNormalRefSpeed = clamp(Number(p.fractureShearNormalRefSpeed ?? 120), 20, 320);
    p.asteroidSpawnRateScale = clamp(Number(p.asteroidSpawnRateScale ?? 1), 0.25, 3);
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
    p.techPingCooldownSec = clamp(Number(p.techPingCooldownSec ?? 3), 0, 60);
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
      } else if (f.savedOut) {
        f.savedOut.textContent = "—";
      }
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
    if (tuneGravitySoft) tuneGravitySoft.value = String(Math.round(p.gravitySoftening));
    if (tuneInnerDrag) tuneInnerDrag.value = String(p.innerDrag);
    if (tuneRingK) tuneRingK.value = String(p.ringK);
    if (tuneRingDamp) tuneRingDamp.value = String(p.ringRadialDamp);
    if (tuneGemTtl) tuneGemTtl.value = String(p.gemTtlSec);
    if (tuneGemBlink) tuneGemBlink.value = String(p.gemBlinkMaxHz);
    if (tuneCapture) tuneCapture.value = String(Math.round(p.captureSpeed));
    if (tuneBurst) tuneBurst.value = String(Math.round(p.burstSpeed));
    if (tuneThrust) tuneThrust.value = String(Math.round(p.shipThrust));
    if (tuneExhaustIntensity) tuneExhaustIntensity.value = String(p.exhaustIntensity ?? 1);
    if (tuneExhaustSparks) tuneExhaustSparks.value = String(p.exhaustSparkScale ?? 1);
    if (tuneExhaustPalette) tuneExhaustPalette.value = String(Math.round(p.exhaustPalette ?? 0));
    if (tuneExhaustCore) tuneExhaustCore.value = String(p.exhaustCoreScale ?? 1);
    if (tuneExhaustGlow) tuneExhaustGlow.value = String(p.exhaustGlowScale ?? 1);
    if (tuneExhaustJets) tuneExhaustJets.value = String(Math.round(p.exhaustLegacyJets ?? 0));
    if (tuneDmg) tuneDmg.value = String(p.projectileImpactScale ?? 1);
    if (tuneXlRadius) tuneXlRadius.value = String(Math.round(p.xlargeRadius));
    if (tuneXxlRadius) tuneXxlRadius.value = String(Math.round(p.xxlargeRadius));
    if (tuneXlCount) tuneXlCount.value = String(Math.round(p.xlargeCount));
    if (tuneXxlCount) tuneXxlCount.value = String(Math.round(p.xxlargeCount));
    if (tuneFracture) tuneFracture.value = String(Math.round(p.fractureImpactSpeed));
    if (tuneFractureSizeExp) tuneFractureSizeExp.value = String(p.fractureSizeStrengthExp ?? 0);
    if (tuneFractureChip) tuneFractureChip.value = String(p.fractureChipScale ?? 0);
    if (tuneFractureDecay) tuneFractureDecay.value = String(p.fractureChipDecaySec ?? 0);
    if (tuneFractureMinSpeed) tuneFractureMinSpeed.value = String(Math.round(p.fractureChipMinSpeed ?? 0));
    if (tuneFractureShear) tuneFractureShear.value = String(p.fractureShearWeightLaunched ?? 0);
    if (tuneFractureShearRef) tuneFractureShearRef.value = String(Math.round(p.fractureShearNormalRefSpeed ?? 120));
    if (tuneTier2Unlock) tuneTier2Unlock.value = String(Math.round(p.tier2UnlockGemScore));
    if (tuneTier3Unlock) tuneTier3Unlock.value = String(Math.round(p.tier3UnlockGemScore));
    if (tuneTier1Zoom) tuneTier1Zoom.value = String(p.tier1Zoom);
    if (tuneTier2Zoom) tuneTier2Zoom.value = String(p.tier2Zoom);
    if (tuneTier3Zoom) tuneTier3Zoom.value = String(p.tier3Zoom);
    if (tuneTierZoomSec) tuneTierZoomSec.value = String(p.tierZoomTweenSec);
    if (tuneWorldDensity) tuneWorldDensity.value = String(p.asteroidWorldDensityScale);
    if (tuneSpawnRate) tuneSpawnRate.value = String(p.asteroidSpawnRateScale);
    if (tuneStarDensity) tuneStarDensity.value = String(p.starDensityScale);
    if (tuneParallax) tuneParallax.value = String(p.starParallaxStrength);
    if (tuneStarAccentChance) tuneStarAccentChance.value = String(p.starAccentChance);
    if (tuneTwinkleChance) tuneTwinkleChance.value = String(p.starTwinkleChance);
    if (tuneTwinkleStrength) tuneTwinkleStrength.value = String(p.starTwinkleStrength);
    if (tuneTwinkleSpeed) tuneTwinkleSpeed.value = String(p.starTwinkleSpeed);
    if (tuneTechPingCooldown) tuneTechPingCooldown.value = String(p.techPingCooldownSec ?? 3);
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
    setOut(tuneGravitySoftOut, readNum(tuneGravitySoft, p.gravitySoftening), " px");
    if (tuneInnerDragOut) tuneInnerDragOut.textContent = `${readNum(tuneInnerDrag, p.innerDrag).toFixed(2)}`;
    if (tuneRingKOut) tuneRingKOut.textContent = `${readNum(tuneRingK, p.ringK).toFixed(2)}`;
    if (tuneRingDampOut) tuneRingDampOut.textContent = `${readNum(tuneRingDamp, p.ringRadialDamp).toFixed(2)}`;
    if (tuneGemTtlOut) tuneGemTtlOut.textContent = `${readNum(tuneGemTtl, p.gemTtlSec).toFixed(1)} s`;
    if (tuneGemBlinkOut) tuneGemBlinkOut.textContent = `${readNum(tuneGemBlink, p.gemBlinkMaxHz).toFixed(1)} /s`;
    setOut(tuneCaptureOut, readNum(tuneCapture, p.captureSpeed), " px/s");
    setOut(tuneBurstOut, readNum(tuneBurst, p.burstSpeed), " px/s");
    setOut(tuneThrustOut, readNum(tuneThrust, p.shipThrust), " px/s^2");
    if (tuneExhaustIntensityOut) tuneExhaustIntensityOut.textContent = `${readNum(tuneExhaustIntensity, p.exhaustIntensity).toFixed(2)}x`;
    if (tuneExhaustSparksOut) tuneExhaustSparksOut.textContent = `${readNum(tuneExhaustSparks, p.exhaustSparkScale).toFixed(2)}x`;
    if (tuneExhaustPaletteOut) {
      const i = Math.round(readNum(tuneExhaustPalette, p.exhaustPalette));
      tuneExhaustPaletteOut.textContent =
        i === 1 ? "Ion (blue)" : i === 2 ? "Plasma (purple)" : i === 3 ? "Toxic (green)" : i === 4 ? "Ember (red)" : "Rocket (warm)";
    }
    if (tuneExhaustCoreOut) tuneExhaustCoreOut.textContent = `${readNum(tuneExhaustCore, p.exhaustCoreScale).toFixed(2)}x`;
    if (tuneExhaustGlowOut) tuneExhaustGlowOut.textContent = `${readNum(tuneExhaustGlow, p.exhaustGlowScale).toFixed(2)}x`;
    if (tuneExhaustJetsOut) tuneExhaustJetsOut.textContent = readNum(tuneExhaustJets, p.exhaustLegacyJets) >= 0.5 ? "On" : "Off";
    if (tuneDmgOut) {
      const val = readNum(tuneDmg, p.projectileImpactScale);
      tuneDmgOut.textContent = `${Number(val).toFixed(2)}x`;
    }
    setOut(tuneXlRadiusOut, readNum(tuneXlRadius, p.xlargeRadius), " px");
    setOut(tuneXxlRadiusOut, readNum(tuneXxlRadius, p.xxlargeRadius), " px");
    setOut(tuneXlCountOut, readNum(tuneXlCount, p.xlargeCount));
    setOut(tuneXxlCountOut, readNum(tuneXxlCount, p.xxlargeCount));
    setOut(tuneFractureOut, readNum(tuneFracture, p.fractureImpactSpeed), " px/s");
    if (tuneFractureSizeExpOut) {
      tuneFractureSizeExpOut.textContent = `${readNum(tuneFractureSizeExp, p.fractureSizeStrengthExp ?? 0).toFixed(2)}`;
    }
    if (tuneFractureChipOut) {
      tuneFractureChipOut.textContent = `${readNum(tuneFractureChip, p.fractureChipScale ?? 0).toFixed(2)}x`;
    }
    if (tuneFractureDecayOut) {
      tuneFractureDecayOut.textContent = `${readNum(tuneFractureDecay, p.fractureChipDecaySec ?? 0).toFixed(2)} s`;
    }
    setOut(tuneFractureMinSpeedOut, readNum(tuneFractureMinSpeed, p.fractureChipMinSpeed ?? 0), " px/s");
    if (tuneFractureShearOut) {
      tuneFractureShearOut.textContent = `${readNum(tuneFractureShear, p.fractureShearWeightLaunched ?? 0).toFixed(2)}x`;
    }
    setOut(tuneFractureShearRefOut, readNum(tuneFractureShearRef, p.fractureShearNormalRefSpeed ?? 120), " px/s");
    setOut(tuneTier2UnlockOut, readNum(tuneTier2Unlock, p.tier2UnlockGemScore));
    setOut(tuneTier3UnlockOut, readNum(tuneTier3Unlock, p.tier3UnlockGemScore));
    if (tuneTier1ZoomOut) tuneTier1ZoomOut.textContent = `${readNum(tuneTier1Zoom, p.tier1Zoom).toFixed(2)}x`;
    if (tuneTier2ZoomOut) tuneTier2ZoomOut.textContent = `${readNum(tuneTier2Zoom, p.tier2Zoom).toFixed(2)}x`;
    if (tuneTier3ZoomOut) tuneTier3ZoomOut.textContent = `${readNum(tuneTier3Zoom, p.tier3Zoom).toFixed(2)}x`;
    if (tuneTierZoomSecOut) tuneTierZoomSecOut.textContent = `${readNum(tuneTierZoomSec, p.tierZoomTweenSec).toFixed(2)} s`;
    if (tuneWorldDensityOut) {
      tuneWorldDensityOut.textContent = `${readNum(tuneWorldDensity, p.asteroidWorldDensityScale).toFixed(2)}x`;
    }
    if (tuneSpawnRateOut) {
      tuneSpawnRateOut.textContent = `${readNum(tuneSpawnRate, p.asteroidSpawnRateScale).toFixed(2)}x`;
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
    if (tuneTechPingCooldownOut) {
      tuneTechPingCooldownOut.textContent = `${readNum(tuneTechPingCooldown, p.techPingCooldownSec ?? 3).toFixed(2)} s`;
    }
  }

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
    p.gravitySoftening = clamp(Math.round(readNum(tuneGravitySoft, p.gravitySoftening)), 10, 220);
    p.innerGravityMult = clamp(readNum(tuneInnerGrav, p.innerGravityMult), 1, 8);
    p.innerDrag = clamp(readNum(tuneInnerDrag, p.innerDrag), 0, 20);
    p.ringK = clamp(readNum(tuneRingK, p.ringK), 0, 30);
    p.ringRadialDamp = clamp(readNum(tuneRingDamp, p.ringRadialDamp), 0, 40);
    p.gemTtlSec = clamp(readNum(tuneGemTtl, p.gemTtlSec), 0.5, 60);
    p.gemBlinkMaxHz = clamp(readNum(tuneGemBlink, p.gemBlinkMaxHz), 0.25, 12);
    p.captureSpeed = readNum(tuneCapture, p.captureSpeed);
    p.burstSpeed = readNum(tuneBurst, p.burstSpeed);
    p.shipThrust = readNum(tuneThrust, p.shipThrust);
    p.exhaustIntensity = clamp(readNum(tuneExhaustIntensity, p.exhaustIntensity), 0, 2.5);
    p.exhaustSparkScale = clamp(readNum(tuneExhaustSparks, p.exhaustSparkScale), 0, 3);
    p.exhaustPalette = clamp(Math.round(readNum(tuneExhaustPalette, p.exhaustPalette)), 0, 4);
    p.exhaustCoreScale = clamp(readNum(tuneExhaustCore, p.exhaustCoreScale), 0, 2.5);
    p.exhaustGlowScale = clamp(readNum(tuneExhaustGlow, p.exhaustGlowScale), 0, 2.5);
    p.exhaustLegacyJets = clamp(Math.round(readNum(tuneExhaustJets, p.exhaustLegacyJets)), 0, 1);
    p.projectileImpactScale = clamp(readNum(tuneDmg, p.projectileImpactScale), 0.2, 4);
    p.xlargeRadius = clamp(readNum(tuneXlRadius, p.xlargeRadius), p.largeRadius + 6, 220);
    p.xxlargeRadius = clamp(readNum(tuneXxlRadius, p.xxlargeRadius), p.xlargeRadius + 6, 320);
    p.xlargeCount = clamp(Math.round(readNum(tuneXlCount, p.xlargeCount)), 0, 50);
    p.xxlargeCount = clamp(Math.round(readNum(tuneXxlCount, p.xxlargeCount)), 0, 50);
    p.fractureImpactSpeed = clamp(readNum(tuneFracture, p.fractureImpactSpeed), 150, 700);
    p.fractureSizeStrengthExp = clamp(readNum(tuneFractureSizeExp, p.fractureSizeStrengthExp ?? -0.8), -1.5, 0.6);
    p.fractureChipScale = clamp(readNum(tuneFractureChip, p.fractureChipScale ?? 1), 0, 3);
    p.fractureChipDecaySec = clamp(readNum(tuneFractureDecay, p.fractureChipDecaySec ?? 3), 0, 12);
    p.fractureChipMinSpeed = clamp(Math.round(readNum(tuneFractureMinSpeed, p.fractureChipMinSpeed ?? 140)), 0, 520);
    p.fractureShearWeightLaunched = clamp(readNum(tuneFractureShear, p.fractureShearWeightLaunched ?? 0.85), 0, 1.6);
    p.fractureShearNormalRefSpeed = clamp(
      Math.round(readNum(tuneFractureShearRef, p.fractureShearNormalRefSpeed ?? 120)),
      20,
      320
    );
    p.tier2UnlockGemScore = clamp(Math.round(readNum(tuneTier2Unlock, p.tier2UnlockGemScore)), 1, 10000);
    p.tier3UnlockGemScore = clamp(Math.round(readNum(tuneTier3Unlock, p.tier3UnlockGemScore)), 1, 10000);
    if (p.tier3UnlockGemScore <= p.tier2UnlockGemScore) p.tier3UnlockGemScore = p.tier2UnlockGemScore + 50;
    p.tier1Zoom = clamp(readNum(tuneTier1Zoom, p.tier1Zoom), 0.35, 1.2);
    p.tier2Zoom = clamp(readNum(tuneTier2Zoom, p.tier2Zoom), 0.35, 1.2);
    p.tier3Zoom = clamp(readNum(tuneTier3Zoom, p.tier3Zoom), 0.35, 1.2);
    p.tierZoomTweenSec = clamp(readNum(tuneTierZoomSec, p.tierZoomTweenSec), 0.05, 1.2);
    p.asteroidWorldDensityScale = clamp(readNum(tuneWorldDensity, p.asteroidWorldDensityScale), 0.08, 2.5);
    p.asteroidSpawnRateScale = clamp(readNum(tuneSpawnRate, p.asteroidSpawnRateScale), 0.25, 3);
    p.starDensityScale = clamp(readNum(tuneStarDensity, p.starDensityScale), 0.4, 2.2);
    p.starParallaxStrength = clamp(readNum(tuneParallax, p.starParallaxStrength), 0, 1.8);
    p.starAccentChance = clamp(readNum(tuneStarAccentChance, p.starAccentChance), 0, 0.35);
    p.starTwinkleChance = clamp(readNum(tuneTwinkleChance, p.starTwinkleChance), 0, 1);
    p.starTwinkleStrength = clamp(readNum(tuneTwinkleStrength, p.starTwinkleStrength), 0, 0.8);
    p.starTwinkleSpeed = clamp(readNum(tuneTwinkleSpeed, p.starTwinkleSpeed), 0.2, 3);
    p.techPingCooldownSec = clamp(readNum(tuneTechPingCooldown, p.techPingCooldownSec ?? 3), 0, 60);
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
    if (dbgGemScore && documentRef.activeElement !== dbgGemScore) {
      dbgGemScore.value = String(clamp(Math.round(game.state.score), 0, 5000));
    }
    if (touchPingBtn) {
      const cooldownSec = Math.max(0, Number(game.state.round?.techPingCooldownSec) || 0);
      const coolingDown = cooldownSec > 0.02;
      touchPingBtn.classList.toggle("cooldown", coolingDown);
      touchPingBtn.setAttribute("aria-disabled", coolingDown ? "true" : "false");
      touchPingBtn.textContent = coolingDown ? `SONAR ${cooldownSec.toFixed(1)}s` : "SONAR";
    }
  }

  function updateHudScore() {
    if (hudScore) hudScore.textContent = `Score: ${nf.format(game.state.score)}`;

    if (!hudMp) return;
    const mp = game.state?._mp;
    if (!mp?.connected) {
      hudMp.textContent = "";
      return;
    }

    // Lightweight client FPS estimate (render loop cadence).
    hudPerf.frames++;
    const t = nowMs();
    const elapsed = t - hudPerf.t0;
    if (elapsed >= 500) {
      hudPerf.fps = (hudPerf.frames * 1000) / Math.max(1, elapsed);
      hudPerf.frames = 0;
      hudPerf.t0 = t;
    }

    const hz = Number.isFinite(mp.snapshotHz) ? mp.snapshotHz.toFixed(1) : "?";
    const dtAvg = Number.isFinite(mp.snapshotDtAvgMs) ? `${Math.round(mp.snapshotDtAvgMs)}ms` : "?";
    const age = Number.isFinite(mp.latestAgeMs) ? `${Math.round(mp.latestAgeMs)}ms` : "?";
    const sim = Number.isFinite(mp.serverSimSpeed) ? `${mp.serverSimSpeed.toFixed(2)}x` : "?";
    const tickHz = Number.isFinite(mp.serverTickHz) ? `${mp.serverTickHz.toFixed(1)}Hz` : "?";

    hudMp.textContent = `fps ${hudPerf.fps.toFixed(0)} | snap ${hz}Hz ~${dtAvg} | age ${age} | sim ${sim} (${tickHz}) | ent ${mp.playerCount}p ${mp.asteroidCount}a ${mp.gemCount}g`;
  }

  function isMenuVisible() {
    if (!menu) return false;
    return menu.style.display !== "none";
  }

  function clearHeldInput() {
    const i = game.state.input;
    i.left = false;
    i.right = false;
    i.up = false;
    i.down = false;
    i.burst = false;
    i.ping = false;
  }

  function syncMenuButtons() {
    const playing = game.state.mode === "playing";
    if (startBtn) startBtn.textContent = playing ? "Apply + Resume" : game.state.mode === "gameover" ? "Restart" : "Start";
    if (debugToggleBtn) {
      const visible = isMenuVisible();
      debugToggleBtn.textContent = visible ? "Close Debug (M)" : "Open Debug (M)";
      debugToggleBtn.setAttribute("aria-expanded", visible ? "true" : "false");
    }
  }

  function setMenuVisible(visible) {
    if (!menu) return;
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
    if (isMenuVisible()) {
      setMenuVisible(false);
    } else {
      syncTuningUiFromParams();
      syncArenaUi();
      setMenuVisible(true);
    }
  }

  function applyAllFromMenu() {
    applyTuningFromMenu();
    applyDebugFlagsFromMenu();
    applyArenaFromMenu();
  }

  function bindTuneInput(el) {
    if (!el) return;
    el.addEventListener("input", () => {
      syncTuningUiLabels();
      applyTuningFromMenu();
    });
  }

  for (const f of TUNING_FIELDS) bindTuneInput(f.input);

  if (startBtn) startBtn.addEventListener("click", () => startOrResume());
  if (debugToggleBtn) debugToggleBtn.addEventListener("click", () => toggleDebugMenu());

  const DEBUG_MENU_BINDINGS = [
    { el: dbgCameraMode, event: "change", handler: () => applyArenaFromMenu() },
    { el: dbgWorldScale, event: "input", handler: () => applyArenaFromMenu() },
    { el: dbgPauseOnOpen, event: "change", handler: () => applyDebugFlagsFromMenu() },
    {
      el: dbgTierOverride,
      event: "change",
      handler: () => {
        applyDebugFlagsFromMenu();
        game.refreshProgression({ animateZoom: false });
      },
    },
    {
      el: dbgTierOverrideLevel,
      event: "input",
      handler: () => {
        applyDebugFlagsFromMenu();
        game.refreshProgression({ animateZoom: false });
      },
    },
    {
      el: dbgGemScore,
      event: "input",
      handler: () => {
        game.state.score = clamp(Math.round(readNum(dbgGemScore, game.state.score)), 0, 5000);
        game.refreshProgression({ animateZoom: true });
        syncRuntimeDebugUi();
      },
    },
    { el: dbgAttract, event: "change", handler: () => applyDebugFlagsFromMenu() },
    { el: shipExplode, event: "change", handler: () => applyDebugFlagsFromMenu() },
  ];
  for (const b of DEBUG_MENU_BINDINGS) {
    if (!b.el) continue;
    b.el.addEventListener(b.event, b.handler);
  }

  for (const f of TUNING_FIELDS) {
    if (!f.saveBtn || !f.input) continue;
    f.saveBtn.addEventListener("click", () => {
      const p = game.state.params;
      const v = readNum(f.input, p[f.key]);
      setTuningDefault(f.key, v);
      syncTuningDefaultLabels();
      const prev = f.saveBtn.textContent;
      f.saveBtn.textContent = "Saved";
      windowRef.setTimeout(() => {
        f.saveBtn.textContent = prev;
      }, 800);
    });
  }

  applyTuningDefaultsToParams();
  syncTuningUiFromParams();
  applyTuningFromMenu();
  syncArenaUi();
  applyArenaFromMenu();
  applyDebugFlagsFromMenu();
  syncMenuButtons();
  syncRuntimeDebugUi();
  syncTuningDefaultLabels();

  if (canvas) {
    canvas.addEventListener("click", () => {
      if (game.state.mode === "menu") startOrResume();
    });
  }

  // Touch controls (iPad/mobile): virtual joystick + burst button.
  // Uses Pointer Events so it works for both touch and pen, and stays file:// friendly.
  if (touchUi) {
    // Ensure screen-reader nav isn't cluttered on desktop.
    touchUi.setAttribute("aria-hidden", "true");
  }
  if (touchJoystickBase) {
    const updateCenterFromLayout = () => {
      const rect = touchJoystickBase.getBoundingClientRect();
      touch.centerX = rect.left + rect.width / 2;
      touch.centerY = rect.top + rect.height / 2;
      touch.maxR = Math.max(24, Math.min(90, rect.width * 0.35));
    };
    updateCenterFromLayout();
    windowRef.addEventListener("resize", () => updateCenterFromLayout());

    touchJoystickBase.addEventListener("pointerdown", (e) => {
      if (typeof e?.preventDefault === "function") e.preventDefault();
      if (touch.pointerId !== null) return;
      updateCenterFromLayout();
      touch.active = true;
      touch.pointerId = e.pointerId;
      try {
        touchJoystickBase.setPointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
      updateJoystickFromPointer(e.clientX, e.clientY);
    });

    touchJoystickBase.addEventListener("pointermove", (e) => {
      if (!touch.active || touch.pointerId !== e.pointerId) return;
      if (typeof e?.preventDefault === "function") e.preventDefault();
      updateJoystickFromPointer(e.clientX, e.clientY);
    });

    const end = (e) => {
      if (!touch.active || touch.pointerId !== e.pointerId) return;
      if (typeof e?.preventDefault === "function") e.preventDefault();
      try {
        touchJoystickBase.releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
      resetTouchControls();
    };
    touchJoystickBase.addEventListener("pointerup", end);
    touchJoystickBase.addEventListener("pointercancel", end);
    touchJoystickBase.addEventListener("lostpointercapture", () => resetTouchControls());
  }

  if (touchBurstBtn) {
    const press = (e) => {
      if (typeof e?.preventDefault === "function") e.preventDefault();
      if (game.state.mode !== "playing") return;
      game.state.input.burst = true;
      touchBurstBtn.classList.add("pressed");
      try {
        touchBurstBtn.setPointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
    };
    const release = (e) => {
      if (typeof e?.preventDefault === "function") e.preventDefault();
      touchBurstBtn.classList.remove("pressed");
      try {
        touchBurstBtn.releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
    };
    touchBurstBtn.addEventListener("pointerdown", press);
    touchBurstBtn.addEventListener("pointerup", release);
    touchBurstBtn.addEventListener("pointercancel", release);
    touchBurstBtn.addEventListener("lostpointercapture", () => touchBurstBtn.classList.remove("pressed"));
  }

  if (touchPingBtn) {
    const press = (e) => {
      if (typeof e?.preventDefault === "function") e.preventDefault();
      if (game.state.mode !== "playing") return;
      const cooldownSec = Math.max(0, Number(game.state.round?.techPingCooldownSec) || 0);
      if (cooldownSec > 0.02) return;
      game.state.input.ping = true;
      touchPingBtn.classList.add("pressed");
      try {
        touchPingBtn.setPointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
      syncRuntimeDebugUi();
    };
    const release = (e) => {
      if (typeof e?.preventDefault === "function") e.preventDefault();
      touchPingBtn.classList.remove("pressed");
      try {
        touchPingBtn.releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
    };
    touchPingBtn.addEventListener("pointerdown", press);
    touchPingBtn.addEventListener("pointerup", release);
    touchPingBtn.addEventListener("pointercancel", release);
    touchPingBtn.addEventListener("lostpointercapture", () => touchPingBtn.classList.remove("pressed"));
  }

  return {
    applyAllFromMenu,
    isMenuVisible,
    setMenuVisible,
    startOrResume,
    toggleDebugMenu,
    syncRuntimeDebugUi,
    updateHudScore,
    applyTouchControls,
  };
}
