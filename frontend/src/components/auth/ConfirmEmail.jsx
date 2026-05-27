// Email confirmation screen shown after signup.
// Extracted from Signup.jsx where it was an inline private component.

import { useState } from "react";
import { api } from "@api/api";
import { AuthLeftPanel, AuthRightPanel } from "@components/auth/AuthPanel";

export default function ConfirmEmail({ email }) {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  async function handleResend() {
    setStatus("sending");
    setError("");
    try {
      await api.post("/auth/resend-verification", { email });
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="auth-root">
      <AuthLeftPanel />
      <AuthRightPanel>
        <div className="auth-confirm">
          <div className="auth-confirm__icon" aria-hidden="true">✉️</div>
          <h1 className="auth-heading">Check your inbox</h1>
          <p className="auth-subheading">
            We sent a confirmation link to <strong>{email}</strong>. Click it
            to activate your account.
          </p>
          <div className="auth-confirm__divider" />
          {status === "sent" ? (
            <p className="auth-confirm__hint">Email sent!</p>
          ) : (
            <p className="auth-confirm__hint">
              Didn't get it?{" "}
              <button
                className="auth-resend-btn auth-resend-btn--inline"
                disabled={status === "sending"}
                onClick={handleResend}>
                {status === "sending" ? "Sending…" : "Resend email"}
              </button>
            </p>
          )}
          {status === "error" && error && (
            <div className="auth-error" role="alert">{error}</div>
          )}
        </div>
      </AuthRightPanel>
    </div>
  );
}
