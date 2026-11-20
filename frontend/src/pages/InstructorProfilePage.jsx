import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import api from "../api/index.js";
import { useAuth } from "../context/auth";
import { StarDisplay, StarPicker } from "../components/StarRating";
import ReviewCard from "../components/ReviewCard";
import ReportDialog from "../components/ReportDialog";
import Highlights from "../components/profile/Highlights";
import PostGrid from "../components/profile/PostGrid";
import PostViewer from "../components/profile/PostViewer";
import ProfileIcon from "../components/profile/ProfileIcon";
import { formatMonthYear } from "../utils/formatDate";
import { formatIrishPhone } from "../utils/formatPhone";
import { profileHighlights } from "../utils/profileHighlights";

/*
 * The public instructor profile, laid out the way people already know how to
 * read a person's page: a photo ringed in amber while they take new learners,
 * three numbers, a short bio and the actions; then highlights that open like
 * stories (where they teach, what, for how much); then tabs - posts as a
 * square grid, reviews, and everything else under About. The point is that an
 * individual instructor should feel like a person, not a directory row.
 *
 * The trust signals stay where the roadmap put them, at the top: the verified
 * badge next to the name, the rating and the lesson count (labelled when it is
 * self-reported) in the numbers, and a plain note when the ADI number has not
 * been checked yet.
 *
 * It reads GET /api/instructors/:id (the public slice, with the ADI number
 * and subscription stripped out) and GET /api/reviews/provider/:id; a learner
 * also asks GET /api/reviews/eligibility/:id, since only someone who has had a
 * lesson with this instructor can review them.
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
  const [openPost, setOpenPost] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [reviewError, setReviewError] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [eligibility, setEligibility] = useState(null);

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
  /* Booking and saving are learner actions. A signed-out visitor still sees
     them (they lead to sign-in); an instructor — including this one, looking
     at their own page — does not, because the server would refuse both. */
  const canActAsLearner = !user || isLearner;

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

  /* Learners only, never your own profile, and only after a lesson. */
  const mayAskToReview =
    isLearner && instructorUserId && String(user?._id ?? user?.id) !== instructorUserId;

  useEffect(() => {
    if (!mayAskToReview) return undefined;
    let ignore = false;

    api.get(`/reviews/eligibility/${instructorUserId}`)
      .then((res) => { if (!ignore) setEligibility(res.data.status); })
      .catch(() => {});

    return () => { ignore = true; };
  }, [mayAskToReview, instructorUserId]);

  const canReview = mayAskToReview && eligibility === "ok";

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

  /* A review is now about the instructor, so no service has to be picked
     first — which is what the old page made people do. */
  const submitReview = async (event) => {
    event.preventDefault();
    setReviewError("");

    if (reviewForm.rating === 0) {
      setReviewError("Please choose a star rating.");
      return;
    }

    try {
      setReviewSubmitting(true);
      const res = await api.post("/reviews", {
        providerId: instructorUserId,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim() || undefined,
      });
      setReviews((prev) => [res.data.review, ...prev]);
      setReviewForm({ rating: 0, comment: "" });
      setReviewDone(true);
    } catch (err) {
      setReviewError(
        err?.response?.data?.message || "Could not submit your review. Please try again."
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

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

  const posts = instructor.posts ?? [];
  const author = { name: instructor.name, initials: initials || "DI", photo: instructor.profilePhotoUrl };
  const highlights = profileHighlights(instructor, {
    counties: countyLabels,
    centres: centreLabels,
    categories: categoryLabels,
  });
  const isOwnProfile = String(user?._id ?? user?.id) === instructorUserId;

  /* The tab lives in the address, so a link can open the reviews directly. */
  const TABS = [
    { id: "posts", label: "Posts", icon: "grid" },
    { id: "reviews", label: "Reviews", icon: "star" },
    { id: "about", label: "About", icon: "info" },
  ];
  const tab = TABS.some((t) => t.id === searchParams.get("tab")) ? searchParams.get("tab") : "posts";
  const chooseTab = (id) => setSearchParams(id === "posts" ? {} : { tab: id }, { replace: true });

  return (
    <div className="ig-page">
      <header className="ig-header">
        {/* Amber ring while they take new learners, like a story waiting to be seen. */}
        <div className={`ig-avatar ${instructor.acceptingNewStudents ? "ig-avatar-open" : ""}`}>
          {instructor.profilePhotoUrl ? (
            <img src={instructor.profilePhotoUrl} alt={instructor.name} />
          ) : (
            <span className="ig-avatar-initials" aria-hidden="true">{initials || "DI"}</span>
          )}
        </div>

        <div className="ig-identity">
          <div className="ig-name-row">
            <h1 className="ig-name">{instructor.name}</h1>
            {instructor.isVerified && (
              <span className="ig-verified" title="ADI number checked against the RSA register">
                <ProfileIcon name="shield" size={15} />
                Verified ADI
              </span>
            )}
          </div>

          <ul className="ig-stats">
            <li>
              <strong>{posts.length}</strong> {posts.length === 1 ? "post" : "posts"}
            </li>
            <li>
              {instructor.averageRating !== null ? (
                <>
                  <strong>{instructor.averageRating.toFixed(1)}</strong>{" "}
                  <button type="button" className="ig-stat-link" onClick={() => chooseTab("reviews")}>
                    {instructor.reviewCount} {instructor.reviewCount === 1 ? "review" : "reviews"}
                  </button>
                </>
              ) : (
                "No reviews yet"
              )}
            </li>
            {/* "0 lessons" says nothing useful and reads badly; omit it. */}
            {instructor.lessonsDone > 0 && (
              <li>
                <strong>{instructor.lessonsDone.toLocaleString("en-IE")}</strong> lessons
                {/* Never let this read as a verified figure. */}
                {instructor.lessonsDoneIsSelfReported && <span className="ig-self-reported"> (self-reported)</span>}
              </li>
            )}
          </ul>

          <div className="ig-bio">
            {instructor.headline && <p className="ig-headline">{instructor.headline}</p>}
            {instructor.bio && <p className="ig-bio-text">{instructor.bio}</p>}
            <p className="ig-facts">
              {instructor.pricePerLesson !== null && instructor.pricePerLesson !== undefined && (
                <span><strong>€{instructor.pricePerLesson}</strong> a lesson</span>
              )}
              <span className={instructor.acceptingNewStudents ? "ig-open" : "ig-closed"}>
                {instructor.acceptingNewStudents ? "Taking new learners" : "Not taking new learners"}
              </span>
            </p>
            {!instructor.isVerified && (
              /* Unverified profiles are listed but must say so plainly — the
                 whole trust proposition depends on the distinction being visible. */
              <p className="ip-unverified-note">
                This instructor's ADI number has not been checked against the RSA register yet.
              </p>
            )}
          </div>

          <div className="ig-actions">
            {/* Only offered when they are actually taking students; a request
                that will certainly be declined helps nobody. */}
            {canActAsLearner && instructor.acceptingNewStudents && (
              <Link to={`/booking?instructor=${instructorUserId}`} className="ig-button ig-button-primary">
                Request a lesson
              </Link>
            )}

            {canActAsLearner && (
              <button
                type="button"
                className={`ig-button ig-save ${isSaved ? "ig-save-on" : ""}`}
                onClick={toggleSave}
                aria-pressed={isSaved}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} aria-hidden="true">
                  <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"
                    stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </svg>
                {isSaved ? "Saved" : "Save"}
              </button>
            )}

            {/* The API only returns the number to signed-in visitors. */}
            {instructor.phone ? (
              <a href={`tel:${instructor.phone}`} className="ig-button">
                {formatIrishPhone(instructor.phone)}
              </a>
            ) : !user ? (
              <Link to="/login" className="ig-button">Sign in for their number</Link>
            ) : null}

            {isOwnProfile && (
              <Link to="/onboarding" className="ig-button">Edit profile</Link>
            )}
          </div>
        </div>
      </header>

      <Highlights highlights={highlights} author={author} />

      <div className="ig-tabs" role="tablist" aria-label="Profile">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`ig-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`ig-panel-${t.id}`}
            className={`ig-tab ${tab === t.id ? "is-active" : ""}`}
            onClick={() => chooseTab(t.id)}
          >
            <ProfileIcon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "posts" && (
        <section id="ig-panel-posts" role="tabpanel" aria-labelledby="ig-tab-posts">
          <PostGrid posts={posts} onOpen={setOpenPost} />
        </section>
      )}

      {tab === "reviews" && (
        <section id="ig-panel-reviews" role="tabpanel" aria-labelledby="ig-tab-reviews" className="ig-panel">
          {instructor.reviewCount > 0 && (
            <p className="ip-review-summary">
              <StarDisplay rating={instructor.averageRating} size={14} />
              {instructor.averageRating.toFixed(1)} · {instructor.reviewCount}{" "}
              {instructor.reviewCount === 1 ? "review" : "reviews"}
            </p>
          )}

          {canReview && !reviewDone && (
            <form className="ip-review-form" onSubmit={submitReview} noValidate>
              {reviewError && <div className="report-error" role="alert">{reviewError}</div>}

              <StarPicker
                value={reviewForm.rating}
                onChange={(rating) => setReviewForm((prev) => ({ ...prev, rating }))}
              />

              <textarea
                rows={3}
                maxLength={1000}
                className="ip-review-comment"
                placeholder="How were your lessons? (optional)"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
              />

              <button type="submit" className="button button-primary" disabled={reviewSubmitting}>
                {reviewSubmitting ? "Posting…" : "Post review"}
              </button>
            </form>
          )}

          {reviewDone && (
            <p className="ip-subtle">Thanks — your review has been posted.</p>
          )}

          {mayAskToReview && eligibility === "no_lesson" && (
            <p className="ip-subtle">
              You can review {instructor.name?.split(" ")[0] || "this instructor"} once you have had a lesson with them.
            </p>
          )}

          {!user && (
            <p className="ip-subtle">
              <Link to="/login" className="legal-link">Sign in</Link> to leave a review.
            </p>
          )}

          {reviews.length === 0 ? (
            <p className="ig-empty">No reviews yet.</p>
          ) : (
            /* ReviewCard is the <li> itself, as on the dashboard. */
            <ul className="ip-reviews">
              {reviews.map((review) => <ReviewCard key={review._id} review={review} />)}
            </ul>
          )}
        </section>
      )}

      {tab === "about" && (
        <section id="ig-panel-about" role="tabpanel" aria-labelledby="ig-tab-about" className="ig-panel">
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

          {/* Category badges: letter plus transmission, kept on separate axes. */}
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

          {instructor.memberSince && (
            <p className="ip-subtle">On Pro.me since {formatMonthYear(instructor.memberSince)}</p>
          )}
        </section>
      )}

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

      {openPost !== null && posts[openPost] && (
        <PostViewer posts={posts} index={openPost} author={author} onIndex={setOpenPost} onClose={() => setOpenPost(null)} />
      )}
    </div>
  );
}

export default InstructorProfilePage;
