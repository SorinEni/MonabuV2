import { useState } from "react";
import { resolveAvatarUrl, getUserInitials } from "@utils/avatar";

export function Avatar({ entry, size = "row", borderColor, className = "" }) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = resolveAvatarUrl(entry.avatar);
  const sizeClass = size === "podium" ? "lb-podium__avatar" : "lb-row__avatar";

  if (src && !imgFailed) {
    return (
      <img
        className={`${sizeClass} ${sizeClass}--img ${className}`}
        src={src}
        alt={entry.name || entry.username || "User"}
        style={borderColor ? { borderColor } : {}}
        onError={() => setImgFailed(true)}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} ${className}`}
      style={borderColor ? { borderColor } : {}}>
      {getUserInitials(entry)}
    </div>
  );
}
