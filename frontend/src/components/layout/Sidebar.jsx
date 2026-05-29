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
  AdminShieldIcon,
  ContactNavIcon,
  DonateNavIcon,
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
          <span className="sidebar__footer-link-icon"><DonateNavIcon /></span>
          {!collapsed && <span className="sidebar__footer-link-label">Support</span>}
        </Link>
        <Link
          to="/contact"
          className={`sidebar__footer-link${pathname === "/contact" ? " sidebar__footer-link--active" : ""}`}
          title={collapsed ? "Contact" : undefined}>
          <span className="sidebar__footer-link-icon"><ContactNavIcon /></span>
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
