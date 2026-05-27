import { useAuraGive } from "@hooks/useAuraGive";
import { formatNum } from "@utils/formatters";

export function AuraButton({ userId, initialCount, auraToGive, onGive }) {
  const { count, remaining, burst, canGive, give } = useAuraGive(initialCount, auraToGive, onGive);

  return (
    <button
      className={`aura-btn${!canGive ? " aura-btn--spent" : ""}${burst ? " aura-btn--burst" : ""}`}
      onClick={(e) => { e.stopPropagation(); give(userId); }}
      disabled={!canGive}
      title={remaining > 0 ? `Give aura (${remaining} left today)` : "No aura left to give today"}>
      <span className="aura-btn__emoji">✨</span>
      <span className="aura-btn__count">{formatNum(count)}</span>
    </button>
  );
}
