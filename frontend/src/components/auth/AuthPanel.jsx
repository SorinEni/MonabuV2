// The left branding panel used on all auth pages (Login, Signup, ForgotPassword,
// ResetPassword). Previously copy-pasted verbatim in each file — now one component.

const DEFAULT_STATS = [
  { num: "1.2M", label: "Sessions logged" },
  { num: "94%",  label: "Weekly goal rate" },
  { num: "48h",  label: "Avg. hours saved" },
];

const DEFAULT_QUOTE = {
  text: "An investment in knowledge pays the best interest.",
  attr: "— Benjamin Franklin",
};

/**
 * Props:
 *   quote   { text, attr }   Override the default quote
 *   stats   [{ num, label }] Override the default stats
 *   gif     string           Optional gif src to show above the heading (right panel use)
 */
export function AuthLeftPanel({ quote = DEFAULT_QUOTE, stats = DEFAULT_STATS }) {
  return (
    <div className="auth-panel auth-panel--left">
      <div className="auth-panel__inner">
        <a href="/" className="auth-logo">
          <div className="auth-logo__mark" />
          Monabu
        </a>
        <div className="auth-quote">
          <p className="auth-quote__text">"{quote.text}"</p>
          <p className="auth-quote__attr">{quote.attr}</p>
        </div>
        <div className="auth-stats">
          {stats.map((s) => (
            <div key={s.label} className="auth-stat">
              <div className="auth-stat__num">{s.num}</div>
              <div className="auth-stat__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Right panel wrapper — contains the actual form or confirmation content. */
export function AuthRightPanel({ children }) {
  return (
    <div className="auth-panel auth-panel--right">
      <div className="auth-form-wrap">{children}</div>
    </div>
  );
}
