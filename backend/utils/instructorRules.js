/*
 * Trust and subscription rules for instructor profiles.
 *
 * Deliberately pure functions with no Mongoose or Express in sight: these carry
 * the rules that are easiest to get quietly wrong, so they need to be testable
 * without a database.
 */

/* ── Self-reported lessons ────────────────────────────────────────────────
   The lessons-done number is entered by the instructor, which makes it
   trivially gameable — a brand-new account could claim 12,000 lessons and top
   the rankings. Unverified profiles are held to a low cap; the cap lifts once
   an admin has checked the ADI number against the RSA register. */

export const LESSONS_DONE_CAPS = {
  unverified: 250,
  pending: 250,
  rejected: 0,
  verified: 20000,
};

export const lessonsDoneCap = (verificationStatus) =>
  LESSONS_DONE_CAPS[verificationStatus] ?? LESSONS_DONE_CAPS.unverified;

/* Clamps a claimed figure to what the profile is allowed to display. */
export const clampLessonsDone = (claimed, verificationStatus) => {
  const value = Number(claimed);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(Math.floor(value), lessonsDoneCap(verificationStatus));
};

/* Whether the figure still needs the "self-reported" label. Corroboration means
   completed bookings or reviews actually backing the claim up. */
export const isLessonsDoneCorroborated = ({
  verificationStatus,
  completedBookings = 0,
  reviewCount = 0,
} = {}) => verificationStatus === "verified" && completedBookings + reviewCount > 0;

/* ── Subscription lapse ───────────────────────────────────────────────────
   trial and active are visible. A lapse moves through a grace period where the
   profile stays up and the instructor is nudged, then to suspended — hidden
   from search, booking disabled, but NOT deleted. After an extended lapse the
   profile is archived. Resubscribing restores everything, and learners' reviews
   and booking history survive all of it because they are partly their data. */

export const GRACE_PERIOD_DAYS = 14;
export const ARCHIVE_AFTER_DAYS = 90;

export const isProfileVisible = (subscription, now = new Date()) => {
  if (!subscription) return false;
  if (subscription.archivedAt) return false;

  const { status, graceEndsAt } = subscription;

  if (status === "trial" || status === "active") return true;
  if (status === "cancelled") return false;

  /* past_due and grace stay visible until the grace window closes. A missing
     graceEndsAt means the window was never opened, so treat it as closed
     rather than granting indefinite free visibility. */
  if (status === "past_due" || status === "grace") {
    if (!graceEndsAt) return false;
    return new Date(graceEndsAt).getTime() > now.getTime();
  }

  return false;
};

/* What the instructor's own dashboard should tell them. */
export const subscriptionState = (subscription, now = new Date()) => {
  if (!subscription) return "unknown";
  if (subscription.archivedAt) return "archived";
  if (isProfileVisible(subscription, now)) return subscription.status;
  if (subscription.status === "cancelled") return "cancelled";
  return "suspended";
};

/* ── Profile completeness ─────────────────────────────────────────────────
   Half of the trust-first default ranking. Weighted towards the things a
   learner actually decides on — a photo and real coverage beat a long bio.
   Not gameable in the way a self-reported counter is: filling these fields in
   is exactly the behaviour we want to reward. */

export const COMPLETENESS_WEIGHTS = {
  profilePhotoUrl: 20,
  counties: 15,
  testCentres: 15,
  licenceCategories: 15,
  transmission: 10,
  bio: 10,
  pricePerLesson: 10,
  gallery: 5,
};

const hasValue = (value) => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return value >= 0;
  return Boolean(value);
};

export const profileCompleteness = (profile = {}) => {
  let score = 0;
  for (const [field, weight] of Object.entries(COMPLETENESS_WEIGHTS)) {
    if (hasValue(profile[field])) score += weight;
  }
  return Math.min(score, 100);
};

/* ── Contact phone ────────────────────────────────────────────────────────
   Instructors type numbers every way imaginable: "087 123 4567",
   "+353 87 123 4567", "+353 (0)87-1234567", "00353871234567". All of those
   are the same number, so store one canonical E.164 form (+353871234567) and
   reject anything that is not an Irish number. Returns null when invalid. */
