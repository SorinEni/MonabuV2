import { useState, useEffect } from "react";
import { api } from "@api/api";

const STEPS = ["Account", "Profile", "Goals"];

export function useSignup() {
  const [step, setStep] = useState(0);
  const [confirmedEmail, setConfirmedEmail] = useState(null);

  // Step 0 — Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [accountLoading, setAccountLoading] = useState(false);
  const [emailCheck, setEmailCheck] = useState({ status: "idle", msg: "" });

  // Step 1 — Profile
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");

  // Step 2 — Goals
  const [goal, setGoal] = useState("");
  const [weeklyHours, setWeeklyHours] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Silent debounced email validation
  useEffect(() => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailCheck({ status: "idle", msg: "" });
      return;
    }
    setEmailCheck({ status: "checking", msg: "Checking email…" });
    const timer = setTimeout(async () => {
      try {
        await api.post("/auth/validate-email", { email });
        setEmailCheck({ status: "valid", msg: "Email available" });
      } catch (err) {
        setEmailCheck({ status: "invalid", msg: err.message || "Invalid email" });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email]);

  async function handleAccountNext(e) {
    e.preventDefault();
    setAccountError("");
    if (!email || !password) { setAccountError("Email and password are required."); return; }
    if (password.length < 8) { setAccountError("Password must be at least 8 characters."); return; }
    if (emailCheck.status === "valid") { setStep(1); return; }
    setAccountLoading(true);
    try {
      await api.post("/auth/validate-email", { email });
      setStep(1);
    } catch (err) {
      setAccountError(err.message || "This email is already registered.");
    } finally {
      setAccountLoading(false);
    }
  }

  async function handleProfileNext(e) {
    e.preventDefault();
    setUsernameError("");
    if (!username.trim()) { setUsernameError("Username is required."); return; }
    setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    setSubmitLoading(true);
    try {
      await api.post("/auth/register", {
        email,
        password,
        name: name.trim(),
        username: username.trim(),
        primaryGoal: goal,
        weeklyHourGoal: weeklyHours ? Number(weeklyHours) : undefined,
      });
      setConfirmedEmail(email);
    } catch (err) {
      setSubmitError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  }

  return {
    step,
    setStep,
    confirmedEmail,
    // Account
    email,
    setEmail,
    password,
    setPassword,
    showPass,
    setShowPass,
    accountError,
    accountLoading,
    emailCheck,
    handleAccountNext,
    // Profile
    name,
    setName,
    username,
    setUsername,
    usernameError,
    setUsernameError,
    handleProfileNext,
    // Goals
    goal,
    setGoal,
    weeklyHours,
    setWeeklyHours,
    submitLoading,
    submitError,
    handleSubmit,
  };
}
