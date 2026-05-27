export function StatCard({ label, value, sub, delta, deltaLabel, accent }) {
  const positive = delta >= 0;
  return (
    <div className={`stat-card${accent ? " stat-card--accent" : ""}`}>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__footer">
        {sub && <span className="stat-card__sub">{sub}</span>}
        {delta !== null && delta !== undefined && (
          <span
            className={`stat-card__delta${positive ? " stat-card__delta--up" : " stat-card__delta--down"}`}>
            {positive ? "↑" : "↓"} {Math.abs(delta)}% {deltaLabel || "vs last period"}
          </span>
        )}
      </div>
    </div>
  );
}
