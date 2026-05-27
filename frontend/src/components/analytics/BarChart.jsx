// Weekly hours bar chart for the Analytics page.
// Bars are filled as a percentage of the weekly goal. When a week exceeds
// the goal, the bar caps at 100% height but switches to an achievement colour.

import { formatHoursFull } from "@utils/formatters";

/**
 * Props:
 *   weeks      { hours, week?, year? }[]
 *   goalHours  number   Weekly hour goal
 */
export default function BarChart({ weeks, goalHours }) {
  const effectiveGoal = goalHours || 0;
  const maxH = Math.max(...weeks.map((w) => w.hours), effectiveGoal || 1);

  return (
    <div className="weekly-chart">
      {weeks.map((w, i) => {
        const pct = effectiveGoal > 0
          ? (w.hours / effectiveGoal) * 100
          : (w.hours / maxH) * 100;
        const cappedPct = Math.min(pct, 100);
        const achieved = effectiveGoal > 0 && w.hours > effectiveGoal;
        const label = w.week
          ? `W${w.week}`
          : `W${weeks.length - i}`;

        return (
          <div key={i} className="weekly-chart__col">
            <div className="weekly-chart__bar-wrap">
              <div
                className={`weekly-chart__bar${achieved ? " weekly-chart__bar--achieved" : ""}`}
                style={{ height: `${cappedPct}%` }}
                title={`${label}: ${formatHoursFull(w.hours)}${effectiveGoal > 0 ? ` (${Math.round(pct)}% of goal)` : ""}`}
              />
            </div>
            <div className="weekly-chart__label">{label}</div>
          </div>
        );
      })}
    </div>
  );
}
