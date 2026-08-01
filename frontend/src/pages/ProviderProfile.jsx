import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/index.js";
import { useAuth } from "../context/AuthContext";
import { getCategoryImage } from "../utils/categoryImages";
import { StarDisplay, StarPicker } from "../components/StarRating";
import ReviewCard from "../components/ReviewCard";

function ProviderProfile() {
  const { providerId } = useParams();
  const { user } = useAuth();

  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [form, setForm] = useState({ serviceId: "", rating: 0, comment: "" });
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    if (!providerId) return undefined;
    let ignore = false;

    api.get(`/enterprise/providers/public/${providerId}`)
      .then((res) => {
        if (ignore) return;
        setProvider(res.data.provider);
        setServices(res.data.services ?? []);
      })
      .catch(() => { if (!ignore) setError("Could not load provider profile."); })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [providerId]);

  useEffect(() => {
    if (!providerId) return undefined;
    let ignore = false;

    api.get(`/reviews/provider/${providerId}`)
      .then((res) => {
        if (ignore) return;
        setReviews(res.data.reviews ?? []);
        setAverageRating(res.data.averageRating);
      })
      .catch(() => {})
      .finally(() => { if (!ignore) setReviewsLoading(false); });

    return () => { ignore = true; };
  }, [providerId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.serviceId) { setFormError("Please select the service you received."); return; }
    if (form.rating === 0) { setFormError("Please select a star rating."); return; }

    try {
      setFormSubmitting(true);
      const res = await api.post("/reviews", {
        providerId,
        serviceId: form.serviceId,
        rating: form.rating,
        comment: form.comment.trim() || undefined,
      });

      setReviews((prev) => {
        const next = [res.data.review, ...prev];
        const avg = next.reduce((sum, r) => sum + r.rating, 0) / next.length;
        setAverageRating(Math.round(avg * 10) / 10);
        return next;
      });

      setForm({ serviceId: "", rating: 0, comment: "" });
      setFormSuccess(true);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Could not submit review. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  };

  if (!providerId || (!loading && (error || !provider))) {
    return (
      <section className="provider-public-page">
        <p className="provider-public-empty">{error || "Provider not found."}</p>
        <Link to="/services" className="button button-primary">Back to services</Link>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="provider-public-page">
        <p className="provider-public-empty">Loading profile...</p>
      </section>
    );
  }

  const providerInitials = provider.name
    .split(" ").filter(Boolean).slice(0, 2)
    .map((p) => p[0]?.toUpperCase()).join("");

  const canReview = user?.role === "user" && user?._id !== providerId && user?.id !== providerId;

  return (
    <section className="provider-public-page">

      {/* Header card */}
      <div className="provider-public-card provider-public-card-split">
        <div className="provider-public-photo-box" aria-hidden="true">
          {provider.avatarUrl ? (
            <img src={provider.avatarUrl} alt={provider.name} className="provider-public-photo-image" />
          ) : (
            <div className="provider-public-photo-initials">{providerInitials || "SP"}</div>
          )}
        </div>

        <div className="provider-public-info">
          <h1 className="provider-public-name">{provider.name}</h1>
          <p className="provider-public-meta">
            Service Provider · Joined{" "}
            {new Date(provider.createdAt).toLocaleDateString("en-IE", { month: "long", year: "numeric" })}
          </p>

          {averageRating !== null ? (
            <div className="provider-public-rating">
              <StarDisplay rating={averageRating} size={18} />
              <span className="provider-public-rating-score">{averageRating}</span>
              <span className="provider-public-rating-count">
                ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
              </span>
            </div>
          ) : (
            <p className="provider-public-reviews">No reviews yet</p>
          )}
        </div>
      </div>

      {/* Services */}
      <div className="provider-public-section">
        <h2 className="provider-public-section-title">Services by this provider</h2>
        {services.length === 0 ? (
          <p className="provider-public-empty">This provider has not posted services yet.</p>
        ) : (
          <ul className="provider-public-services">
            {services.map((service) => (
              <li key={service._id} className="provider-public-service-card">
                <div className="provider-public-service-image-wrap">
                  {getCategoryImage(service.category) && (
                    <img
                      src={getCategoryImage(service.category)}
                      alt={service.subject}
                      className="provider-public-service-image"
                    />
                  )}
                </div>
                <div className="provider-public-service-body">
                  <p className="provider-public-service-category">{service.category || "Other"}</p>
                  <h3 className="provider-public-service-name">{service.subject}</h3>
                  <p className="provider-public-service-price">€{service.price}</p>
                  <p className="provider-public-service-desc">{service.bio || "—"}</p>
                  <Link to={`/booking?service=${service._id}`} className="button button-primary">
                    Book Appointment
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Reviews */}
      <div className="provider-public-section">
        <h2 className="provider-public-section-title">Customer Reviews</h2>

        {reviewsLoading ? (
          <p className="provider-public-empty">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="provider-public-empty">
            This provider has no reviews yet. Reviews will appear here after completed bookings.
          </p>
        ) : (
          <ul className="review-list">
            {reviews.map((r) => <ReviewCard key={r._id} review={r} />)}
          </ul>
        )}

        {/* Leave a review form */}
        {canReview && !formSuccess && (
          <div className="review-form-wrap">
            <h3 className="review-form-title">Leave a Review</h3>
            <form className="review-form" onSubmit={handleSubmitReview} noValidate>
              {formError && <div className="auth-server-error" role="alert">{formError}</div>}

              <div className="booking-field">
                <label className="booking-label" htmlFor="review-service">
                  Which service did you receive?
                </label>
                <select
                  id="review-service"
                  className="booking-input"
                  value={form.serviceId}
                  onChange={(e) => setForm((p) => ({ ...p, serviceId: e.target.value }))}
                >
                  <option value="">Select a service…</option>
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>{s.subject}</option>
                  ))}
                </select>
              </div>

              <div className="booking-field">
                <label className="booking-label">Your Rating</label>
                <StarPicker
                  value={form.rating}
                  onChange={(n) => setForm((p) => ({ ...p, rating: n }))}
                />
              </div>

              <div className="booking-field">
                <label className="booking-label" htmlFor="review-comment">
                  Comment <span className="booking-optional">(optional)</span>
                </label>
                <textarea
                  id="review-comment"
                  className="booking-input booking-textarea"
                  rows="3"
                  maxLength="1000"
                  placeholder="Share your experience…"
                  value={form.comment}
                  onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                />
              </div>

              <button className="booking-submit" type="submit" disabled={formSubmitting}>
                {formSubmitting ? "Submitting…" : "Submit Review"}
              </button>
            </form>
          </div>
        )}

        {formSuccess && (
          <div className="review-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="#1a8a5a" strokeWidth="2" />
              <path d="M7 12l4 4 6-6" stroke="#1a8a5a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Thank you! Your review has been submitted.
          </div>
        )}

        {!canReview && !user && (
          <p className="review-login-prompt">
            <Link to="/login" className="auth-footer-link">Sign in</Link> to leave a review.
          </p>
        )}
      </div>
    </section>
  );
}

export default ProviderProfile;
