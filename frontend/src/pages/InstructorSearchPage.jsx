import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/index.js";
import { useAuth } from "../context/AuthContext";
import InstructorCard from "../components/InstructorCard";

/*
 * One list-based search page with filters — not a separate SEO page per county
 * or test centre, which the roadmap rules out for now.
 *
 * Filter options come from /api/reference rather than being hard-coded here.
 * That endpoint is the single source of truth for counties, centres and
 * categories, which is what stops this drifting the way the old marketplace's
 * five copies of the category list did.
 *
 * Filter state lives in the URL so a search can be shared and survives a
 * refresh.
 */

const EMPTY_REFERENCE = {
  counties: [],
  testCentres: [],
  licenceCategories: [],
  transmissions: [],
};

/* Module-level so it is referentially stable across renders. */
const EMPTY_SAVED = new Set();

function InstructorSearchPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [reference, setReference] = useState(EMPTY_REFERENCE);
  const [referenceError, setReferenceError] = useState("");
  const [savedIds, setSavedIds] = useState(EMPTY_SAVED);

  /* One keyed payload rather than separate results/total/loading/error states.
     Loading is derived by comparing the payload's key with the current query,
     which avoids setting state synchronously inside the effect (that triggers
     a cascading re-render) and makes a stale response impossible to show. */
  const [payload, setPayload] = useState(null);
  const queryKey = searchParams.toString();
  const loading = payload?.key !== queryKey;
  const results = payload?.results ?? [];
  const total = payload?.total ?? 0;
  const sortExplanation = payload?.sortExplanation ?? "";
  const error = payload?.error ?? referenceError;

  const filters = useMemo(
    () => ({
      county: searchParams.get("county") ?? "",
      testCentre: searchParams.get("testCentre") ?? "",
      category: searchParams.get("category") ?? "",
      transmission: searchParams.get("transmission") ?? "",
      maxPrice: searchParams.get("maxPrice") ?? "",
      acceptingNewStudents: searchParams.get("acceptingNewStudents") === "true",
      sort: searchParams.get("sort") ?? "trust",
    }),
    [searchParams]
  );

  /* Reference data loads once — it is static and cached for a day. */
  useEffect(() => {
    let ignore = false;
    api.get("/reference")
      .then((res) => { if (!ignore) setReference(res.data); })
      .catch(() => { if (!ignore) setReferenceError("Could not load the filter options."); });
    return () => { ignore = true; };
  }, []);

  /* Results refetch whenever the query changes. The response is stamped with
     the key it was fetched for, so a slow earlier request can never overwrite
     a newer one's results. */
  useEffect(() => {
    let ignore = false;

    api.get(`/instructors?${queryKey}`)
      .then((res) => {
        if (ignore) return;
        setPayload({
          key: queryKey,
          results: res.data.results ?? [],
          total: res.data.total ?? 0,
          sortExplanation: res.data.sortExplanation ?? "",
          error: "",
        });
      })
      .catch(() => {
        if (ignore) return;
        setPayload({
          key: queryKey,
          results: [],
          total: 0,
          sortExplanation: "",
          error: "Could not load instructors. Please try again.",
        });
      });

    return () => { ignore = true; };
  }, [queryKey]);

  /* Saving is auth-gated, so only fetch the shortlist for a signed-in learner.
     A non-learner simply never populates it — clearing it here would be a
     synchronous setState in an effect body. */
  const isLearner = user?.role === "user";

  useEffect(() => {
    if (!isLearner) return undefined;

    let ignore = false;
    api.get("/favorites")
      .then((res) => {
        if (ignore) return;
        setSavedIds(new Set(res.data.map((f) => String(f.instructor?._id)).filter(Boolean)));
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, [isLearner]);

  /* Signing out must drop the saved highlighting immediately, without waiting
     for a refetch. */
  const effectiveSaved = isLearner ? savedIds : EMPTY_SAVED;

  const updateFilter = useCallback(
    (key, value) => {
      const next = new URLSearchParams(searchParams);
      if (value === "" || value === false || value === null) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
      /* Any filter change puts you back on page one — staying on page 4 of a
         result set that no longer has four pages is a dead end. */
      next.delete("page");
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const clearFilters = () => setSearchParams(new URLSearchParams());

  const toggleSave = async (instructorUserId) => {
    if (!isLearner) {
      window.location.href = "/login";
      return;
    }

    const id = String(instructorUserId);
    const wasSaved = savedIds.has(id);

    /* Optimistic — a save that silently lags feels broken. */
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      if (wasSaved) await api.delete(`/favorites/${id}`);
      else await api.post("/favorites", { instructorId: id });
    } catch {
      /* Roll back so the icon never lies about what is saved. */
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  /* Slug → display name, so cards can show "Dublin" not "dublin". */
  const countyLabels = useMemo(
    () => Object.fromEntries(reference.counties.map((c) => [c.slug, c.name])),
    [reference.counties]
  );
  const centreLabels = useMemo(
    () => Object.fromEntries(reference.testCentres.map((c) => [c.slug, c.name])),
    [reference.testCentres]
  );

  /* Picking a county narrows the centre list — 62 centres in one dropdown is
     unusable, and centres outside the chosen county are noise. */
  const visibleCentres = useMemo(() => {
    if (!filters.county) return reference.testCentres;
    return reference.testCentres.filter((centre) => centre.county === filters.county);
  }, [reference.testCentres, filters.county]);

  const activeFilterCount = [
    filters.county, filters.testCentre, filters.category,
    filters.transmission, filters.maxPrice,
  ].filter(Boolean).length + (filters.acceptingNewStudents ? 1 : 0);

  return (
    <div className="inst-search">
      <header className="inst-search-head">
        <h1 className="inst-search-title">Find a driving instructor</h1>
        <p className="inst-search-sub">
          Approved driving instructors across Ireland — filter by county, test
          centre and what they teach.
        </p>
      </header>

      <div className="inst-search-body">
        <aside className="inst-filters" aria-label="Filters">
          <div className="inst-filters-head">
            <h2 className="inst-filters-title">Filters</h2>
            {activeFilterCount > 0 && (
              <button type="button" className="inst-filters-clear" onClick={clearFilters}>
                Clear all ({activeFilterCount})
              </button>
            )}
          </div>

          <label className="inst-filter">
            <span className="inst-filter-label">County</span>
            <select
              value={filters.county}
              onChange={(e) => {
                const county = e.target.value;
                const next = new URLSearchParams(searchParams);
                if (county) next.set("county", county);
                else next.delete("county");
                /* A centre from the old county would contradict the new one. */
                next.delete("testCentre");
                next.delete("page");
                setSearchParams(next);
              }}
            >
              <option value="">All counties</option>
              {reference.counties.map((county) => (
                <option key={county.slug} value={county.slug}>{county.name}</option>
              ))}
            </select>
          </label>

          <label className="inst-filter">
            <span className="inst-filter-label">Test centre</span>
            <select
              value={filters.testCentre}
              onChange={(e) => updateFilter("testCentre", e.target.value)}
            >
              <option value="">
                {filters.county ? "All centres in this county" : "All test centres"}
              </option>
              {visibleCentres.map((centre) => (
                <option key={centre.slug} value={centre.slug}>{centre.name}</option>
              ))}
            </select>
          </label>

          <label className="inst-filter">
            <span className="inst-filter-label">Licence category</span>
            <select
              value={filters.category}
              onChange={(e) => updateFilter("category", e.target.value)}
            >
              <option value="">Any category</option>
              {reference.licenceCategories.map((cat) => (
                <option key={cat.code} value={cat.code}>
                  {cat.label} (Category {cat.code})
                </option>
              ))}
            </select>
          </label>

          <label className="inst-filter">
            <span className="inst-filter-label">Transmission</span>
            <select
              value={filters.transmission}
              onChange={(e) => updateFilter("transmission", e.target.value)}
            >
              <option value="">Either</option>
              {reference.transmissions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="inst-filter">
            <span className="inst-filter-label">Max price per lesson</span>
            <input
              type="number"
              min="0"
              step="5"
              placeholder="Any price"
              value={filters.maxPrice}
              onChange={(e) => updateFilter("maxPrice", e.target.value)}
            />
          </label>

          <label className="inst-filter inst-filter-check">
            <input
              type="checkbox"
              checked={filters.acceptingNewStudents}
              onChange={(e) => updateFilter("acceptingNewStudents", e.target.checked)}
            />
            <span>Only taking new students</span>
          </label>
        </aside>

        <section className="inst-results">
          <div className="inst-results-head">
            <p className="inst-results-count" aria-live="polite">
              {loading
                ? "Searching…"
                : `${total} ${total === 1 ? "instructor" : "instructors"} found`}
            </p>

            <label className="inst-sort">
              <span className="inst-sort-label">Sort by</span>
              <select
                value={filters.sort}
                onChange={(e) => updateFilter("sort", e.target.value)}
              >
                <option value="trust">Most trusted</option>
                <option value="price_low">Price: low to high</option>
                <option value="price_high">Price: high to low</option>
                <option value="newest">Newest</option>
              </select>
            </label>
          </div>

          {/* The roadmap asks for the ranking to be explained rather than
              left implicit. The API states it; we show it. */}
          {filters.sort === "trust" && sortExplanation && (
            <p className="inst-sort-note">{sortExplanation}</p>
          )}

          {error ? (
            <p className="inst-empty">{error}</p>
          ) : loading ? (
            <p className="inst-empty">Loading instructors…</p>
          ) : results.length === 0 ? (
            <div className="inst-empty-block">
              <p className="inst-empty">No instructors match these filters yet.</p>
              {activeFilterCount > 0 && (
                <button type="button" className="button button-ghost" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <ul className="inst-grid">
              {results.map((instructor) => (
                <li key={instructor.id}>
                  <InstructorCard
                    instructor={instructor}
                    countyLabels={countyLabels}
                    centreLabels={centreLabels}
                    isSaved={effectiveSaved.has(String(instructor.userId))}
                    onToggleSave={toggleSave}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default InstructorSearchPage;
