// Tracker page — strictly presentational shell.
// All state, effects, and business logic live in @hooks/useTracker.

import "@styles/Tracker.css";
import { useTracker } from "@hooks/useTracker";
import AppShell from "@components/layout/AppShell";
import { ClockIcon } from "@components/shared/Icons";
import { TimerClock } from "@components/tracker/TimerClock";
import { PomodoroClock } from "@components/tracker/PomodoroClock";
import { SkinPicker } from "@components/tracker/SkinPicker";
import { TagPicker } from "@components/tracker/TagPicker";
import {
  BlockedTabOverlay,
  StaleRecoveryOverlay,
  AutoSavedBanner,
} from "@components/tracker/TabOverlays";
import CreateTagModal from "@components/tracker/CreateTagModal";
import EditTagModal from "@components/tracker/EditTagModal";
import DeleteTagModal from "@components/tracker/DeleteTagModal";

import { formatDuration, timeAgo } from "@utils/formatters";

export default function TrackerPage() {
  const {
    // Clock & skin
    clockThemeKey,
    clockTheme,
    handleSkinChange,

    // Timer
    elapsed,
    running,
    timerLogic,
    tagColor,

    // Session form
    sessionName,
    setSessionName,
    note,
    setNote,
    selectedTag,
    selectedSubTag,
    setSelectedSubTag,
    handleSelectTag,

    // Tags
    tags,
    tagsLoading,
    handleTagCreated,
    handleHideTag,
    handleHideDefaultTag,
    handleEditTag,
    handleDeleteTag,
    handleSaveEditTag,
    handleConfirmDeleteTag,
    handleAddSubTag,

    // Modals
    showModal,
    setShowModal,
    editingTag,
    setEditingTag,
    deletingTag,
    setDeletingTag,

    // Sessions
    sessionsLoading,
    visibleSessions,
    totalToday,
    handleClearLog,

    // Pomodoro
    pomoMode,
    handlePomoToggle,
    pomo,

    // Tab lock
    isLeader,
    isBlocked,
    ghostSession,
    staleSession,
    showingStaleHandling,
    handleTakeOver,

    // Misc
    localTime,
    saveError,
    statusLabel,
    showAutoSavedBanner,
    setShowAutoSavedBanner,
  } = useTracker();

  return (
    <AppShell className="tracker-root">
      {/*  Left column  */}
      <div className="tracker-left">
        {/* Banners */}
        {showAutoSavedBanner && (
          <AutoSavedBanner
            onDismiss={() => setShowAutoSavedBanner(false)}
          />
        )}
        {saveError && <div className="tracker-error">{saveError}</div>}

        {/* Tab-blocked states */}
        {isBlocked && !isLeader && !showingStaleHandling && (
          <BlockedTabOverlay
            ghostSession={ghostSession}
            onTakeOver={handleTakeOver}
          />
        )}
        {showingStaleHandling && <StaleRecoveryOverlay />}

        {/* Main timer card */}
        {(!isBlocked || isLeader) && !showingStaleHandling && (
          <div className="timer-card">
            {/* 1. Status bar (top controls: label + today total + pomo toggle) */}
            <div className="timer-card__top">
              <div className="timer-card__label">
                {running && <span className="timer-card__pulse" />}
                {statusLabel}
              </div>
              <div className="timer-card__top-right">
                {totalToday > 0 && (
                  <div className="timer-card__today">
                    {formatDuration(totalToday)} today
                  </div>
                )}
                <button
                  className={`pomo-toggle${pomoMode ? " pomo-toggle--on" : ""}`}
                  onClick={handlePomoToggle}
                  title={
                    running
                      ? "Stop session to switch modes"
                      : "Toggle Pomodoro mode"
                  }
                  disabled={running}>
                  <span className="pomo-toggle__icon">🍅</span>
                  <span className="pomo-toggle__label">Pomodoro</span>
                  <span
                    className={`pomo-toggle__pip${pomoMode ? " pomo-toggle__pip--on" : ""}`}
                  />
                </button>
              </div>
            </div>

            {/* 1.5 Local time — muted */}
            {localTime && (
              <div
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: "var(--text-faint)",
                  marginTop: 2,
                  marginBottom: -4,
                  letterSpacing: 0.5,
                }}>
                {localTime} local time
              </div>
            )}

            {/* 2. Clock component — first, bigger */}
            {!pomoMode ? (
              <div className="timer-clock-wrap">
                <TimerClock
                  elapsed={elapsed}
                  running={running}
                  tagColor={tagColor}
                  clockTheme={clockTheme}
                  onStart={timerLogic.handleStart}
                  onPause={timerLogic.handlePause}
                  onStop={timerLogic.handleStop}
                  onDiscard={timerLogic.handleDiscard}
                />
              </div>
            ) : (
              <PomodoroClock
                running={running}
                pomoPhase={pomo.pomoPhase}
                pomoSession={pomo.pomoSession}
                pomoCountdown={pomo.pomoCountdown}
                pomoDone={pomo.pomoDone}
                isLongBreak={pomo.isLongBreak}
                displaySeconds={pomo.displaySeconds}
                progress={pomo.progress}
                pomoSettings={pomo.pomoSettings}
                tagColor={tagColor}
                clockTheme={clockTheme}
                onStart={pomo.handleStart}
                onPause={pomo.handlePause}
                onSkip={pomo.handleSkip}
                onEnd={pomo.handleEnd}
                onDiscard={pomo.handleDiscard}
                onSettingsChange={pomo.handleSettingsChange}
              />
            )}

            {/* 3. Session name */}
            <input
              className="timer-session-name"
              placeholder="Session name (optional)"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              disabled={running}
            />

            {/* 4. Tag picker */}
            <div className="timer-row">
              <TagPicker
                tags={tagsLoading ? [] : tags}
                selected={selectedTag}
                selectedSubTag={selectedSubTag}
                onSelect={handleSelectTag}
                onSelectSubTag={setSelectedSubTag}
                onCreateTag={() => setShowModal(true)}
                onHideTag={handleHideTag}
                onHideDefaultTag={handleHideDefaultTag}
                onEditTag={handleEditTag}
                onDeleteTag={handleDeleteTag}
                onAddSubTag={handleAddSubTag}
                disabled={running}
              />
            </div>

            {/* 5. Notes (timer mode only) */}
            {!pomoMode && (
              <textarea
                className="timer-note"
                placeholder="Add a note for this session…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            )}

            {/* Skin picker (hidden if ≤1 skin) */}
            <SkinPicker
              current={clockThemeKey}
              onChange={handleSkinChange}
            />
          </div>
        )}
      </div>

      {/*  Right column: today's session log  */}
      <div className="tracker-right">
        <div className="sessions-card">
          <div className="sessions-card__header">
            <div>
              <div className="sessions-card__title">Session Log</div>
              <div className="sessions-card__sub">
                {sessionsLoading
                  ? "Loading…"
                  : visibleSessions.length === 0
                    ? "Your completed sessions will appear here"
                    : `${visibleSessions.length} session${visibleSessions.length !== 1 ? "s" : ""} today`}
              </div>
            </div>
            {visibleSessions.length > 0 && (
              <div className="sessions-card__actions">
                <div className="sessions-card__total">
                  {formatDuration(totalToday)} total
                </div>
                <button
                  className="sessions-clear-btn"
                  onClick={handleClearLog}
                  title="Hide sessions from this view (they remain saved)">
                  Clear log
                </button>
              </div>
            )}
          </div>

          {sessionsLoading ? (
            <div className="sessions-empty">
              <div
                className="sessions-empty__text"
                style={{ opacity: 0.5 }}>
                Loading sessions…
              </div>
            </div>
          ) : visibleSessions.length === 0 ? (
            <div className="sessions-empty">
              <div className="sessions-empty__icon">
                <ClockIcon />
              </div>
              <div className="sessions-empty__text">No sessions yet</div>
              <div className="sessions-empty__sub">
                Start your first session and it'll show up here.
              </div>
            </div>
          ) : (
            <div className="sessions-list">
              {visibleSessions.map((session, i) => (
                <div
                  key={session.id}
                  className={`session-row${i === 0 ? " session-row--latest" : ""}`}>
                  <div className="session-row__left">
                    <div
                      className="session-row__dot"
                      style={{
                        background: session.tag?.color || "var(--border-2)",
                      }}
                    />
                    <div className="session-row__info">
                      <div className="session-row__name">
                        {session.pomo && (
                          <span className="session-row__pomo-badge">
                            🍅
                          </span>
                        )}
                        {session.label}
                      </div>
                      <div className="session-row__meta">
                        {session.tag && (
                          <span
                            className="session-row__tag"
                            style={{
                              color: session.tag.color,
                              borderColor: `${session.tag.color}33`,
                            }}>
                            {session.tag.name}
                            {session.subTag && (
                              <>
                                <span
                                  className="session-row__tag-sep"
                                  style={{ opacity: 0.45 }}>
                                  {" ›"}
                                </span>
                                <span
                                  style={{
                                    color:
                                      session.subTag.color ??
                                      session.tag.color,
                                    opacity: 0.85,
                                  }}>
                                  {" "}
                                  {session.subTag.name}
                                </span>
                              </>
                            )}
                          </span>
                        )}
                        <span className="session-row__time">
                          {timeAgo(session.timestamp)}
                        </span>
                      </div>
                      {session.note && (
                        <div className="session-row__note">
                          {session.note}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="session-row__duration">
                    {formatDuration(session.duration)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <CreateTagModal
          onClose={() => setShowModal(false)}
          onCreate={handleTagCreated}
        />
      )}

      {editingTag && (
        <EditTagModal
          tag={editingTag}
          onClose={() => setEditingTag(null)}
          onSave={handleSaveEditTag}
        />
      )}

      {deletingTag && (
        <DeleteTagModal
          tag={deletingTag}
          onClose={() => setDeletingTag(null)}
          onConfirm={handleConfirmDeleteTag}
        />
      )}
    </AppShell>
  );
}
