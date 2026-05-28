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
  const [usernameCheck, setUsernameCheck] = useState({
    status: "idle",
    msg: "",
  });

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
        setEmailCheck({
          status: "invalid",
          msg: err.message || "Invalid email",
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email]);

  // Silent debounced username availability check
  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameCheck({ status: "idle", msg: "" });
      return;
    }
    setUsernameCheck({ status: "checking", msg: "Checking username…" });
    const timer = setTimeout(async () => {
      try {
        await api.post("/auth/validate-username", { username: trimmed });
        setUsernameCheck({ status: "valid", msg: "Username available" });
      } catch (err) {
        setUsernameCheck({
          status: "invalid",
          msg: err.message || "Username already taken",
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  async function handleAccountNext(e) {
    e.preventDefault();
    setAccountError("");
    if (!email || !password) {
      setAccountError("Email and password are required.");
      return;
    }
    if (password.length < 8) {
      setAccountError("Password must be at least 8 characters.");
      return;
    }
    if (emailCheck.status === "valid") {
      setStep(1);
      return;
    }
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
    if (!username.trim()) {
      setUsernameError("Username is required.");
      return;
    }
    if (usernameCheck.status === "invalid") {
      setUsernameError(usernameCheck.msg);
      return;
    }
    if (usernameCheck.status === "checking") {
      setUsernameError("Please wait while we check your username.");
      return;
    }
    if (usernameCheck.status === "idle") {
      try {
        await api.post("/auth/validate-username", {
          username: username.trim(),
        });
      } catch (err) {
        const msg = err.message || "Username already taken";
        setUsernameError(msg);
        setUsernameCheck({ status: "invalid", msg });
        return;
      }
    }
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
    usernameCheck,
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
