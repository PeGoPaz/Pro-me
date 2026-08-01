import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/index.js";

const CATEGORY_COLORS = {
  Barber:               { bg: "#2c2c2c", text: "#fff" },
  Driving:              { bg: "#1e4bdd", text: "#fff" },
  Tutoring:             { bg: "#3d5a80", text: "#fff" },
  "Beauty & Spa":       { bg: "#8b5e7a", text: "#fff" },
  "Health & Wellness":  { bg: "#1a6b5a", text: "#fff" },
  Other:                { bg: "#555",    text: "#fff" },
};

const ALL_CATEGORIES = ["All", ...Object.keys(CATEGORY_COLORS).filter((k) => k !== "Other")];

function ProviderCard({ provider }) {
  const initials = provider.name
    .split(" ").filter(Boolean).slice(0, 2)
    .map((w) => w[0]?.toUpperCase()).join("");

  const ratingLabel =
    typeof provider.rating === "number" ? provider.rating.toFixed(1) : null;

  return (
    <article className="prov-card">
      <div className="prov-card-top">
        <div className="prov-card-avatar">
          {provider.avatarUrl ? (
            <img src={provider.avatarUrl} alt={provider.name} className="prov-card-avatar-img" />
          ) : (
            <span className="prov-card-avatar-initials">{initials || "SP"}</span>
          )}
        </div>

        <div className="prov-card-info">
          <h3 className="prov-card-name">{provider.name}</h3>
          <p className="prov-card-meta">
            {provider.serviceCount} {provider.serviceCount === 1 ? "service" : "services"}
          </p>

          {ratingLabel ? (
            <p className="prov-card-rating">
              <span className="prov-card-star">★</span>
              {ratingLabel}
              <span className="prov-card-reviews">
                &nbsp;({provider.reviewCount} {provider.reviewCount === 1 ? "review" : "reviews"})
              </span>
            </p>
          ) : (
            <p className="prov-card-rating prov-card-rating-new">New provider</p>
          )}
        </div>
      </div>

      <div className="prov-card-categories">
        {provider.categories.map((cat) => {
          const color = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other;
          return (
            <span
              key={cat}
              className="prov-card-cat-badge"
              style={{ background: color.bg, color: color.text }}
            >
              {cat}
            </span>
          );
        })}
      </div>

      <Link to={`/providers/${provider.id}`} className="prov-card-btn">
        View Profile
      </Link>
    </article>
  );
}

function ProviderListingsPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    let ignore = false;

    api.get("/enterprise/services/public")
      .then(async (res) => {
        if (ignore) return;

        // Group services by provider
        const map = new Map();
        for (const service of res.data) {
          const id = service.userId?._id;
          if (!id) continue;

          if (!map.has(id)) {
            map.set(id, {
              id,
              name: service.userId?.name ?? "Unknown",
              avatarUrl: service.userId?.avatarUrl ?? null,
              categories: new Set(),
              serviceCount: 0,
              rating: null,
              reviewCount: 0,
            });
          }

          const entry = map.get(id);
          entry.serviceCount += 1;
          if (service.category) entry.categories.add(service.category);
        }

        // Convert sets to arrays
        const providerList = [...map.values()].map((p) => ({
          ...p,
          categories: [...p.categories],
        }));

        // Fetch ratings in parallel
        await Promise.allSettled(
          providerList.map((p) =>
            api.get(`/reviews/provider/${p.id}`).then((r) => {
              if (r.data.count > 0) {
                p.rating = r.data.averageRating;
                p.reviewCount = r.data.count;
              }
            })
          )
        );

        if (!ignore) setProviders(providerList);
      })
      .catch(() => { if (!ignore) setError("Could not load providers."); })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, []);

  const visible = useMemo(() => {
    return providers.filter((p) => {
      const categoryMatch =
        activeCategory === "All" || p.categories.includes(activeCategory);
      const queryMatch =
        query.trim() === "" ||
        p.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        p.categories.some((c) => c.toLowerCase().includes(query.trim().toLowerCase()));
      return categoryMatch && queryMatch;
    });
  }, [providers, query, activeCategory]);

  return (
    <div className="svc-dashboard">
      <div className="svc-header">
        <div>
          <h1 className="svc-title">Service Providers</h1>
          <p className="svc-subtitle">Find trusted professionals and book their services</p>
        </div>
        <input
          className="svc-search"
          type="search"
          placeholder="Search by name or category…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search providers"
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
        {loading
          ? "Loading providers..."
          : `${visible.length} ${visible.length === 1 ? "provider" : "providers"} found`}
      </p>

      {error ? (
        <p className="svc-empty">{error}</p>
      ) : loading ? (
        <p className="svc-empty">Loading providers...</p>
      ) : visible.length > 0 ? (
        <ul className="prov-grid">
          {visible.map((p) => (
            <li key={p.id}>
              <ProviderCard provider={p} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="svc-empty">No providers match your search. Try a different keyword.</p>
      )}
    </div>
  );
}

export default ProviderListingsPage;
