const SERVICE_CATEGORIES = [
  "Barber",
  "Driving",
  "Tutoring",
  "Beauty & Spa",
  "Health & Wellness",
  "Other",
];

/**
 * Modal for creating or editing a provider service.
 *
 * Props:
 *   isEditing   — boolean, true when editing an existing service
 *   form        — { subject, category, price, availability, bio }
 *   onInput     — onChange handler for all fields
 *   onSave      — form submit handler
 *   onClose     — close modal handler
 *   submitting  — boolean
 *   error       — string | ""
 */
export default function ServiceModal({ isEditing, form, onInput, onSave, onClose, submitting, error }) {
  return (
    <div className="dash-service-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="dash-service-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="serviceModalTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dash-service-modal-head">
          <h3 id="serviceModalTitle" className="dash-service-modal-title">
            {isEditing ? "Edit Service" : "Add Service"}
          </h3>
          <button
            type="button"
            className="dash-service-modal-close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form className="dash-service-form" onSubmit={onSave} noValidate>
          {error && <div className="auth-server-error" role="alert">{error}</div>}

          <div className="dash-service-form-grid">
            <div className="dash-service-field">
              <label className="dash-service-label" htmlFor="serviceSubject">Service title</label>
              <input
                id="serviceSubject"
                name="subject"
                className="dash-service-input"
                value={form.subject}
                onChange={onInput}
                placeholder="e.g. Advanced Driving Lesson"
                maxLength="120"
                required
              />
            </div>

            <div className="dash-service-field">
              <label className="dash-service-label" htmlFor="serviceCategory">Category</label>
              <select
                id="serviceCategory"
                name="category"
                className="dash-service-input"
                value={form.category}
                onChange={onInput}
                required
              >
                <option value="" disabled>Select a category</option>
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="dash-service-field">
              <label className="dash-service-label" htmlFor="servicePrice">Price (€)</label>
              <input
                id="servicePrice"
                name="price"
                type="number"
                min="0"
                step="1"
                className="dash-service-input"
                value={form.price}
                onChange={onInput}
                placeholder="45"
                required
              />
            </div>

            <div className="dash-service-field dash-service-field-wide">
              <label className="dash-service-label" htmlFor="serviceAvailability">Availability</label>
              <input
                id="serviceAvailability"
                name="availability"
                className="dash-service-input"
                value={form.availability}
                onChange={onInput}
                placeholder="Available 5 days/week"
                maxLength="120"
              />
            </div>

            <div className="dash-service-field dash-service-field-wide">
              <label className="dash-service-label" htmlFor="serviceBio">Description</label>
              <textarea
                id="serviceBio"
                name="bio"
                className="dash-service-input dash-service-textarea"
                rows="3"
                value={form.bio}
                onChange={onInput}
                placeholder="Write a short description of your service"
                maxLength="800"
              />
            </div>
          </div>

          <button className="dash-service-submit" type="submit" disabled={submitting}>
            {submitting
              ? isEditing ? "Saving…" : "Adding…"
              : isEditing ? "Save Changes" : "Add Service"}
          </button>
        </form>
      </div>
    </div>
  );
}
