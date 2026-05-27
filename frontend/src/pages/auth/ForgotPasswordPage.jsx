// Forgot password page.
// Refactored: AuthLeftPanel/AuthRightPanel replace duplicated branding panel.

import { useState } from "react";
import { api } from "@api/api";
import { AuthLeftPanel, AuthRightPanel } from "@components/auth/AuthPanel";
import "@styles/Auth.css";

const QUOTE = {
  text: "The secret of getting ahead is getting started.",
  attr: "— Mark Twain",
};

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [status, setStatus]   = useState("idle"); // idle | loading | sent | error
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMsg("Please enter your email address.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      await api.post("/auth/forgot-password", { email: trimmed });
      setStatus("sent");
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="auth-root">
        <AuthLeftPanel quote={QUOTE} />
        <AuthRightPanel>
          <div className="auth-confirm">
            <div className="auth-confirm__icon" aria-hidden="true">✉️</div>
            <h1 className="auth-heading">Check your inbox</h1>
            <p className="auth-subheading">
              If an account exists for <strong>{email.trim()}</strong>, we've sent a
              password reset link. It expires in <strong>15 minutes</strong>.
            </p>
            <div className="auth-confirm__divider" />
            <p className="auth-confirm__hint">
              Didn't get it? Check your spam folder or{" "}
              <button
                className="auth-resend-btn auth-resend-btn--inline"
                onClick={() => setStatus("idle")}>
                try a different email
              </button>
              .
            </p>
            <p className="auth-switch" style={{ marginTop: "2rem" }}>
              <a href="/login" className="auth-switch__link">← Back to sign in</a>
            </p>
          </div>
        </AuthRightPanel>
      </div>
    );
  }

  return (
    <div className="auth-root">
      <AuthLeftPanel quote={QUOTE} />

      <AuthRightPanel>
        <div className="auth-form-header">
          <div className="auth-panel__image-container">
            <img src="forgot.gif" alt="" className="auth-panel__gif" />
          </div>
          <h1 className="auth-heading">Forgot your password?</h1>
          <p className="auth-subheading">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {status === "error" && errorMsg && (
          <div className="auth-error" role="alert">{errorMsg}</div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="fp-email">Email</label>
            <input
              id="fp-email"
              className={`auth-input${status === "error" ? " auth-input--error" : ""}`}
              type="email"
              placeholder="you@example.com"
              value={email}
              autoComplete="email"
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              disabled={status === "loading"}
              required
            />
          </div>

          <button
            type="submit"
            className={`auth-submit-btn${status === "loading" ? " auth-submit-btn--loading" : ""}`}
            disabled={status === "loading"}>
            {status === "loading"
              ? <><span className="auth-spinner" /> Sending…</>
              : "Send reset link"}
          </button>
        </form>

        <p className="auth-switch">
          <a href="/login" className="auth-switch__link">← Back to sign in</a>
        </p>
      </AuthRightPanel>
    </div>
  );
}
