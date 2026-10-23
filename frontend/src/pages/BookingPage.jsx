import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../api/index.js";

/* Min datetime string for the date-picker (today) */
function todayMin() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function BookingPage() {
  const [searchParams] = useSearchParams();

  /* Two ways in. ?instructor=<userId> is the driving-instructor path and the
     primary one; ?service=<enterpriseId> is the legacy listing path, still used
     by the Other category. Either resolves to the same "who am I booking". */
  const instructorId = searchParams.get("instructor");
  const serviceId = searchParams.get("service");
  const target = instructorId ? `instructor:${instructorId}` : serviceId ? `service:${serviceId}` : null;

  /* What was fetched, and for which target. Loading is derived from it rather
     than kept in its own state: following a link to another instructor makes
     the old result stale at once, instead of showing the previous instructor
     until the new one arrives. */
  const [fetched, setFetched] = useState({ target: null, service: null });
  const serviceLoading = target !== null && fetched.target !== target;
  const service = fetched.target === target ? fetched.service : null;

  const [form, setForm] = useState({
    bookingDate: "",
    notes: "",
  });
  /* The desired price shows the listed price until the learner types in it.
     An edit belongs to the instructor it was made for, so it does not carry
     over to the next one; clearing the field keeps it cleared. */
  const [priceEdit, setPriceEdit] = useState({ target: null, value: "" });
  const desiredPrice = priceEdit.target === target ? priceEdit.value : service ? String(service.price) : "";
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!target) return undefined;

    let ignore = false;

    /* Both shapes are normalised into the same object so the rest of the page
       does not have to care which link the learner arrived from. */
    const request = instructorId
      ? api.get(`/instructors/${instructorId}`).then((res) => ({
          instructorId: String(res.data.userId),
          serviceId: null,
          name: "Driving lesson",
          author: res.data.name ?? "Instructor",
          category: "Driving",
          price: res.data.pricePerLesson ?? 0,
        }))
      : api.get(`/enterprise/services/public/${serviceId}`).then((res) => ({
          instructorId: String(res.data.userId?._id ?? res.data.userId),
          serviceId: res.data._id,
          name: res.data.subject,
          author: res.data.userId?.name ?? "Service Provider",
          category: res.data.category ?? "Other",
          price: res.data.price,
        }));

    request
      .then((normalised) => { if (!ignore) setFetched({ target, service: normalised }); })
      .catch(() => { if (!ignore) setFetched({ target, service: null }); });

    return () => { ignore = true; };
  }, [target, instructorId, serviceId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "desiredPrice") setPriceEdit({ target, value });
    else setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const nextErrors = {};
    if (!form.bookingDate) nextErrors.bookingDate = "Please choose a date and time.";
    if (!desiredPrice || Number(desiredPrice) <= 0)
      nextErrors.desiredPrice = "Enter a valid price.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    /* Build notes — prepend desired price so provider can see it */
    const combinedNotes = [
      `Desired price: €${desiredPrice}`,
      form.notes.trim() ? form.notes.trim() : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      setLoading(true);
      await api.post("/booking", {
        instructorId: service.instructorId,
        /* Only sent for the Other category; the API rejects a service that
           does not belong to the instructor being booked. */
        ...(service.serviceId ? { serviceId: service.serviceId } : {}),
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
            <Link to="/instructors" className="button button-ghost">
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
          <Link to="/instructors" className="button button-primary">Find an instructor</Link>
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
          <Link to="/instructors" className="booking-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to search
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
                  value={desiredPrice}
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
