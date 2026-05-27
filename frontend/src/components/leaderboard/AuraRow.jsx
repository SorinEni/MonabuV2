import { AURA_RANK_COLORS } from "./constants";
import { formatNum } from "@utils/formatters";
import { Avatar } from "./Avatar";
import { RoleBadge } from "./RoleBadge";
import { AuraGivePill } from "./AuraGivePill";
import { getFlag } from "./utils";

export function AuraRow({ entry, rank, maxAura, currentUserId, auraToGive, onAuraGive, style }) {
  const isTop3 = rank <= 3;
  const isMe = entry.userId === currentUserId;
  const colors = isTop3 ? AURA_RANK_COLORS[rank - 1] : null;
  const barPct = maxAura > 0 ? (entry.auraReceived / maxAura) * 100 : 0;
  const flag = getFlag(entry);

  return (
    <div
      className={`lb-row lb-row--aura${isMe ? " lb-row--me" : ""}${isTop3 ? ` lb-row--top3 lb-row--${colors.rank}` : ""}`}
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
          {entry.username && entry.name && <span className="lb-row__username">@{entry.username}</span>}
        </div>
      </div>
      <div className="lb-row__bar-wrap" title={`${formatNum(entry.auraReceived)} aura`}>
        <div
          className="lb-row__bar"
          style={{
            width: `${barPct}%`,
            background: isTop3 ? colors.bar : "#fbbf24",
            boxShadow: isTop3 ? `0 0 8px ${colors.glow}` : "none",
          }}
        />
      </div>
      <AuraGivePill
        userId={entry.userId}
        initialCount={entry.auraReceived}
        auraToGive={isMe ? 0 : auraToGive}
        onGive={isMe ? undefined : onAuraGive}
        color={isTop3 ? colors.bar : "#fbbf24"}
      />
    </div>
  );
}
