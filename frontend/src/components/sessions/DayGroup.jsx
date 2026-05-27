import { useState } from "react";
import SessionCard from "./SessionCard";
import { dayTotal, formatPeriodLabel } from "./utils";
import { formatDuration } from "@utils/formatters";

export function DayGroup({ mode, periodKey, sessions, onEdit, onDelete }) {
  const [open, setOpen] = useState(true);
  const total = dayTotal(sessions);
  const label = formatPeriodLabel(mode, periodKey);
  return (
    <section className="ss-day">
      <button className="ss-day__header" onClick={() => setOpen((o) => !o)}>
        <span className="ss-day__chevron">{open ? "▾" : "▸"}</span>
        <h2 className="ss-day__label">{label}</h2>
        <span className="ss-day__count">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </span>
        <span className="ss-day__total">{formatDuration(total)}</span>
      </button>
      {open && (
        <div className="ss-day__rows">
          {sessions.map((s, i) => (
            <SessionCard
              key={s._id}
              session={s}
              onEdit={onEdit}
              onDelete={onDelete}
              animDelay={`${i * 0.03}s`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
