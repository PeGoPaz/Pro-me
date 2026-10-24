import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import api from "../api/index.js";
import { uploadAvatar } from "../api/photos.js";
import { formatDate, formatShortDate } from "../utils/formatDate";
import DashboardAvatar from "../components/DashboardAvatar";
import { StarDisplay } from "../components/StarRating";

const STATUS_CLASSES = {
  pending: "booking-status-pending",
  confirmed: "booking-status-confirmed",
  cancelled: "booking-status-cancelled",
};

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

function getProviderId(booking) {
  /* Bookings now point straight at the instructor, so the provider is right
     there rather than one hop away through the service listing. */
  const providerRef = booking?.instructorId;
  if (!providerRef) return "";
  return typeof providerRef === "string" ? providerRef : providerRef._id || "";
}

function CustomerDashboardPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [error, setError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [myReviews, setMyReviews] = useState([]);

  useEffect(() => {
    if (!user) return;
    api.get("/auth/me").then((res) => setProfile(res.data.user)).catch(() => {});
    api.get("/booking")
      .then((res) => setBookings(res.data))
      .catch(() => setError("Could not load bookings."))
      .finally(() => setLoadingBookings(false));
    api.get("/reviews/mine").then((res) => setMyReviews(res.data.reviews)).catch(() => {});
  }, [user]);

  const handleAvatarUpload = async (file) => {
    setAvatarError("");
    try {
      setAvatarUploading(true);
      setProfile(await uploadAvatar(file));
      await refreshUser();
    } catch (err) {
      setAvatarError(
        err?.response?.data?.message || err?.message || "Could not upload avatar. Please try again."
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await api.delete(`/booking/${bookingId}`);
      setBookings((prev) => prev.filter((b) => b._id !== bookingId));
    } catch {
      alert("Failed to cancel the booking. Please try again.");
    }
  };

  const avatarUrl = profile?.avatarUrl || user.avatarUrl || "";
  const upcoming = bookings.filter((b) => b.status !== "cancelled" && new Date(b.bookingDate) >= new Date());
  const past = bookings.filter((b) => b.status === "cancelled" || new Date(b.bookingDate) < new Date());

  return (
    <div className="dash-page">
      {/* Profile card */}
      <section className="dash-profile-card">
        <DashboardAvatar
          name={user.name}
          avatarUrl={avatarUrl}
          uploading={avatarUploading}
          error={avatarError}
          onUpload={handleAvatarUpload}
          onOpen={() => { if (avatarUrl) setAvatarPreviewOpen(true); }}
        />
        <div className="dash-profile-info">
          <h1 className="dash-profile-name">{user.name}</h1>
          <p className="dash-profile-email">{user.email}</p>
          <span className="dash-role-badge">Customer</span>
        </div>
        <div className="dash-profile-meta">
          <div className="dash-meta-item">
            <span className="dash-meta-label">Member since</span>
            <span className="dash-meta-value">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("en-IE", { month: "long", year: "numeric" })
                : "—"}
            </span>
          </div>
          <div className="dash-meta-item">
            <span className="dash-meta-label">Total bookings</span>
            <span className="dash-meta-value">{bookings.length}</span>
          </div>
        </div>
      </section>

      {/* Upcoming bookings */}
      <section className="dash-section">
        <h2 className="dash-section-title">Upcoming Appointments</h2>
        {loadingBookings ? (
          <p className="dash-loading">Loading…</p>
        ) : error ? (
          <p className="dash-error">{error}</p>
        ) : upcoming.length === 0 ? (
          <div className="dash-empty">
            <p>No upcoming appointments.</p>
            <button className="button button-primary" onClick={() => navigate("/instructors")}>
              Browse Services
            </button>
          </div>
        ) : (
          <ul className="dash-booking-list">
            {upcoming.map((b) => (
              <li key={b._id} className="dash-booking-card">
                <div className="dash-booking-top">
                  <div>
                    <p className="dash-booking-service">
                      {getProviderId(b) ? (
                        <Link to={`/providers/${getProviderId(b)}`} className="dash-booking-service-link">
                          {b.serviceId?.subject ?? "Driving lesson"}
                        </Link>
                      ) : (
                        b.serviceId?.subject ?? "Driving lesson"
                      )}
                    </p>
                    <p className="dash-booking-date">{formatDate(b.bookingDate)}</p>
                  </div>
                  <span className={`booking-status ${STATUS_CLASSES[b.status]}`}>{STATUS_LABELS[b.status]}</span>
                </div>
                {b.notes && <p className="dash-booking-notes">"{b.notes}"</p>}
                {b.status !== "cancelled" && (
                  <button className="dash-cancel-btn" onClick={() => handleCancel(b._id)}>
                    Cancel booking
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Past / cancelled bookings */}
      {!loadingBookings && past.length > 0 && (
        <section className="dash-section">
          <h2 className="dash-section-title">Past &amp; Cancelled</h2>
          <ul className="dash-booking-list">
            {past.map((b) => (
              <li key={b._id} className="dash-booking-card dash-booking-card-muted">
                <div className="dash-booking-top">
                  <div>
                    <p className="dash-booking-service">
                      {getProviderId(b) ? (
                        <Link to={`/providers/${getProviderId(b)}`} className="dash-booking-service-link">
                          {b.serviceId?.subject ?? "Driving lesson"}
                        </Link>
                      ) : (
                        b.serviceId?.subject ?? "Driving lesson"
                      )}
                    </p>
                    <p className="dash-booking-date">{formatDate(b.bookingDate)}</p>
                  </div>
                  <span className={`booking-status ${STATUS_CLASSES[b.status]}`}>{STATUS_LABELS[b.status]}</span>
                </div>
                {b.status !== "cancelled" && (
                  <button className="dash-cancel-btn" onClick={() => handleCancel(b._id)}>
                    Cancel booking
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The learner's own reviews. A hidden one says why: DSA Article 17 owes
          its author the decision and the reasons, and a way to contest it. */}
      {myReviews.length > 0 && (
        <section className="dash-section">
          <h2 className="dash-section-title">Your Reviews</h2>
          <ul className="dash-booking-list">
            {myReviews.map((r) => (
              <li key={r._id} className={`dash-booking-card ${r.hidden ? "dash-booking-card-muted" : ""}`}>
                <div className="dash-booking-top">
                  <div>
                    <p className="dash-booking-service">
                      {r.instructor ? (
                        <Link to={`/instructors/${r.instructor.id}`} className="dash-booking-service-link">
                          {r.instructor.name}
                        </Link>
                      ) : (
                        "Instructor no longer on Pro.me"
                      )}
                    </p>
                    <p className="dash-booking-date">{formatShortDate(r.createdAt)}</p>
                  </div>
                  {r.hidden ? (
                    <span className="booking-status booking-status-cancelled">Hidden</span>
                  ) : (
                    <StarDisplay rating={r.rating} size={14} />
                  )}
                </div>
                {r.comment && <p className="dash-review-comment">“{r.comment}”</p>}
                {r.hidden && (
                  <div className="dash-review-hidden">
                    <p>
                      <strong>Hidden on {formatShortDate(r.hiddenAt)} after a report.</strong>{" "}
                      It no longer shows on the instructor&apos;s profile or counts in their rating.
                    </p>
                    <p>Our reasons: {r.hiddenReason}</p>
                    <p>
                      If you think this decision is wrong,{" "}
                      <Link to="/contact" className="legal-link">tell us</Link> and we will look at it again.
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Photo lightbox */}
      {avatarPreviewOpen && avatarUrl && (
        <div
          className="image-lightbox-overlay"
          onClick={() => setAvatarPreviewOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close photo preview"
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter" || e.key === " ") setAvatarPreviewOpen(false);
          }}
        >
          <button type="button" className="image-lightbox-close" onClick={() => setAvatarPreviewOpen(false)} aria-label="Close">
            ×
          </button>
          <img src={avatarUrl} alt={user.name} className="image-lightbox-content" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

export default CustomerDashboardPage;
