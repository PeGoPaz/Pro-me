import { useRef } from "react";

function initials(name) {
  const parts = (name || "?").trim().split(" ");
  return (
    parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].slice(0, 2)
  ).toUpperCase();
}

/**
 * Avatar panel used in both customer and provider dashboards.
 * Shows the profile photo (or initials), an "Upload photo" button,
 * and calls onOpen when the photo is clicked.
 *
 * Props:
 *   name        — user's full name
 *   avatarUrl   — URL of the current photo, or ""
 *   uploading   — boolean
 *   error       — string | ""
 *   onUpload    — called with the selected File
 *   onOpen      — called when the photo is clicked (for lightbox)
 */
export default function DashboardAvatar({ name, avatarUrl, uploading, error, onUpload, onOpen }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onUpload(file);
  };

  return (
    <div className="dash-avatar-panel">
      {avatarUrl ? (
        <button
          type="button"
          className="dash-avatar-open-btn"
          onClick={onOpen}
          aria-label="Open profile photo"
        >
          <img src={avatarUrl} alt={name} className="dash-avatar-img" />
        </button>
      ) : (
        <span className="dash-avatar">{initials(name)}</span>
      )}

      <button
        type="button"
        className="dash-avatar-upload-btn"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading…" : "Upload photo"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="dash-avatar-input"
        onChange={handleChange}
      />

      {error && <p className="dash-avatar-error">{error}</p>}
    </div>
  );
}
