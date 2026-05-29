// Side drawer that shows all sessions for clicked day on analytics heatmap/calendar.
// Refactored: uses ?date=YYYY-MM-DD query (timezone-aware on the backend)
// instead of computing from/to in local time.

import { useState, useEffect, useMemo, useRef } from "react";
import { api } from "@api/api";
import { formatDuration, formatTime, formatDateFull } from "@utils/formatters";
import { ChevronDownIcon } from "@components/shared/Icons";

/**
 * Props:
 *   date    string "YYYY-MM-DD"
 *   onClose fn
 */
export default function DayDrawer({ date, onClose }) {
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const drawerRef = useRef(null);

  // Tag grouping expand/collapse
  const [expandedTags, setExpandedTags] = useState(new Set());

  // Inline log session form
  const [showLogForm, setShowLogForm] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState("");
  const [logForm, setLogForm] = useState({
    startTime: "09:00",
    endTime: "10:00",
    tagId: "",
    label: "",
    notes: "",
  });

  useEffect(() => {
    if (!date) return;
    api.get("/tags")
      .then((res) => setAllTags(Array.isArray(res) ? res : res?.tags || []))
      .catch(() => setAllTags([]));
  }, [date]);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    setError(null);
    setSessions(null);

    api
      .get(`/analytics/sessions?date=${encodeURIComponent(date)}`)
      .then((res) => setSessions(Array.isArray(res) ? res : (res?.sessions ?? [])))
      .catch((err) => setError(err.message || "Failed to load sessions."))
      .finally(() => setLoading(false));
  }, [date]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 80);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [onClose]);

  const totalSeconds = (sessions || []).reduce((s, r) => s + (r.durationSeconds || 0), 0);

  const toggleTag = (name) => {
    setExpandedTags((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  async function handleLogSubmit(e) {
    e.preventDefault();
    setLogError("");
    if (!logForm.startTime || !logForm.endTime) {
      setLogError("Start and end times are required.");
      return;
    }
    const startedAt = new Date(`${date}T${logForm.startTime}:00`);
    const endedAt   = new Date(`${date}T${logForm.endTime}:00`);
    if (endedAt <= startedAt) {
      setLogError("End time must be after start time.");
      return;
    }
    setLogLoading(true);
    try {
      await api.post("/sessions", {
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        tagId: logForm.tagId || undefined,
        label: logForm.label.trim() || undefined,
        notes: logForm.notes.trim() || undefined,
      });
      // Refresh sessions
      const refreshed = await api.get(`/analytics/sessions?date=${encodeURIComponent(date)}`);
      setSessions(Array.isArray(refreshed) ? refreshed : (refreshed?.sessions ?? []));
      setShowLogForm(false);
      setLogForm({ startTime: "09:00", endTime: "10:00", tagId: "", label: "", notes: "" });
    } catch (err) {
      setLogError(err.message || "Failed to log session.");
    } finally {
      setLogLoading(false);
    }
  }

  const tagRows = useMemo(() => {
    if (!sessions) return [];
    const map = sessions.reduce((acc, s) => {
      const key = s.tag?.name || "Untagged";
      if (!acc[key]) acc[key] = { seconds: 0, color: s.tag?.color || "var(--accent)", sessions: 0 };
      acc[key].seconds += s.durationSeconds || 0;
      acc[key].sessions += 1;
      return acc;
    }, {});
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.seconds - a.seconds);
  }, [sessions]);

  const totalTagSec = totalSeconds || 1;

  return (
    <>
      <div className="day-drawer-overlay" />
      <aside
        className="day-drawer"
        ref={drawerRef}
        role="dialog"
        aria-label={`Sessions for ${date}`}>
        <div className="day-drawer__header">
          <div>
            <div className="day-drawer__title">{formatDateFull(date)}</div>
            {!loading && sessions && (
              <div className="day-drawer__meta">
                {sessions.length} session{sessions.length !== 1 ? "s" : ""} · {formatDuration(totalSeconds)} total
              </div>
            )}
          </div>
          <button className="day-drawer__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="day-drawer__body">
          {loading && (
            <div className="day-drawer__loading">
              <div className="day-drawer__spinner" />
              Loading sessions…
            </div>
          )}

          {error && <div className="day-drawer__error">{error}</div>}

          {!loading && !error && (
            <div className="day-drawer__log-bar">
              <button
                className={`day-drawer__log-btn${showLogForm ? " day-drawer__log-btn--active" : ""}`}
                onClick={() => setShowLogForm((v) => !v)}
              >
                {showLogForm ? "Cancel" : "+ Log session"}
              </button>
            </div>
          )}

          {showLogForm && (
            <form className="day-drawer__log-form" onSubmit={handleLogSubmit}>
              <div className="day-drawer__log-row">
                <div className="day-drawer__log-field">
                  <label>Start</label>
                  <input
                    type="time"
                    value={logForm.startTime}
                    onChange={(e) => setLogForm((f) => ({ ...f, startTime: e.target.value }))}
                    required
                  />
                </div>
                <div className="day-drawer__log-field">
                  <label>End</label>
                  <input
                    type="time"
                    value={logForm.endTime}
                    onChange={(e) => setLogForm((f) => ({ ...f, endTime: e.target.value }))}
                    required
                  />
                </div>
                <div className="day-drawer__log-field day-drawer__log-field--wide">
                  <label>Tag</label>
                  <select
                    value={logForm.tagId}
                    onChange={(e) => setLogForm((f) => ({ ...f, tagId: e.target.value }))}
                  >
                    <option value="">None</option>
                    {allTags.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="day-drawer__log-row">
                <div className="day-drawer__log-field day-drawer__log-field--wide">
                  <label>Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Morning study"
                    value={logForm.label}
                    onChange={(e) => setLogForm((f) => ({ ...f, label: e.target.value }))}
                  />
                </div>
                <div className="day-drawer__log-field day-drawer__log-field--wide">
                  <label>Notes</label>
                  <input
                    type="text"
                    placeholder="Optional notes…"
                    value={logForm.notes}
                    onChange={(e) => setLogForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>
              {logError && <div className="day-drawer__log-error">{logError}</div>}
              <button
                type="submit"
                className={`day-drawer__log-submit${logLoading ? " day-drawer__log-submit--loading" : ""}`}
                disabled={logLoading}
              >
                {logLoading ? "Saving…" : "Save session"}
              </button>
            </form>
          )}

          {!loading && !error && sessions.length === 0 && (
            <div className="day-drawer__empty">
              <div className="day-drawer__empty-icon">📭</div>
              <div>No sessions recorded on this day.</div>
            </div>
          )}

          {!loading && !error && sessions && sessions.length > 0 && (
            <>
              <div className="day-drawer__summary">
                <div className="day-drawer__summary-total">
                  <span className="day-drawer__summary-val">{formatDuration(totalSeconds)}</span>
                  <span className="day-drawer__summary-label">Total focus time</span>
                </div>
                <div className="day-drawer__summary-count">
                  <span className="day-drawer__summary-val">{sessions.length}</span>
                  <span className="day-drawer__summary-label">Sessions</span>
                </div>
              </div>

              {tagRows.length > 0 && (
                <div className="day-drawer__section">
                  <div className="day-drawer__section-title">By tag</div>
                  {tagRows.map((t) => (
                    <div key={t.name} className="day-drawer__tag-row">
                      <div className="day-drawer__tag-left">
                        <span className="day-drawer__tag-dot" style={{ background: t.color }} />
                        <span className="day-drawer__tag-name">{t.name}</span>
                      </div>
                      <div className="day-drawer__tag-bar-wrap">
                        <div
                          className="day-drawer__tag-bar"
                          style={{ width: `${(t.seconds / totalTagSec) * 100}%`, background: t.color }}
                        />
                      </div>
                      <span className="day-drawer__tag-pct">{Math.round((t.seconds / totalTagSec) * 100)}%</span>
                      <span className="day-drawer__tag-time">{formatDuration(t.seconds)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="day-drawer__section">
                <div className="day-drawer__section-title">Sessions</div>
                {tagRows.map((tag) => {
                  const tagSessions = sessions.filter((s) => (s.tag?.name || "Untagged") === tag.name);
                  const isOpen = expandedTags.has(tag.name);
                  return (
                    <div key={tag.name} className="day-drawer__tag-group">
                      <button
                        className="day-drawer__tag-header"
                        onClick={() => toggleTag(tag.name)}
                        aria-expanded={isOpen}
                      >
                        <span className="day-drawer__tag-header-left">
                          <span className="day-drawer__tag-dot" style={{ background: tag.color }} />
                          <span className="day-drawer__tag-header-name">{tag.name}</span>
                          <span className="day-drawer__tag-header-count">{tag.sessions}</span>
                        </span>
                        <span className="day-drawer__tag-header-right">
                          <span className="day-drawer__tag-header-time">{formatDuration(tag.seconds)}</span>
                          <ChevronDownIcon size={14} className={`day-drawer__tag-chevron${isOpen ? " day-drawer__tag-chevron--open" : ""}`} />
                        </span>
                      </button>
                      {isOpen && (
                        <div className="day-drawer__tag-sessions">
                          {tagSessions.map((s, i) => (
                            <div key={s._id || i} className="day-drawer__session">
                              <div className="day-drawer__session-left">
                                {s.label && <span className="day-drawer__session-label">{s.label}</span>}
                                {s.notes && <span className="day-drawer__session-note">{s.notes}</span>}
                                {!s.label && !s.notes && (
                                  <span className="day-drawer__session-note day-drawer__session-note--faint">No details</span>
                                )}
                              </div>
                              <div className="day-drawer__session-right">
                                <span className="day-drawer__session-dur">{formatDuration(s.durationSeconds)}</span>
                                <span className="day-drawer__session-time">
                                  {formatTime(s.startedAt)}–{formatTime(s.endedAt)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
