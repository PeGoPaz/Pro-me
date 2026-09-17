import { Link } from "react-router-dom";
import HomeHero from "../components/HomeHero";

/*
 * The landing page.
 *
 * It used to carry a category dropdown and a grid of generic "services" left
 * over from the multi-vertical marketplace. Both are gone: the product is a
 * driving-instructor directory, and search lives on its own page with real
 * filters (county, test centre, category, transmission) that a category
 * dropdown could never stand in for.
 *
 * What is left is the hero, a short explanation of why this exists next to the
 * RSA's own free register, and a way into the search.
 */

const TRUST_POINTS = [
  {
    title: "Verified ADI status",
    copy: "We check instructor numbers against the RSA's public register. Unverified profiles are listed, but clearly marked as such.",
  },
  {
    title: "Search the way Ireland works",
    copy: "Filter by county and by the 62 RSA test centres — not by a vague postcode box.",
  },
  {
    title: "Reviews from real learners",
    copy: "Ratings sit next to the instructor, and self-reported figures are always labelled as self-reported.",
  },
];

function HomePage() {
  return (
    <>
      <HomeHero />

      <section className="home-trust">
        <p className="overview-eyebrow">Why Pro.me</p>
        <h2 className="home-trust-title">
          The RSA register tells you who is approved.
          <br />
          We help you choose between them.
        </h2>

        <ul className="home-trust-grid">
          {TRUST_POINTS.map((point) => (
            <li key={point.title} className="home-trust-card">
              <h3 className="home-trust-card-title">{point.title}</h3>
              <p className="home-trust-card-copy">{point.copy}</p>
            </li>
          ))}
        </ul>

        <div className="home-trust-actions">
          <Link className="button button-primary" to="/instructors">
            Find an instructor
          </Link>
          <Link className="button button-ghost" to="/register">
            Join as an instructor
          </Link>
        </div>
      </section>
    </>
  );
}

export default HomePage;