export const normaliseIrishPhone = (input) => {
  if (typeof input !== "string") return null;

  let digits = input.replace(/[\s\-().]/g, "");
  if (!digits) return null;

  if (digits.startsWith("00353")) digits = `+353${digits.slice(5)}`;

  let national;
  if (digits.startsWith("+353")) {
    /* "+353 (0)87…" is a common habit; the 0 does not belong after +353. */
    national = digits.slice(4).replace(/^0/, "");
  } else if (digits.startsWith("0")) {
    national = digits.slice(1);
  } else {
    return null;
  }

  /* Mobiles are 9 digits after the 0 (87 123 4567); landlines 7–9
     (Dublin 1 234 5678). Nothing in Ireland starts with 0 after the prefix. */
  if (!/^[1-9]\d{6,8}$/.test(national)) return null;

  return `+353${national}`;
};

/* ── Publishing ───────────────────────────────────────────────────────────
   What a profile must have before it can be listed publicly. Returns
   human-readable reasons, empty when the profile is ready.

   The declarations are not paperwork for its own sake. Teaching for reward
   without an ADI permit is a criminal offence, and the roadmap requires every
   instructor to confirm they hold insurance covering paid tuition — the
   platform introduces, the instructor is responsible for the lesson. A
   timestamped confirmation is the evidence that they did. */
const CAR_CATEGORIES = ["B", "BE"];

export const publishBlockers = (profile = {}) => {
  const blockers = [];

  if (!profile.adiNumber) blockers.push("Add your RSA ADI number");
  if (!profile.phone) blockers.push("Add a contact phone number");
  if (!profile.counties?.length) blockers.push("Choose at least one county you cover");
  if (!profile.licenceCategories?.length) blockers.push("Choose at least one licence category you teach");

  /* Transmission is its own axis, and for a car instructor it is the first
     thing a learner filters on. */
  const teachesCars = (profile.licenceCategories ?? []).some((c) => CAR_CATEGORIES.includes(c));
  if (teachesCars && !profile.transmission?.length) {
    blockers.push("Say whether you teach automatic, manual or both");
  }

  /* An admin checked the register and the ADI number did not match. Teaching
     for reward without a permit is an offence, so a rejected profile stays
     off the listing until it is re-checked — the instructor cannot simply
     republish around the decision. */
  if (profile.verification?.status === "rejected") {
    blockers.push("Your ADI number could not be matched to the RSA register — contact us to have it re-checked");
  }

  if (!profile.declarations?.adiConfirmedAt) {
    blockers.push("Confirm that you hold a current ADI permit");
  }
  if (!profile.declarations?.holdsInsuranceAt) {
    blockers.push("Confirm that you hold insurance covering paid instruction");
  }

  return blockers;
};

/* Only https URLs may be stored as images. Until uploads exist these are
   typed or pasted, and nothing else — data:, javascript:, plain http — has any
   business in an <img src> on someone else's profile. */
export const isHttpsUrl = (value) => {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

/* ── Admin verification decisions ─────────────────────────────────────────
   What a verify / reject decision changes on a profile. Verification is done
   by a person comparing the profile with the RSA public register (name, ADI
   number, counties, categories); this only encodes the consequences.

   - verified: the badge appears, ranking improves, the lessons cap lifts.
   - rejected: the profile is taken off the listing and the self-reported
     lessons figure drops to zero (the cap for rejected profiles). Nothing is
     deleted — reviews and bookings are learners' data and stay. */
export const VERIFICATION_DECISIONS = ["verified", "rejected"];

export const verificationUpdate = (profile, decision, { note = "", now = new Date() } = {}) => {
  if (!VERIFICATION_DECISIONS.includes(decision)) return null;

  const updates = {
    "verification.status": decision,
    "verification.verifiedAt": decision === "verified" ? now : null,
    "verification.note": String(note ?? "").trim().slice(0, 500),
    lessonsDone: clampLessonsDone(profile?.lessonsDone ?? 0, decision),
  };

  if (decision === "rejected") updates.isPublished = false;

  return updates;
};
