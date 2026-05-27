import {
  TimerIcon,
  TagFeatureIcon,
  BarChartIcon,
  ActivityIcon,
  DownloadIcon,
  JournalIcon,
  CheckIcon,
  PauseIcon,
  PlayIcon,
  WarningIcon,
} from "@components/shared/Icons";
import { useEffect, useState } from "react";
import { Nav, Footer, BottomCta } from "@components/shared/PublicLayout";
import "@styles/Features.css";

//   Data

const FEATURES = [
  {
    id: "timer",
    label: "Real-time Timer",
    tagline: "One click to start. Zero friction.",
    desc: "Launch a session instantly — no forms, no setup. Tag it mid-session, rename it after. Every second is captured the moment it happens, so you can stay in flow and let Monabu handle the record.",
    bullets: [
      "Auto-pause detection when you go idle",
      "Name and tag sessions while they run",
      "Session history synced across devices",
    ],
    icon: <TimerIcon size={22} />,
    visual: "timer",
  },
  {
    id: "tags",
    label: "Tag-Based Clarity",
    tagline: "Your learning, your structure.",
    desc: "Tags are the backbone of Monabu. Build a library that mirrors how you actually think — by subject, by project, by skill. Color-code everything. Reorganize as you grow. Your structure, not ours.",
    bullets: [
      "Unlimited tags on Pro",
      "Custom colors per tag",
      "Nested tag groups coming soon",
    ],
    icon: <TagFeatureIcon size={22} />,
    visual: "tags",
  },
  {
    id: "analytics",
    label: "Visual Analytics",
    tagline: "See exactly where your time goes.",
    desc: "Heatmaps, weekly bar charts, tag breakdowns — every visualization is built to surface a real insight, not just fill screen space. Spot patterns. Adjust. Improve.",
    bullets: [
      "Daily heatmap across the year",
      "Per-tag weekly and monthly views",
      "Trend lines with delta vs last period",
    ],
    icon: <BarChartIcon size={22} />,
    visual: "analytics",
  },
  {
    id: "streaks",
    label: "Streak Intelligence",
    tagline: "Momentum you can measure.",
    desc: "Daily streaks are motivating — until you lose one without warning. Monabu tells you when a streak is at risk before it breaks, so you can protect what you've built. Smart nudges, not guilt.",
    bullets: [
      "Per-tag streak tracking",
      "End-of-day warnings before midnight",
      "Streak freeze for planned breaks",
    ],
    icon: <ActivityIcon size={22} />,
    visual: "streaks",
  },
  {
    id: "journal",
    label: "Session Journal",
    tagline: "Reflection built into the workflow.",
    desc: "Log what you learned, what was hard, what clicked. Over time, your journal becomes a searchable record of your intellectual growth — not just hours, but the thinking behind them.",
    bullets: [
      "Freeform notes per session",
      "Full-text search across all entries",
      "Filter by tag, date, or duration",
    ],
    icon: <JournalIcon size={22} />,
    visual: "journal",
  },
  {
    id: "export",
    label: "Export Anywhere",
    tagline: "Your data is yours. Always.",
    desc: "Download everything as CSV with one click. Pipe it into Notion, Obsidian, Google Sheets, or your own scripts. No lock-in. No hoops. Monabu stores it — you own it.",
    bullets: [
      "Full CSV export of all sessions",
      "Notion & Obsidian templates available",
      "Webhook support on Team plan",
    ],
    icon: <DownloadIcon size={22} />,
    visual: "export",
  },
];

//   Visual Mockups

