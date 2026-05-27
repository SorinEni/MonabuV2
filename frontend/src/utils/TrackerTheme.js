/**
 * TrackerTheme.js
 *
 * Clock SKINS — each skin is a complete visual identity for the entire
 * clock area: ring, digits, buttons, backgrounds, borders, typography.
 *
 * A skin is NOT just a color palette — each one has its own character.
 * Add more skins here following the same shape; the SkinPicker renders
 * automatically when more than one is available.
 *
 * Current skins:
 *   default  —  "Obsidian"   Deep dark glass, minimal, focused.
 *
 * When you add a second skin, SkinPicker will appear automatically.
 */

//  "Obsidian" skin
// A deep, dark-glass clock. The ring glows softly. The digits are light and
// airy (thin weight Geist). Buttons are flat with tinted borders. Everything
// sits on a near-black surface so the ring arc is the hero.

const OBSIDIAN = {
  label: "Obsidian",
  description: "Deep dark glass — focused and minimal.",
  icon: "◉",
  vars: {
    // Surfaces
    "--ct-bg": "transparent",
    "--ct-surface": "rgba(255,255,255,0.0)",
    "--ct-border": "rgba(255,255,255,0.06)",
    "--ct-border-radius": "0px",
    "--ct-shadow": "none",
    "--ct-padding": "0px",
    "--ct-gap": "18px",

    // Text
    "--ct-text": "var(--text, #e2e0dc)",
    "--ct-text-dim": "rgba(226,224,220,0.35)",

    // Accent / ring
    "--ct-accent": "var(--accent, #93c5fd)",
    "--ct-accent-glow": "rgba(147,197,253,0.20)",
    "--ct-ring-track": "rgba(255,255,255,0.055)",
    "--ct-ring-stroke": "5",

    // Typography (digits)
    "--ct-digit-font": "'Geist', 'SF Mono', monospace",
    "--ct-digit-size": "72px",
    "--ct-digit-weight": "200",
    "--ct-digit-spacing": "-0.03em",

    // Buttons
    "--ct-btn-start-bg": "var(--accent)",
    "--ct-btn-start-text": "var(--color-on-accent, #06060a)",
    "--ct-btn-pause-bg": "rgba(251,146,60,0.12)",
    "--ct-btn-pause-text": "#fb923c",
    "--ct-btn-stop-bg": "rgba(74,222,128,0.09)",
    "--ct-btn-stop-text": "#4ade80",
    "--ct-btn-discard-bg": "rgba(255,255,255,0.04)",
    "--ct-btn-discard-text": "rgba(232,230,225,0.45)",
    "--ct-btn-radius": "10px",
  },
};

//  Skin registry

export const TRACKER_THEMES = {
  default: OBSIDIAN,
};

export const TRACKER_THEME_KEYS = Object.keys(TRACKER_THEMES);

export function getTrackerTheme(key) {
  return TRACKER_THEMES[key] ?? OBSIDIAN;
}

export function saveClockTheme(key) {
  localStorage.setItem("clockTheme", key);
}

export function loadClockTheme() {
  return localStorage.getItem("clockTheme") ?? "default";
}
