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
       * Coverage bar.
       *
       * This used to read "10,000+ active users" and "50,000+ bookings made" —
       * invented figures on a platform with no users at all. On a product whose
       * entire pitch is that its numbers can be trusted, made-up social proof
       * is the one thing we cannot ship; it is also the kind of claim the CCPC
       * treats as a misleading commercial practice.
       *
       * These three are facts, and they come from the committed RSA reference
       * data (backend/data/) rather than from a marketing deck.
       */}
      <div className="hero-stats">
        <div className="hero-stat">
          <span className="hero-stat-value">26</span>
          <span className="hero-stat-label">Counties covered</span>
        </div>

        <span className="hero-stat-divider" aria-hidden="true" />

        <div className="hero-stat">
          <span className="hero-stat-value">62</span>
          <span className="hero-stat-label">RSA test centres</span>
        </div>

        <span className="hero-stat-divider" aria-hidden="true" />

        <div className="hero-stat">
          <span className="hero-stat-value">ADI</span>
          <span className="hero-stat-label">Verified against the register</span>
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
