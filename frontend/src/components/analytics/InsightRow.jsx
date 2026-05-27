function InsightPill({ icon, label }) {
  return (
    <div className="insight-pill">
      <span className="insight-pill__icon">{icon}</span>
      <span className="insight-pill__label">{label}</span>
    </div>
  );
}

export function InsightRow({ overview, streaks }) {
  if (!overview || !streaks) return null;
  const pills = [];
  if (streaks.current > 1) {
    pills.push({ icon: "🔥", label: `${streaks.current}-day streak` });
  } else if (streaks.todayDone) {
    pills.push({ icon: "✓", label: "Session logged today" });
  }
  if (overview.avgSession?.minutes > 0) {
    pills.push({ icon: "⏱", label: `${overview.avgSession.minutes} min avg` });
  }
  if (overview.bestDay) {
    pills.push({ icon: "🏆", label: `Best day · ${overview.bestDay.date}` });
  }
  if (!pills.length) {
    pills.push({
      icon: "🎯",
      label: overview.allTime?.sessions
        ? "Keep going — every session counts."
        : "Start your first session to begin tracking progress.",
    });
  }
  return (
    <div className="insight-row">
      {pills.map((p, i) => (
        <InsightPill key={i} icon={p.icon} label={p.label} />
      ))}
    </div>
  );
}
