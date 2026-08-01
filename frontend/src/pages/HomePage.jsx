import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import HomeHero from "../components/HomeHero";
import ServiceCard from "../components/ServiceCard";
import api from "../api/index.js";
import { getCategoryImage } from "../utils/categoryImages";

const CATEGORIES = ["All", "Barber", "Driving", "Tutoring", "Beauty & Spa", "Health & Wellness"];

function HomePage() {
  const [category, setCategory] = useState("All");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchServices = () => {
    setLoading(true);
    api.get("/enterprise/services/public")
      .then((res) => {
        setServices(res.data.map((s) => ({
          id: s._id,
          name: s.subject,
          author: s.userId?.name ?? "Service Provider",
          authorId: s.userId?._id ?? null,
          category: s.category ?? "Other",
          rating: null,
          reviews: 0,
          location: "By arrangement",
          description: s.bio || "No description provided yet.",
          price: s.price,
          availability: s.availability || "Availability not specified",
          image: getCategoryImage(s.category),
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const visible = useMemo(() => {
    if (category === "All") return services;
    return services.filter((s) => s.category === category);
  }, [category, services]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searched) {
      fetchServices();
      setSearched(true);
    }
    // if already searched, just re-filter (visible memo updates automatically)
  };

  return (
    <>
      <HomeHero />

      {/* Search section */}
      <section className="search-section">
        <h2 className="search-section-title search-section-title-lg">Find your next appointment</h2>
        <form className="search-bar search-bar-simple" onSubmit={handleSearch} noValidate>
          <label className="search-field">
            <span className="search-field-label">Service type</span>
            <select name="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat === "All" ? "All services" : cat}</option>
              ))}
            </select>
          </label>
          <button className="search-icon-btn" type="submit" aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </form>
      </section>

      {/* Services grid — shown only after Search is clicked */}
      {searched && (
        <section className="home-services-section">
          <div className="home-services-head">
            <h2 className="home-services-title">Available Services</h2>
            <Link to="/services" className="home-services-see-all">See all →</Link>
          </div>

          {loading ? (
            <p className="svc-empty">Loading services…</p>
          ) : visible.length === 0 ? (
            <p className="svc-empty">No services in this category yet.</p>
          ) : (
            <ul className="svc-grid">
              {visible.slice(0, 6).map((service) => (
                <li key={service.id}>
                  <ServiceCard service={service} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* CTA band */}
      <section className="cta">
        <p className="overview-eyebrow">Why Pro.me</p>
        <h2>Pro.me connects customers and local professionals in one flow.</h2>
        <p className="overview-copy">
          Fast discovery, reliable booking, and clear schedule management for
          everyone — customers and service providers alike.
        </p>

        <div className="overview-stats">
          <article className="stat-card">
            <p className="stat-value">10,000+</p>
            <p className="stat-label">Active users</p>
          </article>
          <article className="stat-card">
            <p className="stat-value">4.8 / 5</p>
            <p className="stat-label">Average rating</p>
          </article>
          <article className="stat-card">
            <p className="stat-value">50,000+</p>
            <p className="stat-label">Bookings made</p>
          </article>
        </div>

        <div className="overview-actions">
          <Link className="button button-light" to="/services">Find services</Link>
          <Link className="button button-outline-light" to="/register">Join as provider</Link>
        </div>
      </section>
    </>
  );
}

export default HomePage;
