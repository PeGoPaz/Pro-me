import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/index.js";

/* Min datetime string for the date-picker (today) */
function todayMin() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function BookingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const serviceId = searchParams.get("service");
  const [service, setService] = useState(null);
  const [serviceLoading, setServiceLoading] = useState(true);

  const [form, setForm] = useState({
    bookingDate: "",
    desiredPrice: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /* Redirect if not a logged-in customer */
  useEffect(() => {
    if (user && user.role !== "user") navigate("/");
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    if (!serviceId) {
      setServiceLoading(false);
      return;
    }

    let ignore = false;
    setServiceLoading(true);

    api.get(`/enterprise/services/public/${serviceId}`)
      .then((res) => {
        if (ignore) return;
        const fetched = res.data;
        setService({
          id: fetched._id,
          name: fetched.subject,
          author: fetched.userId?.name ?? "Service Provider",
          category: fetched.category ?? "Other",
          price: fetched.price,
        });
      })
      .catch(() => {
        if (!ignore) setService(null);
      })
      .finally(() => {
        if (!ignore) setServiceLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [serviceId]);

  useEffect(() => {
    if (!service) return;
    setForm((prev) => ({
      ...prev,
      desiredPrice: prev.desiredPrice || String(service.price),
    }));
  }, [service]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const nextErrors = {};
    if (!form.bookingDate) nextErrors.bookingDate = "Please choose a date and time.";
    if (!form.desiredPrice || Number(form.desiredPrice) <= 0)
      nextErrors.desiredPrice = "Enter a valid price.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    /* Build notes — prepend desired price so provider can see it */
    const combinedNotes = [
      `Desired price: €${form.desiredPrice}`,
      form.notes.trim() ? form.notes.trim() : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      setLoading(true);
      await api.post("/booking", {
        enterpriseId: service.id,
        bookingDate: form.bookingDate,
        notes: combinedNotes,
      });
      setSuccess(true);
    } catch (err) {
      setServerError(err?.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Success state ────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="booking-page">
        <div className="booking-success">
          <div className="booking-success-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="#1a8a5a" strokeWidth="2" />
              <path d="M7 12l4 4 6-6" stroke="#1a8a5a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="booking-success-title">Booking Request Sent!</h2>
          <p className="booking-success-sub">
            Your request for <strong>{service?.name}</strong> has been sent to the provider.
            You'll see the status update in your dashboard.
          </p>
          <div className="booking-success-actions">
            <Link to="/dashboard/customer" className="button button-primary">
              View My Bookings
            </Link>
            <Link to="/services" className="button button-ghost">
              Browse More Services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Service not found ───────────────────────────────────────── */
  if (serviceLoading) {
    return (
      <div className="booking-page">
        <div className="booking-not-found">
          <p>Loading service...</p>
        </div>
      </div>
    );
  }

  /* ── Service not found ───────────────────────────────────────── */
  if (!service) {
    return (
      <div className="booking-page">
        <div className="booking-not-found">
          <p>Service not found.</p>
          <Link to="/services" className="button button-primary">Browse Services</Link>
        </div>
      </div>
    );
  }

  /* ── Main form ───────────────────────────────────────────────── */
  return (
    <div className="booking-page">
      <div className="booking-wrapper">

        {/* Header */}
        <div className="booking-header">
          <Link to="/services" className="booking-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to services
          </Link>
          <h1 className="booking-title">Book an Appointment</h1>
        </div>

        <div className="booking-layout">

          {/* Left — service info card */}
          <aside className="booking-service-card">
            <p className="booking-service-category">{service.category}</p>
            <h2 className="booking-service-name">{service.name}</h2>
            <p className="booking-service-author">by {service.author}</p>
            <div className="booking-service-divider" />
            <div className="booking-service-price-row">
              <span className="booking-service-price-label">Listed price</span>
              <span className="booking-service-price">€{service.price}</span>
            </div>
            <p className="booking-service-note">
              You can propose a different price below — the provider will review your request.
            </p>
          </aside>

          {/* Right — booking form */}
          <form className="booking-form" onSubmit={handleSubmit} noValidate>
            {serverError && (
              <div className="auth-server-error" role="alert">{serverError}</div>
            )}

            {/* Date & time */}
            <div className="booking-field">
              <label className="booking-label" htmlFor="bookingDate">
                Date &amp; Time
              </label>
              <input
                id="bookingDate"
                name="bookingDate"
                type="datetime-local"
                min={todayMin()}
                value={form.bookingDate}
                onChange={handleChange}
                className={`booking-input${errors.bookingDate ? " booking-input-error" : ""}`}
              />
              {errors.bookingDate && (
                <span className="error" role="alert">{errors.bookingDate}</span>
              )}
            </div>

            {/* Desired price */}
            <div className="booking-field">
              <label className="booking-label" htmlFor="desiredPrice">
                Desired Price (€)
              </label>
              <div className="booking-price-wrap">
                <span className="booking-price-prefix">€</span>
                <input
                  id="desiredPrice"
                  name="desiredPrice"
                  type="number"
                  min="1"
                  step="1"
                  placeholder={String(service.price)}
                  value={form.desiredPrice}
                  onChange={handleChange}
                  className={`booking-input booking-input-price${errors.desiredPrice ? " booking-input-error" : ""}`}
                />
              </div>
              {errors.desiredPrice && (
                <span className="error" role="alert">{errors.desiredPrice}</span>
              )}
              <span className="booking-field-hint">
                Listed at €{service.price} — feel free to negotiate.
              </span>
            </div>

            {/* Notes */}
            <div className="booking-field">
              <label className="booking-label" htmlFor="notes">
                Message to Provider <span className="booking-optional">(optional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="4"
                maxLength="1000"
                placeholder="Tell the provider anything they should know…"
                value={form.notes}
                onChange={handleChange}
                className="booking-input booking-textarea"
              />
            </div>

            <button className="booking-submit" type="submit" disabled={loading}>
              {loading ? "Sending request…" : "Confirm Booking Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BookingPage;
