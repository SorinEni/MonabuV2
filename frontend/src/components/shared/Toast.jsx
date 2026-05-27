// Auto-dismissing toast notification.
// Previously defined privately in Admin.jsx and Settings.jsx — now shared.

import { useEffect } from "react";

/**
 * Props:
 *   message   string   Text to display
 *   type      string   "ok" | "error" | "warn" — drives CSS modifier
 *   onDone    fn       Called after the dismiss timeout
 *   duration  number   Milliseconds before dismiss (default 2800)
 */
export default function Toast({ message, type = "ok", onDone, duration = 2800 }) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  return (
    <div className={`toast toast--${type}`} role="status" aria-live="polite">
      <span className="toast__dot" />
      {message}
    </div>
  );
}
