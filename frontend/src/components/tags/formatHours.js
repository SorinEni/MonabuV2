export function formatHours(seconds = 0) {
  if (!seconds || seconds <= 0) return "0h";
  const h = seconds / 3600;
  if (h < 0.1) {
    const mins = Math.round(seconds / 60);
    return mins < 1 ? "< 1m" : `${mins}m`;
  }
  return `${h.toFixed(1)}h`;
}
