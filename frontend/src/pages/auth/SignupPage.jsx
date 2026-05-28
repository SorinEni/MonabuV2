import { AuthLeftPanel, AuthRightPanel } from "@components/auth/AuthPanel";
import StepDots from "@components/auth/StepDots";
import ConfirmEmail from "@components/auth/ConfirmEmail";
import PasswordStrengthMeter from "@components/shared/PasswordStrengthMeter";
import {
  GoogleIcon,
  EyeOpenIcon,
  EyeClosedIcon,
} from "@components/shared/Icons";
const GOALS = [
  { value: "none", icon: "🤐", label: "None" },
  { value: "work", icon: "💼", label: "Work" },
  { value: "school", icon: "🎒", label: "School" },
  { value: "fitness", icon: "🏋️", label: "Fitness" },
  { value: "learning", icon: "🧠", label: "Learning" },
  { value: "reading", icon: "📚", label: "Reading" },
  { value: "productivity", icon: "⚡", label: "Productivity" },
  { value: "habits", icon: "🔁", label: "Habits" },
];

import { useSignup } from "@hooks/useSignup";
import "@styles/Auth.css";

const STEPS = ["Account", "Profile", "Goals"];

const QUOTE = {
  text: "The more that you read, the more things you will know.",
  attr: "— Dr. Seuss",
};

