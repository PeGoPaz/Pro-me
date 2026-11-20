import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/index.js";
import { useAuth } from "../context/auth";

/*
 * The instructors a learner saved, as a grid of photos like any app's saved
 * tab. Saving already existed - the heart on a profile and on a search card -
 * but there was no page that listed what was saved.
 */
function SavedPage() {
  const { user, loading } = useAuth();
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");
  const isLearner = user?.role === "user";

  useEffect(() => {
    if (!isLearner) return undefined;
    let ignore = false;
    api.get("/favorites")
      .then((res) => { if (!ignore) setSaved(res.data); })
      .catch(() => { if (!ignore) setError("Your saved instructors could not be loaded. Try again in a moment."); });
    return () => { ignore = true; };
  }, [isLearner]);

  if (loading) return <div className="ip-state">Loading…</div>;

  if (!user) {
    return (
      <section className="saved-page">
        <h1 className="saved-title">Saved</h1>
        <p className="ig-empty">
          <Link to="/login" className="legal-link">Sign in</Link> to keep a list of the instructors you like.
        </p>
      </section>
    );
  }

  if (!isLearner) {
    return (
      <section className="saved-page">
        <h1 className="saved-title">Saved</h1>
        <p className="ig-empty">Saving instructors is for learners' accounts.</p>
      </section>
    );
  }

  return (
    <section className="saved-page">
      <h1 className="saved-title">Saved</h1>
      {error && <p className="ig-empty" role="alert">{error}</p>}
      {!error && saved === null && <p className="ig-empty">Loading…</p>}
      {saved?.length === 0 && (
        <p className="ig-empty">
          Nothing saved yet. Tap Save on an instructor's profile and they will wait for you here.{" "}
          <Link to="/instructors" className="legal-link">Explore instructors</Link>
        </p>
      )}
      {saved?.length > 0 && (
        <ul className="explore-grid">
          {saved.filter((item) => item.profile).map(({ id, instructor, profile }) => (
            <li key={id}>
              <Link to={`/instructors/${profile._id}`} className="explore-tile">
                {profile.profilePhotoUrl || instructor.avatarUrl ? (
                  <img src={profile.profilePhotoUrl || instructor.avatarUrl} alt="" loading="lazy" />
                ) : (
                  <span className="explore-tile-initials" aria-hidden="true">
                    {(instructor.name ?? "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
                  </span>
                )}
                <span className="explore-tile-info">
                  <span className="explore-tile-name">{instructor.name}</span>
                  {profile.pricePerLesson !== null && profile.pricePerLesson !== undefined && (
                    <span className="explore-tile-facts">€{profile.pricePerLesson} a lesson</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default SavedPage;
