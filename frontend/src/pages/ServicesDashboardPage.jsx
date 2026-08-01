import { useEffect, useMemo, useState } from "react";
import api from "../api/index.js";
import { getCategoryImage } from "../utils/categoryImages";
import ServiceCard from "../components/ServiceCard";

const CATEGORY_GRADIENTS = {
  Barber: "linear-gradient(135deg, #2c2c2c 0%, #4a4a4a 100%)",
  Driving: "linear-gradient(135deg, #162ea3 0%, #2f66ff 100%)",
  Tutoring: "linear-gradient(135deg, #3d5a80 0%, #6b9dc7 100%)",
  "Beauty & Spa": "linear-gradient(135deg, #8b5e7a 0%, #c49ab0 100%)",
  "Health & Wellness": "linear-gradient(135deg, #1a6b5a 0%, #3aab8c 100%)",
};

const ALL_CATEGORIES = ["All", ...Object.keys(CATEGORY_GRADIENTS)];

function ServicesDashboardPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let ignore = false;

    api.get("/enterprise/services/public")
      .then(async (res) => {
        if (ignore) return;

        const normalized = res.data.map((service) => ({
          id: service._id,
          name: service.subject,
          author: service.userId?.name ?? "Service Provider",
          authorId: service.userId?._id ?? null,
          category: service.category ?? "Other",
          rating: null,
          reviews: 0,
          location: "By arrangement",
          description: service.bio || "No description provided yet.",
          price: service.price,
          availability: service.availability || "Availability not specified",
          image: getCategoryImage(service.category),
        }));

        // Fetch ratings for each unique provider in parallel
        const uniqueProviderIds = [...new Set(normalized.map((s) => s.authorId).filter(Boolean))];
        const ratingMap = {};
        await Promise.allSettled(
          uniqueProviderIds.map((pid) =>
            api.get(`/reviews/provider/${pid}`).then((r) => {
              ratingMap[pid] = { avg: r.data.averageRating, count: r.data.count };
            })
          )
        );

        if (ignore) return;
        setServices(normalized.map((s) => {
          const data = ratingMap[s.authorId];
          return data && data.count > 0
            ? { ...s, rating: data.avg, reviews: data.count }
            : s;
        }));
      })
      .catch(() => { if (!ignore) setError("Could not load services."); })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, []);

  const visible = useMemo(() => {
    return services.filter((s) => {
      const categoryMatch = activeCategory === "All" || s.category === activeCategory;
      const queryMatch =
        query.trim() === "" ||
        `${s.name} ${s.author} ${s.location}`.toLowerCase().includes(query.trim().toLowerCase());
      return categoryMatch && queryMatch;
    });
  }, [activeCategory, query, services]);

  return (
    <div className="svc-dashboard">
      <div className="svc-header">
        <div>
          <h1 className="svc-title">Services</h1>
          <p className="svc-subtitle">Browse and book from our trusted professionals</p>
        </div>
        <input
          className="svc-search"
          type="search"
          placeholder="Search by name, location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search services"
        />
      </div>

      <div className="svc-tabs" role="group" aria-label="Filter by category">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`svc-tab ${activeCategory === cat ? "svc-tab-active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="svc-count" aria-live="polite">
        {loading ? "Loading services..." : `${visible.length} ${visible.length === 1 ? "service" : "services"} found`}
      </p>

      {error ? (
        <p className="svc-empty">{error}</p>
      ) : loading ? (
        <p className="svc-empty">Loading services...</p>
      ) : visible.length > 0 ? (
        <ul className="svc-grid">
          {visible.map((service) => (
            <li key={service.id}>
              <ServiceCard service={service} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="svc-empty">No services match your search. Try a different keyword.</p>
      )}
    </div>
  );
}

export default ServicesDashboardPage;
