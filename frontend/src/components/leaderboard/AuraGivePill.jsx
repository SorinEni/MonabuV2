import { useAuraGive } from "@hooks/useAuraGive";
import { formatNum } from "@utils/formatters";

export function AuraGivePill({ userId, initialCount, auraToGive, onGive, color }) {
  const { count, remaining, busy, burst, canGive, give } = useAuraGive(initialCount, auraToGive, onGive);

  return (
    <button
      className={`aura-give-pill${!canGive ? " aura-give-pill--spent" : ""}${burst ? " aura-give-pill--burst" : ""}`}
      onClick={(e) => { e.stopPropagation(); give(userId); }}
      disabled={busy}
      title={canGive ? `Give aura (${remaining} left today)` : "No aura left to give today"}>
      <span className="aura-give-pill__emoji">✨</span>
      <span className="aura-give-pill__count">{formatNum(count)}</span>
    </button>
  );
}
