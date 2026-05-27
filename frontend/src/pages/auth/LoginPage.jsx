// Login page.
// Refactored: AuthLeftPanel replaces the duplicated left branding panel.

import { useState } from "react";
import { api, saveAuth } from "@api/api";
import { AuthLeftPanel, AuthRightPanel } from "@components/auth/AuthPanel";
import { GoogleIcon, EyeOpenIcon, EyeClosedIcon } from "@components/shared/Icons";
import "@styles/Auth.css";

const QUOTE = {
  text: "An investment in knowledge pays the best interest.",
  attr: "— Benjamin Franklin",
};

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.post("/auth/login", { email, password });
      saveAuth(data);
      window.location.href = "/tracker";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-root">
      <AuthLeftPanel quote={QUOTE} />

      <AuthRightPanel>
        <div className="auth-form-header">
          <h1 className="auth-heading">Welcome back</h1>
          <p className="auth-subheading">Log in to continue your learning streak.</p>
        </div>

        <button
          className="auth-oauth-btn"
          type="button"
          onClick={() => { window.location.href = "/api/auth/google"; }}>
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="auth-divider"><span>or continue with email</span></div>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <div className="auth-label-row">
              <label className="auth-label" htmlFor="password">Password</label>
              <a href="/forgot-password" className="auth-forgot">Forgot password?</a>
            </div>
            <div className="auth-input-wrap">
              <input
                id="password"
                className="auth-input auth-input--padded"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
            className={`auth-submit-btn${loading ? " auth-submit-btn--loading" : ""}`}
            disabled={loading}>
            {loading ? <><span className="auth-spinner" /> Signing in…</> : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <a href="/signup" className="auth-switch__link">Create one free</a>
        </p>
      </AuthRightPanel>
    </div>
  );
}
