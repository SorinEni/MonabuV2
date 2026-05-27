// Renders a user avatar: image when available, initials as fallback.
// Extracted from Sidebar.jsx and Admin.jsx where it was duplicated.

import { useState } from "react";
import { resolveAvatarUrl, getUserInitials } from "@utils/avatar";

/**
 * Props:
 *   user       object   User object with .avatar, .name, .username, .email
 *   size       number   Width/height in px (default 32)
 *   className  string   Additional class names
 *   style      object   Additional inline styles
 */
export default function Avatar({ user, size = 32, className = "", style = {} }) {
  const src = resolveAvatarUrl(user?.avatar);
  const initials = getUserInitials(user);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      className={`avatar ${className}`}
      style={{ width: size, height: size, ...style }}>
      {src && !imgFailed ? (
        <img
          src={src}
          alt={user?.name || user?.username || "Avatar"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "inherit",
            display: "block",
          }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}
