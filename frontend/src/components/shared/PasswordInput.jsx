import { useState } from "react";

/**
 * PasswordInput — A text input with built-in show/hide toggle.
 *
 * Props:
 *   - id, value, onChange, placeholder, autoComplete — forwarded to <input>
 *   - className — extra classes for the outer wrapper
 *   - inputClassName — extra classes for the <input> element
 *   - label — optional rendered text (defaults to "Show"/"Hide")
 *   - showIcons — if true, renders children for open/closed state
 *                 instead of text.  Pass two elements:
 *                 <PasswordInput showIcons>
 *                   <EyeOpenIcon />
 *                   <EyeClosedIcon />
 *                 </PasswordInput>
 */
export default function PasswordInput({
  id,
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete,
  className = "",
  inputClassName = "",
  showIcons,
  children,
  ...rest
}) {
  const [visible, setVisible] = useState(false);

  // If showIcons is true, expect exactly two children: [OpenIcon, ClosedIcon]
  const iconChildren = showIcons && Array.isArray(children) ? children : null;

  return (
    <div className={`pw-input-wrap ${className}`.trim()}>
      <input
        id={id}
        className={`pw-input-field ${inputClassName}`.trim()}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        {...rest}
      />
      <button
        type="button"
        className="pw-input-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {iconChildren
          ? visible
            ? iconChildren[1]
            : iconChildren[0]
          : visible
            ? "Hide"
            : "Show"}
      </button>
    </div>
  );
}
