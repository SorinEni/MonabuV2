// Edit and Add session modals, including the custom datetime-with-seconds picker.
// Extracted from Sessions.jsx where both modals and DatetimeSecondsPicker were
// private inner components.

import { useState, useEffect, useRef } from "react";
import { api } from "@api/api";
import { formatDuration } from "@utils/formatters";

// Helpers shared between both modals

function toLocalDatetimeParts(dateStr) {
  if (!dateStr) return { date: "", h: "00", m: "00", s: "00" };
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
    h: pad(d.getHours()),
    m: pad(d.getMinutes()),
    s: pad(d.getSeconds()),
  };
}

function mergeLocalDatetime(datetimeLocal, seconds) {
  if (!datetimeLocal) return null;
  const [datePart, timePart] = datetimeLocal.split("T");
  const [year, month, day]  = datePart.split("-").map(Number);
  const [hour, minute]      = timePart.split(":").map(Number);
  const sec = Math.max(0, Math.min(59, parseInt(seconds, 10) || 0));
  return new Date(year, month - 1, day, hour, minute, sec, 0);
}

// Calendar + time-spinner picker for a date/time value with second precision

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DOW = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function DatetimeSecondsPicker({ label: fieldLabel, value, onChange }) {
  const pad = (n) => String(n).padStart(2, "0");

  function getParts() {
    if (!value.date) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), h: 0, m: 0, s: 0 };
    }
    const [datePart, timePart] = value.date.split("T");
    const [year, month, day]   = datePart.split("-").map(Number);
    const [h, m]               = timePart.split(":").map(Number);
    return { year, month, day, h, m, s: parseInt(value.s, 10) || 0 };
  }

  function buildValue({ year, month, day, h, m, s }) {
    return { date: `${year}-${pad(month)}-${pad(day)}T${pad(h)}:${pad(m)}`, s: pad(s) };
  }

  const p     = getParts();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [calYear, setCalYear]   = useState(p.year);
  const [calMonth, setCalMonth] = useState(p.month);

  useEffect(() => {
    const parts = getParts();
    setCalYear(parts.year);
    setCalMonth(parts.month);
  }, [value.date]);

  function stepTime(field, delta) {
    const cur = getParts();
    if (field === "h") cur.h = (cur.h + delta + 24) % 24;
    else if (field === "m") cur.m = (cur.m + delta + 60) % 60;
    else if (field === "s") cur.s = (cur.s + delta + 60) % 60;
    onChange(buildValue(cur));
  }

  function selectDay(year, month, day) {
    const d = new Date(year, month - 1, day);
    if (d > today) return;
    const cur = getParts();
    onChange(buildValue({ ...cur, year, month, day }));
  }

  function prevMonth() {
    if (calMonth === 1) { setCalYear((y) => y - 1); setCalMonth(12); }
    else setCalMonth((m) => m - 1);
  }

  function nextMonth() {
    const nm = calMonth === 12 ? 1  : calMonth + 1;
    const ny = calMonth === 12 ? calYear + 1 : calYear;
    if (new Date(ny, nm - 1, 1) > today) return;
    setCalMonth(nm);
    setCalYear(ny);
  }

  const firstOfMonth = new Date(calYear, calMonth - 1, 1);
  const daysInMonth  = new Date(calYear, calMonth, 0).getDate();
  const startDow     = firstOfMonth.getDay();
  const cells        = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isNextMonthDisabled = new Date(
    calMonth === 12 ? calYear + 1 : calYear,
    calMonth === 12 ? 0 : calMonth,
    1,
  ) > today;

  const LABELS = { h: "HR", m: "MIN", s: "SEC" };

  function SpinUnit({ fieldKey, val }) {
    return (
      <div className="ss-spin-unit">
        <button type="button" className="ss-spin-btn" onClick={() => stepTime(fieldKey, 1)} aria-label={`Increase ${fieldKey}`}>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <input
          type="text"
          inputMode="numeric"
          className="ss-spin-val"
          value={pad(val)}
          onChange={(e) => {
            const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
            if (!isNaN(n)) {
              const cur = getParts();
              let v = n;
              if (fieldKey === "h") v = ((v % 24) + 24) % 24;
              else v = ((v % 60) + 60) % 60;
              onChange(buildValue({ ...cur, [fieldKey]: v }));
            }
          }}
          onBlur={(e) => {
            const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
            const cur = getParts();
            let v = isNaN(n) ? 0 : n;
            if (fieldKey === "h") v = ((v % 24) + 24) % 24;
            else v = ((v % 60) + 60) % 60;
            onChange(buildValue({ ...cur, [fieldKey]: v }));
          }}
          aria-label={`${LABELS[fieldKey]} value`}
        />
        <button type="button" className="ss-spin-btn" onClick={() => stepTime(fieldKey, -1)} aria-label={`Decrease ${fieldKey}`}>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="ss-spin-unit__label">{LABELS[fieldKey]}</span>
      </div>
    );
  }

  return (
    <div className="ss-field">
      <label className="ss-field__label">{fieldLabel}</label>
      <div className="ss-cal-picker">
        <div className="ss-cal__header">
          <button type="button" className="ss-cal__nav-btn" onClick={prevMonth} aria-label="Previous month">
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="ss-cal__month-label">
            <select
              className="ss-cal__month-select"
              value={calMonth}
              onChange={(e) => setCalMonth(Number(e.target.value))}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>{name}</option>
              ))}
            </select>
            <input
              type="number"
              className="ss-cal__year-input"
              value={calYear}
              onChange={(e) => {
                const y = Number(e.target.value);
                if (!isNaN(y) && y >= 1900 && y <= 2100) setCalYear(y);
              }}
              min={1900}
              max={2100}
            />
          </div>
          <button type="button" className="ss-cal__nav-btn" onClick={nextMonth} disabled={isNextMonthDisabled} aria-label="Next month">
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="ss-cal__dow-row">
          {DOW.map((d) => <span key={d} className="ss-cal__dow">{d}</span>)}
        </div>

        <div className="ss-cal__grid">
          {cells.map((day, i) => {
            if (!day) return <span key={`blank-${i}`} className="ss-cal__cell ss-cal__cell--blank" />;
            const cellDate  = new Date(calYear, calMonth - 1, day);
            const isFuture  = cellDate > today;
            const isSelected = day === p.day && calMonth === p.month && calYear === p.year;
            const isToday   = cellDate.getTime() === today.getTime();
            return (
              <button
                key={day}
                type="button"
                className={[
                  "ss-cal__cell",
                  isSelected ? "ss-cal__cell--selected" : "",
                  isToday && !isSelected ? "ss-cal__cell--today" : "",
                  isFuture ? "ss-cal__cell--disabled" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => selectDay(calYear, calMonth, day)}
                disabled={isFuture}
                aria-label={`${MONTH_NAMES[calMonth - 1]} ${day}, ${calYear}`}
                aria-pressed={isSelected}>
                {day}
              </button>
            );
          })}
        </div>

        <div className="ss-spin-divider" />

        <div className="ss-spin-time">
          <SpinUnit fieldKey="h" val={p.h} />
          <span className="ss-spin-colon">:</span>
          <SpinUnit fieldKey="m" val={p.m} />
          <span className="ss-spin-colon">:</span>
          <SpinUnit fieldKey="s" val={p.s} />
        </div>
      </div>
    </div>
  );
}

