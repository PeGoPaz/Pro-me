import express from "express";
import mongoose from "mongoose";

import InstructorProfile from "../models/InstructorProfile.js";
import User from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ratingStats, reviewStatsFor, visibleReviewsLookup } from "../utils/reviews.js";
import { COUNTY_SLUGS } from "../data/counties.js";
import { TEST_CENTRE_SLUGS } from "../data/testCentres.js";
import {
  LICENCE_CATEGORY_CODES,
  TRANSMISSION_VALUES,
} from "../data/licenceCategories.js";
import {
  clampLessonsDone,
  isHttpsUrl,
  isProfileVisible,
  normaliseIrishPhone,
  profileCompleteness,
  publishBlockers,
} from "../utils/instructorRules.js";
import {
  toOwnerProfile,
  toPublicProfile,
} from "../utils/instructorSerializer.js";
import {
  buildInstructorQuery,
  buildInstructorSort,
  buildPagination,
  DEFAULT_SORT,
} from "../utils/instructorSearch.js";
import { avatarProjection } from "../utils/avatar.js";

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* Validates an incoming array against a reference list, so an instructor can
   never store a county or category the RSA does not recognise. */
const validateSet = (values, allowed, label) => {
  if (values === undefined) return { ok: true };
  if (!Array.isArray(values)) return { ok: false, message: `${label} must be a list` };

  const unknown = values.filter((value) => !allowed.includes(value));
  if (unknown.length) {
    return { ok: false, message: `Unknown ${label}: ${unknown.join(", ")}` };
  }
  /* Duplicates would skew the badges and the filters. */
  return { ok: true, value: [...new Set(values)] };
};

/* ── GET /api/instructors — the filtered search page ───────────────────
   One list-based page with filters, as the roadmap specifies, rather than a
   separate SEO page per county or test centre. */
router.get("/", async (req, res) => {
  try {
    const query = buildInstructorQuery(req.query);
    const sort = buildInstructorSort(req.query.sort ?? DEFAULT_SORT);
    const { page, limit, skip } = buildPagination(req.query);

    /* verificationRank is derived, not stored: it exists so a single sort can
       put verified profiles above unverified ones without a second query. */
    const pipeline = [
      { $match: query },
      {
        $addFields: {
          verificationRank: {
            $cond: [{ $eq: ["$verification.status", "verified"] }, 1, 0],
          },
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      /* Only the user fields a card needs. This lookup used to pull whole user
         documents — password hash and multi-megabyte base64 avatar included —
         for every result on the page. */
      {
        $lookup: {
          from: "users",
          let: { uid: "$userId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
            { $project: { name: 1, updatedAt: 1, avatarUrl: avatarProjection } },
          ],
          as: "user",
        },
      },
      { $unwind: "$user" },
      /* Review stats come from the reviews collection so the rating on a card
         cannot drift from the reviews on the profile. */
      visibleReviewsLookup,
    ];

    const [rows, total] = await Promise.all([
      InstructorProfile.aggregate(pipeline),
      InstructorProfile.countDocuments(query),
    ]);

    const results = rows.map((row) => {
      const { reviewCount, averageRating } = ratingStats((row.reviews ?? []).map((review) => review.rating));
      return toPublicProfile(row, { user: row.user, reviewCount, averageRating });
    });

    /* minRating filters on a value computed from the reviews collection, so it
       is applied after the lookup rather than in the Mongo match. */
    const minRating = Number(req.query.minRating);
    const filtered = Number.isFinite(minRating)
      ? results.filter((r) => r.averageRating !== null && r.averageRating >= minRating)
      : results;

    return res.json({
      results: filtered,
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      /* The roadmap asks for the ranking to be documented. Saying it in the
         response keeps the UI honest about why the order is what it is. */
      sort: req.query.sort ?? DEFAULT_SORT,
      sortExplanation:
        "Verified instructors first, then profile completeness and review count. " +
        "Self-reported lesson counts do not affect ranking.",
    });
  } catch (error) {
    console.error("Instructor search error:", error.message);
    return res.status(500).json({ message: "Failed to search instructors" });
  }
});

/* ── GET /api/instructors/:id — the public profile ─────────────────────── */
router.get("/:id", async (req, res, next) => {
  /* "me" is the owner's route below, not an instructor id. */
  if (req.params.id === "me") return next();

  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid instructor id" });
    }

    /* Accepts either the profile id or the instructor's user id, because
       cards link by user id and deep links may carry either. */
    const profile = await InstructorProfile.findOne({
      $or: [{ _id: id }, { userId: id }],
    }).populate("userId", "name avatarUrl updatedAt");

    if (!profile || !profile.isPublished) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    /* A lapsed subscription hides the profile from the public site. The
       document is untouched — resubscribing brings it straight back. */
    if (!isProfileVisible(profile.subscription)) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    const instructorUserId = profile.userId?._id ?? profile.userId;
    const stats = await reviewStatsFor(instructorUserId);

    return res.json(
      toPublicProfile(profile, {
        user: profile.userId,
        ...stats,
        includeContact: Boolean(req.session?.user),
      })
    );
  } catch (error) {
    console.error("Instructor fetch error:", error.message);
    return res.status(500).json({ message: "Failed to fetch instructor" });
  }
});

