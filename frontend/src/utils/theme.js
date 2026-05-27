// Manages dark / light theme: localStorage <-> .app-shell class <-> backend sync.
// The light theme is scoped to .app-shell so public marketing pages stay dark.

import { api } from "@api/api";

const KEY = "theme";

export function getTheme() {
  return localStorage.getItem(KEY) || "dark";
}

export function applyTheme(theme) {
  const shell = document.querySelector(".app-shell");
  const target = shell || document.documentElement;
  target.classList.toggle("theme-light", theme === "light");
  if (shell) {
    document.documentElement.classList.remove("theme-light");
  }
}

export function setTheme(theme) {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);

  const token = localStorage.getItem("token");
  if (token) {
    api.patch("/auth/me", { themePreference: theme }).catch(() => {});
  }
}

export function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function initTheme(userThemePreference) {
  const stored = localStorage.getItem(KEY);
  const theme = stored ?? userThemePreference ?? "dark";
  if (!stored) localStorage.setItem(KEY, theme);
  applyTheme(theme);
}
