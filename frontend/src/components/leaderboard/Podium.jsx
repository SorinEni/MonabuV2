import { MEDALS, RANK_COLORS, AURA_RANK_COLORS } from "./constants";
import { formatDuration } from "@utils/formatters";
import { Avatar } from "./Avatar";
import { RoleBadge } from "./RoleBadge";
import { AuraGivePill } from "./AuraGivePill";
import { AuraButton } from "./AuraButton";
import { getFlag } from "./utils";

export function Podium({ entries, currentUserId, auraMap, auraToGive, onAuraGive, mode }) {
  if (!entries || entries.length < 1) return null;

  const podiumSlots =
    entries.length >= 3
      ? [entries[1], entries[0], entries[2]]
      : entries.length === 2
        ? [entries[1], entries[0], null]
        : [null, entries[0], null];

  const podiumHeights = ["72px", "96px", "56px"];
  const slotRankIndex = [1, 0, 2];
  const rankColors = mode === "aura" ? AURA_RANK_COLORS : RANK_COLORS;

  return (
    <div className="lb-podium">
      {podiumSlots.map((entry, i) => {
        if (!entry) return <div key={i} className="lb-podium__slot lb-podium__slot--empty" />;
        const rank = slotRankIndex[i];
        const isMe = entry.userId === currentUserId;
        const colors = rankColors[rank];
        const flag = getFlag(entry);
        return (
          <div
            key={entry.userId}
            className={`lb-podium__slot lb-podium__slot--${colors.rank}${isMe ? " lb-podium__slot--me" : ""}`}>
            <div className="lb-podium__medal">{MEDALS[rank]}</div>
            <div className="lb-podium__avatar-wrap">
              <Avatar
                entry={entry}
                size="podium"
                borderColor={colors.bar}
                className={isMe ? "lb-podium__avatar--me" : ""}
              />
              {flag && <span className="lb-podium__flag">{flag}</span>}
            </div>
            <div className="lb-podium__name">
              {entry.name || entry.username || "User"}
              <RoleBadge entry={entry} />
              {isMe && <span className="lb-podium__you">you</span>}
            </div>
            {entry.username && entry.name && <div className="lb-podium__username">@{entry.username}</div>}
            {mode === "aura" ? (
              <AuraGivePill
                userId={entry.userId}
                initialCount={entry.auraReceived}
                auraToGive={isMe ? 0 : auraToGive}
                onGive={isMe ? undefined : onAuraGive}
                color={colors.bar}
              />
            ) : (
              <>
                <div className="lb-podium__meta">
                  {entry.sessions} session{entry.sessions !== 1 ? "s" : ""}
                </div>
                <div className="lb-podium__hours" style={{ color: colors.bar }}>
                  {formatDuration(entry.seconds)}
                </div>
                {!isMe && (
                  <AuraButton
                    userId={entry.userId}
                    initialCount={auraMap[entry.userId] ?? 0}
                    auraToGive={auraToGive}
                    onGive={onAuraGive}
                  />
                )}
              </>
            )}
            <div
              className="lb-podium__base"
              style={{
                height: podiumHeights[i],
                background: colors.bar,
                boxShadow: `0 0 28px ${colors.glow}`,
              }}>
              <span className="lb-podium__pos">{rank + 1}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
