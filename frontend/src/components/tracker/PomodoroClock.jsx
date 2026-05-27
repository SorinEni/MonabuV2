/**
 * PomodoroClock
 *
 * Pomodoro countdown display.
 * Inline settings panel (no overlay), phase bar with session dots, SVG ring.
 *
 * Pure presentational — receives all state as props, emits callbacks.
 */

import { useState } from "react";
import { formatCountdown } from "@utils/formatters";

function totalPomoMinutes(s) {
  const workTotal  = s.totalSessions * s.workMins;
  const longBreaks = s.longBreakEvery > 0
    ? Math.floor((s.totalSessions - 1) / s.longBreakEvery)
    : 0;
  const shortBreaks = s.totalSessions - 1 - longBreaks;
  return workTotal + shortBreaks * s.shortBreakMins + longBreaks * s.longBreakMins;
}

// SVG ring constants
const RING_SIZE = 280;
const RING_SW   = 6;
const RING_R    = (RING_SIZE - RING_SW * 2) / 2;
const RING_C    = RING_SIZE / 2;
const CIRC      = 2 * Math.PI * RING_R;

function PomodoroRing({ progress, phase, tagColor, themeVars }) {
  const filled     = progress * CIRC;
  const workColor  = tagColor || themeVars["--ct-accent"] || "var(--accent, #93c5fd)";
  const breakColor = "#34d399";
  const phaseColor = phase === "work" ? workColor : breakColor;
  const glowColor  = phase === "work"
    ? themeVars["--ct-accent-glow"] || "rgba(147,197,253,0.22)"
    : "rgba(52,211,153,0.22)";
  const trackColor = themeVars["--ct-ring-track"] || "rgba(255,255,255,0.055)";

  return (
    <svg
      className="pomo-ring"
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      width={RING_SIZE}
      height={RING_SIZE}
      style={{ gridArea: "1 / 1", pointerEvents: "none" }}
      aria-hidden="true">
      <circle cx={RING_C} cy={RING_C} r={RING_R} fill="none" stroke={trackColor} strokeWidth={RING_SW} />
      <circle
        cx={RING_C} cy={RING_C} r={RING_R}
        fill="none"
        stroke={phaseColor}
        strokeWidth={RING_SW}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${CIRC}`}
        transform={`rotate(-90 ${RING_C} ${RING_C})`}
        style={{
          filter: `drop-shadow(0 0 8px ${glowColor})`,
          transition: "stroke-dasharray 0.9s linear, stroke 0.4s ease",
        }}
      />
    </svg>
  );
}

// Inline stepper used only inside settings
function Stepper({ value, min, max, step = 1, suffix = "min", onChange }) {
  const [draft, setDraft] = useState(null);
  const commit = (raw) => {
    setDraft(null);
    const v = parseInt(raw, 10);
    if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
  };
  return (
    <div className="pomo-stepper">
      <button className="pomo-stepper__btn" onClick={() => { setDraft(null); onChange(Math.max(min, value - step)); }} disabled={value <= min}>−</button>
      <div className="pomo-stepper__input-wrap">
        <input
          className="pomo-stepper__input"
          type="number"
          value={draft ?? value}
          min={min} max={max}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.target.blur(); commit(e.target.value); }
            if (e.key === "Escape") setDraft(null);
          }}
        />
        {suffix && <span className="pomo-stepper__suffix">{suffix}</span>}
      </div>
      <button className="pomo-stepper__btn" onClick={() => { setDraft(null); onChange(Math.min(max, value + step)); }} disabled={value >= max}>+</button>
    </div>
  );
}

const LONG_BREAK_OPTIONS = [0, 2, 3, 4, 5, 6];

function PomoSettings({ settings, onChange, disabled }) {
  const totalMins = totalPomoMinutes(settings);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const totalLabel = h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim() : `${m}m`;

  return (
    <div className={`pomo-settings${disabled ? " pomo-settings--disabled" : ""}`}>
      <div className="pomo-settings__grid">
        <div className="pomo-settings__item">
          <div className="pomo-settings__label">Focus</div>
          <Stepper value={settings.workMins} min={1} max={180} onChange={(v) => onChange({ ...settings, workMins: v })} />
        </div>
        <div className="pomo-settings__item">
          <div className="pomo-settings__label">Short break</div>
          <Stepper value={settings.shortBreakMins} min={1} max={15} onChange={(v) => onChange({ ...settings, shortBreakMins: v })} />
        </div>
        <div className="pomo-settings__item">
          <div className="pomo-settings__label">Long break</div>
          <Stepper value={settings.longBreakMins} min={15} max={60} onChange={(v) => onChange({ ...settings, longBreakMins: v })} />
        </div>
        <div className="pomo-settings__item">
          <div className="pomo-settings__label">Sessions</div>
          <Stepper value={settings.totalSessions} min={1} max={6} step={1} suffix="" onChange={(v) => onChange({ ...settings, totalSessions: v })} />
        </div>

        <div className="pomo-settings__item pomo-settings__item--full">
          <div className="pomo-settings__label">Long break every <span className="pomo-settings__hint">(sessions)</span></div>
          <div className="pomo-settings__long-break-opts">
            {LONG_BREAK_OPTIONS.map((n) => (
              <button
                key={n}
                className={`pomo-settings__opt${settings.longBreakEvery === n ? " pomo-settings__opt--active" : ""}`}
                onClick={() => onChange({ ...settings, longBreakEvery: n })}>
                {n === 0 ? "Never" : n}
              </button>
            ))}
          </div>
        </div>

        <div className="pomo-settings__item pomo-settings__item--full">
          <div className="pomo-settings__label">Auto-start</div>
          <div className="pomo-settings__toggles">
            {[
              { key: "autoStartBreak", label: "Breaks" },
              { key: "autoStartWork",  label: "Next session" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`pomo-settings__toggle${settings[key] ? " pomo-settings__toggle--on" : ""}`}
                onClick={() => onChange({ ...settings, [key]: !settings[key] })}>
                <span className={`pomo-settings__toggle-pip${settings[key] ? " pomo-settings__toggle-pip--on" : ""}`} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pomo-settings__summary">
        {[
          { icon: "🍅", label: "Sessions",  value: settings.totalSessions },
          { icon: "☕", label: "Breaks",    value: settings.totalSessions - 1 },
          { icon: "⏱", label: "Total",     value: totalLabel },
        ].map(({ icon, label, value }, i, arr) => (
          <>
            <div key={label} className={`pomo-settings__summary-item${i === arr.length - 1 ? " pomo-settings__summary-item--total" : ""}`}>
              <span className="pomo-settings__summary-icon">{icon}</span>
              <span className="pomo-settings__summary-label">{label}</span>
              <span className="pomo-settings__summary-value">{value}</span>
            </div>
            {i < arr.length - 1 && <div className="pomo-settings__summary-divider" />}
          </>
        ))}
      </div>
    </div>
  );
}

function PhaseBar({ pomoSession, totalSessions, pomoPhase, isLongBreak }) {
  const phaseLabel = isLongBreak ? "Long Break" : pomoPhase === "break" ? "Short Break" : "Focus";
  const phaseIcon  = pomoPhase === "work" ? "🍅" : "☕";
  return (
    <div className="pomo-phase-bar">
      <div className="pomo-phase-bar__left">
        <span className="pomo-phase-bar__icon">{phaseIcon}</span>
        <span className="pomo-phase-bar__label">{phaseLabel}</span>
      </div>
      <div className="pomo-phase-bar__sessions">
        {Array.from({ length: totalSessions }).map((_, i) => {
          const done   = i < pomoSession - 1;
          const active = i === pomoSession - 1 && pomoPhase === "work";
          return (
            <span
              key={i}
              className={`pomo-phase-bar__dot${done ? " pomo-phase-bar__dot--done" : ""}${active ? " pomo-phase-bar__dot--active" : ""}`}
            />
          );
        })}
      </div>
      <span className="pomo-phase-bar__count">{pomoSession}&thinsp;/&thinsp;{totalSessions}</span>
    </div>
  );
}

export function PomodoroClock({
  running = false,
  pomoPhase = "work",
  pomoSession = 1,
  pomoCountdown = null,
  pomoDone = false,
  isLongBreak = false,
  displaySeconds,
  progress = 1,
  pomoSettings = {
    workMins: 25, shortBreakMins: 5, longBreakMins: 15,
    totalSessions: 4, longBreakEvery: 4,
    autoStartBreak: false, autoStartWork: false,
  },
  tagColor,
  clockTheme,
  onStart,
  onPause,
  onSkip,
  onEnd,
  onDiscard,
  onSettingsChange,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const themeVars  = clockTheme?.vars ?? {};
  const countdown  = displaySeconds ?? pomoCountdown;
  const tagColorVar = tagColor || "var(--accent)";

  if (pomoDone) {
    return (
      <div className="pomo-done">
        <div className="pomo-done__icon">🎉</div>
        <div className="pomo-done__title">All done!</div>
        <div className="pomo-done__sub">
          {pomoSettings.totalSessions} pomodoro{pomoSettings.totalSessions !== 1 ? "s" : ""} completed. Great work.
        </div>
        <div className="timer-controls" style={{ marginTop: 8, justifyContent: "center" }}>
          <button className="timer-btn timer-btn--start" onClick={onEnd}>Save &amp; Finish</button>
          <button className="timer-btn timer-btn--discard" onClick={onDiscard}>Discard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pomo-wrap" style={{ "--tag-color": tagColorVar, ...themeVars }}>
      <PhaseBar
        pomoSession={pomoSession}
        totalSessions={pomoSettings.totalSessions}
        pomoPhase={pomoPhase}
        isLongBreak={isLongBreak}
      />

      <div className="pomo-ring-wrap">
        <PomodoroRing progress={progress} phase={pomoPhase} tagColor={tagColor} themeVars={themeVars} />
        <div
          className={`timer-display${running ? " timer-display--running" : " timer-display--paused"}${countdown >= 3600 ? " timer-display--long" : ""}`}
          style={running ? { "--tag-color": tagColorVar } : undefined}>
          {formatCountdown(countdown)}
        </div>
      </div>

      <div className="timer-controls">
        {!running ? (
          <button className="timer-btn timer-btn--start" onClick={onStart}>
            {pomoCountdown === null ? "Start" : "Resume"}
          </button>
        ) : (
          <button className="timer-btn timer-btn--pause" onClick={onPause}>Pause</button>
        )}

        {pomoPhase === "break" && (
          <button className="timer-btn timer-btn--stop" onClick={onSkip} title="Skip break">
            Skip break
          </button>
        )}

        {!running && pomoCountdown !== null && (
          <>
            <button className="timer-btn timer-btn--stop" onClick={onEnd}>Save &amp; Finish</button>
            <button className="timer-btn timer-btn--discard" onClick={onDiscard}>Discard</button>
          </>
        )}

        <button
          className={`timer-btn timer-btn--settings${settingsOpen ? " timer-btn--settings-on" : ""}${running ? " timer-btn--settings-disabled" : ""}`}
          onClick={() => !running && setSettingsOpen((v) => !v)}
          title={running ? "Stop session to change settings" : "Settings"}
          disabled={running}>
          Settings
        </button>
      </div>

      {settingsOpen && (
        <PomoSettings settings={pomoSettings} onChange={onSettingsChange} disabled={running} />
      )}
    </div>
  );
}
