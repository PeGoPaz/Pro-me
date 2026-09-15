import mongoose from "mongoose";

import { COUNTY_SLUGS } from "../data/counties.js";
import { TEST_CENTRE_SLUGS } from "../data/testCentres.js";
import {
  LICENCE_CATEGORY_CODES,
  TRANSMISSION_VALUES,
} from "../data/licenceCategories.js";

/*
 * An instructor's public profile — one per provider account.
 *
 * Deliberately separate from Enterprise. Enterprise is a *listing* (a lesson
 * offering with a price) and both Booking and Review already point at it; an
 * instructor is a *person*, has exactly one ADI number, and may run several
 * listings. Folding the two together would make the ADI number and the
 * verification state ambiguous.
 *
 * Every controlled value is validated against the committed RSA reference data
 * rather than a hand-written enum, so the schema cannot drift from the
 * register.
 */

const instructorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    /* Required at signup. Teaching for reward without being on the RSA ADI
       register is a criminal offence, so we always collect it — but we do not
       gate account creation on checking it (see verification below). */
    adiNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32,
    },

    /* Primary location axis, matching the RSA's own register UX. */
    counties: {
      type: [String],
      default: [],
      validate: {
        validator: (values) => values.every((v) => COUNTY_SLUGS.includes(v)),
        message: "counties must be valid Irish county slugs",
      },
    },

    /* Secondary axis. A flat list — centres are not nested under a city,
       because Irish test centres do not divide that way. */
    testCentres: {
      type: [String],
      default: [],
      validate: {
        validator: (values) => values.every((v) => TEST_CENTRE_SLUGS.includes(v)),
        message: "testCentres must be valid RSA test centre slugs",
      },
    },

    /* Real RSA licence category letters. */
    licenceCategories: {
      type: [String],
      default: [],
      validate: {
        validator: (values) => values.every((v) => LICENCE_CATEGORY_CODES.includes(v)),
        message: "licenceCategories must be valid RSA category codes",
      },
    },

    /* Separate axis from licenceCategories — an instructor may teach both. */
    transmission: {
      type: [String],
      default: [],
      validate: {
        validator: (values) => values.every((v) => TRANSMISSION_VALUES.includes(v)),
        message: "transmission must be automatic and/or manual",
      },
    },

    headline: { type: String, trim: true, maxlength: 120, default: "" },
    bio: { type: String, trim: true, maxlength: 2000, default: "" },

    profilePhotoUrl: { type: String, trim: true, default: "" },

    /* Capped so one profile cannot balloon the document. Real uploads go to
       Cloudinary; this holds the resulting URLs, never base64. */
    gallery: {
      type: [String],
      default: [],
      validate: {
        validator: (values) => values.length <= 12,
        message: "gallery can hold at most 12 photos",
      },
    },

    pricePerLesson: { type: Number, min: 0, default: null },

    /* Self-reported and gameable, so it is capped by verification status and
       always displayed with a "self-reported" label until corroborated. It is
       never the default sort. */
    lessonsDone: { type: Number, min: 0, default: 0 },

    /* The Phase 1 stand-in for a real availability calendar. */
    acceptingNewStudents: { type: Boolean, default: true },

    isPublished: { type: Boolean, default: false },

    /* Recomputed on every write; feeds the trust-first default ranking. */
    profileCompleteness: { type: Number, min: 0, max: 100, default: 0 },

    /* ADI verification against the RSA public register.
       Accounts are created immediately with no human gate — with no network
       effect yet, instructors will not wait on a manual review. New profiles
       are listed but badged "unverified", ranked below verified ones, and held
       to the lowest self-reported lessons cap. An admin then checks the name,
       ADI number, counties and categories against the register. */
    verification: {
      status: {
        type: String,
        enum: ["unverified", "pending", "verified", "rejected"],
        default: "unverified",
      },
      verifiedAt: { type: Date, default: null },
      /* Admin-facing only — never serialised to the public profile. */
      note: { type: String, trim: true, maxlength: 500, default: "" },
    },

    /* Flat subscription: 3-month free trial, then EUR 5/month.
       Phase 1 ships this schema only. Stripe — card verification at trial
       start, subscription creation, webhooks and dunning — is a defined
       Phase 2 workstream and is deliberately not wired up here. The status
       values are already the ones Stripe's lifecycle maps onto, so adding it
       later needs no schema change. */
    subscription: {
      status: {
        type: String,
        enum: ["trial", "active", "grace", "past_due", "cancelled"],
        default: "trial",
      },
      trialStartedAt: { type: Date, default: null },
      trialEndsAt: { type: Date, default: null },
      currentPeriodEnd: { type: Date, default: null },
      graceEndsAt: { type: Date, default: null },
      /* Set when an extended lapse archives the profile. Archiving hides it;
         it never deletes it, and never touches learners' reviews or bookings. */
      archivedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

/* Search filters hit these together, county and centre being the strongest. */
instructorProfileSchema.index({ counties: 1 });
instructorProfileSchema.index({ testCentres: 1 });
/* These two must stay SEPARATE single-field indexes. Both fields are arrays,
   and MongoDB refuses to build a compound index across two array fields
   ("cannot index parallel arrays"), which fails every insert rather than just
   the index build. Multikey indexes on each field serve the filters fine. */
instructorProfileSchema.index({ licenceCategories: 1 });
instructorProfileSchema.index({ transmission: 1 });
instructorProfileSchema.index({ isPublished: 1, acceptingNewStudents: 1 });
/* Default ranking puts verified profiles first, then completeness. */
instructorProfileSchema.index({ "verification.status": 1, profileCompleteness: -1 });
instructorProfileSchema.index({ "subscription.status": 1 });

const InstructorProfile = mongoose.model("InstructorProfile", instructorProfileSchema);

export default InstructorProfile;
