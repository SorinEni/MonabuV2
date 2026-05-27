// 365-day activity heatmap grid.
// Extracted from Analytics.jsx where it was a private inner component.

import { useMemo } from "react";
import { formatHoursFull } from "@utils/formatters";

function localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function intensity(hours, maxHours) {
  if (hours === 0) return 0;
  const pct = hours / maxHours;
  if (pct < 0.25) return 1;
  if (pct < 0.5)  return 2;
  if (pct < 0.75) return 3;
  return 4;
}

/**
 * Props:
 *   data        { date, hours }[]   One entry per active day
 *   onDayClick  fn(dateStr)         Called when a cell with activity is clicked
 */
export default function HeatmapGrid({ data, onDayClick }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lookup = useMemo(() => {
    const m = {};
    data.forEach((d) => { m[d.date] = d.hours; });
    return m;
  }, [data]);

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const weeks = [];
  let cursor = new Date(startDate);
  while (cursor <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = localDateStr(cursor);
      const hours = lookup[dateStr] ?? 0;
      const isFuture = cursor > today;
      week.push({ date: dateStr, hours, isFuture });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  const monthLabels = [];
  weeks.forEach((week, wi) => {
    const firstActive = week.find((d) => !d.isFuture);
    if (!firstActive) return;
    const dt = new Date(firstActive.date);
    if (dt.getDate() <= 7) {
      monthLabels.push({ wi, label: dt.toLocaleString("default", { month: "short" }) });
    }
  });

  const maxHours = Math.max(...data.map((d) => d.hours), 1);

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-month-row">
        {monthLabels.map(({ wi, label }) => (
          <span
            key={wi + label}
            className="heatmap-month-label"
            style={{ left: `${wi * 14}px` }}>
            {label}
          </span>
        ))}
      </div>
      <div className="heatmap-body">
        <div className="heatmap-dow">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={i} className="heatmap-dow-label">{i % 2 === 1 ? d : ""}</span>
          ))}
        </div>
        <div className="heatmap-grid">
          {weeks.map((week, wi) => (
            <div key={wi} className="heatmap-col">
              {week.map((cell) => (
                <div
                  key={cell.date}
                  className={[
                    `heatmap-cell heatmap-cell--${cell.isFuture ? "future" : intensity(cell.hours, maxHours)}`,
                    !cell.isFuture && cell.hours > 0 ? "heatmap-cell--clickable" : "",
                  ].filter(Boolean).join(" ")}
                  title={
                    cell.isFuture
                      ? ""
                      : `${cell.date}: ${cell.hours > 0 ? formatHoursFull(cell.hours) : "no activity"}`
                  }
                  onClick={() => { if (!cell.isFuture && cell.hours > 0) onDayClick(cell.date); }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="heatmap-legend">
        <span className="heatmap-legend-label">Less</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`heatmap-cell heatmap-cell--${i}`} />
        ))}
        <span className="heatmap-legend-label">More</span>
      </div>
    </div>
  );
}
