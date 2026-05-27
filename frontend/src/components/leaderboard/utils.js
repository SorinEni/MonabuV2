import { getCountryFlag } from "@utils/avatar";
import { TZ_COUNTRY_MAP } from "./constants";

export function formatHours(seconds) {
  const h = seconds / 3600;
  if (h >= 100) return `${Math.round(h)}h`;
  if (h >= 10) return `${h.toFixed(1)}h`;
  if (h >= 1) return `${h.toFixed(1)}h`;
  const m = Math.floor(seconds / 60);
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

export function getFlag(entry) {
  if (entry.countryCode) return getCountryFlag(entry.countryCode);
  if (entry.timezone) return getCountryFlag(TZ_COUNTRY_MAP[entry.timezone] ?? null);
  return null;
}

export function offsetLabel(period, offset) {
  if (offset === 0) {
    return (
      {
        today: "Today",
        week: "This week",
        month: "This month",
        year: "This year",
      }[period] ?? ""
    );
  }
  const now = new Date();
  if (period === "today") {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  if (period === "week") {
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) - offset * 7);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const fmt = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${fmt(mon)} – ${fmt(sun)}`;
  }
  if (period === "month") {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }
  if (period === "year") return String(now.getFullYear() - offset);
  return "";
}
