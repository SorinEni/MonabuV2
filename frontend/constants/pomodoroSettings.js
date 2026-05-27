export const POMO_FIELDS = [
  {
    label: "Work session",
    desc: "Duration of each focused work block.",
    key: "workMins",
    min: 1,
    max: 180,
    unit: "min",
  },
  {
    label: "Short break",
    desc: "Rest between work sessions.",
    key: "shortBreakMins",
    min: 1,
    max: 15,
    unit: "min",
  },
  {
    label: "Long break",
    desc: "Extended rest after a full cycle.",
    key: "longBreakMins",
    min: 1,
    max: 60,
    unit: "min",
  },
];

export const DEFAULT_POMO = {
  workMins: 25,
  shortBreakMins: 5,
  longBreakMins: 15,
  totalSessions: 4,
  longBreakEvery: 4,
  autoStartBreak: true,
  autoStartWork: false,
};
