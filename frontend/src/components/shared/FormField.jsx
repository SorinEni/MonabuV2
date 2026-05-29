/**
 * FormField — Consistent label + input + error wrapper.
 *
 *   <FormField label="Email" htmlFor="email" error={emailErr}>
 *     <input id="email" className="form-input" ... />
 *   </FormField>
 */
export default function FormField({
  label,
  htmlFor,
  hint,
  error,
  success,
  className = "",
  children,
}) {
  return (
    <div className={`form-field ${className}`.trim()}>
      {label && (
        <label className="form-field__label" htmlFor={htmlFor}>
          {label}
          {hint && <span className="form-field__hint"> {hint}</span>}
        </label>
      )}
      {children}
      {error && <p className="form-field__error">{error}</p>}
      {success && <p className="form-field__ok">{success}</p>}
    </div>
  );
}
