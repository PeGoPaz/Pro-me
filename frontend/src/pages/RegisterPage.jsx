import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/index.js";

function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("customer");
  /* Only asked for when signing up as a provider. Driving instructors are the
     launch vertical; "other" is the fallback for every other business. */
  const [providerType, setProviderType] = useState("driving_instructor");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");

    /* Client-side validation */
    const nextErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = "Name must be at least 2 characters.";
    if (!form.email.includes("@")) nextErrors.email = "Enter a valid email address.";
    if (form.password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setLoading(true);
      /* Map frontend role names to backend role values */
      const backendRole = role === "provider" ? "enterprise" : "user";
      await api.post("/auth/register", {
        name: form.name.trim(),
        email: form.email,
        password: form.password,
        role: backendRole,
        ...(backendRole === "enterprise" ? { providerType } : {}),
      });
      /* Registration successful — go to login */
      navigate("/login");
    } catch (err) {
      const msg = err?.response?.data?.message || "Registration failed. Please try again.";
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

      <h1 className="auth-heading">Create Account</h1>
      <p className="auth-subheading">Sign up to get started</p>

      <div className={`auth-card ${role === "provider" ? "auth-card-provider" : ""}`}>
        <div className="role-toggle" role="group" aria-label="Account type">
          <button
            type="button"
            className={`role-btn ${role === "customer" ? "role-btn-active" : ""}`}
            onClick={() => setRole("customer")}
          >
            Customer
          </button>
          <button
            type="button"
            className={`role-btn ${role === "provider" ? "role-btn-active" : ""}`}
            onClick={() => setRole("provider")}
          >
            Service Provider
          </button>
        </div>

        {role === "provider" && (
          <div className="provider-type-choice" role="group" aria-label="Provider type">
            <p className="provider-type-label">What do you do?</p>
            <button
              type="button"
              className={`provider-type-btn ${providerType === "driving_instructor" ? "provider-type-btn-active" : ""}`}
              onClick={() => setProviderType("driving_instructor")}
              aria-pressed={providerType === "driving_instructor"}
            >
              Driving Instructor
            </button>
            <button
              type="button"
              className={`provider-type-btn ${providerType === "other" ? "provider-type-btn-active" : ""}`}
              onClick={() => setProviderType("other")}
              aria-pressed={providerType === "other"}
            >
              Other business
            </button>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {serverError && (
            <div className="auth-server-error" role="alert">{serverError}</div>
          )}

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-name">Full name</label>
            <input
              id="reg-name"
              name="name"
              type="text"
              placeholder="John Smith"
              value={form.name}
              onChange={handleChange}
              className="auth-input"
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && <span id="name-error" className="error" role="alert">{errors.name}</span>}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              className="auth-input"
              aria-describedby={errors.email ? "reg-email-error" : undefined}
            />
            {errors.email && <span id="reg-email-error" className="error" role="alert">{errors.email}</span>}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className="auth-input"
              aria-describedby={errors.password ? "reg-password-error" : undefined}
            />
            {errors.password && <span id="reg-password-error" className="error" role="alert">{errors.password}</span>}
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{" "}
          <Link to="/login" className="auth-footer-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
