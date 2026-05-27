//   DashboardPreview.jsx
// The animated dashboard preview card shown in the landing page hero.
// Extracted from App.jsx — no props needed, all data is self-contained.

//   Data

const TAGS = [
  { name: "Mathematics", color: "#7dd3fc", hours: 42.5 },
  { name: "Systems Design", color: "#a5b4fc", hours: 28.0 },
  { name: "Japanese", color: "#6ee7b7", hours: 35.5 },
  { name: "Piano", color: "#f9a8d4", hours: 19.0 },
  { name: "Writing", color: "#c4b5fd", hours: 22.5 },
];

const SESSIONS = [
  {
    tagColor: "#7dd3fc",
    duration: "1h 20m",
    time: "Today, 9:14 AM",
    label: "Linear Algebra Ch. 4",
  },
  {
    tagColor: "#6ee7b7",
    duration: "45m",
    time: "Today, 7:30 AM",
    label: "Anki deck — N3 vocab",
  },
  {
    tagColor: "#a5b4fc",
    duration: "2h 05m",
    time: "Yesterday, 8:00 PM",
    label: "Distributed systems reading",
  },
];

const SPARKLINE_VALS = [14, 18, 11, 22, 16, 20, 24];

const maxHours = Math.max(...TAGS.map((t) => t.hours));
const totalHours = TAGS.reduce((sum, t) => sum + t.hours, 0);

//   Component

export default function DashboardPreview() {
  return (
    <div className="preview-card">
      <div className="preview-header">
        <div>
          <div className="preview-sublabel">This Month</div>
          <div className="preview-total">
            {Math.round(totalHours)}
            <span>h</span>
          </div>
          <div className="preview-delta">↑ 12% vs last month</div>
        </div>
        <div className="preview-sparkline">
          {SPARKLINE_VALS.map((h, i) => (
            <div
              key={i}
              className={`spark-bar${i === SPARKLINE_VALS.length - 1 ? " spark-bar--active" : ""}`}
              style={{ height: `${h * 1.8}px` }}
            />
          ))}
        </div>
      </div>

      <div className="preview-section-label">By Tag</div>
      <div className="preview-bars">
        {TAGS.map((tag) => (
          <div key={tag.name} className="preview-bar-row">
            <div
              className="preview-bar-dot"
              style={{ background: tag.color }}
            />
            <div className="preview-bar-name">{tag.name}</div>
            <div className="preview-bar-track">
              <div
                className="preview-bar-fill"
                style={{
                  width: `${(tag.hours / maxHours) * 100}%`,
                  background: tag.color,
                }}
              />
            </div>
            <div className="preview-bar-hours">{tag.hours}h</div>
          </div>
        ))}
      </div>

      <div className="preview-section-label preview-section-label--spaced">
        Recent Sessions
      </div>
      <div className="preview-sessions">
        {SESSIONS.map((s, i) => (
          <div
            key={i}
            className={`preview-session-row${i === 0 ? " preview-session-row--active" : ""}`}>
            <div
              className="preview-session-dot"
              style={{ background: s.tagColor }}
            />
            <div className="preview-session-info">
              <div className="preview-session-label">{s.label}</div>
              <div className="preview-session-time">{s.time}</div>
            </div>
            <div className="preview-session-dur">{s.duration}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