/* Everything below is the instructor managing their own profile. */
router.use(requireAuth, requireRole(["enterprise"]));

/* ── GET /api/instructors/me ───────────────────────────────────────────── */
router.get("/me", async (req, res) => {
  try {
    const profile = await InstructorProfile.findOne({
      userId: req.session.user.id,
    });

    if (!profile) {
      /* Not an error — a provider who has not started their profile yet. */
      return res.json({ profile: null });
    }

    const stats = await reviewStatsFor(req.session.user.id);
    return res.json({ profile: toOwnerProfile(profile, stats) });
  } catch (error) {
    console.error("Own profile fetch error:", error.message);
    return res.status(500).json({ message: "Failed to fetch your profile" });
  }
});

/* ── PUT /api/instructors/me — create or update ────────────────────────── */
router.put("/me", async (req, res) => {
  try {
    const userId = req.session.user.id;

    const user = await User.findById(userId).select("role providerType avatarUrl");
    if (!user || user.providerType !== "driving_instructor") {
      return res.status(403).json({
        message: "Only driving instructor accounts can have an instructor profile",
      });
    }

    const existing = await InstructorProfile.findOne({ userId });

    const {
      adiNumber, counties, testCentres, licenceCategories, transmission,
      headline, bio, profilePhotoUrl, gallery, pricePerLesson,
      lessonsDone, acceptingNewStudents, isPublished, phone, declarations,
    } = req.body;

    /* The ADI number is required on first save. Account creation stays
       immediate and unverified — this is collection, not a gate. */
    const resolvedAdi =
      typeof adiNumber === "string" && adiNumber.trim()
        ? adiNumber.trim()
        : existing?.adiNumber;

    if (!resolvedAdi) {
      return res.status(400).json({ message: "An RSA ADI number is required" });
    }

    const checks = [
      validateSet(counties, COUNTY_SLUGS, "counties"),
      validateSet(testCentres, TEST_CENTRE_SLUGS, "test centres"),
      validateSet(licenceCategories, LICENCE_CATEGORY_CODES, "licence categories"),
      validateSet(transmission, TRANSMISSION_VALUES, "transmission"),
    ];
    const failed = checks.find((check) => !check.ok);
    if (failed) {
      return res.status(400).json({ message: failed.message });
    }

    if (pricePerLesson !== undefined && pricePerLesson !== null) {
      if (typeof pricePerLesson !== "number" || pricePerLesson < 0) {
        return res.status(400).json({ message: "pricePerLesson must be a non-negative number" });
      }
    }

    /* Stored in one canonical form however it was typed. An empty string
       clears it; anything else must be a real Irish number. */
    let resolvedPhone;
    if (phone !== undefined) {
      if (phone === "" || phone === null) {
        resolvedPhone = "";
      } else {
        resolvedPhone = normaliseIrishPhone(phone);
        if (!resolvedPhone) {
          return res.status(400).json({
            message: "Enter an Irish phone number, e.g. 087 123 4567",
          });
        }
      }
    }

    /* Images are URLs until the upload pipeline exists, and these end up in
       an <img src> on a public page. Only https, nothing else. */
    if (profilePhotoUrl !== undefined && profilePhotoUrl !== "" && !isHttpsUrl(profilePhotoUrl)) {
      return res.status(400).json({ message: "profilePhotoUrl must be an https URL" });
    }
    if (gallery !== undefined) {
      if (!Array.isArray(gallery) || gallery.length > 12 || !gallery.every(isHttpsUrl)) {
        return res.status(400).json({ message: "gallery must be up to 12 https URLs" });
      }
    }

    const updates = {
      adiNumber: resolvedAdi,
      ...(checks[0].value !== undefined ? { counties: checks[0].value } : {}),
      ...(checks[1].value !== undefined ? { testCentres: checks[1].value } : {}),
      ...(checks[2].value !== undefined ? { licenceCategories: checks[2].value } : {}),
      ...(checks[3].value !== undefined ? { transmission: checks[3].value } : {}),
      ...(headline !== undefined ? { headline: String(headline).trim() } : {}),
      ...(bio !== undefined ? { bio: String(bio).trim() } : {}),
      ...(profilePhotoUrl !== undefined ? { profilePhotoUrl: String(profilePhotoUrl).trim() } : {}),
      ...(Array.isArray(gallery) ? { gallery } : {}),
      ...(pricePerLesson !== undefined ? { pricePerLesson } : {}),
      ...(acceptingNewStudents !== undefined
        ? { acceptingNewStudents: Boolean(acceptingNewStudents) }
        : {}),
      ...(isPublished !== undefined ? { isPublished: Boolean(isPublished) } : {}),
      ...(resolvedPhone !== undefined ? { phone: resolvedPhone } : {}),
    };

    /* Each declaration is recorded with the moment it was given. Re-ticking an
       already confirmed box keeps the original date; unticking clears it.
       Dotted paths, so one declaration never overwrites the other. */
    const nextDeclarations = {
      adiConfirmedAt: existing?.declarations?.adiConfirmedAt ?? null,
      holdsInsuranceAt: existing?.declarations?.holdsInsuranceAt ?? null,
    };
    if (declarations && typeof declarations === "object") {
      const now = new Date();
      if (declarations.adiConfirmed !== undefined) {
        nextDeclarations.adiConfirmedAt = declarations.adiConfirmed
          ? nextDeclarations.adiConfirmedAt ?? now
          : null;
        updates["declarations.adiConfirmedAt"] = nextDeclarations.adiConfirmedAt;
      }
      if (declarations.holdsInsurance !== undefined) {
        nextDeclarations.holdsInsuranceAt = declarations.holdsInsurance
          ? nextDeclarations.holdsInsuranceAt ?? now
          : null;
        updates["declarations.holdsInsuranceAt"] = nextDeclarations.holdsInsuranceAt;
      }
    }

    /* Self-reported and gameable, so it is clamped to what this profile's
       verification status permits rather than stored as claimed. Note that
       verification and subscription are never taken from the request body —
       an instructor cannot verify or bill themselves. */
    if (lessonsDone !== undefined) {
      const status = existing?.verification?.status ?? "unverified";
      updates.lessonsDone = clampLessonsDone(lessonsDone, status);
    }

    /* Completeness is derived from the merged result, never trusted from
       the client, because it feeds search ranking. The account avatar counts
       as the profile photo, which is what the public profile falls back to. */
    const merged = {
      ...(existing?.toObject() ?? {}),
      ...updates,
      declarations: nextDeclarations,
    };
    updates.profileCompleteness = profileCompleteness({
      ...merged,
      profilePhotoUrl: merged.profilePhotoUrl || user.avatarUrl || "",
    });

    /* A listed profile must meet the minimum, whether this request is the one
       publishing it or an edit to one that is already live. Otherwise an
       instructor could publish properly, then quietly withdraw a declaration. */
    if (merged.isPublished) {
      const blockers = publishBlockers({ ...merged, adiNumber: resolvedAdi });
      if (blockers.length) {
        return res.status(400).json({
          message: "Your profile is not ready to be listed yet",
          blockers,
        });
      }
    }

    /* First save starts the 3-month free trial clock. Stripe card
       verification is the Phase 2 piece; the dates exist from day one. */
    if (!existing) {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setMonth(trialEnd.getMonth() + 3);
      updates.subscription = {
        status: "trial",
        trialStartedAt: now,
        trialEndsAt: trialEnd,
      };
    }

    const profile = await InstructorProfile.findOneAndUpdate(
      { userId },
      { $set: updates, $setOnInsert: { userId } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const stats = await reviewStatsFor(userId);
    return res.json({
      message: existing ? "Profile updated" : "Profile created",
      profile: toOwnerProfile(profile, stats),
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Profile save error:", error.message);
    return res.status(500).json({ message: "Failed to save your profile" });
  }
});

export default router;
