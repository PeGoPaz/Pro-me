import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/index.js";
import { useAuth } from "../context/AuthContext";
import { StarDisplay } from "../components/StarRating";
import ReviewCard from "../components/ReviewCard";
import ReportDialog from "../components/ReportDialog";

/*
 * The public instructor profile.
 *
 * Block order follows the roadmap's content hierarchy exactly:
 *   photo and name → verification badge, rating, lessons → county and test
 *   centre coverage → category badges → bio → gallery → reviews → save action.
 *
 * Visually it leans Instagram-ish, as the roadmap asks: one large photo, a
 * simple stat row, a photo grid. The point is that an individual instructor
 * should feel like a person, not a directory row.
 *
 * No new backend was needed. This reads GET /api/instructors/:id (which
 * already returns the public slice, with the ADI number and subscription
 * stripped out) and reuses GET /api/reviews/provider/:id.
 */

function InstructorProfilePage() {
  const { instructorId } = useParams();
  const { user } = useAuth();

  const [instructor, setInstructor] = useState(null);
  const [reference, setReference] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState("loading");
  const [isSaved, setIsSaved] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!instructorId) return undefined;
    let ignore = false;

    api.get(`/instructors/${instructorId}`)
      .then((res) => {
        if (ignore) return;
        setInstructor(res.data);
        setStatus("ready");
      })
      .catch((err) => {
        if (ignore) return;
        setStatus(err?.response?.status === 404 ? "missing" : "error");
      });

    return () => { ignore = true; };
  }, [instructorId]);

  /* Slug → display name, so the page shows "Dublin" and "Finglas" rather than
     the slugs the profile stores. */
  useEffect(() => {
    let ignore = false;
    api.get("/reference")
      .then((res) => { if (!ignore) setReference(res.data); })
      .catch(() => {});
    return () => { ignore = true; };
  }, []);

  /* Reviews are keyed on the instructor's user id, not the profile id. */
  const instructorUserId = instructor?.userId ? String(instructor.userId) : null;

  useEffect(() => {
    if (!instructorUserId) return undefined;
    let ignore = false;

    api.get(`/reviews/provider/${instructorUserId}`)
      .then((res) => { if (!ignore) setReviews(res.data.reviews ?? []); })
      .catch(() => {});

    return () => { ignore = true; };
  }, [instructorUserId]);

  const isLearner = user?.role === "user";

  useEffect(() => {
    if (!isLearner || !instructorUserId) return undefined;
    let ignore = false;

    api.get("/favorites")
      .then((res) => {
        if (ignore) return;
        setIsSaved(
          res.data.some((f) => String(f.instructor?._id) === instructorUserId)
        );
      })
      .catch(() => {});

    return () => { ignore = true; };
  }, [isLearner, instructorUserId]);

  const countyLabels = useMemo(
    () => Object.fromEntries((reference?.counties ?? []).map((c) => [c.slug, c.name])),
    [reference]
  );
  const centreLabels = useMemo(
    () => Object.fromEntries((reference?.testCentres ?? []).map((c) => [c.slug, c.name])),
    [reference]
  );
  const categoryLabels = useMemo(
    () => Object.fromEntries((reference?.licenceCategories ?? []).map((c) => [c.code, c.label])),
    [reference]
  );

  const toggleSave = async () => {
    if (!isLearner) {
      window.location.href = "/login";
      return;
    }

    const wasSaved = isSaved;
    setIsSaved(!wasSaved);

    try {
      if (wasSaved) await api.delete(`/favorites/${instructorUserId}`);
      else await api.post("/favorites", { instructorId: instructorUserId });
    } catch {
      setIsSaved(wasSaved);
    }
  };

  if (status === "loading") {
    return <div className="ip-state">Loading profile…</div>;
  }

  if (status === "missing") {
    return (
      <div className="ip-state">
        <h1 className="ip-state-title">Instructor not found</h1>
        <p>
          This profile may have been removed, or it is not currently listed.{" "}
          <Link to="/instructors" className="legal-link">Back to search</Link>
        </p>
      </div>
    );
  }

  if (status === "error" || !instructor) {
    return (
      <div className="ip-state">
        <p>Could not load this profile. Please try again.</p>
      </div>
    );
  }

  const initials = (instructor.name ?? "")
    .split(" ").filter(Boolean).slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  const gallery = instructor.gallery ?? [];

  return (
    <div className="ip-page">
      {/* 1 + 2 — photo, name, then the trust signals, highest on the page */}
      <header className="ip-header">
        <div className="ip-avatar">
          {instructor.profilePhotoUrl ? (
            <img src={instructor.profilePhotoUrl} alt={instructor.name} className="ip-avatar-img" />
          ) : (
            <span className="ip-avatar-initials">{initials || "DI"}</span>
          )}
        </div>

        <div className="ip-identity">
          <h1 className="ip-name">
            {instructor.name}
            {instructor.isVerified && (
              <span className="ip-verified" title="ADI number checked against the RSA register">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2l7 3v6c0 4.5-3 8.6-7 11-4-2.4-7-6.5-7-11V5l7-3z"
                    stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Verified ADI
              </span>
            )}
          </h1>

          {instructor.headline && <p className="ip-headline">{instructor.headline}</p>}

          {/* The simple stat row the roadmap asks for */}
          <div className="ip-stats">
            <div className="ip-stat">
              {instructor.averageRating !== null ? (
                <>
                  <span className="ip-stat-value">{instructor.averageRating.toFixed(1)}</span>
                  <span className="ip-stat-label">
                    {instructor.reviewCount} {instructor.reviewCount === 1 ? "review" : "reviews"}
                  </span>
                </>
              ) : (
                <>
                  <span className="ip-stat-value ip-stat-value-muted">—</span>
                  <span className="ip-stat-label">No reviews yet</span>
                </>
              )}
            </div>

            <div className="ip-stat">
              <span className="ip-stat-value">{instructor.lessonsDone ?? 0}</span>
              {/* Never let this read as a verified figure. */}
              <span className="ip-stat-label">
                lessons{instructor.lessonsDoneIsSelfReported && " (self-reported)"}
              </span>
            </div>

            <div className="ip-stat">
              <span className={`ip-stat-value ${instructor.acceptingNewStudents ? "ip-stat-open" : "ip-stat-closed"}`}>
                {instructor.acceptingNewStudents ? "Open" : "Closed"}
              </span>
              <span className="ip-stat-label">
                {instructor.acceptingNewStudents ? "taking students" : "not taking students"}
              </span>
            </div>
          </div>

          {!instructor.isVerified && (
            /* Unverified profiles are listed but must say so plainly — the
               whole trust proposition depends on the distinction being visible. */
            <p className="ip-unverified-note">
              This instructor's ADI number has not been checked against the RSA
              register yet.
            </p>
          )}
        </div>

        {/* 8 — the action */}
        <div className="ip-actions">
          <button
            type="button"
            className={`ip-save ${isSaved ? "ip-save-on" : ""}`}
            onClick={toggleSave}
            aria-pressed={isSaved}
          >
            <svg width="16" height="16" viewBox="0 0 24 24"
              fill={isSaved ? "currentColor" : "none"} aria-hidden="true">
              <path d="M6 4h12a1 1 0 011 1v15l-7-4-7 4V5a1 1 0 011-1z"
                stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            {isSaved ? "Saved" : "Save"}
          </button>

          {instructor.pricePerLesson !== null && instructor.pricePerLesson !== undefined && (
            <p className="ip-price">
              €{instructor.pricePerLesson}
              <span className="ip-price-unit"> / lesson</span>
            </p>
          )}
        </div>
      </header>

      {/* 3 — coverage */}
      <section className="ip-section">
        <h2 className="ip-section-title">Where they teach</h2>
        <div className="ip-chips">
          {(instructor.counties ?? []).map((slug) => (
            <span key={slug} className="inst-chip inst-chip-county">
              {countyLabels[slug] ?? slug}
            </span>
          ))}
        </div>
        {(instructor.testCentres ?? []).length > 0 && (
          <>
            <p className="ip-subtle">Test centres served</p>
            <div className="ip-chips">
              {instructor.testCentres.map((slug) => (
                <span key={slug} className="inst-chip inst-chip-centre">
                  {centreLabels[slug] ?? slug}
                </span>
              ))}
            </div>
          </>
        )}
      </section>

      {/* 4 — category badges: letter plus transmission, kept on separate axes */}
      <section className="ip-section">
        <h2 className="ip-section-title">What they teach</h2>
        <div className="ip-chips">
          {(instructor.licenceCategories ?? []).map((code) => (
            <span key={code} className="inst-chip inst-chip-cat">
              {categoryLabels[code] ? `${categoryLabels[code]} (${code})` : code}
            </span>
          ))}
          {(instructor.transmission ?? []).map((value) => (
            <span key={value} className="inst-chip inst-chip-trans">
              {value === "automatic" ? "Automatic" : "Manual"}
            </span>
          ))}
        </div>
      </section>

      {/* 5 — bio */}
      {instructor.bio && (
        <section className="ip-section">
          <h2 className="ip-section-title">About</h2>
          <p className="ip-bio">{instructor.bio}</p>
        </section>
      )}

      {/* 6 — gallery. Hidden entirely when empty rather than showing a hole. */}
      {gallery.length > 0 && (
        <section className="ip-section">
          <h2 className="ip-section-title">Photos</h2>
          <ul className="ip-gallery">
            {gallery.map((url, index) => (
              <li key={url}>
                <button
                  type="button"
                  className="ip-gallery-item"
                  onClick={() => setLightbox(url)}
                  aria-label={`Open photo ${index + 1}`}
                >
                  <img src={url} alt="" loading="lazy" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 7 — reviews */}
      <section className="ip-section">
        <h2 className="ip-section-title">
          Reviews
          {instructor.reviewCount > 0 && (
            <span className="ip-review-summary">
              <StarDisplay rating={instructor.averageRating} size={14} />
              {instructor.averageRating.toFixed(1)} · {instructor.reviewCount}
            </span>
          )}
        </h2>

        {reviews.length === 0 ? (
          <p className="ip-subtle">No reviews yet.</p>
        ) : (
          <ul className="ip-reviews">
            {reviews.map((review) => (
              <li key={review._id}>
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* DSA Article 16 — available to everyone, signed in or not. */}
      <div className="report-trigger-row">
        <button type="button" className="report-trigger" onClick={() => setReportOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 9v4M12 17h.01M10.3 3.9L2.4 17.6A2 2 0 004.1 20.6h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Report this profile
        </button>
      </div>

      {reportOpen && (
        <ReportDialog
          targetType="profile"
          targetId={instructorUserId}
          targetLabel={instructor.name}
          onClose={() => setReportOpen(false)}
        />
      )}

      {lightbox && (
        <div className="ip-lightbox" onClick={() => setLightbox(null)} role="presentation">
          <img src={lightbox} alt="" className="ip-lightbox-img" />
        </div>
      )}
    </div>
  );
}

export default InstructorProfilePage;
