import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../api/index.js";
import { useAuth } from "../context/AuthContext";
import { resizePhotoToDataUrl } from "../utils/avatarImage";
import { formatIrishPhone } from "../utils/formatPhone";
import {
  StepAbout,
  StepBasics,
  StepCoverage,
  StepReview,
  StepTeaching,
} from "../components/onboarding/OnboardingSteps";

/*
 * Instructor onboarding — the step-by-step setup the roadmap asks for instead
 * of one long form.
 *
 * Until this existed, PUT /api/instructors/me was the only way to create a
 * profile: nothing in the interface called it, so no real instructor could
 * ever appear in search.
 *
 * Every "Next" saves that step to the server. Someone filling this in on a
 * phone between lessons can stop at any point and pick up where they left off;
 * the page reopens at the first step that is still incomplete.
 */

const STEPS = [
  { key: "basics", title: "Basic details", intro: "Who you are and how learners reach you." },
  { key: "coverage", title: "Where you teach", intro: "Counties first, then the test centres you know." },
  { key: "teaching", title: "What you teach", intro: "Exactly as it appears on your ADI permit." },
  { key: "about", title: "About you", intro: "What makes a learner pick you over the next name." },
  { key: "review", title: "Review and publish", intro: "Check everything, then go live." },
];

const EMPTY_DRAFT = {
  adiNumber: "",
  phone: "",
  counties: [],
  testCentres: [],
  licenceCategories: [],
  transmission: [],
  headline: "",
  bio: "",
  pricePerLesson: "",
  acceptingNewStudents: true,
  declarations: { adiConfirmed: false, holdsInsurance: false },
  isPublished: false,
};

/* Server profile → editable draft. */
const toDraft = (profile) => ({
  adiNumber: profile.adiNumber ?? "",
  phone: profile.phone ? formatIrishPhone(profile.phone) : "",
  counties: profile.counties ?? [],
  testCentres: profile.testCentres ?? [],
  licenceCategories: profile.licenceCategories ?? [],
  transmission: profile.transmission ?? [],
  headline: profile.headline ?? "",
  bio: profile.bio ?? "",
  pricePerLesson: profile.pricePerLesson ?? "",
  acceptingNewStudents: profile.acceptingNewStudents ?? true,
  declarations: {
    adiConfirmed: Boolean(profile.declarations?.adiConfirmedAt),
    holdsInsurance: Boolean(profile.declarations?.holdsInsuranceAt),
  },
  isPublished: Boolean(profile.isPublished),
});

/* Where to reopen: the first step that still has a gap. */
const firstIncompleteStep = (profile) => {
  if (!profile) return 0;
  if (profile.isPublished) return 4;
  if (!profile.adiNumber || !profile.phone) return 0;
  if (!profile.counties?.length) return 1;
  if (!profile.licenceCategories?.length) return 2;
  if (!profile.bio) return 3;
  return 4;
};

/* What each step sends. Only its own fields, so a step never overwrites
   another with stale values. */
const payloadFor = (stepKey, draft) => {
  switch (stepKey) {
    case "basics":
      return { adiNumber: draft.adiNumber.trim(), phone: draft.phone.trim() };
    case "coverage":
      return { counties: draft.counties, testCentres: draft.testCentres };
    case "teaching":
      return { licenceCategories: draft.licenceCategories, transmission: draft.transmission };
    case "about":
      return {
        headline: draft.headline,
        bio: draft.bio,
        pricePerLesson: draft.pricePerLesson === "" ? null : Number(draft.pricePerLesson),
        acceptingNewStudents: draft.acceptingNewStudents,
      };
    default:
      return {};
  }
};

/* Light checks before a round trip. The server is the authority. */
const clientCheck = (stepKey, draft) => {
  if (stepKey === "basics") {
    if (!draft.adiNumber.trim()) return "Enter your RSA ADI number.";
    if (!draft.phone.trim()) return "Enter a contact phone number.";
  }
  if (stepKey === "coverage" && !draft.counties.length) return "Choose at least one county.";
  if (stepKey === "teaching" && !draft.licenceCategories.length) return "Choose at least one licence category.";
  if (stepKey === "about" && draft.pricePerLesson !== "" && Number(draft.pricePerLesson) < 0) {
    return "Price cannot be negative.";
  }
  return "";
};

function InstructorOnboardingPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [reference, setReference] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [blockers, setBlockers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [avatarState, setAvatarState] = useState({ uploading: false, error: "" });

  const isInstructor = user?.role === "enterprise" && user?.providerType === "driving_instructor";

  useEffect(() => {
    if (!isInstructor) return undefined;
    let ignore = false;

    Promise.all([api.get("/reference"), api.get("/instructors/me")])
      .then(([refRes, meRes]) => {
        if (ignore) return;
        setReference(refRes.data);
        const profile = meRes.data.profile;
        if (profile) {
          setDraft(toDraft(profile));
          setUserId(String(profile.userId));
        }
        const start = firstIncompleteStep(profile);
        setStep(start);
        /* An existing profile can jump to any step; a new one only as far as
           it has got. */
        setFurthest(profile ? STEPS.length - 1 : start);
        setLoaded(true);
      })
      .catch(() => {
        if (!ignore) setError("Could not load your profile. Please refresh the page.");
      });

    return () => { ignore = true; };
  }, [isInstructor]);

  /* Always functional. Chip toggles used to compute the next list from the
     draft captured at render time, so two taps landing in one batched update
     (a fast double tap, or a touch firing twice) lost the first selection.
     A function value is applied to the field's latest state instead. */
  const setField = useCallback((field, value) => {
    setDraft((prev) => ({
      ...prev,
      [field]: typeof value === "function" ? value(prev[field]) : value,
    }));
    setError("");
  }, []);

  /* For changes that must touch several fields atomically. */
  const updateDraft = useCallback((updater) => {
    setDraft(updater);
    setError("");
  }, []);

  const save = async (payload) => {
    const res = await api.put("/instructors/me", payload);
    const profile = res.data.profile;
    setDraft(toDraft(profile));
    setUserId(String(profile.userId));
    return profile;
  };

  const goTo = (index) => {
    setError("");
    setBlockers([]);
    setStep(index);
    setFurthest((prev) => Math.max(prev, index));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = async () => {
    const key = STEPS[step].key;
    const problem = clientCheck(key, draft);
    if (problem) {
      setError(problem);
      return;
    }

    try {
      setSaving(true);
      await save(payloadFor(key, draft));
      goTo(step + 1);
    } catch (err) {
      /* Editing a live profile can trip the publishing minimum; say exactly
         what is missing rather than a generic refusal. */
      const data = err?.response?.data;
      setError(
        data?.blockers?.length
          ? `${data.message}: ${data.blockers.join("; ")}.`
          : data?.message || "Could not save. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (publish) => {
    try {
      setSaving(true);
      setError("");
      setBlockers([]);
      await save({
        declarations: draft.declarations,
        isPublished: publish,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save. Please try again.");
      setBlockers(err?.response?.data?.blockers ?? []);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    setAvatarState({ uploading: true, error: "" });
    try {
      const avatarUrl = await resizePhotoToDataUrl(file);
      await api.patch("/auth/me/avatar", { avatarUrl });
      await refreshUser();
      setAvatarState({ uploading: false, error: "" });
    } catch (err) {
      setAvatarState({
        uploading: false,
        error: err?.response?.data?.message || err?.message || "Could not upload the photo.",
      });
    }
  };

  /* ── guards ───────────────────────────────────────────────────────────── */
  if (authLoading) return <div className="ip-state">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isInstructor) {
    return (
      <div className="ip-state">
        <h1 className="ip-state-title">Instructor setup</h1>
        <p>This page is for driving instructor accounts.</p>
        <Link to="/" className="legal-link">Back to the home page</Link>
      </div>
    );
  }
  if (!loaded) {
    return <div className="ip-state">{error || "Loading your profile…"}</div>;
  }

  const current = STEPS[step];
  const stepProps = { draft, setField, updateDraft, reference, user };

  return (
    <div className="ob-page">
      <ol className="ob-progress" aria-label="Setup progress">
        {STEPS.map((s, index) => {
          const reachable = index <= furthest;
          return (
            <li
              key={s.key}
              className={`ob-progress-step ${index === step ? "is-current" : ""} ${index < step ? "is-done" : ""}`}
            >
              <button
                type="button"
                onClick={() => reachable && goTo(index)}
                disabled={!reachable || saving}
                aria-current={index === step ? "step" : undefined}
              >
                <span className="ob-progress-num">{index + 1}</span>
                <span className="ob-progress-label">{s.title}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <section className="ob-card">
        <p className="ob-step-count">Step {step + 1} of {STEPS.length}</p>
        <h1 className="ob-title">{current.title}</h1>
        <p className="ob-intro">{current.intro}</p>

        {error && <div className="report-error" role="alert">{error}</div>}

        <div className="ob-body">
          {current.key === "basics" && (
            <StepBasics
              {...stepProps}
              avatar={{
                url: user.avatarUrl || "",
                uploading: avatarState.uploading,
                error: avatarState.error,
                onUpload: handleAvatarUpload,
              }}
            />
          )}
          {current.key === "coverage" && <StepCoverage {...stepProps} />}
          {current.key === "teaching" && <StepTeaching {...stepProps} />}
          {current.key === "about" && <StepAbout {...stepProps} />}
          {current.key === "review" && (
            <StepReview
              {...stepProps}
              onEdit={goTo}
              blockers={blockers}
              published={draft.isPublished}
              userId={userId}
            />
          )}
        </div>

        <div className="ob-actions">
          {step > 0 && (
            <button type="button" className="button button-ghost" onClick={() => goTo(step - 1)} disabled={saving}>
              Back
            </button>
          )}

          {current.key !== "review" && (
            <button type="button" className="button button-primary" onClick={handleNext} disabled={saving}>
              {saving ? "Saving…" : "Save and continue"}
            </button>
          )}

          {current.key === "review" && !draft.isPublished && (
            <button type="button" className="button button-primary" onClick={() => handlePublish(true)} disabled={saving}>
              {saving ? "Publishing…" : "Publish my profile"}
            </button>
          )}

          {current.key === "review" && draft.isPublished && (
            <button type="button" className="button button-ghost" onClick={() => handlePublish(false)} disabled={saving}>
              {saving ? "Saving…" : "Hide my profile"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default InstructorOnboardingPage;
