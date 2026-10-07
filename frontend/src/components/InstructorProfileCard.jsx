import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/index.js";

/*
 * The instructor's own profile status, at the top of their dashboard.
 *
 * Doubles as the roadmap's Phase 1 "profile completion progress": the
 * percentage is the same completeness score the search ranking uses, so
 * filling the profile in visibly moves the instructor up.
 */
function InstructorProfileCard() {
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    let ignore = false;
    api.get("/instructors/me")
      .then((res) => { if (!ignore) setProfile(res.data.profile); })
      .catch(() => { if (!ignore) setProfile(null); });
    return () => { ignore = true; };
  }, []);

  if (profile === undefined) return null;

  /* No profile yet — the one thing this instructor should do next. */
  if (!profile) {
    return (
      <section className="ipc ipc-empty">
        <div>
          <h2 className="ipc-title">Set up your instructor profile</h2>
          <p className="ipc-copy">
            Learners cannot find you until you have a profile. It takes about
            five minutes and you can stop and come back at any point.
          </p>
        </div>
        <Link to="/onboarding" className="button button-primary">Start setup</Link>
      </section>
    );
  }

  const completeness = profile.profileCompleteness ?? 0;
  const verification = profile.verification?.status ?? "unverified";

  return (
    <section className="ipc">
      <div className="ipc-main">
        <div className="ipc-head">
          <h2 className="ipc-title">Your instructor profile</h2>
          <span className={`ipc-status ${profile.isPublished ? "ipc-status-live" : "ipc-status-draft"}`}>
            {profile.isPublished ? "Live" : "Not listed"}
          </span>
          <span className={`ipc-status ${verification === "verified" ? "ipc-status-live" : "ipc-status-pending"}`}>
            {verification === "verified" ? "Verified ADI" : "ADI not yet verified"}
          </span>
        </div>

        <div className="ipc-progress" aria-label={`Profile ${completeness}% complete`}>
          <div className="ipc-progress-bar">
            <div className="ipc-progress-fill" style={{ width: `${completeness}%` }} />
          </div>
          <span className="ipc-progress-label">{completeness}% complete</span>
        </div>

        <p className="ipc-copy">
          {!profile.isPublished
            ? "Finish the remaining steps and publish to appear in search."
            : completeness < 100
              ? "Complete profiles rank higher in search — a photo and a bio matter most."
              : "Your profile is complete."}
        </p>
      </div>

      <div className="ipc-actions">
        <Link to="/onboarding" className="button button-primary">
          {profile.isPublished ? "Edit profile" : "Continue setup"}
        </Link>
        {profile.isPublished && (
          <Link to={`/instructors/${profile.userId}`} className="button button-ghost">
            View public profile
          </Link>
        )}
      </div>
    </section>
  );
}

export default InstructorProfileCard;
