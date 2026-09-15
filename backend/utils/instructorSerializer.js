/*
 * Turns an InstructorProfile document into what each audience is allowed to
 * see. Kept separate from the routes so the shaping rules live in one place —
 * leaking an admin verification note or a billing date through one forgotten
 * endpoint is exactly the kind of mistake this prevents.
 */

import { isLessonsDoneCorroborated } from "./instructorRules.js";

/* What anyone browsing the site may see.
   Deliberately absent: verification.note (admin-only) and every subscription
   field (the instructor's billing is nobody else's business). */
export const toPublicProfile = (profile, { user, reviewCount = 0, averageRating = null, completedBookings = 0 } = {}) => {
  if (!profile) return null;

  const verificationStatus = profile.verification?.status ?? "unverified";

  return {
    id: profile._id,
    userId: profile.userId?._id ?? profile.userId,
    name: user?.name ?? profile.userId?.name ?? null,

    headline: profile.headline || "",
    bio: profile.bio || "",
    profilePhotoUrl: profile.profilePhotoUrl || user?.avatarUrl || "",
    gallery: profile.gallery ?? [],

    counties: profile.counties ?? [],
    testCentres: profile.testCentres ?? [],
    licenceCategories: profile.licenceCategories ?? [],
    transmission: profile.transmission ?? [],

    pricePerLesson: profile.pricePerLesson ?? null,
    acceptingNewStudents: profile.acceptingNewStudents ?? false,

    /* Only the badge, never the ADI number itself — publishing it invites
       people to copy a real instructor's registration onto a fake profile. */
    isVerified: verificationStatus === "verified",

    lessonsDone: profile.lessonsDone ?? 0,
    /* The roadmap is strict about this: until the number is corroborated it
       must carry the "self-reported" label wherever it appears. */
    lessonsDoneIsSelfReported: !isLessonsDoneCorroborated({
      verificationStatus,
      completedBookings,
      reviewCount,
    }),

    reviewCount,
    averageRating,
    profileCompleteness: profile.profileCompleteness ?? 0,
    memberSince: profile.createdAt ?? null,
  };
};

/* What the instructor sees of their own profile: everything public, plus their
   ADI number, their verification state and their subscription. */
export const toOwnerProfile = (profile, extras = {}) => {
  if (!profile) return null;

  return {
    ...toPublicProfile(profile, extras),
    adiNumber: profile.adiNumber ?? "",
    isPublished: profile.isPublished ?? false,
    verification: {
      status: profile.verification?.status ?? "unverified",
      verifiedAt: profile.verification?.verifiedAt ?? null,
      /* note stays admin-only even here — it is internal review commentary. */
    },
    subscription: {
      status: profile.subscription?.status ?? "trial",
      trialStartedAt: profile.subscription?.trialStartedAt ?? null,
      trialEndsAt: profile.subscription?.trialEndsAt ?? null,
      currentPeriodEnd: profile.subscription?.currentPeriodEnd ?? null,
      graceEndsAt: profile.subscription?.graceEndsAt ?? null,
      archivedAt: profile.subscription?.archivedAt ?? null,
    },
  };
};
