import { RANK_COLORS } from "./constants";
import { formatDuration } from "@utils/formatters";
import { formatHours } from "./utils";
import { Avatar } from "./Avatar";
import { RoleBadge } from "./RoleBadge";
import { AuraButton } from "./AuraButton";
import { getFlag } from "./utils";

export function LeaderboardRow({ entry, rank, maxSeconds, currentUserId, auraMap, auraToGive, onAuraGive, style }) {
  const isTop3 = rank <= 3;
  const isMe = entry.userId === currentUserId;
  const colors = isTop3 ? RANK_COLORS[rank - 1] : null;
  const barPct = maxSeconds > 0 ? (entry.seconds / maxSeconds) * 100 : 0;
  const flag = getFlag(entry);

  return (
    <div
      className={`lb-row${isMe ? " lb-row--me" : ""}${isTop3 ? ` lb-row--top3 lb-row--${colors.rank}` : ""}`}
      style={style}>
      <div className="lb-row__rank">
        {isTop3 ? (
          <span className="lb-row__medal">{["🥇", "🥈", "🥉"][rank - 1]}</span>
        ) : (
          <span className="lb-row__num">{rank}</span>
        )}
      </div>
      <div className="lb-row__avatar-wrap">
        <Avatar entry={entry} size="row" borderColor={isTop3 ? colors.bar : undefined} />
        {flag && <span className="lb-row__flag">{flag}</span>}
      </div>
      <div className="lb-row__info">
        <div className="lb-row__name-line">
          <span className="lb-row__name">{entry.name || entry.username || "User"}</span>
          <RoleBadge entry={entry} />
          {isMe && <span className="lb-row__you-badge">you</span>}
        </div>
        <div className="lb-row__meta">
          {entry.sessions != null && (
            <span>
              {entry.sessions} session{entry.sessions !== 1 ? "s" : ""}
            </span>
          )}
          {entry.username && entry.name && <span className="lb-row__username">· @{entry.username}</span>}
        </div>
      </div>
      <div
        className="lb-row__bar-wrap"
        title={`${Math.round(barPct)}% of #1's time (${formatDuration(entry.seconds)})`}>
        <div
          className="lb-row__bar"
          style={{
            width: `${barPct}%`,
            background: isTop3 ? colors.bar : "var(--accent)",
            boxShadow: isTop3 ? `0 0 8px ${colors.glow}` : "none",
          }}
        />
      </div>
      <div
        className="lb-row__hours"
        title={formatDuration(entry.seconds)}
        style={isTop3 ? { color: colors.bar } : {}}>
        {formatHours(entry.seconds)}
      </div>
      {isMe ? (
        <div className="lb-row__aura-placeholder" />
      ) : (
        <AuraButton
          userId={entry.userId}
          initialCount={auraMap[entry.userId] ?? 0}
          auraToGive={auraToGive}
          onGive={onAuraGive}
        />
      )}
    </div>
  );
}
