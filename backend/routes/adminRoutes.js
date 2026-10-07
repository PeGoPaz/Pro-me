import express from "express";
import mongoose from "mongoose";

import InstructorProfile from "../models/InstructorProfile.js";
import Report from "../models/Report.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { VERIFICATION_DECISIONS, verificationUpdate } from "../utils/instructorRules.js";

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* Everything here is admin-only. The role cannot be self-assigned: register
   rejects it and only scripts/makeAdmin.mjs grants it. */
router.use(requireAuth, requireRole(["admin"]));

/* Where an admin checks an instructor against the official register. */
const RSA_REGISTER_URL =
  "https://www.rsa.ie/services/learner-drivers/driving-lessons/find-an-instructor/approved-driving-instructor";

/* ── ADI verification queue ────────────────────────────────────────────────
   Accounts are created immediately with no human gate (cold start: with no
   network effect yet, instructors will not wait on a review). Profiles are
   listed as unverified, and this queue is where a person compares each one
   against the RSA public register and records the outcome. */

/* GET /api/admin/verifications?status=unverified — oldest first, so nobody
   waits indefinitely. */
router.get("/verifications", async (req, res) => {
  try {
    const status = ["unverified", "pending", "verified", "rejected"].includes(req.query.status)
      ? req.query.status
      : "unverified";

    const profiles = await InstructorProfile.find({ "verification.status": status })
      .populate("userId", "name email createdAt")
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    return res.json({
      registerUrl: RSA_REGISTER_URL,
      profiles: profiles.map((profile) => ({
        id: profile._id,
        userId: profile.userId?._id,
        name: profile.userId?.name ?? "(deleted account)",
        email: profile.userId?.email ?? "",
        /* The admin needs the ADI number — it is the whole point of the
           check. It is never exposed outside this route and the owner's own. */
        adiNumber: profile.adiNumber,
        counties: profile.counties ?? [],
        licenceCategories: profile.licenceCategories ?? [],
        isPublished: Boolean(profile.isPublished),
        verification: profile.verification ?? {},
        declarations: profile.declarations ?? {},
        createdAt: profile.createdAt,
      })),
    });
  } catch (error) {
    console.error("Admin verification list error:", error.message);
    return res.status(500).json({ message: "Failed to load the verification queue" });
  }
});

/* POST /api/admin/verifications/:profileId  { decision, note } */
router.post("/verifications/:profileId", async (req, res) => {
  try {
    const { profileId } = req.params;
    const { decision, note } = req.body;

    if (!isValidObjectId(profileId)) {
      return res.status(400).json({ message: "Invalid profile id" });
    }
    if (!VERIFICATION_DECISIONS.includes(decision)) {
      return res.status(400).json({ message: `decision must be one of: ${VERIFICATION_DECISIONS.join(", ")}` });
    }
    /* A rejection takes a profile off the listing, so it must say why — this
       is what we would tell the instructor, and it is the record if they
       dispute it. */
    if (decision === "rejected" && !String(note ?? "").trim()) {
      return res.status(400).json({ message: "Say why the ADI number could not be verified" });
    }

    const profile = await InstructorProfile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const updated = await InstructorProfile.findByIdAndUpdate(
      profileId,
      { $set: verificationUpdate(profile, decision, { note }) },
      { new: true, runValidators: true }
    );

    return res.json({
      message: decision === "verified" ? "Instructor verified" : "Verification rejected and profile unlisted",
      verification: updated.verification,
      isPublished: updated.isPublished,
    });
  } catch (error) {
    console.error("Admin verification decision error:", error.message);
    return res.status(500).json({ message: "Failed to record the decision" });
  }
});

/* ── DSA notice-and-action queue ───────────────────────────────────────────
   Reports were being collected (Article 16) with no way for anyone to read
   them. This is the other half: review, decide, and record the statement of
   reasons that Article 17 requires whenever we act on content. */

const OPEN_STATUSES = ["received", "reviewing"];
const ALL_STATUSES = ["received", "reviewing", "actioned", "dismissed"];

/* Attach a readable summary of what was reported. */
const describeTarget = async (report) => {
  if (report.targetType === "profile") {
    const user = await User.findById(report.targetId).select("name").lean();
    return { kind: "profile", label: user?.name ?? "(account deleted)", link: `/instructors/${report.targetId}` };
  }
  if (report.targetType === "review") {
    const review = await Review.findById(report.targetId).select("rating comment providerId").lean();
    return review
      ? { kind: "review", label: `${review.rating}★ — ${review.comment || "(no comment)"}`, link: `/instructors/${review.providerId}` }
      : { kind: "review", label: "(review deleted)", link: null };
  }
  return { kind: report.targetType, label: String(report.targetId), link: null };
};

/* GET /api/admin/reports?status=open — oldest first. */
router.get("/reports", async (req, res) => {
  try {
    const statuses = ALL_STATUSES.includes(req.query.status) ? [req.query.status] : OPEN_STATUSES;

    const reports = await Report.find({ status: { $in: statuses } })
      .populate("reporterId", "name email")
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    const withTargets = await Promise.all(
      reports.map(async (report) => ({ ...report, target: await describeTarget(report) }))
    );

    return res.json({ reports: withTargets });
  } catch (error) {
    console.error("Admin report list error:", error.message);
    return res.status(500).json({ message: "Failed to load reports" });
  }
});

/* PATCH /api/admin/reports/:id
   { status, statementOfReasons, unpublishProfile?, referToAuthorities? } */
router.patch("/reports/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, statementOfReasons, unpublishProfile, referToAuthorities } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid report id" });
    }
    if (!ALL_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${ALL_STATUSES.join(", ")}` });
    }

    const reasons = String(statementOfReasons ?? "").trim();
    /* Closing a report either way needs a reason on record: Article 17 for
       the person whose content we acted on, and an answer for the reporter. */
    if ((status === "actioned" || status === "dismissed") && !reasons) {
      return res.status(400).json({ message: "A statement of reasons is required to close a report" });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.status = status;
    if (reasons) report.statementOfReasons = reasons.slice(0, 2000);
    if (status === "actioned" || status === "dismissed") {
      report.handledAt = new Date();
      report.handledBy = req.session.user.id;
    }
    /* Article 18: suspected offences threatening someone's safety are passed
       to the authorities. Recorded here; the referral itself happens outside
       the system. */
    if (referToAuthorities === true && !report.referredToAuthoritiesAt) {
      report.referredToAuthoritiesAt = new Date();
    }
    await report.save();

    /* The one content action available today: take a reported profile off
       the listing. Nothing is deleted. */
    let unpublished = false;
    if (unpublishProfile === true && report.targetType === "profile" && status === "actioned") {
      const result = await InstructorProfile.updateOne(
        { userId: report.targetId },
        { $set: { isPublished: false } }
      );
      unpublished = result.modifiedCount > 0;
    }

    return res.json({ message: "Report updated", report, unpublished });
  } catch (error) {
    console.error("Admin report update error:", error.message);
    return res.status(500).json({ message: "Failed to update the report" });
  }
});

export default router;
