import { Link } from "react-router-dom";

/* Human-readable labels for each service category badge */
const CATEGORY_LABELS = {
  barber: "Barber",
  driving: "Driving",
  tutoring: "Tutoring",
};

/*
 * ServiceResults — renders a responsive grid of service cards.
 * Receives the already-filtered list from HomePage; all filtering
 * logic lives in the parent component.
 */
function ServiceResults({ services }) {
  /* Empty state — shown when filters match nothing */
  if (services.length === 0) {
    return (
      <p className="results-empty" role="status">
        No providers found. Try a different location or category.
      </p>
    );
  }

  return (
    <ul className="results-grid" aria-live="polite">
      {services.map((service) => (
        <li key={service.id} className="service-card">
          {/* Category badge — uses the label map with a fallback */}
          <span className="service-badge">
            {CATEGORY_LABELS[service.category] ?? service.category}
          </span>

          <h3 className="service-card-title">{service.title}</h3>
          <p className="service-card-location">{service.location}</p>

          {/* Rating and price displayed side by side */}
          <div className="service-card-meta">
            <span className="service-rating">★ {service.rating}</span>
            <span className="service-price">€{service.price}</span>
          </div>

          {/* Flexible spacer keeps the book button pinned to the card bottom */}
          <span className="service-card-spacer" />

          {/*
           * Book now navigates to the booking page.
           * The serviceId query param will be read by BookingPage to pre-select
           * the service — actual API call happens on booking form submit.
           */}
          <Link
            className="button button-primary service-card-btn"
            to={`/booking?service=${service.id}`}
          >
            Book now
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default ServiceResults;
