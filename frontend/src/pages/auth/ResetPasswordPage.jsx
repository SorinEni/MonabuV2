// Reset password page.
// Refactored: uses AuthLeftPanel/AuthRightPanel and extracted PasswordStrength component.

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api, saveAuth } from "@api/api";
import { AuthLeftPanel, AuthRightPanel } from "@components/auth/AuthPanel";
import PasswordStrength from "@components/auth/PasswordStrength";
import "@styles/Auth.css";

const QUOTE = {
  text: "The secret of getting ahead is getting started.",
  attr: "— Mark Twain",
};

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [status, setStatus]       = useState("idle"); // idle | loading | success | error | invalid
  const [errorMsg, setErrorMsg]   = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) setStatus("invalid");
  }, [token]);

  function validate() {
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return false;
    }
    if (password !== confirm) {
      setErrorMsg("Passwords don't match.");
      return false;
    }
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!validate()) { setStatus("error"); return; }

    setStatus("loading");
    try {
      const data = await api.post("/auth/reset-password", { token, password });
      saveAuth(data);
      setStatus("success");
      setTimeout(() => navigate("/tracker", { replace: true }), 2200);
    } catch (err) {
      const msg = err.message?.toLowerCase() ?? "";
      if (msg.includes("invalid") || msg.includes("expired") || msg.includes("token")) {
        setStatus("invalid");
      } else {
        setErrorMsg(err.message || "Something went wrong. Please try again.");
        setStatus("error");
      }
    }
  }

  if (status === "invalid") {
    return (
      <div className="auth-root">
        <AuthLeftPanel quote={QUOTE} />
        <AuthRightPanel>
          <div className="auth-verify-state">
            <div className="auth-confirm__icon">⏱️</div>
            <h1 className="auth-heading">Link expired</h1>
            <p className="auth-subheading">
              This reset link is invalid or has expired. Reset links are only valid for{" "}
              <strong>15 minutes</strong>.
            </p>
            <a href="/forgot-password" className="auth-verify-back">← Request a new link</a>
          </div>
        </AuthRightPanel>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="auth-root">
        <AuthLeftPanel quote={QUOTE} />
        <AuthRightPanel>
          <div className="auth-verify-state">
            <div className="auth-confirm__icon">✅</div>
            <h1 className="auth-heading">Password updated!</h1>
            <p className="auth-subheading">Taking you to your dashboard…</p>
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
          <h1 className="auth-heading">Set a new password</h1>
          <p className="auth-subheading">
            Choose something strong — at least 12 chars, a capital, a number, and a symbol.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="rp-password">New password</label>
            <div className="auth-input-wrap">
              <input
                id="rp-password"
                className="auth-input auth-input--padded"
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                disabled={status === "loading"}
              />
              <button
                type="button"
                className="auth-toggle-pass"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Hide password" : "Show password"}>
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="rp-confirm">Confirm new password</label>
            <input
              id="rp-confirm"
              className={`auth-input${status === "error" && errorMsg.includes("match") ? " auth-input--error" : ""}`}
              type={showPass ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat your new password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              disabled={status === "loading"}
            />
            {status === "error" && errorMsg && (
              <p className="auth-field-error">{errorMsg}</p>
            )}
          </div>

          <button
            type="submit"
            className={`auth-submit-btn${status === "loading" ? " auth-submit-btn--loading" : ""}`}
            disabled={status === "loading"}>
            {status === "loading"
              ? <><span className="auth-spinner" /> Updating…</>
              : "Reset password"}
          </button>
        </form>

        <p className="auth-switch">
          <a href="/forgot-password" className="auth-switch__link">Request a new link</a>
        </p>
      </AuthRightPanel>
    </div>
  );
}
