import express from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Enterprise from "../models/Enterprise.js";
import User from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

/* ── POST /api/reviews ─────────────────────────────────────────────
   Create a review. Only logged-in learners (role: "user") can post.
   One review per learner per INSTRUCTOR, enforced by the unique index.
   serviceId is optional and only meaningful for the Other category.  */
router.post("/", requireAuth, requireRole(["user"]), async (req, res) => {
  try {
    const { providerId, serviceId, rating, comment } = req.body;
    const reviewerId = req.session.user.id;

    if (!providerId || !rating) {
      return res.status(400).json({ message: "providerId and rating are required." });
    }

    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be a whole number between 1 and 5." });
    }

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({ message: "Invalid providerId." });
    }

    /* The provider must exist and actually be a provider. */
    const provider = await User.findOne({ _id: providerId, role: "enterprise" }).select("_id");
    if (!provider) {
      return res.status(404).json({ message: "Provider not found." });
    }

    /* Optional listing link. If given it must belong to this provider,
       otherwise a review could be attached to someone else's listing. */
    let resolvedServiceId = null;
    if (serviceId) {
      if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        return res.status(400).json({ message: "Invalid serviceId." });
      }
      const service = await Enterprise.findOne({ _id: serviceId, userId: providerId });
      if (!service) {
        return res.status(404).json({ message: "Service not found for this provider." });
      }
      resolvedServiceId = service._id;
    }

    /* Customers cannot review themselves */
    if (reviewerId === providerId) {
      return res.status(400).json({ message: "You cannot review your own service." });
    }

    const review = await Review.create({
      reviewerId,
      providerId,
      serviceId: resolvedServiceId,
      rating: parsedRating,
      comment: comment?.trim() || undefined,
    });

    const populated = await review.populate([
      { path: "reviewerId", select: "name" },
      { path: "serviceId", select: "subject" },
    ]);

    return res.status(201).json({ message: "Review submitted.", review: populated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "You have already reviewed this instructor." });
    }
    console.error("Review error:", error.message);
    return res.status(500).json({ message: "An error occurred." });
  }
});

/* ── GET /api/reviews/provider/:providerId ─────────────────────────
   Public — fetch all reviews for a provider, newest first.           */
router.get("/provider/:providerId", async (req, res) => {
  try {
    const { providerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({ message: "Invalid providerId." });
    }

    const reviews = await Review.find({ providerId })
      .populate("reviewerId", "name avatarUrl")
      .populate("serviceId", "subject")
      .sort({ createdAt: -1 });

    const count = reviews.length;
    const avg =
      count > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
        : null;

    return res.status(200).json({ reviews, count, averageRating: avg });
  } catch (error) {
    console.error("Review error:", error.message);
    return res.status(500).json({ message: "An error occurred." });
  }
});

export default router;