function TimerVisual() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const fmt = (s) => {
    const h = Math.floor(s / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((s % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  return (
    <div className="fv-card">
      <div className="fv-timer">
        <div
          className="fv-timer__tag"
          style={{
            background: "#7dd3fc22",
            color: "#7dd3fc",
            borderColor: "#7dd3fc44",
          }}>
          <span className="fv-timer__dot" style={{ background: "#7dd3fc" }} />
          Mathematics
        </div>
        <div className="fv-timer__display">{fmt(seconds)}</div>
        <div className="fv-timer__label">Linear Algebra Ch. 4</div>
        <button
          className={`fv-timer__btn${running ? " fv-timer__btn--stop" : " fv-timer__btn--start"}`}
          onClick={() => setRunning((r) => !r)}>
          {running ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
          {running ? "Pause" : "Resume"}
        </button>
      </div>
    </div>
  );
}

function TagsVisual() {
  const tags = [
    { name: "Mathematics", color: "#7dd3fc", hours: 42.5, sessions: 34 },
    { name: "Japanese", color: "#6ee7b7", hours: 35.5, sessions: 28 },
    { name: "Systems Design", color: "#a5b4fc", hours: 28.0, sessions: 19 },
    { name: "Writing", color: "#c4b5fd", hours: 22.5, sessions: 15 },
    { name: "Piano", color: "#f9a8d4", hours: 19.0, sessions: 12 },
  ];
  const max = Math.max(...tags.map((t) => t.hours));

  return (
    <div className="fv-card">
      <div className="fv-tags">
        <div className="fv-tags__header">
          <span className="fv-sublabel">All Tags</span>
          <span className="fv-sublabel">147h total</span>
        </div>
        {tags.map((tag) => (
          <div key={tag.name} className="fv-tag-row">
            <div className="fv-tag-dot" style={{ background: tag.color }} />
            <div className="fv-tag-name">{tag.name}</div>
            <div className="fv-tag-track">
              <div
                className="fv-tag-fill"
                style={{
                  width: `${(tag.hours / max) * 100}%`,
                  background: tag.color,
                }}
              />
            </div>
            <div className="fv-tag-meta">
              <span className="fv-tag-hours">{tag.hours}h</span>
              <span className="fv-tag-sessions">{tag.sessions} sessions</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  const weeks = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data = {
    Mathematics: [1.5, 2.0, 0, 1.8, 2.5, 3.0, 1.2],
    Japanese: [1.0, 0.8, 1.5, 0, 1.2, 2.0, 0.5],
    "Sys. Design": [0, 1.5, 1.0, 2.0, 0, 1.0, 0],
  };
  const colors = {
    Mathematics: "#7dd3fc",
    Japanese: "#6ee7b7",
    "Sys. Design": "#a5b4fc",
  };
  const maxVal = 3.0;

  return (
    <div className="fv-card">
      <div className="fv-analytics">
        <div className="fv-analytics__header">
          <div>
            <div className="fv-sublabel">This Week</div>
            <div className="fv-analytics__total">
              24.5<span>h</span>
            </div>
            <div className="fv-analytics__delta">↑ 8% vs last week</div>
          </div>
          <div className="fv-legend">
            {Object.entries(colors).map(([name, color]) => (
              <div key={name} className="fv-legend-item">
                <div className="fv-legend-dot" style={{ background: color }} />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="fv-chart">
          {weeks.map((day, di) => (
            <div key={day} className="fv-chart-col">
              <div className="fv-chart-bars">
                {Object.entries(data).map(([tag, vals]) => (
                  <div
                    key={tag}
                    className="fv-chart-bar"
                    style={{
                      height: `${(vals[di] / maxVal) * 80}px`,
                      background: colors[tag],
                      opacity: vals[di] === 0 ? 0.08 : 0.75,
                    }}
                  />
                ))}
              </div>
              <div className="fv-chart-label">{day}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StreaksVisual() {
  const tags = [
    {
      name: "Mathematics",
      color: "#7dd3fc",
      streak: 14,
      best: 21,
      today: true,
    },
    { name: "Japanese", color: "#6ee7b7", streak: 7, best: 12, today: true },
    {
      name: "Piano",
      color: "#f9a8d4",
      streak: 3,
      best: 9,
      today: false,
      warning: true,
    },
  ];

  return (
    <div className="fv-card">
      <div className="fv-streaks">
        <div className="fv-sublabel" style={{ marginBottom: "16px" }}>
          Active Streaks
        </div>
        {tags.map((tag) => (
          <div
            key={tag.name}
            className={`fv-streak-row${tag.warning ? " fv-streak-row--warn" : ""}`}>
            <div className="fv-streak-left">
              <div
                className="fv-streak-dot"
                style={{ background: tag.color }}
              />
              <div>
                <div className="fv-streak-name">{tag.name}</div>
                <div className="fv-streak-best">Best: {tag.best} days</div>
              </div>
            </div>
            <div className="fv-streak-right">
              {tag.warning && (
                <div className="fv-streak-warn-badge">
                  <WarningIcon size={11} />
                  Log today
                </div>
              )}
              {tag.today && <div className="fv-streak-done">✓ done</div>}
              <div
                className="fv-streak-count"
                style={{ color: tag.warning ? "#fbbf24" : tag.color }}>
                {tag.streak}
                <span>d</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JournalVisual() {
  return (
    <div className="fv-card">
      <div className="fv-journal">
        <div className="fv-journal__entry">
          <div className="fv-journal__entry-header">
            <div
              className="fv-journal__tag"
              style={{
                background: "#7dd3fc22",
                color: "#7dd3fc",
                borderColor: "#7dd3fc44",
              }}>
              Mathematics
            </div>
            <div className="fv-journal__meta">Today · 1h 20m</div>
          </div>
          <div className="fv-journal__title">Linear Algebra Ch. 4</div>
          <div className="fv-journal__body">
            Finally clicked — eigenvectors make sense when you think of them as
            the axes that don't rotate under a transformation. The geometric
            intuition was missing before.
          </div>
          <div className="fv-journal__tags-row">
            <span className="fv-journal__chip">eigenvalues</span>
            <span className="fv-journal__chip">breakthrough</span>
          </div>
        </div>
        <div className="fv-journal__entry fv-journal__entry--muted">
          <div className="fv-journal__entry-header">
            <div
              className="fv-journal__tag"
              style={{
                background: "#6ee7b722",
                color: "#6ee7b7",
                borderColor: "#6ee7b744",
              }}>
              Japanese
            </div>
            <div className="fv-journal__meta">Yesterday · 45m</div>
          </div>
          <div className="fv-journal__title">Anki deck — N3 vocab</div>
          <div className="fv-journal__body">
            Retention on kanji compounds is still rough. Need to add mnemonics
            for the ones I keep missing.
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportVisual() {
  const rows = [
    {
      date: "2026-05-09",
      tag: "Mathematics",
      label: "Linear Algebra Ch. 4",
      dur: "1:20:00",
    },
    {
      date: "2026-05-09",
      tag: "Japanese",
      label: "Anki deck — N3 vocab",
      dur: "0:45:00",
    },
    {
      date: "2026-05-08",
      tag: "Systems Design",
      label: "Distributed systems reading",
      dur: "2:05:00",
    },
    {
      date: "2026-05-08",
      tag: "Piano",
      label: "Bach Invention No. 1",
      dur: "0:30:00",
    },
  ];

  return (
    <div className="fv-card">
      <div className="fv-export">
        <div className="fv-export__toolbar">
          <span className="fv-sublabel">sessions_export.csv</span>
          <button className="fv-export__btn">
            <DownloadIcon size={13} />
            Download CSV
          </button>
        </div>
        <div className="fv-export__table">
          <div className="fv-export__row fv-export__row--head">
            <span>Date</span>
            <span>Tag</span>
            <span>Session</span>
            <span>Duration</span>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="fv-export__row">
              <span className="fv-export__date">{r.date}</span>
              <span className="fv-export__tag">{r.tag}</span>
              <span className="fv-export__session">{r.label}</span>
              <span className="fv-export__dur">{r.dur}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const VISUALS = {
  timer: <TimerVisual />,
  tags: <TagsVisual />,
  analytics: <AnalyticsVisual />,
  streaks: <StreaksVisual />,
  journal: <JournalVisual />,
  export: <ExportVisual />,
};

//   Page

export default function Features() {
  return (
    <div className="root">
      <Nav />

      {/*   Hero   */}
      <section className="features-hero">
        <div className="eyebrow">
          <span className="eyebrow__dot" />
          Built for deliberate learners
        </div>
        <h1 className="features-hero__heading">
          Every feature exists
          <br />
          for a <em>reason.</em>
        </h1>
        <p className="features-hero__desc">
          No bloat. No gamification gimmicks. Just the tools that turn raw hours
          into compounding growth.
        </p>
      </section>

      {/*   Feature Sections   */}
      <div className="feature-sections">
        {FEATURES.map((f, i) => (
          <section
            key={f.id}
            className={`feature-section${i % 2 === 1 ? " feature-section--flipped" : ""}`}>
            <div className="feature-section__content">
              <div className="feature-section__icon">{f.icon}</div>
              <div className="feature-section__label">{f.label}</div>
              <h2 className="feature-section__heading">{f.tagline}</h2>
              <p className="feature-section__desc">{f.desc}</p>
              <ul className="feature-section__bullets">
                {f.bullets.map((b) => (
                  <li key={b} className="feature-section__bullet">
                    <CheckIcon size={14} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="feature-section__visual">{VISUALS[f.visual]}</div>
          </section>
        ))}
      </div>

      <BottomCta />
      <Footer />
    </div>
  );
}
