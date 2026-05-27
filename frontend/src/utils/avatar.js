// Resolves an avatar value (relative path or full OAuth URL) to an absolute URL.
// Previously duplicated in Sidebar.jsx and Admin.jsx.
// compressImage added here (was in @components/settings/utils/avatarUtils.js)
// so useProfileSettings can import both from one place.

const API_ORIGIN = (() => {
  const base = import.meta.env.VITE_API_URL || "";
  if (!base || base.startsWith("/")) return window.location.origin;
  try {
    return new URL(base).origin;
  } catch {
    return window.location.origin;
  }
})();

export function resolveAvatarUrl(avatar) {
  if (!avatar) return null;
  if (avatar.startsWith("http") || avatar.startsWith("blob:")) return avatar;
  return `${API_ORIGIN}${avatar}`;
}

/** ISO country code (2-letter) to emoji flag. */
export function getCountryFlag(code) {
  if (!code || code.length !== 2) return null;
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  return [...upper]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

export function getUserInitials(user) {
  return (user?.name || user?.username || user?.email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Resize and JPEG-compress an image File to at most maxPx on the longest side.
export function compressImage(file, maxPx = 256, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
        "image/jpeg",
        quality,
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}
