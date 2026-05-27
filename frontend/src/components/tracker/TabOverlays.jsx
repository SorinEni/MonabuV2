// All tab-lock overlay states: blocked by live tab, ghost (closed tab),
// stale session recovery, and the auto-saved banner.

import { timeAgo } from "@utils/formatters";

// Shown when another live tab owns the session lock.
// If a ghost session exists (tab was closed), shows a take-over option.
export function BlockedTabOverlay({ ghostSession, onTakeOver }) {
  if (ghostSession) {
    const ago = ghostSession.startedAt
      ? timeAgo(ghostSession.startedAt)
      : "some time ago";
    return (
      <div className="tab-blocked">
        <div className="tab-blocked__icon">⚠️</div>
        <div className="tab-blocked__title">Session left running</div>
        <div className="tab-blocked__body">
          A session started {ago} in another tab that was closed. You can take
          it over and continue.
        </div>
        <button className="timer-btn timer-btn--start" onClick={onTakeOver}>
          Take over session
        </button>
      </div>
    );
  }

  return (
    <div className="tab-blocked">
      <div className="tab-blocked__icon">🔒</div>
      <div className="tab-blocked__title">Session running in another tab</div>
      <div className="tab-blocked__body">
        You can only track one session at a time. Switch to the other tab to
        control your active session.
      </div>
    </div>
  );
}

// Shown while the stale-session auto-save is in progress.
export function StaleRecoveryOverlay() {
  return (
    <div className="tab-blocked">
      <div className="tab-blocked__icon">⏳</div>
      <div className="tab-blocked__title">Recovering previous session…</div>
      <div className="tab-blocked__body">
        Saving your last session up to its final active moment.
      </div>
    </div>
  );
}

// Dismissable banner shown after stale auto-save completes.
export function AutoSavedBanner({ onDismiss }) {
  return (
    <div className="auto-saved-banner">
      <span>Previous session was auto-saved up to your last active time.</span>
      <button onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
