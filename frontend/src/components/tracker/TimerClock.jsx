/**
 * TimerClock
 *
 * Stopwatch display component — large digits inside a breathing SVG ring.
 * Pure presentational: receives state and callbacks, owns no logic.
 *
 * Props:
 *   elapsed    {number}   seconds elapsed
 *   running    {boolean}
 *   tagColor   {string}   hex color for ring and digit glow
 *   clockTheme {object}   skin vars from TrackerTheme
 *   onStart / onPause / onStop / onDiscard  {fn}
 */

import { useMemo } from "react";
import { formatElapsed } from "@utils/formatters";

const RING_SIZE = 280;
const RING_SW   = 5;
const RING_R    = (RING_SIZE - RING_SW * 2) / 2;
const RING_C    = RING_SIZE / 2;
const CIRC      = 2 * Math.PI * RING_R;

function ElapsedRing({ elapsed, tagColor, themeVars }) {
  const sw          = parseFloat(themeVars["--ct-ring-stroke"] || RING_SW);
  const progress    = (elapsed % 600) / 600; // one revolution = 10 minutes
  const dash        = progress * CIRC;
  const accentColor = tagColor || themeVars["--ct-accent"] || "var(--accent, #93c5fd)";
  const glowColor   = themeVars["--ct-accent-glow"] || "rgba(147,197,253,0.22)";
  const trackColor  = themeVars["--ct-ring-track"]  || "rgba(255,255,255,0.055)";

  return (
    <svg
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      width={RING_SIZE}
      height={RING_SIZE}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      aria-hidden="true">
      <circle cx={RING_C} cy={RING_C} r={RING_R} fill="none" stroke={trackColor} strokeWidth={sw} />
      <circle
        cx={RING_C} cy={RING_C} r={RING_R}
        fill="none"
        stroke={accentColor}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${CIRC}`}
        strokeDashoffset={0}
        transform={`rotate(-90 ${RING_C} ${RING_C})`}
        style={{
          filter: `drop-shadow(0 0 10px ${glowColor})`,
          transition: "stroke-dasharray 0.9s ease, stroke 0.4s ease",
        }}
      />
    </svg>
  );
}

export function TimerClock({
  elapsed = 0,
  running = false,
  tagColor,
  clockTheme,
  onStart,
  onPause,
  onStop,
  onDiscard,
}) {
  const themeVars  = clockTheme?.vars ?? {};
  const timeString = formatElapsed(elapsed);
  const isPaused   = !running && elapsed > 0;
  const isLong     = elapsed >= 3600;

  const wrapStyle = useMemo(
    () => ({
      ...themeVars,
      "--tag-color": tagColor || "var(--accent)",
      position: "relative",
      width: RING_SIZE,
      height: RING_SIZE,
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }),
    [themeVars, tagColor],
  );

  return (
    <div className="timer-clock-area">
      <div style={wrapStyle}>
        <ElapsedRing elapsed={elapsed} tagColor={tagColor} themeVars={themeVars} />
        <div
          className={[
            "timer-display",
            running  ? "timer-display--running" : "",
            isPaused ? "timer-display--paused"  : "",
            isLong   ? "timer-display--long"    : "",
          ].filter(Boolean).join(" ")}
          style={running ? { "--tag-color": tagColor || "var(--accent)" } : undefined}>
          {timeString}
        </div>
      </div>

      <div className="timer-controls" style={{ marginTop: 16 }}>
        {!running && elapsed === 0 && (
          <button className="timer-btn timer-btn--start" onClick={onStart}>Start</button>
        )}
        {running && (
          <button className="timer-btn timer-btn--pause" onClick={onPause}>Pause</button>
        )}
        {isPaused && (
          <button className="timer-btn timer-btn--start" onClick={onStart}>Resume</button>
        )}
        {(running || isPaused) && (
          <button className="timer-btn timer-btn--stop" onClick={onStop}>Stop &amp; Save</button>
        )}
        {isPaused && (
          <button className="timer-btn timer-btn--discard" onClick={onDiscard}>Discard</button>
        )}
      </div>
    </div>
  );
}
