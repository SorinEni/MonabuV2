import { Link } from "react-router-dom";
import { Nav, Footer, BottomCta } from "@components/shared/PublicLayout";
import DashboardPreview from "@components/DashboardPreview";
import {
  TimerIcon,
  TagFeatureIcon,
  BarChartIcon,
  ActivityIcon,
  DownloadIcon,
  JournalIcon,
  ArrowRightIcon,
} from "@components/shared/Icons";
import "@styles/App.css";

//   Data

const FEATURES = [
  {
    icon: <TimerIcon />,
    title: "Real-time Timer",
    desc: "Start a session with one click. Tag it, name it, and track every second as it happens.",
  },
  {
    icon: <TagFeatureIcon />,
    title: "Tag-Based Clarity",
    desc: "Group sessions into custom tags — subjects, projects, skills. Your data, your structure.",
  },
  {
    icon: <BarChartIcon />,
    title: "Visual Analytics",
    desc: "Streaks, heatmaps, weekly breakdowns. Turn hours logged into insights that change habits.",
  },
  {
    icon: <ActivityIcon />,
    title: "Streak Intelligence",
    desc: "Build momentum with daily streaks. Get warned before you break a streak you care about.",
  },
  {
    icon: <DownloadIcon />,
    title: "Export Anywhere",
    desc: "Download your data as CSV. Integrate with Notion, Obsidian, or your own dashboards.",
  },
  {
    icon: <JournalIcon />,
    title: "Session Journal",
    desc: "Annotate each session with notes and reflections. Build a searchable log over time.",
  },
];

const STATS = [
  { num: "1.2M", label: "Sessions logged to date" },
  { num: "94%", label: "Users hit their weekly goal" },
  { num: "48h", label: "Avg. hours saved per month" },
];

const AVATAR_COLORS = ["#7dd3fc", "#6ee7b7", "#f9a8d4", "#a5b4fc"];
const AVATAR_LETTERS = ["S", "M", "R", "K"];

//   Page

export default function App() {
  return (
    <div className="root">
      <Nav />

      {/*   Hero   */}
      <section className="hero">
        <div className="hero__left">
          <div className="eyebrow">
            <span className="eyebrow__dot" />
            Built for deliberate learners
          </div>
          <h1 className="hero__heading">
            Track every hour.
            <br />
            Own your <em>growth.</em>
          </h1>
          <p className="hero__desc">
            Monabu is a focused time tracker for serious learners. Log sessions
            by tag, visualize your streaks, and turn raw hours into insight you
            can act on.
          </p>
          <div className="hero__actions">
            <Link to="/signup" className="btn btn--primary">
              Get Monabu free
              <ArrowRightIcon size={14} />
            </Link>
            <button
              className="btn btn--ghost"
              onClick={() =>
                document
                  .getElementById("features")
                  .scrollIntoView({ behavior: "smooth" })
              }>
              See how it works
            </button>
          </div>
          <div className="social-proof">
            <div className="avatars">
              {AVATAR_COLORS.map((c, i) => (
                <div key={c} className="avatar" style={{ background: c }}>
                  {AVATAR_LETTERS[i]}
                </div>
              ))}
            </div>
            <p className="social-proof__text">
              <strong>2,400+ learners</strong> tracking their growth today
            </p>
          </div>
        </div>
        <div className="hero__right">
          <DashboardPreview />
        </div>
      </section>

      {/*   Stats band   */}
      <div className="stats-band">
        <div className="stats-band__inner">
          {STATS.map((s) => (
            <div key={s.label} className="stat">
              <div className="stat__num">{s.num}</div>
              <div className="stat__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/*   Features   */}
      <section className="features" id="features">
        <div className="features__meta">
          <div className="section-label">Features</div>
          <h2 className="section-heading">
            Everything you need to learn
            <br />
            with <em>intention.</em>
          </h2>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-card__icon">{f.icon}</div>
              <div className="feature-card__title">{f.title}</div>
              <div className="feature-card__desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <BottomCta />
      <Footer />
    </div>
  );
}
