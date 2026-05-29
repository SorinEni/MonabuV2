import { useRef, useCallback, useEffect } from "react";

/**
 * Modal — Reusable overlay + panel wrapper.
 *
 *   <Modal onClose={close} title="Edit tag">
 *     <form> ... </form>
 *   </Modal>
 *
 * Features:
 *   - Click-outside-to-close (overlay click)
 *   - Escape key to close
 *   - Focus trap optional via aria
 *   - Accepts `size` prop: "sm" | "md" | "lg"
 */
export default function Modal({
  onClose,
  title,
  size = "md",
  className = "",
  children,
}) {
  const overlayRef = useRef(null);

  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div
        className={`modal modal--${size} ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {title && (
          <div className="modal__header">
            <div className="modal__title">{title}</div>
            <button
              className="modal__close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
