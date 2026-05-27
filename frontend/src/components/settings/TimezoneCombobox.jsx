import { useState, useRef, useEffect } from "react";

const ALL_TIMEZONES = Intl.supportedValuesOf
  ? Intl.supportedValuesOf("timeZone")
  : [
      "UTC",
      "America/New_York",
      "America/Los_Angeles",
      "Europe/London",
      "Asia/Tokyo",
      "Europe/Prague",
    ];

export default function TimezoneCombobox({ value, onChange }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const filtered = query.trim()
    ? ALL_TIMEZONES.filter((tz) =>
        tz.toLowerCase().includes(query.toLowerCase()),
      ).slice(0, 40)
    : ALL_TIMEZONES.slice(0, 40);

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        if (!ALL_TIMEZONES.includes(query)) setQuery(value);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [query, value]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  function select(tz) {
    onChange(tz);
    setQuery(tz);
    setOpen(false);
  }

  return (
    <div className="settings-tz-wrap" ref={wrapRef}>
      <input
        type="text"
        className="settings-input settings-tz-input"
        value={query}
        placeholder="Search timezone…"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
        spellCheck={false}
        onKeyDown={(e) => {
          if (!open || filtered.length === 0) return;
          if (e.key === "Enter") {
            e.preventDefault();
            select(filtered[0]);
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && filtered.length > 0 && (
        <ul className="settings-tz-dropdown">
          {filtered.map((tz) => (
            <li
              key={tz}
              className={`settings-tz-option${tz === value ? " settings-tz-option--active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                select(tz);
              }}>
              {tz}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
