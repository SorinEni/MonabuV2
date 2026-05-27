// Main navigation sidebar for authenticated pages.
// Refactored from the original: avatar logic moved to Avatar component and
// avatar.js util, resolveAvatarUrl no longer duplicated here.

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getUser, clearAuth } from "@api/api";
import Avatar from "@components/shared/Avatar";
import {
  SunIcon,
  MoonIcon,
  TrackerNavIcon,
  AnalyticsNavIcon,
  LeaderboardNavIcon,
  SessionsNavIcon,
  TagsNavIcon,
  SettingsNavIcon,
  CollapseLeftIcon,
  CollapseRightIcon,
  LogoutIcon,
} from "@components/shared/Icons";
import "@styles/Sidebar.css";

// Nav items shared by all authenticated users
const NAV_ITEMS = [
  { to: "/tracker",     label: "Tracker",     icon: <TrackerNavIcon /> },
  { to: "/analytics",   label: "Analytics",   icon: <AnalyticsNavIcon /> },
  { to: "/leaderboard", label: "Leaderboard", icon: <LeaderboardNavIcon /> },
  { to: "/sessions",    label: "Sessions",    icon: <SessionsNavIcon /> },
  { to: "/tags",        label: "Tags",        icon: <TagsNavIcon /> },
  { to: "/settings",    label: "Settings",    icon: <SettingsNavIcon /> },
];

function NavLink({ to, label, icon, collapsed, active }) {
  return (
    <Link
      to={to}
      className={`sidebar__item${active ? " sidebar__item--active" : ""}`}
      title={collapsed ? label : undefined}>
      <span className="sidebar__item-icon">{icon}</span>
      {!collapsed && <span className="sidebar__item-label">{label}</span>}
    </Link>
  );
}

function AdminShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.5L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1.5z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
      />
      <path
        d="M5.5 8l1.5 1.5L10.5 6"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M14 10.667A1.333 1.333 0 0 1 12.667 12H4.667L2 14.667V3.333A1.333 1.333 0 0 1 3.333 2h9.334A1.333 1.333 0 0 1 14 3.333v7.334z"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function DonateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 6.5h11M2.5 6.5C2.5 5.4 3.4 4.5 4.5 4.5h7c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2h-7c-1.1 0-2-.9-2-2v-5z"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M5.5 2.5c0 0 .5 1 1 1.5M8 2c0 0 .5 1.2 0 2M10.5 2.5c0 0-.5 1-1 1.5"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
      />
    </svg>
  );
}

export default function Sidebar({ collapsed, onToggle, theme, onThemeToggle }) {
  const [user, setUser] = useState(getUser);
  const { pathname } = useLocation();

  useEffect(() => {
    const handler = (e) => setUser(e.detail);
    window.addEventListener("userUpdated", handler);
    return () => window.removeEventListener("userUpdated", handler);
  }, []);

  const isLight = theme === "light";
  const hasAdmin = user?.isAdmin || user?.isDeveloper;

  return (
    <aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
      {/* Logo */}
      <div className="sidebar__logo">
        <Link to="/" className="sidebar__logo-mark-wrap">
          <div className="sidebar__logo-mark" />
        </Link>
        {!collapsed && (
          <Link to="/" className="sidebar__logo-text">Monabu</Link>
        )}
        <button
          className="sidebar__collapse-btn"
          onClick={onToggle}
          title={collapsed ? "Expand" : "Collapse"}>
          {collapsed ? <CollapseRightIcon /> : <CollapseLeftIcon />}
        </button>
      </div>

      {/* Main navigation */}
      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            {...item}
            collapsed={collapsed}
            active={pathname === item.to}
          />
        ))}

        <div className="sidebar__divider" />

        {hasAdmin && (
          <Link
            to="/admin"
            className={`sidebar__item${pathname === "/admin" ? " sidebar__item--active" : ""}`}
            style={user?.isDeveloper ? { color: "#fbbf24" } : undefined}
            title={collapsed ? "Admin" : undefined}>
            <span className="sidebar__item-icon"><AdminShieldIcon /></span>
            {!collapsed && <span className="sidebar__item-label">Admin</span>}
          </Link>
        )}
      </nav>

      {/* Footer links */}
      <div className={`sidebar__footer-links${collapsed ? " sidebar__footer-links--collapsed" : ""}`}>
        <Link
          to="/donate"
          className={`sidebar__footer-link${pathname === "/donate" ? " sidebar__footer-link--active" : ""}`}
          title={collapsed ? "Support" : undefined}>
          <span className="sidebar__footer-link-icon"><DonateIcon /></span>
          {!collapsed && <span className="sidebar__footer-link-label">Support</span>}
        </Link>
        <Link
          to="/contact"
          className={`sidebar__footer-link${pathname === "/contact" ? " sidebar__footer-link--active" : ""}`}
          title={collapsed ? "Contact" : undefined}>
          <span className="sidebar__footer-link-icon"><ContactIcon /></span>
          {!collapsed && <span className="sidebar__footer-link-label">Contact</span>}
        </Link>
      </div>

      {/* Bottom: user info, theme toggle, logout */}
      <div className="sidebar__bottom">
        {user && (
          <div className={`sidebar__user${collapsed ? " sidebar__user--collapsed" : ""}`}>
            <Avatar
              user={user}
              size={32}
              className="sidebar__user-avatar"
              style={
                user.isDeveloper && !user.avatar
                  ? { background: "rgba(251,191,36,0.12)", borderColor: "rgba(251,191,36,0.3)", color: "#fbbf24" }
                  : undefined
              }
            />
            {!collapsed && (
              <div className="sidebar__user-info">
                <div className="sidebar__user-name">
                  {user.name || user.username || "User"}
                  {user.isDeveloper && (
                    <span className="role-badge role-badge--dev">DEV</span>
                  )}
                  {!user.isDeveloper && user.isAdmin && (
                    <span className="role-badge role-badge--admin">ADMIN</span>
                  )}
                </div>
                <div className="sidebar__user-email">{user.email}</div>
              </div>
            )}
          </div>
        )}

        <button
          className={`sidebar__theme-toggle${collapsed ? " sidebar__theme-toggle--icon-only" : ""}`}
          title={isLight ? "Switch to dark mode" : "Switch to light mode"}
          onClick={onThemeToggle}>
          <span className="sidebar__theme-toggle-icon">
            {isLight ? <MoonIcon /> : <SunIcon />}
          </span>
          {!collapsed && <span>{isLight ? "Dark mode" : "Light mode"}</span>}
        </button>

        <button
          className={`sidebar__logout${collapsed ? " sidebar__logout--icon-only" : ""}`}
          title="Log out"
          onClick={() => { clearAuth(); window.location.href = "/login"; }}>
          <LogoutIcon />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
