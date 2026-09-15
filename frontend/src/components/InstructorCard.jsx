import { Link } from "react-router-dom";

/*
 * A single instructor in the search results.
 *
 * Information order follows the roadmap's profile hierarchy: photo, then trust
 * signals, then coverage, then what they teach, then price. Trust sits high on
 * purpose — it is the whole reason to use this over the RSA's free register.
 */
function InstructorCard({
  instructor,
  countyLabels = {},
  centreLabels = {},
  isSaved = false,
  onToggleSave,
}) {
  const initials = (instructor.name ?? "")
    .split(" ").filter(Boolean).slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  const rating =
    typeof instructor.averageRating === "number"
      ? instructor.averageRating.toFixed(1)
      : null;

  const counties = (instructor.counties ?? []).map((slug) => countyLabels[slug] ?? slug);
  const centres = (instructor.testCentres ?? []).map((slug) => centreLabels[slug] ?? slug);

  return (
    <article className="inst-card">
      <div className="inst-card-head">
        <div className="inst-card-avatar">
          {instructor.profilePhotoUrl ? (
            <img
              src={instructor.profilePhotoUrl}
              alt={instructor.name ?? "Instructor"}
              className="inst-card-avatar-img"
            />
          ) : (
            <span className="inst-card-avatar-initials">{initials || "DI"}</span>
          )}
        </div>

        <div className="inst-card-identity">
          <h3 className="inst-card-name">
            {instructor.name ?? "Driving instructor"}
            {instructor.isVerified && (
              <span className="inst-badge-verified" title="ADI number checked against the RSA register">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2l7 3v6c0 4.5-3 8.6-7 11-4-2.4-7-6.5-7-11V5l7-3z"
                    stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Verified ADI
              </span>
            )}
          </h3>

          {instructor.headline && (
            <p className="inst-card-headline">{instructor.headline}</p>
          )}

          <div className="inst-card-stats">
            {rating ? (
              <span className="inst-card-rating">
                ★ {rating}
                <span className="inst-card-reviews">
                  &nbsp;({instructor.reviewCount}{" "}
                  {instructor.reviewCount === 1 ? "review" : "reviews"})
                </span>
              </span>
            ) : (
              <span className="inst-card-rating inst-card-rating-new">No reviews yet</span>
            )}

            {instructor.lessonsDone > 0 && (
              /* The roadmap is explicit: until this is corroborated it must be
                 labelled wherever it appears, because the instructor types it. */
              <span className="inst-card-lessons">
                {instructor.lessonsDone} lessons
                {instructor.lessonsDoneIsSelfReported && (
                  <span className="inst-card-selfreported"> (self-reported)</span>
                )}
              </span>
            )}
          </div>
        </div>

        {onToggleSave && (
          <button
            type="button"
            className={`inst-card-save ${isSaved ? "inst-card-save-on" : ""}`}
            onClick={() => onToggleSave(instructor.userId)}
            aria-pressed={isSaved}
            aria-label={isSaved ? "Remove from saved" : "Save this instructor"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"
              fill={isSaved ? "currentColor" : "none"} aria-hidden="true">
              <path d="M6 4h12a1 1 0 011 1v15l-7-4-7 4V5a1 1 0 011-1z"
                stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="inst-card-coverage">
        {counties.map((county) => (
          <span key={county} className="inst-chip inst-chip-county">{county}</span>
        ))}
        {centres.slice(0, 3).map((centre) => (
          <span key={centre} className="inst-chip inst-chip-centre">{centre}</span>
        ))}
        {centres.length > 3 && (
          <span className="inst-chip inst-chip-more">+{centres.length - 3} more</span>
        )}
      </div>

      <div className="inst-card-categories">
        {(instructor.licenceCategories ?? []).map((code) => (
          <span key={code} className="inst-chip inst-chip-cat">{code}</span>
        ))}
        {(instructor.transmission ?? []).map((value) => (
          <span key={value} className="inst-chip inst-chip-trans">
            {value === "automatic" ? "Automatic" : "Manual"}
          </span>
        ))}
      </div>

      <div className="inst-card-foot">
        <div>
          {instructor.pricePerLesson !== null && instructor.pricePerLesson !== undefined ? (
            <p className="inst-card-price">
              €{instructor.pricePerLesson}
              <span className="inst-card-price-unit"> / lesson</span>
            </p>
          ) : (
            <p className="inst-card-price inst-card-price-none">Price on request</p>
          )}

          {!instructor.acceptingNewStudents && (
            <p className="inst-card-closed">Not taking new students</p>
          )}
        </div>

        <Link to={`/providers/${instructor.userId}`} className="inst-card-btn">
          View profile
        </Link>
      </div>
    </article>
  );
}

export default InstructorCard;
