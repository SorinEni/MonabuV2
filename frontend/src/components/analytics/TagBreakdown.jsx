import { formatHoursFull } from "@utils/formatters";

export function TagBreakdown({ data }) {
  return (
    <div className="tag-breakdown">
      {data.map((row) => (
        <div key={row.tag.name} className="tag-breakdown__row">
          <div className="tag-breakdown__left">
            <div className="tag-breakdown__dot" style={{ background: row.tag.color }} />
            <div className="tag-breakdown__name">{row.tag.name}</div>
          </div>
          <div className="tag-breakdown__bar-wrap">
            <div
              className="tag-breakdown__bar"
              style={{ width: `${row.pct}%`, background: row.tag.color }}
            />
          </div>
          <div className="tag-breakdown__meta">
            <span className="tag-breakdown__hours">{formatHoursFull(row.hours)}</span>
            <span className="tag-breakdown__pct">{row.pct}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