export default function SignupPage() {
  const {
    step,
    setStep,
    confirmedEmail,
    email,
    setEmail,
    password,
    setPassword,
    showPass,
    setShowPass,
    accountError,
    accountLoading,
    emailCheck,
    handleAccountNext,
    name,
    setName,
    username,
    setUsername,
    usernameError,
    setUsernameError,
    usernameCheck,
    handleProfileNext,
    goal,
    setGoal,
    weeklyHours,
    setWeeklyHours,
    submitLoading,
    submitError,
    handleSubmit,
  } = useSignup();

  if (confirmedEmail) {
    return <ConfirmEmail email={confirmedEmail} />;
  }

  return (
    <div className="auth-root">
      <AuthLeftPanel quote={QUOTE} />

      <AuthRightPanel>
        <StepDots steps={STEPS} current={step} />

        {/* Step 0: Account */}
        {step === 0 && (
          <>
            <div className="auth-form-header">
              <h1 className="auth-heading">Create your account</h1>
              <p className="auth-subheading">
                Free forever. No credit card required.
              </p>
            </div>

            <button
              className="auth-oauth-btn"
              type="button"
              onClick={() => {
                window.location.href = "/api/auth/google";
              }}>
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="auth-divider">
              <span>or continue with email</span>
            </div>

            {accountError && (
              <div className="auth-error" role="alert">
                {accountError}
              </div>
            )}

            <form className="auth-form" onSubmit={handleAccountNext} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="su-email">
                  Email
                </label>
                <input
                  id="su-email"
                  className={`auth-input${emailCheck.status === "invalid" ? " auth-input--error" : ""}`}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                {emailCheck.msg && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color:
                        emailCheck.status === "invalid"
                          ? "var(--color-error)"
                          : emailCheck.status === "valid"
                            ? "var(--color-success)"
                            : "var(--text-faint)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}>
                    {emailCheck.status === "checking" && (
                      <span
                        className="auth-spinner"
                        style={{ width: 10, height: 10, borderWidth: 1.5 }}
                      />
                    )}
                    {emailCheck.msg}
                  </div>
                )}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="su-password">
                  Password
                </label>
                <div className="auth-input-wrap">
                  <input
                    id="su-password"
                    className="auth-input auth-input--padded"
                    type={showPass ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-toggle-pass"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? "Hide password" : "Show password"}>
                    {showPass ? <EyeClosedIcon /> : <EyeOpenIcon />}
                  </button>
                </div>
                <PasswordStrengthMeter password={password} />
              </div>

              <button
                type="submit"
                className={`auth-submit-btn${accountLoading ? " auth-submit-btn--loading" : ""}`}
                disabled={accountLoading}>
                {accountLoading ? (
                  <>
                    <span className="auth-spinner" /> Checking…
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account?{" "}
              <a href="/login" className="auth-switch__link">
                Sign in
              </a>
            </p>
          </>
        )}

        {/* Step 1: Profile */}
        {step === 1 && (
          <>
            <div className="auth-form-header">
              <h1 className="auth-heading">Your profile</h1>
              <p className="auth-subheading">How should we address you?</p>
            </div>

            <form className="auth-form" onSubmit={handleProfileNext} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="su-name">
                  Display name
                </label>
                <input
                  id="su-name"
                  className="auth-input"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="su-username">
                  Username (unique)
                </label>
                <input
                  id="su-username"
                  className={`auth-input${usernameError || usernameCheck.status === "invalid" ? " auth-input--error" : ""}`}
                  type="text"
                  placeholder="janedoe"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameError("");
                  }}
                  autoComplete="username"
                  required
                />
                {usernameCheck.msg && !usernameError && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color:
                        usernameCheck.status === "invalid"
                          ? "var(--color-error)"
                          : usernameCheck.status === "valid"
                            ? "var(--color-success)"
                            : "var(--text-faint)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}>
                    {usernameCheck.status === "checking" && (
                      <span
                        className="auth-spinner"
                        style={{ width: 10, height: 10, borderWidth: 1.5 }}
                      />
                    )}
                    {usernameCheck.msg}
                  </div>
                )}
                {usernameError && (
                  <p className="auth-field-error">{usernameError}</p>
                )}
              </div>

              <button type="submit" className="auth-submit-btn">
                Continue
              </button>
            </form>

            <button className="auth-back-btn" onClick={() => setStep(0)}>
              ← Back
            </button>
          </>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <>
            <div className="auth-form-header">
              <h1 className="auth-heading">Set your goals</h1>
              <p className="auth-subheading">
                We'll use these to personalise your dashboard.
              </p>
            </div>

            {submitError && (
              <div className="auth-error" role="alert">
                {submitError}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label className="auth-label">Primary goal</label>
                <div className="auth-goal-grid">
                  {GOALS.map((g) => (
                    <button
                      key={g.value || "none"}
                      type="button"
                      className={`auth-goal-card${g.value === "" ? " auth-goal-card--none" : ""}${goal === g.value ? " auth-goal-card--selected" : ""}`}
                      onClick={() => setGoal(g.value)}>
                      <span className="auth-goal-icon">{g.icon}</span>
                      <span className="auth-goal-text">
                        <span className="auth-goal-label">{g.label}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="su-hours">
                  Weekly study target (hours)
                  <span className="auth-label-hint">(max 80)</span>
                </label>
                <div className="auth-hours-control">
                  <button
                    type="button"
                    className="auth-hours-btn"
                    onClick={() =>
                      setWeeklyHours((v) => Math.max(1, Number(v) - 1))
                    }>
                    −
                  </button>
                  <input
                    id="su-hours"
                    className="auth-input"
                    type="number"
                    min="1"
                    max="80"
                    placeholder="10"
                    value={weeklyHours}
                    onChange={(e) =>
                      setWeeklyHours(
                        Math.min(80, Math.max(1, Number(e.target.value))),
                      )
                    }
                    style={{
                      textAlign: "center",
                      width: "52px",
                      border: "none",
                      background: "transparent",
                      padding: "0",
                    }}
                  />
                  <button
                    type="button"
                    className="auth-hours-btn"
                    onClick={() =>
                      setWeeklyHours((v) => Math.min(80, Number(v) + 1))
                    }>
                    +
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`auth-submit-btn${submitLoading ? " auth-submit-btn--loading" : ""}`}
                disabled={submitLoading}>
                {submitLoading ? (
                  <>
                    <span className="auth-spinner" /> Creating account…
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <button className="auth-back-btn" onClick={() => setStep(1)}>
              ← Back
            </button>
          </>
        )}
      </AuthRightPanel>
    </div>
  );
}
