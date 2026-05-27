export const PERIODS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
  { key: "allTime", label: "All Time" },
];

export const AURA_PERIODS = [{ key: "allTime", label: "All Time" }];

export const LEADERBOARD_TABS = [
  { key: "study", label: "Study Time" },
  { key: "aura", label: "✨ Aura" },
];

export const MEDALS = ["🥇", "🥈", "🥉"];

export const RANK_COLORS = [
  { bar: "#fbbf24", glow: "rgba(251,191,36,0.25)", rank: "gold" },
  { bar: "#b8d4f0", glow: "rgba(184,212,240,0.3)", rank: "silver" },
  { bar: "#d4a574", glow: "rgba(212,165,116,0.25)", rank: "bronze" },
];

export const AURA_RANK_COLORS = [
  { bar: "#fbbf24", glow: "rgba(251,191,36,0.3)", rank: "gold" },
  { bar: "#b8d4f0", glow: "rgba(184,212,240,0.3)", rank: "silver" },
  { bar: "#6ee7b7", glow: "rgba(110,231,183,0.25)", rank: "bronze" },
];

export const TZ_COUNTRY_MAP = {
  "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US",
  "America/Los_Angeles": "US", "America/Phoenix": "US", "America/Anchorage": "US",
  "Pacific/Honolulu": "US", "America/Toronto": "CA", "America/Vancouver": "CA",
  "America/Montreal": "CA", "America/Halifax": "CA", "America/Winnipeg": "CA",
  "America/Mexico_City": "MX", "America/Sao_Paulo": "BR", "America/Buenos_Aires": "AR",
  "America/Bogota": "CO", "America/Lima": "PE", "America/Santiago": "CL",
  "America/Caracas": "VE", "Europe/London": "GB", "Europe/Dublin": "IE",
  "Europe/Paris": "FR", "Europe/Berlin": "DE", "Europe/Madrid": "ES",
  "Europe/Rome": "IT", "Europe/Amsterdam": "NL", "Europe/Brussels": "BE",
  "Europe/Zurich": "CH", "Europe/Vienna": "AT", "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO", "Europe/Copenhagen": "DK", "Europe/Helsinki": "FI",
  "Europe/Warsaw": "PL", "Europe/Prague": "CZ", "Europe/Budapest": "HU",
  "Europe/Bucharest": "RO", "Europe/Athens": "GR", "Europe/Lisbon": "PT",
  "Europe/Moscow": "RU", "Europe/Kiev": "UA", "Europe/Istanbul": "TR",
  "Asia/Dubai": "AE", "Asia/Riyadh": "SA", "Asia/Kolkata": "IN",
  "Asia/Karachi": "PK", "Asia/Dhaka": "BD", "Asia/Bangkok": "TH",
  "Asia/Singapore": "SG", "Asia/Kuala_Lumpur": "MY", "Asia/Jakarta": "ID",
  "Asia/Manila": "PH", "Asia/Shanghai": "CN", "Asia/Hong_Kong": "HK",
  "Asia/Tokyo": "JP", "Asia/Seoul": "KR", "Asia/Taipei": "TW",
  "Asia/Colombo": "LK", "Asia/Kathmandu": "NP", "Asia/Tashkent": "UZ",
  "Asia/Almaty": "KZ", "Asia/Baku": "AZ", "Asia/Tbilisi": "GE",
  "Africa/Cairo": "EG", "Africa/Lagos": "NG", "Africa/Nairobi": "KE",
  "Africa/Johannesburg": "ZA", "Africa/Accra": "GH", "Africa/Casablanca": "MA",
  "Africa/Addis_Ababa": "ET", "Africa/Dar_es_Salaam": "TZ",
  "Australia/Sydney": "AU", "Australia/Melbourne": "AU",
  "Australia/Brisbane": "AU", "Australia/Perth": "AU",
  "Australia/Adelaide": "AU", "Pacific/Auckland": "NZ", "Pacific/Fiji": "FJ",
};

export const PLAN_BADGE = {
  pro: { label: "PRO", cls: "lb-role-badge--pro" },
  "pro+": { label: "PRO+", cls: "lb-role-badge--proplus" },
  team: { label: "TEAM", cls: "lb-role-badge--team" },
  earlyaccess: { label: "TOAD", cls: "lb-role-badge--early" },
};
