import express from "express";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import validator from "validator";

import Report from "../models/Report.js";

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/*
 * DSA Article 16 notice-and-action endpoint.
 *
 * Anyone may report, signed in or not — Article 16 does not permit us to put
 * an account behind the ability to flag illegal content. That openness is also
 * an abuse surface, so reports get their own tighter rate limit rather than
 * riding on the general one.
 */
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: "Too many reports from this address, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const VALID_REASONS = [
  "not_an_adi",
  "fake_profile",
  "fake_reviews",
  "inappropriate_photo",
  "harassment",
  "unsafe_conduct",
  "spam",
  "other",
];

/* GET /api/reports/reasons — drives the dropdown in the report dialog. */
router.get("/reasons", (_req, res) =>
  res.json([
    { value: "not_an_adi", label: "Not an approved driving instructor" },
    { value: "fake_profile", label: "Fake or impersonating profile" },
    { value: "fake_reviews", label: "Fake reviews" },
    { value: "inappropriate_photo", label: "Inappropriate photo" },
    { value: "harassment", label: "Harassment or abuse" },
    { value: "unsafe_conduct", label: "Unsafe conduct during a lesson" },
    { value: "spam", label: "Spam or misleading content" },
    { value: "other", label: "Something else" },
  ])
);

/* POST /api/reports — file a report. */
router.post("/", reportLimiter, async (req, res) => {
  try {
    const { targetType, targetId, reason, details, reporterEmail } = req.body;

    if (!["profile", "review", "service"].includes(targetType)) {
      return res.status(400).json({ message: "targetType must be profile, review or service" });
    }
    if (!isValidObjectId(targetId)) {
      return res.status(400).json({ message: "Invalid targetId" });
    }
    if (!VALID_REASONS.includes(reason)) {
      return res.status(400).json({ message: "Please choose a valid reason" });
    }
    if (details !== undefined && typeof details !== "string") {
      return res.status(400).json({ message: "details must be text" });
    }
    if (typeof details === "string" && details.length > 2000) {
      return res.status(400).json({ message: "details must be 2000 characters or fewer" });
    }

    /* Only kept so we can send the Article 17 statement of reasons back to a
       reporter who is not signed in. */
    let email = "";
    if (typeof reporterEmail === "string" && reporterEmail.trim()) {
      if (!validator.isEmail(reporterEmail.trim())) {
        return res.status(400).json({ message: "Please provide a valid email address" });
      }
      email = reporterEmail.trim().toLowerCase();
    }

    const report = await Report.create({
      targetType,
      targetId,
      reason,
      details: typeof details === "string" ? details.trim() : "",
      reporterId: req.session?.user?.id ?? null,
      reporterEmail: email,
    });

    /* The reference is what a reporter quotes when chasing an outcome — but we
       never echo back the report's contents or who filed it. */
    return res.status(201).json({
      message: "Report received. We review every report and will act where needed.",
      reference: report._id,
    });
  } catch (error) {
    console.error("Report create error:", error.message);
    return res.status(500).json({ message: "Failed to submit report" });
  }
});

export default router;
