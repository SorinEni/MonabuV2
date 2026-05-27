export const DEFAULT_POMO = {
  workMins: 25,
  shortBreakMins: 5,
  longBreakMins: 15,
  totalSessions: 4,
  longBreakEvery: 4,
  autoStartBreak: true,
  autoStartWork: false,
};

export const POMO_FIELDS = [
  {
    label: "Work duration",
    desc: "Minutes per focused work session.",
    key: "workMins",
    min: 1,
    max: 120,
    unit: "min",
  },
  {
    label: "Short break",
    desc: "Minutes between work sessions.",
    key: "shortBreakMins",
    min: 1,
    max: 60,
    unit: "min",
  },
  {
    label: "Long break",
    desc: "Minutes after a full cycle.",
    key: "longBreakMins",
    min: 1,
    max: 120,
    unit: "min",
  },
];
