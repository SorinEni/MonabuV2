import { useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@components/shared/Icons";
import { formatHoursFull } from "@utils/formatters";

function intensity(hours) {
  if (!hours) return 0;
  if (hours < 1) return 1;
  if (hours < 2) return 2;
  if (hours < 4) return 3;
  return 4;
}

export function CalendarCard({ heatmapData, onDayClick }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const lookup = useMemo(() => {
    const m = {};
    (heatmapData || []).forEach((d) => {
      m[d.date] = { hours: d.hours, sessions: d.sessions };
    });
    return m;
  }, [heatmapData]);

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString("default", {
    month: "long",
  });

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth >= today.getMonth()))
      return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const isNextDisabled =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth >= today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const monthEntries = Object.entries(lookup).filter(([k]) => k.startsWith(monthPrefix));
  const monthHours = monthEntries.reduce((s, [, v]) => s + v.hours, 0);
  const activeDays = monthEntries.filter(([, v]) => v.hours > 0).length;
  const avgHours = activeDays > 0 ? monthHours / activeDays : 0;

  const todayLocal = new Date();
  todayLocal.setHours(0, 0, 0, 0);
  const todayStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, "0")}-${String(todayLocal.getDate()).padStart(2, "0")}`;

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push(<div key={`e-${i}`} className="cal-cell cal-cell--empty" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const entry = lookup[dateStr];
    const hours = entry?.hours ?? 0;
    const sessionCount = entry?.sessions ?? 0;
    const lv = intensity(hours);
    const isToday = dateStr === todayStr;
    const isFuture = new Date(viewYear, viewMonth, d) > todayLocal;
    const isSelected = dateStr === selectedDate;
    const hasActivity = hours > 0;

    cells.push(
      <div
        key={d}
        className={[
          "cal-cell",
          `cal-cell--lv${isFuture ? 0 : lv}`,
          isToday ? "cal-cell--today" : "",
          isFuture ? "cal-cell--future" : "",
          hasActivity ? "cal-cell--active" : "",
          isSelected ? "cal-cell--selected" : "",
          !isFuture ? "cal-cell--clickable" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => {
          if (isFuture) return;
          setSelectedDate(dateStr);
          onDayClick(dateStr);
        }}
        title={
          isFuture
            ? "Future date"
            : hasActivity
              ? `${dateStr} · ${formatHoursFull(hours)} · ${sessionCount} session${sessionCount !== 1 ? "s" : ""}`
              : `${dateStr} · no activity`
        }>
        <span className="cal-cell__day">{d}</span>
        {hasActivity && <span className="cal-cell__dot" />}
      </div>,
    );
  }

  return (
    <div className="cal-card">
      <div className="cal-card__header">
        <button className="cal-nav-btn" onClick={prevMonth}>
          <ChevronLeftIcon />
        </button>
        <div className="cal-card__title">
          {monthName} {viewYear}
        </div>
        <button className="cal-nav-btn" onClick={nextMonth} disabled={isNextDisabled}>
          <ChevronRightIcon />
        </button>
      </div>
      <div className="cal-weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="cal-weekday">
            {d}
          </div>
        ))}
      </div>
      <div className="cal-grid">{cells}</div>
      <div className="cal-stats">
        <div className="cal-stat">
          <div className="cal-stat__val">{activeDays}</div>
          <div className="cal-stat__label">Active days</div>
        </div>
        <div className="cal-stat">
          <div className="cal-stat__val">{formatHoursFull(monthHours)}</div>
          <div className="cal-stat__label">Total focus</div>
        </div>
        <div className="cal-stat">
          <div className="cal-stat__val">{formatHoursFull(avgHours)}</div>
          <div className="cal-stat__label">Daily avg</div>
        </div>
      </div>
      {activeDays > 0 && (
        <div className="cal-hint">
          <span className="cal-hint__icon">↑</span> Tap any day to see sessions
        </div>
      )}
    </div>
  );
}
