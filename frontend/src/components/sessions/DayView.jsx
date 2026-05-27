import SessionCard from "./SessionCard";
import { SkeletonGroup } from "./SkeletonGroup";
import { useDayView } from "@hooks/useDayView";
import { dayTotal, formatDayLabel } from "./utils";
import { formatDuration } from "@utils/formatters";

export function DayView({ onEdit, onDelete, refreshKey, tagFilter }) {
  const { offset, setOffset, date, sessions, loading, error } = useDayView(refreshKey, tagFilter);

  const total = dayTotal(sessions);
  const isToday = offset === 0;

  return (
    <div className="ss-dayview">
      <div className="ss-dayview__nav">
        <button className="ss-dayview__arrow" onClick={() => setOffset((o) => o - 1)} aria-label="Previous day">
          ‹
        </button>
        <div className="ss-dayview__nav-center">
          <span className="ss-dayview__label">{formatDayLabel(date)}</span>
          <span className="ss-dayview__date">
            {date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <button
          className="ss-dayview__arrow"
          onClick={() => setOffset((o) => o + 1)}
          disabled={isToday}
          aria-label="Next day">
          ›
        </button>
      </div>

      {!loading && !error && (
        <div className="ss-dayview__summary">
          <span className="ss-dayview__summary-count">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </span>
          {sessions.length > 0 && (
            <>
              <span className="ss-dayview__summary-dot">·</span>
              <span className="ss-dayview__summary-total">{formatDuration(total)} total</span>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="ss-error">
          <span>⚠</span> {error}
        </div>
      )}

      {loading ? (
        <SkeletonGroup />
      ) : sessions.length === 0 ? (
        <div className="ss-empty">
          <div className="ss-empty__icon">📭</div>
          <div className="ss-empty__title">No sessions {isToday ? "today" : "this day"}</div>
          <div className="ss-empty__sub">
            {isToday
              ? "Start tracking to log your first session today."
              : "Nothing was tracked on this day."}
          </div>
        </div>
      ) : (
        <div className="ss-day__rows ss-dayview__rows">
          {sessions.map((s, i) => (
            <SessionCard key={s._id} session={s} onEdit={onEdit} onDelete={onDelete} animDelay={`${i * 0.03}s`} />
          ))}
        </div>
      )}
    </div>
  );
}
