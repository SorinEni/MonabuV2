//   ProgressRing.jsx
// SVG circular progress ring used by the Pomodoro timer in Tracker.jsx.
//
// Props:
//   progress  number   0–1, where 1 = full circle
//   color     string   stroke color (defaults to var(--accent))
//   size      number   SVG width/height in px (default 200)
//   stroke    number   stroke width in px (default 5)

export default function ProgressRing({
  progress,
  color,
  size = 200,
  stroke = 5,
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  return (
    <svg
      className="pomo-ring"
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(128,128,128,0.12)"
        strokeWidth={stroke}
      />
      {/* Fill */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color || "var(--accent)"}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s ease" }}
      />
    </svg>
  );
}
