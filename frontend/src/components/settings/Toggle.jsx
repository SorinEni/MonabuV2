export default function Toggle({ checked, onChange, id, disabled = false }) {
  return (
    <label className="settings-toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="settings-toggle__track" />
    </label>
  );
}
