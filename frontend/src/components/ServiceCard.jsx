import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCategoryImage } from "../utils/categoryImages";

const CATEGORY_GRADIENTS = {
  Barber:            "linear-gradient(135deg, #2c2c2c 0%, #4a4a4a 100%)",
  Driving:           "linear-gradient(135deg, #162ea3 0%, #2f66ff 100%)",
  Tutoring:          "linear-gradient(135deg, #3d5a80 0%, #6b9dc7 100%)",
  "Beauty & Spa":    "linear-gradient(135deg, #8b5e7a 0%, #c49ab0 100%)",
  "Health & Wellness": "linear-gradient(135deg, #1a6b5a 0%, #3aab8c 100%)",
};

/**
 * A single service card for the public browse page.
 * Handles "Book Appointment" routing based on auth state.
 */
export default function ServiceCard({ service }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBook = () => {
    if (user?.role === "user") {
      navigate(`/booking?service=${service.id}`);
    } else {
      navigate("/login");
    }
  };

  const gradient = CATEGORY_GRADIENTS[service.category] ?? "linear-gradient(135deg, #555 0%, #888 100%)";
  const image = service.image || getCategoryImage(service.category);
  const ratingLabel = typeof service.rating === "number" ? service.rating.toFixed(1) : "New";
  const reviewsCount = Number.isFinite(service.reviews) ? service.reviews : 0;

  return (
    <article className="svc-card">
      <div
        className="svc-card-image"
        style={{ background: image ? undefined : gradient }}
        role="img"
        aria-label={`${service.name} cover image`}
      >
        {image && <img src={image} alt={service.name} className="svc-card-img-tag" />}
        <span className="svc-card-badge">{service.category}</span>
      </div>

      <div className="svc-card-body">
        <h3 className="svc-card-name">{service.name}</h3>
        <p className="svc-card-author">
          by{" "}
          {service.authorId ? (
            <Link to={`/providers/${service.authorId}`} className="svc-card-author-link">
              {service.author}
            </Link>
          ) : (
            service.author
          )}
        </p>

        <div className="svc-card-meta">
          <span className="svc-card-rating">
            ★ {ratingLabel}
            <span className="svc-card-reviews"> ({reviewsCount})</span>
          </span>
          <span className="svc-card-location">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
                fill="#888"
              />
            </svg>
            {service.location}
          </span>
        </div>

        <p className="svc-card-desc">{service.description}</p>
        <p className="svc-card-price-label">Services from:</p>
        <p className="svc-card-price">€{service.price}</p>

        <p className="svc-card-avail">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="#888" strokeWidth="2" />
            <path d="M12 7v5l3 3" stroke="#888" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {service.availability}
        </p>

        <button type="button" className="svc-card-btn" onClick={handleBook}>
          Book Appointment
        </button>
      </div>
    </article>
  );
}