// Tag selector used inside both modals

function TagSelector({ allTags, defaultTags, selectedTagId, selectedSubTagId, onChange }) {
  const [open, setOpen]             = useState(false);
  const [search, setSearch]         = useState("");
  const [expandDefaults, setExpandDefaults] = useState(false);
  const dropRef = useRef(null);

  const selectedTag =
    allTags.find((t) => t._id === selectedTagId) ||
    defaultTags.find((t) => t._id === selectedTagId) ||
    null;

  const subTags      = selectedTag?.__type === "user" ? selectedTag.subTags || [] : [];
  const selectedSub  = subTags.find((s) => s._id === selectedSubTagId) || null;

  useEffect(() => {
    if (!open) return;
    function onClick(e) { if (!dropRef.current?.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const filterStr      = search.toLowerCase();
  const filteredUser   = allTags.filter((t) => t.name.toLowerCase().includes(filterStr));
  const filteredDefault = defaultTags.filter((t) => t.name.toLowerCase().includes(filterStr));

  function selectTag(id) { onChange({ tagId: id || null, subTagId: null }); setSearch(""); setOpen(false); }
  function selectSubTag(id) { onChange({ tagId: selectedTagId, subTagId: id }); }

  return (
    <div className="ss-field">
      <label className="ss-field__label">Tag</label>
      <div className="ss-tag-selector" ref={dropRef}>
        <button
          type="button"
          className="ss-tag-selector__trigger"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}>
          {selectedTag ? (
            <span className="ss-tag-selector__preview">
              <span className="ss-tag-selector__dot" style={{ background: selectedTag.color || "var(--accent)" }} />
              {selectedTag.name}
              {selectedTag.__type === "default" && <span className="ss-tag-selector__badge">default</span>}
            </span>
          ) : (
            <span className="ss-tag-selector__placeholder">Untagged</span>
          )}
          <svg className="ss-tag-selector__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div className="ss-tag-selector__dropdown" role="listbox">
            <div className="ss-tag-selector__search-wrap">
              <input
                className="ss-tag-selector__search"
                type="text"
                placeholder="Search tags…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="ss-tag-selector__list">
              <button
                type="button"
                className={`ss-tag-selector__option${!selectedTagId ? " ss-tag-selector__option--selected" : ""}`}
                onClick={() => selectTag(null)}
                role="option"
                aria-selected={!selectedTagId}>
                <span className="ss-tag-selector__option-dot ss-tag-selector__option-dot--none" />
                <span>Untagged</span>
              </button>

              {filteredUser.length > 0 && (
                <>
                  {(filteredDefault.length > 0 || !filterStr) && (
                    <div className="ss-tag-selector__group-label">Your tags</div>
                  )}
                  {filteredUser.map((t) => (
                    <button
                      key={t._id}
                      type="button"
                      className={`ss-tag-selector__option${selectedTagId === t._id ? " ss-tag-selector__option--selected" : ""}`}
                      onClick={() => selectTag(t._id)}
                      role="option"
                      aria-selected={selectedTagId === t._id}>
                      <span className="ss-tag-selector__option-dot" style={{ background: t.color || "var(--accent)" }} />
                      <span>{t.name}</span>
                    </button>
                  ))}
                </>
              )}

              {filteredDefault.length > 0 && (
                <>
                  {!filterStr ? (
                    <button type="button" className="ss-tag-selector__group-toggle" onClick={() => setExpandDefaults((e) => !e)}>
                      <svg className={`ss-tag-selector__group-toggle-chevron${expandDefaults ? " ss-tag-selector__group-toggle-chevron--open" : ""}`} width="8" height="5" viewBox="0 0 8 5" fill="none">
                        <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Platform defaults
                      <span className="ss-tag-selector__group-toggle-count">{filteredDefault.length}</span>
                    </button>
                  ) : (
                    <div className="ss-tag-selector__group-label">Platform defaults</div>
                  )}
                  {(expandDefaults || !!filterStr) && filteredDefault.map((t) => (
                    <button
                      key={t._id}
                      type="button"
                      className={`ss-tag-selector__option${selectedTagId === t._id ? " ss-tag-selector__option--selected" : ""}`}
                      onClick={() => selectTag(t._id)}
                      role="option"
                      aria-selected={selectedTagId === t._id}>
                      <span className="ss-tag-selector__option-dot" style={{ background: t.color || "var(--accent)" }} />
                      <span>{t.name}</span>
                      <span className="ss-tag-selector__badge">default</span>
                    </button>
                  ))}
                </>
              )}

              {filteredUser.length === 0 && filteredDefault.length === 0 && (
                <div className="ss-tag-selector__empty">No tags match</div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedTag?.__type === "user" && subTags.length > 0 && (
        <div className="ss-subtag-row">
          <span className="ss-subtag-row__label">Subtag</span>
          <div className="ss-subtag-chips">
            <button
              type="button"
              className={`ss-subtag-chip${!selectedSubTagId ? " ss-subtag-chip--selected" : ""}`}
              onClick={() => selectSubTag(null)}>
              None
            </button>
            {subTags.map((s) => (
              <button
                key={s._id}
                type="button"
                className={`ss-subtag-chip${selectedSubTagId === s._id ? " ss-subtag-chip--selected" : ""}`}
                style={selectedSubTagId === s._id ? { "--chip-color": s.color || "var(--accent)" } : {}}
                onClick={() => selectSubTag(s._id)}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Tags fetch helper used by both modals
async function fetchTagsWithSubs() {
  const [userRes, defaultRes] = await Promise.all([api.get("/tags"), api.get("/tags/defaults")]);
  const dTags    = (defaultRes.tags || defaultRes.defaultTags || []).map((t) => ({ ...t, __type: "default" }));
  const defaultIds = new Set(dTags.map((t) => t._id));
  const userTags = (userRes.tags || [])
    .filter((t) => !defaultIds.has(t._id))
    .map((t) => ({ ...t, __type: "user" }));
  const tagsWithSubs = await Promise.all(
    userTags.map((t) =>
      api.get(`/tags/${t._id}/subtags`)
        .then((r) => ({ ...t, subTags: r.subTags || r.subtags || [] }))
        .catch(() => ({ ...t, subTags: [] })),
    ),
  );
  return { userTags: tagsWithSubs, defaultTags: dTags };
}

/**
 * Edit session modal.
 * Props: session, onClose, onSave(updatedSession)
 */
export function SessionEditModal({ session, onClose, onSave }) {
  const [label, setLabel] = useState(session.label || "");
  const [notes, setNotes] = useState(session.notes || "");

  const initStart = toLocalDatetimeParts(session.startedAt);
  const initEnd   = toLocalDatetimeParts(session.endedAt);
  const [startVal, setStartVal] = useState({ date: initStart.date, s: initStart.s });
  const [endVal, setEndVal]     = useState({ date: initEnd.date,   s: initEnd.s });

  const [selectedTagId, setSelectedTagId]     = useState(session.tag?._id || session.tag || null);
  const [selectedSubTagId, setSelectedSubTagId] = useState(session.subTag?._id || session.subTag || null);
  const [allTags, setAllTags]         = useState([]);
  const [defaultTags, setDefaultTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchTagsWithSubs()
      .then(({ userTags, defaultTags }) => {
        if (!cancelled) { setAllTags(userTags); setDefaultTags(defaultTags); }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setTagsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const start = mergeLocalDatetime(startVal.date, startVal.s);
      const end   = mergeLocalDatetime(endVal.date, endVal.s);
      if (!start || !end || isNaN(start) || isNaN(end)) throw new Error("Invalid dates");
      if (end <= start) throw new Error("End time must be after start time");

      const truncSec  = (ms) => Math.floor(ms / 1000);
      const origStart = truncSec(new Date(session.startedAt).getTime());
      const origEnd   = truncSec(new Date(session.endedAt).getTime());
      const timeChanged = truncSec(start.getTime()) !== origStart || truncSec(end.getTime()) !== origEnd;

      const origTagId    = session.tag?._id || session.tag || null;
      const origSubTagId = session.subTag?._id || session.subTag || null;
      const tagChanged   = selectedTagId !== origTagId || selectedSubTagId !== origSubTagId;

      const body = {
        label: label.trim() || undefined,
        notes: notes.trim() || undefined,
        startedAt: start.toISOString(),
        endedAt: end.toISOString(),
        durationSeconds: Math.round((end - start) / 1000),
        ...(timeChanged ? { isEdited: true } : {}),
        ...(tagChanged  ? { tagId: selectedTagId ?? null, subTagId: selectedSubTagId ?? null } : {}),
      };
      const res = await api.patch(`/sessions/${session._id}`, body);
      onSave(res.session);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ss-modal-overlay" ref={overlayRef} onClick={(e) => e.target === overlayRef.current && onClose()}>
      <div className="ss-modal" role="dialog" aria-modal="true">
        <div className="ss-modal__header">
          <h2 className="ss-modal__title">Edit Session</h2>
          <button className="ss-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="ss-modal__body">
          {error && <div className="ss-modal__error">{error}</div>}
          <div className="ss-field">
            <label className="ss-field__label">Label</label>
            <input className="ss-field__input" type="text" placeholder="What were you working on?" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={128} />
          </div>
          {tagsLoading ? (
            <div className="ss-field"><label className="ss-field__label">Tag</label><div className="ss-tag-selector__loading">Loading tags…</div></div>
          ) : (
            <TagSelector
              allTags={allTags} defaultTags={defaultTags}
              selectedTagId={selectedTagId} selectedSubTagId={selectedSubTagId}
              onChange={({ tagId, subTagId }) => { setSelectedTagId(tagId); setSelectedSubTagId(subTagId); }}
            />
          )}
          <div className="ss-field-row ss-field-row--cal">
            <DatetimeSecondsPicker label="Started at" value={startVal} onChange={setStartVal} />
            <DatetimeSecondsPicker label="Ended at"   value={endVal}   onChange={setEndVal} />
          </div>
          <div className="ss-field">
            <label className="ss-field__label">Notes</label>
            <textarea className="ss-field__textarea" placeholder="Any notes about this session…" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} rows={4} />
          </div>
        </div>
        <div className="ss-modal__footer">
          <button className="ss-modal__btn ss-modal__btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="ss-modal__btn ss-modal__btn--primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Add (manual log) session modal.
 * Props: onClose, onCreated(newSession)
 */
export function SessionAddModal({ onClose, onCreated }) {
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");

  const defaults = (() => {
    const now  = new Date();
    const hour = new Date(now.getTime() - 3600 * 1000);
    return { start: toLocalDatetimeParts(hour.toISOString()), end: toLocalDatetimeParts(now.toISOString()) };
  })();

  const [startVal, setStartVal] = useState({ date: defaults.start.date, s: defaults.start.s });
  const [endVal, setEndVal]     = useState({ date: defaults.end.date,   s: defaults.end.s });

  const [selectedTagId, setSelectedTagId]     = useState(null);
  const [selectedSubTagId, setSelectedSubTagId] = useState(null);
  const [allTags, setAllTags]         = useState([]);
  const [defaultTags, setDefaultTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchTagsWithSubs()
      .then(({ userTags, defaultTags }) => { if (!cancelled) { setAllTags(userTags); setDefaultTags(defaultTags); } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setTagsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const start = mergeLocalDatetime(startVal.date, startVal.s);
      const end   = mergeLocalDatetime(endVal.date, endVal.s);
      if (!start || !end || isNaN(start) || isNaN(end)) throw new Error("Invalid dates");
      if (end <= start) throw new Error("End time must be after start time");
      if (end > new Date()) throw new Error("End time cannot be in the future");
      const res = await api.post("/sessions", {
        startedAt: start.toISOString(),
        endedAt: end.toISOString(),
        durationSeconds: Math.round((end - start) / 1000),
        label: label.trim() || undefined,
        notes: notes.trim() || undefined,
        tagId: selectedTagId ?? undefined,
        subTagId: selectedSubTagId ?? undefined,
      });
      onCreated(res.session);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ss-modal-overlay" ref={overlayRef} onClick={(e) => e.target === overlayRef.current && onClose()}>
      <div className="ss-modal" role="dialog" aria-modal="true">
        <div className="ss-modal__header">
          <h2 className="ss-modal__title">Log session</h2>
          <button className="ss-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="ss-modal__body">
          {error && <div className="ss-modal__error">{error}</div>}
          <div className="ss-field">
            <label className="ss-field__label">Label</label>
            <input className="ss-field__input" type="text" placeholder="What were you working on?" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={128} />
          </div>
          {tagsLoading ? (
            <div className="ss-field"><label className="ss-field__label">Tag</label><div className="ss-tag-selector__loading">Loading tags…</div></div>
          ) : (
            <TagSelector
              allTags={allTags} defaultTags={defaultTags}
              selectedTagId={selectedTagId} selectedSubTagId={selectedSubTagId}
              onChange={({ tagId, subTagId }) => { setSelectedTagId(tagId); setSelectedSubTagId(subTagId); }}
            />
          )}
          <div className="ss-field-row ss-field-row--cal">
            <DatetimeSecondsPicker label="Started at" value={startVal} onChange={setStartVal} />
            <DatetimeSecondsPicker label="Ended at"   value={endVal}   onChange={setEndVal} />
          </div>
          <div className="ss-field">
            <label className="ss-field__label">Notes</label>
            <textarea className="ss-field__textarea" placeholder="Any notes about this session…" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} rows={3} />
          </div>
          <div className="ss-add-notice">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M6.5 5.5v4M6.5 4h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Manually logged sessions don't appear on the leaderboard.
          </div>
        </div>
        <div className="ss-modal__footer">
          <button className="ss-modal__btn ss-modal__btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="ss-modal__btn ss-modal__btn--primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Log session"}</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Delete confirmation modal.
 * Props: session, onClose, onDeleted(sessionId)
 */
export function SessionDeleteModal({ session, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/sessions/${session._id}`);
      onDeleted(session._id);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <div className="ss-modal-overlay" ref={overlayRef} onClick={(e) => e.target === overlayRef.current && onClose()}>
      <div className="ss-modal ss-modal--sm" role="dialog" aria-modal="true">
        <div className="ss-modal__header">
          <h2 className="ss-modal__title">Delete session?</h2>
          <button className="ss-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="ss-modal__body">
          {error && <div className="ss-modal__error">{error}</div>}
          <p className="ss-delete__msg">
            This will permanently remove the session
            {session.label ? ` "${session.label}"` : ""}{" "}
            ({formatDuration(session.durationSeconds)}) from your history. This action cannot be undone.
          </p>
        </div>
        <div className="ss-modal__footer">
          <button className="ss-modal__btn ss-modal__btn--ghost" onClick={onClose} disabled={deleting}>Cancel</button>
          <button className="ss-modal__btn ss-modal__btn--danger" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</button>
        </div>
      </div>
    </div>
  );
}
