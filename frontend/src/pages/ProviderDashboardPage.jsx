import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/index.js";
import { getCategoryImage } from "../utils/categoryImages";
import { formatDate } from "../utils/formatDate";
import ActivityHeatmap from "../components/ActivityHeatmap";
import ServiceModal from "../components/ServiceModal";
import DashboardAvatar from "../components/DashboardAvatar";
import ReviewCard from "../components/ReviewCard";

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

function ProviderDashboardPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [error, setError] = useState("");
  const [servicesError, setServicesError] = useState("");
  const [serviceSubmitError, setServiceSubmitError] = useState("");
  const [serviceSubmitting, setServiceSubmitting] = useState(false);
  const [serviceStatusUpdatingId, setServiceStatusUpdatingId] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState("");
  const [serviceTab, setServiceTab] = useState("active");
  const [serviceForm, setServiceForm] = useState({
    subject: "", category: "", price: "", availability: "", bio: "",
  });

  useEffect(() => {
    if (!user) return undefined;
    const enterpriseId = user.id || user._id;
    if (!enterpriseId) return undefined;

    api.get("/auth/me").then((res) => setProfile(res.data.user)).catch(() => {});
    api.get("/booking")
      .then((res) => setBookings(res.data))
      .catch(() => setError("Could not load bookings."))
      .finally(() => setLoadingBookings(false));
    api.get(`/enterprise/${enterpriseId}/services`)
      .then((res) => setServices(res.data))
      .catch(() => setServicesError("Could not load your services."))
      .finally(() => setLoadingServices(false));
    api.get(`/reviews/provider/${enterpriseId}`)
      .then((res) => setReviews(res.data.reviews ?? []))
      .catch(() => {})
      .finally(() => setReviewsLoading(false));

    return undefined;
  }, [user]);

  const updateStatus = async (bookingId, newStatus) => {
    try {
      const res = await api.patch(`/booking/${bookingId}/status`, { status: newStatus });
      const updated = res.data.booking;
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, ...updated } : b)));
    } catch {
      alert("Failed to update booking status.");
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const pending = bookings.filter((b) => b.status === "pending");
  const confirmed = bookings.filter(
    (b) => b.status === "confirmed" && new Date(b.bookingDate) >= now
  );
  const past = bookings.filter(
    (b) => b.status === "confirmed" && new Date(b.bookingDate) < now
  );
  const cancelled = bookings.filter((b) => b.status === "cancelled");
  const activeServices = services.filter((s) => !s.isArchived);
  const archivedServices = services.filter((s) => s.isArchived);
  const visibleServices = serviceTab === "archived" ? archivedServices : activeServices;

  const handleServiceInput = (e) => {
    const { name, value } = e.target;
    setServiceForm((prev) => ({ ...prev, [name]: value }));
    setServiceSubmitError("");
  };

  const resetServiceForm = () => setServiceForm({ subject: "", category: "", price: "", availability: "", bio: "" });

  const closeServiceModal = () => {
    setServiceFormOpen(false);
    setEditingServiceId("");
    setServiceSubmitError("");
    resetServiceForm();
  };

  const openCreateServiceModal = () => {
    setEditingServiceId("");
    setServiceSubmitError("");
    resetServiceForm();
    setServiceFormOpen(true);
  };

  const openEditServiceModal = (service) => {
    setEditingServiceId(service._id);
    setServiceSubmitError("");
    setServiceForm({
      subject: service.subject ?? "",
      category: service.category ?? "",
      price: service.price != null ? String(service.price) : "",
      availability: service.availability ?? "",
      bio: service.bio ?? "",
    });
    setServiceFormOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    const enterpriseId = user.id || user._id;
    if (!enterpriseId) return;

    const subject = serviceForm.subject.trim();
    const category = serviceForm.category.trim();
    const bio = serviceForm.bio.trim();
    const availability = serviceForm.availability.trim();
    const price = Number(serviceForm.price);

    if (!subject) { setServiceSubmitError("Service title is required."); return; }
    if (!category) { setServiceSubmitError("Please select a category."); return; }
    if (Number.isNaN(price) || price < 0) { setServiceSubmitError("Price must be a valid non-negative number."); return; }

    try {
      setServiceSubmitting(true);
      setServiceSubmitError("");
      const payload = { subject, category, price, bio: bio || undefined, availability: availability || undefined };

      if (editingServiceId) {
        const res = await api.patch(`/enterprise/${enterpriseId}/services/${editingServiceId}`, payload);
        setServices((prev) => prev.map((s) => (s._id === editingServiceId ? res.data : s)));
      } else {
        const res = await api.post(`/enterprise/${enterpriseId}/services`, payload);
        setServices((prev) => [res.data, ...prev]);
      }
      closeServiceModal();
    } catch (err) {
      setServiceSubmitError(err?.response?.data?.message || "Could not save service. Please try again.");
    } finally {
      setServiceSubmitting(false);
    }
  };

  const handleArchiveToggle = async (serviceId, archiveValue) => {
    const enterpriseId = user.id || user._id;
    if (!enterpriseId) return;
    try {
      setServiceStatusUpdatingId(serviceId);
      const res = await api.patch(`/enterprise/${enterpriseId}/services/${serviceId}`, { isArchived: archiveValue });
      setServices((prev) => prev.map((s) => (s._id === serviceId ? res.data : s)));
    } catch {
      setServicesError("Could not update service status.");
    } finally {
      setServiceStatusUpdatingId("");
    }
  };

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

  const avatarUrl = profile?.avatarUrl || user.avatarUrl || "";
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

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
          onOpen={() => setAvatarPreviewOpen(true)}
        />
        <div className="dash-profile-info">
          <h1 className="dash-profile-name">{user.name}</h1>
          <p className="dash-profile-email">{user.email}</p>
          <span className="dash-role-badge dash-role-badge-provider">Service Provider</span>
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
            <span className="dash-meta-label">Total requests</span>
            <span className="dash-meta-value">{bookings.length}</span>
          </div>
          <div className="dash-meta-item">
            <span className="dash-meta-label">Pending</span>
            <span className="dash-meta-value">{pending.length}</span>
          </div>
        </div>
      </section>

      {/* Activity heatmap */}
      <ActivityHeatmap bookings={bookings} services={services} />

      {/* My services */}
      <section className="dash-section">
        <div className="dash-service-header">
          <h2 className="dash-section-title dash-service-title">
            My Services
            {visibleServices.length > 0 && <span className="dash-count-badge">{visibleServices.length}</span>}
          </h2>
          <div className="dash-service-header-actions">
            <div className="dash-service-tabs" role="tablist" aria-label="Service status">
              <button
                type="button" role="tab"
                aria-selected={serviceTab === "active"}
                className={`dash-service-tab-btn${serviceTab === "active" ? " dash-service-tab-btn-active" : ""}`}
                onClick={() => setServiceTab("active")}
              >
                Active ({activeServices.length})
              </button>
              <button
                type="button" role="tab"
                aria-selected={serviceTab === "archived"}
                className={`dash-service-tab-btn${serviceTab === "archived" ? " dash-service-tab-btn-active" : ""}`}
                onClick={() => setServiceTab("archived")}
              >
                Archived ({archivedServices.length})
              </button>
            </div>
            <button type="button" className="dash-service-add-trigger" aria-label="Add service" onClick={openCreateServiceModal}>
              +
            </button>
          </div>
        </div>

        {loadingServices ? (
          <p className="dash-loading">Loading services…</p>
        ) : servicesError ? (
          <p className="dash-error">{servicesError}</p>
        ) : visibleServices.length === 0 ? (
          <p className="dash-empty-inline">
            {serviceTab === "archived" ? "No archived services yet." : "You have not added any services yet."}
          </p>
        ) : (
          <ul className="dash-service-list">
            {visibleServices.map((service) => {
              const image = getCategoryImage(service.category);
              return (
                <li key={service._id} className="dash-service-card">
                  {image && (
                    <div className="dash-service-image-wrap">
                      <img src={image} alt={service.category || service.subject} className="dash-service-image" />
                    </div>
                  )}
                  <p className="dash-service-name">{service.subject}</p>
                  <p className="dash-service-price">€{service.price}</p>
                  {service.category && <p className="dash-service-meta">Category: {service.category}</p>}
                  {service.availability && <p className="dash-service-meta">Availability: {service.availability}</p>}
                  {service.bio && <p className="dash-service-bio">{service.bio}</p>}
                  <div className="dash-service-actions">
                    <button type="button" className="dash-service-edit-btn" onClick={() => openEditServiceModal(service)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="dash-service-state-btn"
                      disabled={serviceStatusUpdatingId === service._id}
                      onClick={() => handleArchiveToggle(service._id, !service.isArchived)}
                    >
                      {serviceStatusUpdatingId === service._id
                        ? "Updating..."
                        : service.isArchived ? "Restore service" : "Archive service"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {serviceFormOpen && (
        <ServiceModal
          isEditing={!!editingServiceId}
          form={serviceForm}
          onInput={handleServiceInput}
          onSave={handleSaveService}
          onClose={closeServiceModal}
          submitting={serviceSubmitting}
          error={serviceSubmitError}
        />
      )}

      {/* Pending requests */}
      <section className="dash-section">
        <h2 className="dash-section-title">
          Pending Requests
          {pending.length > 0 && <span className="dash-count-badge">{pending.length}</span>}
        </h2>
        {loadingBookings ? (
          <p className="dash-loading">Loading…</p>
        ) : error ? (
          <p className="dash-error">{error}</p>
        ) : pending.length === 0 ? (
          <p className="dash-empty-inline">No pending requests.</p>
        ) : (
          <ul className="dash-booking-list">
            {pending.map((b) => (
              <li key={b._id} className="dash-booking-card">
                <div className="dash-booking-top">
                  <div>
                    <p className="dash-booking-service">{b.enterpriseId?.subject ?? "Booking"}</p>
                    <p className="dash-booking-customer">
                      Customer: <strong>{b.userId?.name ?? "Unknown"}</strong>
                      {b.userId?.email && <span className="dash-booking-customer-email"> · {b.userId.email}</span>}
                    </p>
                    <p className="dash-booking-date">{formatDate(b.bookingDate)}</p>
                  </div>
                  <span className={`booking-status ${STATUS_CLASSES[b.status]}`}>{STATUS_LABELS[b.status]}</span>
                </div>
                {b.notes && <p className="dash-booking-notes">"{b.notes}"</p>}
                <div className="dash-action-row">
                  <button className="dash-action-btn dash-action-confirm" onClick={() => updateStatus(b._id, "confirmed")}>
                    Confirm
                  </button>
                  <button className="dash-action-btn dash-action-cancel" onClick={() => updateStatus(b._id, "cancelled")}>
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Confirmed appointments */}
      {!loadingBookings && confirmed.length > 0 && (
        <section className="dash-section">
          <h2 className="dash-section-title">Confirmed Appointments</h2>
          <ul className="dash-booking-list">
            {confirmed.map((b) => (
              <li key={b._id} className="dash-booking-card">
                <div className="dash-booking-top">
                  <div>
                    <p className="dash-booking-service">{b.enterpriseId?.subject ?? "Booking"}</p>
                    <p className="dash-booking-customer">Customer: <strong>{b.userId?.name ?? "Unknown"}</strong></p>
                    <p className="dash-booking-date">{formatDate(b.bookingDate)}</p>
                  </div>
                  <span className={`booking-status ${STATUS_CLASSES[b.status]}`}>{STATUS_LABELS[b.status]}</span>
                </div>
                <div className="dash-action-row">
                  <button className="dash-action-btn dash-action-cancel" onClick={() => updateStatus(b._id, "cancelled")}>
                    Cancel
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Cancelled */}
      {!loadingBookings && cancelled.length > 0 && (
        <section className="dash-section">
          <h2 className="dash-section-title">Cancelled</h2>
          <ul className="dash-booking-list">
            {cancelled.map((b) => (
              <li key={b._id} className="dash-booking-card dash-booking-card-muted">
                <div className="dash-booking-top">
                  <div>
                    <p className="dash-booking-service">{b.enterpriseId?.subject ?? "Booking"}</p>
                    <p className="dash-booking-customer">Customer: <strong>{b.userId?.name ?? "Unknown"}</strong></p>
                    <p className="dash-booking-date">{formatDate(b.bookingDate)}</p>
                  </div>
                  <span className={`booking-status ${STATUS_CLASSES[b.status]}`}>{STATUS_LABELS[b.status]}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Appointment history — past confirmed */}
      {!loadingBookings && past.length > 0 && (
        <section className="dash-section">
          <h2 className="dash-section-title">
            Appointment History
            <span className="dash-count-badge">{past.length}</span>
          </h2>
          <ul className="dash-booking-list">
            {past.map((b) => (
              <li key={b._id} className="dash-booking-card dash-booking-card-muted">
                <div className="dash-booking-top">
                  <div>
                    <p className="dash-booking-service">{b.enterpriseId?.subject ?? "Booking"}</p>
                    <p className="dash-booking-customer">
                      Customer: <strong>{b.userId?.name ?? "Unknown"}</strong>
                      {b.userId?.email && (
                        <span className="dash-booking-customer-email"> · {b.userId.email}</span>
                      )}
                    </p>
                    <p className="dash-booking-date">{formatDate(b.bookingDate)}</p>
                    {b.confirmedAt && (
                      <p className="dash-booking-confirmed-at">
                        Confirmed on {formatDate(b.confirmedAt)}
                      </p>
                    )}
                  </div>
                  <span className="booking-status dash-booking-status-completed">Completed</span>
                </div>
                {b.notes && <p className="dash-booking-notes">"{b.notes}"</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Reviews */}
      <section className="dash-section">
        <div className="dash-reviews-head">
          <h2 className="dash-section-title" style={{ margin: 0 }}>Customer Reviews</h2>
          {avgRating !== null && (
            <div className="dash-reviews-avg">
              <span className="dash-reviews-avg-score">{avgRating.toFixed(1)}</span>
              <span className="dash-reviews-stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <svg key={n} width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"
                    fill={n <= Math.round(avgRating) ? "#f59e0b" : "none"}
                    stroke={n <= Math.round(avgRating) ? "#f59e0b" : "#d1d5db"}
                    strokeWidth="1.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </span>
              <span className="dash-reviews-count">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        {reviewsLoading ? (
          <p className="dash-loading" style={{ marginTop: "1rem" }}>Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="dash-empty-inline" style={{ marginTop: "1rem" }}>
            No reviews yet. They will appear here once customers leave feedback.
          </p>
        ) : (
          <ul className="review-list" style={{ marginTop: "1.25rem" }}>
            {reviews.map((r) => <ReviewCard key={r._id} review={r} />)}
          </ul>
        )}
      </section>

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

export default ProviderDashboardPage;
