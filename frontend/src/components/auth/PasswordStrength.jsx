// Password strength meter and criteria checklist.
// Extracted from ResetPassword.jsx — reusable for any password input.

const LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const COLORS = [
  "",
  "var(--color-error)",
  "var(--color-warning)",
  "var(--accent)",
  "var(--color-success)",
];

const CRITERIA_DEFS = [
  { key: "length",    label: "12+ characters" },
  { key: "uppercase", label: "Uppercase letter" },
  { key: "number",    label: "Number" },
  { key: "special",   label: "Special character (!@#...)" },
];

/** Analyse a password string, return { criteria, score }. */
export function analysePassword(pw) {
  const criteria = {
    length:    pw.length >= 12,
    uppercase: /[A-Z]/.test(pw),
    number:    /[0-9]/.test(pw),
    special:   /[^A-Za-z0-9]/.test(pw),
  };
  const score = Object.values(criteria).filter(Boolean).length;
  return { criteria, score };
}

/**
 * Props:
 *   password   string   The current password value
 */
export default function PasswordStrength({ password }) {
  if (!password) return null;

  const { criteria, score } = analysePassword(password);
  const color = score > 0 ? COLORS[score] : "var(--text-faint)";

  return (
    <div className="password-strength">
      <div className="password-strength__bars">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="password-strength__bar"
            style={{
              background: score >= i ? COLORS[score] : "var(--border-2)",
              transition: "background 0.25s",
            }}
          />
        ))}
        <span className="password-strength__label" style={{ color }}>
          {LABELS[score] || ""}
        </span>
      </div>

      <ul className="password-strength__criteria">
        {CRITERIA_DEFS.map(({ key, label }) => (
          <li
            key={key}
            className={`password-strength__criterion${criteria[key] ? " password-strength__criterion--met" : ""}`}>
            <span className="password-strength__criterion-icon">
              {criteria[key] ? "✓" : "·"}
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
