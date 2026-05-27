import { formatHoursFull } from "@utils/formatters";

export function GoalRing({ progressPct, targetHours, currentHours }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pct = progressPct ?? 0;
  const filled = (pct / 100) * circ;
  const achieved = pct > 100;

  return (
    <div className="goal-ring-wrap">
      <div className="goal-ring-svg-wrap">
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r={r} fill="none" stroke="var(--border-2)" strokeWidth="8" />
          <circle
            cx="45"
            cy="45"
            r={r}
            fill="none"
            stroke={achieved ? "var(--color-success)" : "var(--accent)"}
            strokeWidth="8"
            strokeDasharray={`${filled} ${circ}`}
            strokeDashoffset={circ / 4}
            strokeLinecap="round"
          />
        </svg>
        <div className="goal-ring-center">
          <div className="goal-ring-pct">{Math.round(progressPct ?? 0)}%</div>
          <div className="goal-ring-label">of goal</div>
        </div>
      </div>
      <div className="goal-ring-info">
        <div className="goal-ring-current">{formatHoursFull(currentHours)} done</div>
        <div className="goal-ring-target">Goal: {targetHours}h / week</div>
      </div>
    </div>
  );
}
