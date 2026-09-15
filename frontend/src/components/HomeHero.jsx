import { Link } from "react-router-dom";

/* HomeHero — above-the-fold banner for the Pro.me landing page */
function HomeHero() {
  return (
    <section className="hero">
      {/*
       * hero::before and hero::after in index.css render decorative radial
       * glows in the top-right and bottom-left corners of this card.
       */}

      {/* Text content — sits above the CSS blob decorations via position:relative */}
      <div className="hero-content">
        <p className="eyebrow">Driving lessons in Ireland</p>

        <h1>
          Find a driving instructor
          <br />
          you can trust.
        </h1>

        <p className="hero-copy">
          Compare approved driving instructors across Ireland by county, test
          centre and what they teach — with verified ADI status and real reviews.
        </p>

        <div className="hero-actions">
          {/* Primary CTA — navigates to the provider listings page */}
          <Link className="button button-light" to="/instructors">
            Find an instructor
          </Link>

          {/* Secondary CTA — opens the registration form */}
          <Link className="button button-outline-light" to="/register">
            Join as an instructor
          </Link>
        </div>
      </div>

      {/*
       * Stats bar — static figures shown beneath the headline.
       * These will be replaced by real data from GET /api/stats
       * in the next development iteration.
       */}
      <div className="hero-stats">
        <div className="hero-stat">
          <span className="hero-stat-value">10,000+</span>
          <span className="hero-stat-label">Active users</span>
        </div>

        <span className="hero-stat-divider" aria-hidden="true" />

        <div className="hero-stat">
          <span className="hero-stat-value">4.8 / 5</span>
          <span className="hero-stat-label">Average rating</span>
        </div>

        <span className="hero-stat-divider" aria-hidden="true" />

        <div className="hero-stat">
          <span className="hero-stat-value">50,000+</span>
          <span className="hero-stat-label">Bookings made</span>
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
