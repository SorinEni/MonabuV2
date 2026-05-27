const LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const COLORS = [
  "",
  "var(--color-error)",
  "var(--color-warning)",
  "var(--accent)",
  "var(--color-success)",
];

const CRITERIA_DEFS = [
  { key: "length8", label: "8+ characters" },
  { key: "length12", label: "12+ characters" },
  { key: "mixedCase", label: "Upper & lowercase" },
  { key: "number", label: "One number" },
  { key: "special", label: "One special character (!@#…)" },
];

/** Realistic password analysis.
 *  - 8+ chars = minimum (score 1)
 *  - mixed case + number = fair (score 2)
 *  - 12+ chars + 3 types = good (score 3)
 *  - 16+ chars + all 4 types = strong (score 4)
 *  Short passwords are capped low regardless of complexity.
 */
export function analysePassword(pw) {
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);

  const types = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  let score = 0;
  if (pw.length >= 8) score = 1;
  if (pw.length >= 8 && types >= 2) score = 2;
  if (pw.length >= 12 && types >= 3) score = 3;
  if (pw.length >= 16 && types >= 4) score = 4;

  // Hard cap: < 8 chars can never be > Fair
  if (pw.length < 8) score = Math.min(score, 2);

  const criteria = {
    length8: pw.length >= 8,
    length12: pw.length >= 12,
    mixedCase: hasLower && hasUpper,
    number: hasNumber,
    special: hasSpecial,
  };

  return { criteria, score };
}

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null;

  const { criteria, score } = analysePassword(password);
  const color = score > 0 ? COLORS[score] : "var(--text-faint)";

  return (
    <>
      <div className="settings-pw-strength">
        <div className="settings-pw-bars">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="settings-pw-bar"
              style={{
                background: score >= n ? COLORS[score] : "var(--border)",
                transition: "background 0.25s",
              }}
            />
          ))}
        </div>
        <span className="settings-pw-label" style={{ color }}>
          {LABELS[score] || ""}
        </span>
      </div>
      <ul className="settings-pw-criteria">
        {CRITERIA_DEFS.map(({ key, label }) => {
          const met = criteria[key];
          return (
            <li
              key={key}
              className={met ? "settings-pw-criterion--met" : ""}
              style={{
                color: met ? "var(--color-success)" : "var(--text-faint)",
              }}
            >
              {met ? "✓" : "○"} {label}
            </li>
          );
        })}
      </ul>
    </>
  );
}
