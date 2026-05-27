// Base URL — reads from Vite env or falls back to localhost
const BASE = import.meta.env.VITE_API_URL || "/api";

async function request(method, path, body) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // No `credentials: "include"` — we use JWT in the Authorization header,
    // not cookies. Including credentials is unnecessary and causes CORS failures.
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  // Forced logout: deactivated account or tokenVersion bump from server side.
  // Redirect immediately so the user doesn't linger in a broken state.
  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login";
    return;
  }

  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

export const api = {
  post: (path, body) => request("POST", path, body),
  get: (path) => request("GET", path),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};

// Auth helpers
export function saveAuth({ token, user }) {
  if (token) localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new CustomEvent("userUpdated", { detail: user }));
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

// Merge updated fields into the stored user without touching the token.
// Also fires a "userUpdated" event so any mounted component can re-read.
export function updateStoredUser(updatedUser) {
  const current = getUser() || {};
  const merged = { ...current, ...updatedUser };
  localStorage.setItem("user", JSON.stringify(merged));
  window.dispatchEvent(new CustomEvent("userUpdated", { detail: merged }));
}
