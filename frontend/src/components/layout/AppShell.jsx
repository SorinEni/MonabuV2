// Wraps every authenticated page with the app-shell div and Sidebar.
// Previously every page (Settings, Contact, Donate, Analytics, etc.) repeated
// this identical structure. Import AppShell instead.

import { useState } from "react";
import Sidebar from "@components/layout/Sidebar";
import { useTheme } from "@hooks/useTheme";
import { getUser } from "@api/api";

/**
 * Props:
 *   children             ReactNode   Page content
 *   userThemePreference  string      Optional — seeds theme on first login
 *   className            string      Extra class on the <main> element
 */
export default function AppShell({ children, userThemePreference, className = "" }) {
  const user = getUser();
  const [theme, handleThemeToggle] = useTheme(userThemePreference ?? user?.themePreference);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        theme={theme}
        onThemeToggle={handleThemeToggle}
      />
      <main className={`app-main ${className}`.trim()}>
        {children}
      </main>
    </div>
  );
}
