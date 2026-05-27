import { formatDateHeading } from "@utils/formatters";

export function dayRange(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const to = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return { date: new Date(from), from: from.toISOString(), to: to.toISOString() };
}

export function isoWeek(date) {
  const tmp = new Date(date);
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 4 - (tmp.getDay() || 7));
  const yearStart = new Date(tmp.getFullYear(), 0, 1);
  const week = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
  return { year: tmp.getFullYear(), week };
}

export function groupByPeriod(mode, sessions) {
  const groups = {};
  for (const s of sessions) {
    const d = new Date(s.startedAt);
    let key;
    if (mode === "week") {
      const w = isoWeek(d);
      key = `${w.year}-W${String(w.week).padStart(2, "0")}`;
    } else if (mode === "month") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else if (mode === "year") {
      key = `${d.getFullYear()}`;
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  }
  return Object.entries(groups).sort(([a], [b]) => (a < b ? 1 : -1));
}

export function formatPeriodLabel(mode, key) {
  if (mode === "day") return formatDateHeading(key);
  if (mode === "week") {
    const [, w, y] = key.match(/^(\d+)-W(\d+)$/) || [];
    return w ? `Week ${w}, ${y}` : key;
  }
  if (mode === "month") {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1).toLocaleString("default", { month: "long", year: "numeric" });
  }
  return key;
}

export function dayTotal(sessions) {
  return sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
}

export function formatDayLabel(date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (same(date, today)) return "Today";
  if (same(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}
