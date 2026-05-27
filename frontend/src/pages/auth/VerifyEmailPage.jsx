// Email verification page — handles the token from the verification email link.
// Renamed from VerifyEmail.jsx to VerifyEmailPage.jsx for consistency.

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api, saveAuth } from "@api/api";
import "@styles/Auth.css";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus]     = useState("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token found in the link.");
      return;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    api
      .get(`/auth/verify-email?token=${token}`)
      .then((data) => {
        saveAuth(data);
        setStatus("success");
        setTimeout(() => navigate("/tracker", { replace: true }), 2000);
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err.message || "Verification link is invalid or has expired.");
      });
  }, []);

  if (status === "verifying") {
    return (
      <div className="auth-root">
        <div className="auth-verify-state">
          <div className="auth-verify-spinner" />
          <p className="auth-subheading">Verifying your email…</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="auth-root">
        <div className="auth-verify-state">
          <div className="auth-confirm__icon">✅</div>
          <h1 className="auth-heading">Email verified!</h1>
          <p className="auth-subheading">Taking you to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-root">
      <div className="auth-verify-state">
        <div className="auth-confirm__icon">✉️</div>
        <h1 className="auth-heading">Verification failed</h1>
        <p className="auth-verify-error">{errorMsg}</p>
        <a href="/signup" className="auth-verify-back">← Back to sign up</a>
      </div>
    </div>
  );
}
