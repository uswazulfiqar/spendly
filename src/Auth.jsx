import { useState } from "react";
import {
  CircleDollarSign,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
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

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setError("");
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

      // If user has no workspace, create a default one
      if (!workspaces.length) {
        const createResponse = await fetch(WORKSPACE_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: `${user.name}'s Workspace`,
          }),
        });

        if (!createResponse.ok) {
          throw new Error("Could not create workspace");
        }

        const newWorkspace = await createResponse.json();
        workspaces = [newWorkspace];
      }

      // Use the first workspace for now
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
      console.error("Workspace setup error:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "login" ? "/login" : "/register";

      const response = await fetch(`${AUTH_API}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Something went wrong"
        );
      }

      localStorage.setItem("spendlyToken", data.token);

      localStorage.setItem(
        "spendlyUser",
        JSON.stringify(data.user)
      );

      // Setup/load user's workspace
      await setupWorkspace(data.token, data.user);

      onLogin(data.user);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");

    setForm({
      name: "",
      email: "",
      password: "",
    });

    setShowPassword(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <CircleDollarSign size={25} />
          </div>

          <div>
            <strong>Spendly</strong>
            <span>PERSONAL FINANCE</span>
          </div>
        </div>

        <div className="auth-heading">
          <p className="eyebrow">
            {mode === "login"
              ? "WELCOME BACK"
              : "GET STARTED"}
          </p>

          <h1>
            {mode === "login"
              ? "Welcome back."
              : "Create your account."}
          </h1>

          <p>
            {mode === "login"
              ? "Sign in to continue managing your finances."
              : "Start organizing your finances with Spendly."}
          </p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <label>
              Full name

              <input
                type="text"
                name="name"
                placeholder="e.g. Uswa Zulfiqar"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>
          )}

          <label>
            Email address

            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Password

            <div className="password-input">
              <input
                type={
                  showPassword ? "text" : "password"
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
                  setShowPassword(!showPassword)
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

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? (
              "Please wait..."
            ) : mode === "login" ? (
              <>
                <LogIn size={18} />
                Sign in
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Create account
              </>
            )}
          </button>
        </form>

        <div className="auth-switch">
          <span>
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
          </span>

          <button
            type="button"
            onClick={switchMode}
          >
            {mode === "login"
              ? "Create account"
              : "Sign in"}
          </button>
        </div>
      </div>

      <div className="auth-footer">
        <span>Spendly</span>
        <span>•</span>
        <span>Track. Understand. Grow.</span>
      </div>
    </div>
  );
}

export default Auth;