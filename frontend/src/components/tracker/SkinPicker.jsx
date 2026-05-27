/**
 * SkinPicker
 * Clock skin selector. Auto-hides when only one skin is available.
 */

import { TRACKER_THEMES, TRACKER_THEME_KEYS } from "@utils/TrackerTheme";

export function SkinPicker({ current, onChange }) {
  if (TRACKER_THEME_KEYS.length <= 1) return null;
  return (
    <div className="skin-picker" aria-label="Clock skin">
      {TRACKER_THEME_KEYS.map((key) => {
        const skin = TRACKER_THEMES[key];
        return (
          <button
            key={key}
            className={`skin-btn${current === key ? " skin-btn--active" : ""}`}
            title={skin.description || skin.label}
            onClick={() => onChange(key)}
            aria-pressed={current === key}>
            <span className="skin-btn__icon">{skin.icon}</span>
            <span className="skin-btn__label">{skin.label}</span>
          </button>
        );
      })}
    </div>
  );
}
