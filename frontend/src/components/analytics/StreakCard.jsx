export function StreakCard({ streaks, avgSession }) {
  return (
    <div className="streak-card">
      <div className="streak-card__row">
        <div className="streak-card__item">
          <div className="streak-card__flame">🔥</div>
          <div className="streak-card__num">{streaks.current}</div>
          <div className="streak-card__desc">Current streak</div>
          {streaks.todayDone && <div className="streak-card__badge">Today ✓</div>}
        </div>
        <div className="streak-card__divider" />
        <div className="streak-card__item">
          <div className="streak-card__flame">⚡</div>
          <div className="streak-card__num">{streaks.longest}</div>
          <div className="streak-card__desc">Longest streak</div>
        </div>
        <div className="streak-card__divider" />
        <div className="streak-card__item">
          <div className="streak-card__flame">📅</div>
          <div className="streak-card__num">{streaks.totalActiveDays}</div>
          <div className="streak-card__desc">Active days</div>
        </div>
        <div className="streak-card__divider" />
        <div className="streak-card__item">
          <div className="streak-card__flame">⏱</div>
          <div className="streak-card__num">{avgSession?.minutes ?? 0}</div>
          <div className="streak-card__desc">Avg min/session</div>
        </div>
      </div>
    </div>
  );
}
