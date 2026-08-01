import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/index.js";
import { formatDate } from "../utils/formatDate";
import DashboardAvatar from "../components/DashboardAvatar";

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
  const providerRef = booking?.enterpriseId?.userId;
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

  useEffect(() => {
    if (!user) return;
    api.get("/auth/me").then((res) => setProfile(res.data.user)).catch(() => {});
    api.get("/booking")
      .then((res) => setBookings(res.data))
      .catch(() => setError("Could not load bookings."))
      .finally(() => setLoadingBookings(false));
  }, [user]);

  const handleAvatarUpload = async (file) => {
    setAvatarError("");
    if (!file.type.startsWith("image/")) { setAvatarError("Please choose an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { setAvatarError("Image is too large. Max size is 2MB."); return; }

    try {
      setAvatarUploading(true);
      const avatarUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Failed to read image."));
        reader.readAsDataURL(file);
      });
      const res = await api.patch("/auth/me/avatar", { avatarUrl });
      setProfile(res.data.user);
      await refreshUser();
    } catch {
      setAvatarError("Could not upload avatar. Please try again.");
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

  if (!user) {
    navigate("/login");
    return null;
  }

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
            <button className="button button-primary" onClick={() => navigate("/services")}>
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
                          {b.enterpriseId?.subject ?? "Service"}
                        </Link>
                      ) : (
                        b.enterpriseId?.subject ?? "Service"
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
                          {b.enterpriseId?.subject ?? "Service"}
                        </Link>
                      ) : (
                        b.enterpriseId?.subject ?? "Service"
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
