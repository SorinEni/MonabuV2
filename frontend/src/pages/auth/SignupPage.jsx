import { AuthLeftPanel, AuthRightPanel } from "@components/auth/AuthPanel";
import StepDots from "@components/auth/StepDots";
import ConfirmEmail from "@components/auth/ConfirmEmail";
import { GoogleIcon, EyeOpenIcon, EyeClosedIcon } from "@components/shared/Icons";
import { GOALS } from "@constants/goals";
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
              <p className="auth-subheading">Free forever. No credit card required.</p>
            </div>

            <button
              className="auth-oauth-btn"
              type="button"
              onClick={() => { window.location.href = "/api/auth/google"; }}>
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="auth-divider"><span>or continue with email</span></div>

            {accountError && <div className="auth-error" role="alert">{accountError}</div>}

            <form className="auth-form" onSubmit={handleAccountNext} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="su-email">Email</label>
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
                  <div style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: emailCheck.status === "invalid" ? "var(--color-error)" : emailCheck.status === "valid" ? "var(--color-success)" : "var(--text-faint)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}>
                    {emailCheck.status === "checking" && <span className="auth-spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />}
                    {emailCheck.msg}
                  </div>
                )}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="su-password">Password</label>
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
              </div>

              <button
                type="submit"
                className={`auth-submit-btn${accountLoading ? " auth-submit-btn--loading" : ""}`}
                disabled={accountLoading}>
                {accountLoading ? <><span className="auth-spinner" /> Checking…</> : "Continue"}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account?{" "}
              <a href="/login" className="auth-switch__link">Sign in</a>
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
                <label className="auth-label" htmlFor="su-name">Full name (optional)</label>
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
                <label className="auth-label" htmlFor="su-username">Username</label>
                <input
                  id="su-username"
                  className={`auth-input${usernameError ? " auth-input--error" : ""}`}
                  type="text"
                  placeholder="janedoe"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setUsernameError(""); }}
                  autoComplete="username"
                  required
                />
                {usernameError && <p className="auth-field-error">{usernameError}</p>}
              </div>

              <button type="submit" className="auth-submit-btn">Continue</button>
            </form>

            <button className="auth-switch__link" onClick={() => setStep(0)}>← Back</button>
          </>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <>
            <div className="auth-form-header">
              <h1 className="auth-heading">Set your goals</h1>
              <p className="auth-subheading">We'll use these to personalise your dashboard.</p>
            </div>

            {submitError && <div className="auth-error" role="alert">{submitError}</div>}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="su-goal">Primary goal</label>
                <select
                  id="su-goal"
                  className="auth-input"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}>
                  <option value="">Select a goal…</option>
                  {GOALS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="su-hours">Weekly study target (hours)</label>
                <input
                  id="su-hours"
                  className="auth-input"
                  type="number"
                  min="1"
                  max="168"
                  placeholder="e.g. 10"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className={`auth-submit-btn${submitLoading ? " auth-submit-btn--loading" : ""}`}
                disabled={submitLoading}>
                {submitLoading
                  ? <><span className="auth-spinner" /> Creating account…</>
                  : "Create account"}
              </button>
            </form>

            <button className="auth-switch__link" onClick={() => setStep(1)}>← Back</button>
          </>
        )}
      </AuthRightPanel>
    </div>
  );
}
