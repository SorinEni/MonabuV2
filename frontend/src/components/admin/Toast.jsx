import { useEffect } from "react";

export function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className={`admin__toast admin__toast--${type}`}>
      <span className="admin__toast-dot" />
      {message}
    </div>
  );
}
