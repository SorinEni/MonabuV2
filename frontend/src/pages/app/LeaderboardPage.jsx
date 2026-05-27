import AppShell from "@components/layout/AppShell";
import { getUser } from "@api/api";
import { formatDuration, formatNum } from "@utils/formatters";
import { useLeaderboard } from "@hooks/useLeaderboard";
import {
  PERIODS,
  AURA_PERIODS,
  LEADERBOARD_TABS,
  offsetLabel,
  getFlag,
  Podium,
  LeaderboardRow,
  AuraRow,
  SkeletonRow,
} from "@components/leaderboard";
import "@styles/Leaderboard.css";

export default function LeaderboardPage() {
  const user = getUser();
  const {
    tab,
    period,
    setPeriod,
    offset,
    setOffset,
    data,
    loading,
    error,
    myRank,
    auraMap,
    auraToGive,
    myAuraReceived,
    handleAuraGive,
    handleTabChange,
    maxSeconds,
    maxAura,
    restRows,
  } = useLeaderboard();

  const myEntry = data.find((e) => e.userId === user?._id);
  const myRankNum = myRank ?? (myEntry ? data.indexOf(myEntry) + 1 : null);
  const activePeriods = tab === "aura" ? AURA_PERIODS : PERIODS;
  const activePeriod = tab === "aura" ? "allTime" : period;

  return (
    <AppShell>
      <div className="lb-header">
        <div className="lb-header__left">
          <h1 className="lb-title">Leaderboard</h1>
          <p className="lb-subtitle">See how you stack up against the community.</p>
          <div className="lb-type-tabs" role="tablist">
            {LEADERBOARD_TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                className={`lb-type-tab${tab === t.key ? " lb-type-tab--active" : ""}`}
                onClick={() => handleTabChange(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lb-header__right">
          <div className="lb-period-tabs" role="tablist">
            {activePeriods.map((p) => (
              <button
                key={p.key}
                role="tab"
                aria-selected={activePeriod === p.key}
                className={`lb-period-tab${activePeriod === p.key ? " lb-period-tab--active" : ""}`}
                onClick={() => {
                  setPeriod(p.key);
                  setOffset(0);
                }}>
                {p.label}
              </button>
            ))}
          </div>
          {tab === "study" && period !== "allTime" && (
            <div className="lb-offset-nav">
              <button className="lb-offset-arrow" onClick={() => setOffset((o) => o + 1)} aria-label="Previous period">
                ‹
              </button>
              <span className="lb-offset-label">{offsetLabel(period, offset)}</span>
              <button className="lb-offset-arrow" onClick={() => setOffset((o) => o - 1)} disabled={offset === 0} aria-label="Next period">
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="lb-error">
          <span>⚠</span> {error}
        </div>
      )}

      {!loading && !error && data.length >= 1 && (
        <Podium
          entries={data.slice(0, 3)}
          currentUserId={user?._id}
          auraMap={auraMap}
          auraToGive={auraToGive}
          onAuraGive={handleAuraGive}
          mode={tab}
        />
      )}

      <div className="lb-list">
        {!loading && !error && data.length > 0 && (
          <div className="lb-row--header lb-col-header">
            <div style={{ width: 40 }} />
            <div style={{ width: 48 }} />
            <div className="lb-col-label" style={{ flex: 1 }}>User</div>
            <div className="lb-col-label" style={{ width: 120 }}>vs #1</div>
            {tab === "study" ? (
              <>
                <div className="lb-col-label" style={{ width: 64, textAlign: "right" }}>Time</div>
                <div className="lb-col-label" style={{ width: 72, textAlign: "center", marginRight: 8 }}>Aura</div>
              </>
            ) : (
              <div className="lb-col-label" style={{ width: 72, textAlign: "center" }}>Aura</div>
            )}
          </div>
        )}
        {loading ? (
          Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} index={i} />)
        ) : !error && data.length === 0 ? (
          <div className="lb-empty">
            <div className="lb-empty__icon">{tab === "aura" ? "✨" : "🏆"}</div>
            <div className="lb-empty__title">No data yet</div>
            <div className="lb-empty__sub">
              {tab === "aura"
                ? "No aura points given yet."
                : `No sessions logged${period === "today" ? " today" : ` this ${period}`}.`}
            </div>
          </div>
        ) : tab === "aura" ? (
          restRows.map((entry, i) => (
            <AuraRow
              key={entry.userId}
              entry={entry}
              rank={i + 4}
              maxAura={maxAura}
              currentUserId={user?._id}
              auraToGive={auraToGive}
              onAuraGive={handleAuraGive}
              style={{ animationDelay: `${i * 0.04}s` }}
            />
          ))
        ) : (
          restRows.map((entry, i) => (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              rank={i + 4}
              maxSeconds={maxSeconds}
              currentUserId={user?._id}
              auraMap={auraMap}
              auraToGive={auraToGive}
              onAuraGive={handleAuraGive}
              style={{ animationDelay: `${i * 0.04}s` }}
            />
          ))
        )}
      </div>

      {!loading && !error && (
        <div className="lb-my-rank">
          <span className="lb-my-rank__flag">{getFlag(myEntry ?? {}) ?? "🌐"}</span>
          <span className="lb-my-rank__label">Your rank</span>
          <span className="lb-my-rank__pos">{myRankNum != null ? `#${myRankNum}` : "—"}</span>
          {myEntry && tab === "study" && (
            <span className="lb-my-rank__hours">{formatDuration(myEntry.seconds)}</span>
          )}
          <span className="lb-my-rank__divider" />
          <span className="lb-my-rank__aura" title="Your aura (all-time)">✨ {formatNum(myAuraReceived)}</span>
          <span className="lb-my-rank__divider" />
          <span className="lb-my-rank__aura-give" title="Aura left to give today">✨ {auraToGive}</span>
        </div>
      )}
    </AppShell>
  );
}
