// Multi-step progress indicator for the signup flow.
// Extracted from Signup.jsx — could be reused in any multi-step form.

import { SignupCheckIcon } from "@components/shared/Icons";

/**
 * Props:
 *   steps    string[]   Step labels
 *   current  number     Zero-based index of the active step
 */
export default function StepDots({ steps, current }) {
  return (
    <div className="auth-steps">
      {steps.map((label, i) => (
        <div
          key={label}
          className={[
            "auth-step",
            i === current ? "auth-step--active" : "",
            i < current ? "auth-step--done" : "",
          ]
            .filter(Boolean)
            .join(" ")}>
          <div className="auth-step__dot">
            {i < current ? <SignupCheckIcon /> : <span>{i + 1}</span>}
          </div>
          <span className="auth-step__label">{label}</span>
        </div>
      ))}
    </div>
  );
}
