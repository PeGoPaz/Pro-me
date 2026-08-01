import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");

    /* Client-side validation */
    const nextErrors = {};
    if (!form.email.includes("@")) nextErrors.email = "Enter a valid email address.";
    if (form.password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setLoading(true);
      const user = await login(form.email, form.password);
      /* Route based on role returned from the API */
      if (user.role === "enterprise") {
        navigate("/dashboard/provider");
      } else {
        navigate("/dashboard/customer");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Invalid email or password.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-brand">
        <svg className="auth-brand-icon" width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="3" stroke="#1e4bdd" strokeWidth="2" />
          <line x1="3" y1="9" x2="21" y2="9" stroke="#1e4bdd" strokeWidth="2" />
          <line x1="8" y1="2" x2="8" y2="6" stroke="#1e4bdd" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="2" x2="16" y2="6" stroke="#1e4bdd" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="auth-brand-name">Pro.me</span>
      </Link>

      <h1 className="auth-heading">Welcome</h1>
      <p className="auth-subheading">Sign in to your account to continue</p>

      <div className="auth-card">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Server-level error */}
          {serverError && (
            <div className="auth-server-error" role="alert">{serverError}</div>
          )}

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              className="auth-input"
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && <span id="email-error" className="error" role="alert">{errors.email}</span>}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className="auth-input"
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && <span id="password-error" className="error" role="alert">{errors.password}</span>}
          </div>

          <label className="auth-remember">
            <input name="remember" type="checkbox" checked={form.remember} onChange={handleChange} />
            Remember me
          </label>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="auth-footer-text">
          Don't have an account?{" "}
          <Link to="/register" className="auth-footer-link">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
