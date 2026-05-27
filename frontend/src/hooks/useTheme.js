// Centralises theme state so pages don't each manage their own useState + useEffect.
// Previously every authenticated page duplicated: useState(getTheme()),
// useEffect initTheme, and a handleThemeToggle closure.

import { useState, useEffect } from "react";
import { getTheme, toggleTheme, initTheme } from "@utils/theme";

/**
 * Returns [theme, handleThemeToggle].
 * userThemePreference — optional server value for first-render hydration.
 */
export function useTheme(userThemePreference) {
  const [theme, setTheme] = useState(() => {
    initTheme(userThemePreference);
    return getTheme();
  });

  // Re-apply when the preference prop changes (e.g. after user data loads).
  useEffect(() => {
    if (userThemePreference) {
      initTheme(userThemePreference);
      setTheme(getTheme());
    }
  }, [userThemePreference]);

  function handleThemeToggle() {
    toggleTheme();
    setTheme(getTheme());
  }

  return [theme, handleThemeToggle];
}
