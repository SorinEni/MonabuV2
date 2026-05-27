import { useState, useEffect } from "react";

export default function Stepper({ value, onChange, min, max, unit }) {
  const [raw, setRaw] = useState(String(value));

  useEffect(() => {
    setRaw(String(value));
  }, [value]);

  function commit(str) {
    const n = parseInt(str, 10);
    if (!isNaN(n)) {
      onChange(Math.min(max, Math.max(min, n)));
    }
    setRaw(String(value));
  }

  return (
    <div className="settings-pomo-stepper">
      <button
        type="button"
        className="settings-pomo-btn"
        onClick={() => {
          const next = Math.max(min, value - 1);
          onChange(next);
          setRaw(String(next));
        }}
        disabled={value <= min}>
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className="settings-pomo-input"
        value={raw}
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9]/g, "");
          setRaw(v);
        }}
        onBlur={() => commit(raw)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
      {unit && <span className="settings-pomo-unit">{unit}</span>}
      <button
        type="button"
        className="settings-pomo-btn"
        onClick={() => {
          const next = Math.min(max, value + 1);
          onChange(next);
          setRaw(String(next));
        }}
        disabled={value >= max}>
        +
      </button>
    </div>
  );
}
