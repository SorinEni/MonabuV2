import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import App from "@pages/public/App";
import LoginPage from "@pages/auth/LoginPage";
import SignupPage from "@pages/auth/SignupPage";
import VerifyEmailPage from "@pages/auth/VerifyEmailPage";
import Pricing from "@pages/public/Pricing";
import Features from "@pages/public/Features";
import Methodology from "@pages/public/Methodology";
import TrackerPage from "@pages/app/TrackerPage";
import AnalyticsPage from "@pages/app/AnalyticsPage";
import AdminPage from "@pages/admin/AdminPage";
import TagsPage from "@pages/app/TagsPage";
import LeaderboardPage from "@pages/app/LeaderboardPage";
import SessionsPage from "@pages/app/SessionsPage";
import ForgotPasswordPage from "@pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@pages/auth/ResetPasswordPage";
import SettingsPage from "@pages/app/SettingsPage";
import ContactPage from "@pages/app/ContactPage";
import DonatePage from "@pages/app/DonatePage";

import "@styles/globals.css";

const BASE = import.meta.env.VITE_API_URL || "/api";

//   Auth helpers
function isLoggedIn() {
  return Boolean(localStorage.getItem("token"));
}

function getStoredUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

// Refreshes /auth/me on app start so planLimits / planFeatures stay in sync
// after backend changes. Silently fails on network errors.
function AuthRefresh() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.ok) {
          const { user } = await res.json();
          if (user) {
            localStorage.setItem("user", JSON.stringify(user));
            window.dispatchEvent(new CustomEvent("userUpdated", { detail: user }));
          }
        }
      })
      .catch(() => {});
  }, []);
  return null;
}

//   Route guards
function PublicRoute({ children }) {
  return isLoggedIn() ? <Navigate to="/tracker" replace /> : children;
}

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  const user = getStoredUser();
  if (!user?.isAdmin && !user?.isDeveloper) {
    return <Navigate to="/tracker" replace />;
  }
  return children;
}

//  Google OAuth callback
function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function exchange() {
      try {
        const tokenRes = await fetch(`${BASE}/auth/google/token`, {
          credentials: "include",
        });
        if (!tokenRes.ok) throw new Error("Token exchange failed");
        const { token } = await tokenRes.json();

        localStorage.setItem("token", token);

        const meRes = await fetch(`${BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meRes.ok) throw new Error("Failed to fetch user");
        const { user } = await meRes.json();

        localStorage.setItem("user", JSON.stringify(user));
        navigate("/tracker", { replace: true });
      } catch {
        navigate("/login?error=failed", { replace: true });
      }
    }
    exchange();
  }, [navigate]);

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif", opacity: 0.5 }}>
      Signing you in…
    </div>
  );
}

//  Router
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthRefresh />
      <Routes>
        {/* Public */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <App />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          }
        />
        <Route
          path="/pricing"
          element={
            <PublicRoute>
              <Pricing />
            </PublicRoute>
          }
        />
        <Route
          path="/features"
          element={
            <PublicRoute>
              <Features />
            </PublicRoute>
          }
        />
        <Route
          path="/methodology"
          element={
            <PublicRoute>
              <Methodology />
            </PublicRoute>
          }
        />

        {/* OAuth callback */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Email verification */}
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* App */}
        <Route
          path="/tracker"
          element={
            <PrivateRoute>
              <TrackerPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <PrivateRoute>
              <AnalyticsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <PrivateRoute>
              <LeaderboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/sessions"
          element={
            <PrivateRoute>
              <SessionsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tags"
          element={
            <PrivateRoute>
              <TagsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/contact"
          element={
            <PrivateRoute>
              <ContactPage />
            </PrivateRoute>
          }
        />

        {/* Admin — guarded by role */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="/donate"
          element={
            <AdminRoute>
              <DonatePage />
            </AdminRoute>
          }
        />
        <Route
          path="*"
          element={<Navigate to={isLoggedIn() ? "/tracker" : "/"} replace />}
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
