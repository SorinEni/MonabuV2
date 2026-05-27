// Single session row used in both the "all sessions" grouped list and the day view.
// Extracted from Sessions.jsx where it was a private inner component.

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { formatDuration, formatTime } from "@utils/formatters";

function TagPill({ tag, subTag }) {
  if (!tag) return <span className="ss-tag ss-tag--none">Untagged</span>;
  return (
    <span className="ss-tag" style={{ "--tag-color": tag.color || "var(--accent)" }}>
      <span className="ss-tag__dot" />
      {tag.name}
      {subTag && <span className="ss-tag__sub"> · {subTag.name}</span>}
    </span>
  );
}

// Live-updating duration for running sessions
function LiveDuration({ startedAt }) {
  const [secs, setSecs] = useState(() =>
    Math.max(0, Math.round((Date.now() - new Date(startedAt)) / 1000)),
  );
  useEffect(() => {
    const id = setInterval(
      () => setSecs(Math.round((Date.now() - new Date(startedAt)) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [startedAt]);
  return <span className="ss-row__dur-live">{formatDuration(secs)}</span>;
}

/**
 * Props:
 *   session     object    Session document
 *   onEdit      fn        Called with the session object when Edit is chosen
 *   onDelete    fn        Called with the session object when Delete is chosen
 *   animDelay   string    CSS animation-delay value for entrance animation
 */
export default function SessionCard({ session, onEdit, onDelete, animDelay }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos]   = useState({ top: 0, right: 0 });
  const btnRef  = useRef(null);
  const menuRef = useRef(null);

  // Inherit the app-shell theme class so the portal picks up CSS variables
  const themeClass = document.querySelector(".app-shell")?.classList.contains("theme-light")
    ? "theme-light"
    : "";

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e) {
      if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    function onScroll() { setMenuOpen(false); }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [menuOpen]);

  function openMenu() {
    const rect = btnRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setMenuOpen((o) => !o);
  }

  return (
    <div
      className={`ss-row${session.isRunning ? " ss-row--running" : ""}`}
      style={{ animationDelay: animDelay }}>
      <div className="ss-row__time">
        <span className="ss-row__time-start">{formatTime(session.startedAt)}</span>
        {!session.isRunning && (
          <>
            <span className="ss-row__time-sep">→</span>
            <span className="ss-row__time-end">{formatTime(session.endedAt)}</span>
          </>
        )}
        {session.isRunning && <span className="ss-row__running-badge">● live</span>}
      </div>

      <div className="ss-row__tag">
        <TagPill tag={session.tag} subTag={session.subTag} />
      </div>

      <div className="ss-row__info">
        {session.label
          ? <span className="ss-row__label">{session.label}</span>
          : <span className="ss-row__label ss-row__label--empty">No label</span>
        }
        {session.notes && <span className="ss-row__notes">{session.notes}</span>}
      </div>

      <div className="ss-row__dur">
        {session.isRunning
          ? <LiveDuration startedAt={session.startedAt} />
          : formatDuration(session.durationSeconds)
        }
      </div>

      <div className="ss-row__actions">
        <button
          ref={btnRef}
          className="ss-row__menu-btn"
          onClick={openMenu}
          aria-label="Session options">
          ···
        </button>
        {menuOpen && createPortal(
          <div
            ref={menuRef}
            className={`ss-menu${themeClass ? ` ${themeClass}` : ""}`}
            style={{ position: "fixed", top: menuPos.top, right: menuPos.right }}>
            <button
              className="ss-menu__item"
              onClick={() => { setMenuOpen(false); onEdit(session); }}>
              <span className="ss-menu__icon">✎</span> Edit
            </button>
            <button
              className="ss-menu__item ss-menu__item--danger"
              onClick={() => { setMenuOpen(false); onDelete(session); }}>
              <span className="ss-menu__icon">⌫</span> Delete
            </button>
          </div>,
          document.body,
        )}
      </div>
    </div>
  );
}
