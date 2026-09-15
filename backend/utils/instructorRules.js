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
