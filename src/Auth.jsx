import { useEffect, useState } from "react";
import {
  CircleDollarSign,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ArrowUpRight,
  ArrowLeft,
  Mail,
  KeyRound,
  Sparkles,
  ShieldCheck,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

const AUTH_API = "http://localhost:5000/api/auth";
const WORKSPACE_API = "http://localhost:5000/api/workspaces";

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [resetToken, setResetToken] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetLink, setResetLink] = useState("");

  // Detect reset link:
  // http://localhost:5173/?resetToken=xxxxx
  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const token = params.get("resetToken");

    if (token) {
      setResetToken(token);
      setMode("reset");

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setError("");
    setSuccess("");
  };

  const setupWorkspace = async (token, user) => {
    try {
      const response = await fetch(WORKSPACE_API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Could not load workspaces");
      }

      let workspaces = await response.json();

      if (!workspaces.length) {
        const createResponse = await fetch(
          WORKSPACE_API,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: `${user.name}'s Workspace`,
            }),
          }
        );

        if (!createResponse.ok) {
          throw new Error("Could not create workspace");
        }

        const newWorkspace =
          await createResponse.json();

        workspaces = [newWorkspace];
      }

      const activeWorkspace = workspaces[0];

      localStorage.setItem(
        "spendlyWorkspaceId",
        activeWorkspace._id
      );

      localStorage.setItem(
        "spendlyWorkspace",
        JSON.stringify(activeWorkspace)
      );

      localStorage.setItem(
        "spendlyWorkspaces",
        JSON.stringify(workspaces)
      );

      return activeWorkspace;
    } catch (error) {
      console.error(
        "Workspace setup error:",
        error
      );

      throw error;
    }
  };

  // LOGIN
  const handleLogin = async () => {
    const response = await fetch(
      `${AUTH_API}/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      }
    );

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "Server returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        data.message || "Login failed."
      );
    }

    if (!data.token || !data.user) {
      throw new Error(
        "Authentication succeeded, but account data was not returned."
      );
    }

    localStorage.setItem(
      "spendlyToken",
      data.token
    );

    localStorage.setItem(
      "spendlyUser",
      JSON.stringify(data.user)
    );

    await setupWorkspace(
      data.token,
      data.user
    );

    onLogin(data.user);
  };

  // REGISTER
  const handleRegister = async () => {
    const response = await fetch(
      `${AUTH_API}/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      }
    );

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "Server returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        data.message || "Registration failed."
      );
    }

    if (!data.token || !data.user) {
      throw new Error(
        "Registration succeeded, but account data was not returned."
      );
    }

    localStorage.setItem(
      "spendlyToken",
      data.token
    );

    localStorage.setItem(
      "spendlyUser",
      JSON.stringify(data.user)
    );

    await setupWorkspace(
      data.token,
      data.user
    );

    onLogin(data.user);
  };

  // FORGOT PASSWORD
  const handleForgotPassword = async () => {
    if (!form.email.trim()) {
      throw new Error(
        "Please enter your email address."
      );
    }

    const response = await fetch(
      `${AUTH_API}/forgot-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email.trim(),
        }),
      }
    );

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "Server returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Could not process password reset."
      );
    }

    setSuccess(
      data.message ||
        "Password reset link generated."
    );

    // Development mode:
    // backend sends resetLink in response
    if (data.resetLink) {
      setResetLink(data.resetLink);
    }
  };

  // RESET PASSWORD
  const handleResetPassword = async () => {
    if (!resetToken) {
      throw new Error(
        "Invalid or missing reset link."
      );
    }

    if (form.password.length < 6) {
      throw new Error(
        "Password must be at least 6 characters."
      );
    }

    const response = await fetch(
      `${AUTH_API}/reset-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: resetToken,
          password: form.password,
        }),
      }
    );

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "Server returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Could not reset password."
      );
    }

    setSuccess(
      "Password reset successfully."
    );

    setResetToken("");
    setResetLink("");

    setForm({
      name: "",
      email: "",
      password: "",
    });

    setTimeout(() => {
      setMode("login");
      setSuccess("");
    }, 1800);
  };

  // FORM SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setResetLink("");
    setLoading(true);

    try {
      if (mode === "login") {
        await handleLogin();
      }

      if (mode === "register") {
        await handleRegister();
      }

      if (mode === "forgot") {
        await handleForgotPassword();
      }

      if (mode === "reset") {
        await handleResetPassword();
      }
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);

    setError("");
    setSuccess("");
    setResetLink("");
    setShowPassword(false);

    if (newMode !== "reset") {
      setResetToken("");
    }

    setForm({
      name: "",
      email: "",
      password: "",
    });
  };

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";

  return (
    <div className="auth-page">
      {/* BACKGROUND */}
      <div className="auth-background">
        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />
        <div className="auth-orb auth-orb-three" />
        <div className="auth-grid" />
      </div>

      <div className="auth-layout">

        {/* LEFT SIDE */}
        <div className="auth-showcase">
          <div className="auth-showcase-content">

            <div className="auth-brand">
              <div className="auth-logo">
                <CircleDollarSign size={24} />
              </div>

              <div>
                <strong>FINANCE</strong>
                <span>PERSONAL OS</span>
              </div>
            </div>

            <div className="auth-showcase-copy">
              <div className="auth-kicker">
                <span />
                SMART MONEY MANAGEMENT
              </div>

              <h2>
                Your money.
                <br />
                <span>Clearly understood.</span>
              </h2>

              <p>
                Keep track of your income, expenses and
                financial activity from one beautifully
                organized workspace.
              </p>
            </div>

            <div className="auth-preview">
              <div className="preview-glow" />

              <div className="preview-top">
                <div>
                  <span>NET BALANCE</span>
                  <strong>PKR 248,500</strong>
                </div>

                <div className="preview-icon">
                  <TrendingMini />
                </div>
              </div>

              <div className="preview-chart">
                <svg
                  viewBox="0 0 500 150"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="authChartFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#8b7cf6"
                        stopOpacity="0.38"
                      />

                      <stop
                        offset="100%"
                        stopColor="#8b7cf6"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>

                  <path
                    d="M0 120 C40 115 55 90 90 98 C125 106 138 70 175 78 C215 88 225 58 260 67 C300 78 320 40 355 52 C390 64 405 25 440 38 C465 47 480 23 500 15 L500 150 L0 150 Z"
                    fill="url(#authChartFill)"
                  />

                  <path
                    d="M0 120 C40 115 55 90 90 98 C125 106 138 70 175 78 C215 88 225 58 260 67 C300 78 320 40 355 52 C390 64 405 25 440 38 C465 47 480 23 500 15"
                    fill="none"
                    stroke="#8b7cf6"
                    strokeWidth="3"
                  />
                </svg>
              </div>

              <div className="preview-bottom">
                <div>
                  <span>
                    <i className="preview-dot purple" />
                    Income
                  </span>

                  <strong>PKR 310k</strong>
                </div>

                <div>
                  <span>
                    <i className="preview-dot pink" />
                    Expenses
                  </span>

                  <strong>PKR 61.5k</strong>
                </div>
              </div>
            </div>

            <div className="auth-features">
              <div>
                <div className="feature-icon">
                  <ShieldCheck size={16} />
                </div>

                <span>Secure account</span>
              </div>

              <div>
                <div className="feature-icon">
                  <BarChart3 size={16} />
                </div>

                <span>Smart analytics</span>
              </div>

              <div>
                <div className="feature-icon">
                  <Sparkles size={16} />
                </div>

                <span>Simple tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="auth-form-area">

          <div className="auth-card">

            <div className="auth-card-top">

              {/* MOBILE BRAND */}
              <div className="mobile-auth-brand">
                <div className="auth-logo">
                  <CircleDollarSign size={23} />
                </div>

                <div>
                  <strong>FINANCE</strong>
                  <span>PERSONAL OS</span>
                </div>
              </div>

              {/* BACK BUTTON */}
              {(isForgot || isReset) && (
                <button
                  type="button"
                  className="auth-back-button"
                  onClick={() =>
                    switchMode("login")
                  }
                >
                  <ArrowLeft size={15} />
                  Back to sign in
                </button>
              )}

              <div className="auth-heading">

                <p className="eyebrow">
                  {isLogin && "WELCOME BACK"}
                  {isRegister && "GET STARTED"}
                  {isForgot && "ACCOUNT RECOVERY"}
                  {isReset && "SECURITY"}
                </p>

                <h1>
                  {isLogin &&
                    "Welcome back."}

                  {isRegister &&
                    "Create your account."}

                  {isForgot &&
                    "Forgot your password?"}

                  {isReset &&
                    "Create a new password."}
                </h1>

                <p>
                  {isLogin &&
                    "Sign in to continue managing your finances."}

                  {isRegister &&
                    "Start organizing your finances from one place."}

                  {isForgot &&
                    "Enter your email and we'll help you reset your password."}

                  {isReset &&
                    "Choose a new password for your account."}
                </p>

              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="auth-error">
                <span className="auth-error-dot" />
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="auth-success">
                <CheckCircle2 size={17} />
                <span>{success}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="auth-form"
            >

              {/* REGISTER NAME */}
              {isRegister && (
                <label>
                  <span>Full name</span>

                  <div className="auth-input-wrap">
                    <input
                      type="text"
                      name="name"
                      placeholder="e.g. Uswa Zulfiqar"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </label>
              )}

              {/* EMAIL */}
              {(isLogin ||
                isRegister ||
                isForgot) && (
                <label>
                  <span>Email address</span>

                  <div className="auth-input-wrap">
                    <Mail size={17} />

                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </label>
              )}

              {/* PASSWORD */}
              {(isLogin ||
                isRegister ||
                isReset) && (
                <label>
                  <span>
                    {isReset
                      ? "New password"
                      : "Password"}
                  </span>

                  <div className="password-input">
                    <LockIcon />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      placeholder="Minimum 6 characters"
                      value={form.password}
                      onChange={handleChange}
                      minLength="6"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </label>
              )}

              {/* FORGOT PASSWORD LINK */}
              {isLogin && (
                <div className="forgot-password-row">
                  <button
                    type="button"
                    onClick={() =>
                      switchMode("forgot")
                    }
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-spinner" />
                    Please wait...
                  </>
                ) : (
                  <>
                    {isLogin && (
                      <>
                        <LogIn size={18} />
                        Sign in
                      </>
                    )}

                    {isRegister && (
                      <>
                        <UserPlus size={18} />
                        Create account
                      </>
                    )}

                    {isForgot && (
                      <>
                        <Mail size={18} />
                        Send reset link
                      </>
                    )}

                    {isReset && (
                      <>
                        <KeyRound size={18} />
                        Reset password
                      </>
                    )}

                    <ArrowUpRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* DEVELOPMENT RESET LINK */}
            {isForgot && resetLink && (
              <div className="reset-link-box">
                <div className="reset-link-heading">
                  <KeyRound size={16} />
                  Password reset link
                </div>

                <p>
                  For local development, your reset
                  link is ready:
                </p>

                <a
                  href={resetLink}
                  className="reset-link-button"
                >
                  Open reset page
                  <ArrowUpRight size={15} />
                </a>

                <small>
                  This development link expires in
                  15 minutes.
                </small>
              </div>
            )}

            {/* DIVIDER */}
            {!isForgot && !isReset && (
              <div className="auth-divider">
                <span />
                <small>OR</small>
                <span />
              </div>
            )}

            {/* LOGIN / REGISTER SWITCH */}
            {isLogin && (
              <div className="auth-switch">
                <span>
                  Don't have an account?
                </span>

                <button
                  type="button"
                  onClick={() =>
                    switchMode("register")
                  }
                >
                  Create account
                </button>
              </div>
            )}

            {isRegister && (
              <div className="auth-switch">
                <span>
                  Already have an account?
                </span>

                <button
                  type="button"
                  onClick={() =>
                    switchMode("login")
                  }
                >
                  Sign in
                </button>
              </div>
            )}

            {isForgot && (
              <div className="auth-switch">
                <span>
                  Remember your password?
                </span>

                <button
                  type="button"
                  onClick={() =>
                    switchMode("login")
                  }
                >
                  Sign in
                </button>
              </div>
            )}

            {isReset && (
              <div className="auth-switch">
                <span>
                  Want to go back?
                </span>

                <button
                  type="button"
                  onClick={() =>
                    switchMode("login")
                  }
                >
                  Sign in
                </button>
              </div>
            )}

            <div className="auth-security">
              <ShieldCheck size={14} />

              <span>
                Your account is protected with
                secure authentication.
              </span>
            </div>

          </div>
        </div>
      </div>

      <div className="auth-footer">
        <span>FINANCE PERSONAL OS</span>
        <span>•</span>
        <span>Track. Understand. Grow.</span>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="10"
        width="16"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 10V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrendingMini() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M4 16L9 11L13 14L20 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M15 6H20V11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Auth;