export function PillToggle({ active, onClick, disabled, children, variant = "default", title }) {
  return (
    <button
      type="button"
      className={`pill-toggle pill-toggle--${variant}${active ? " pill-toggle--active" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}>
      {children}
    </button>
  );
}
