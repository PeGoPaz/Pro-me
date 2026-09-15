import express from "express";
import mongoose from "mongoose";

import Favorite from "../models/Favorite.js";
import User from "../models/User.js";
import InstructorProfile from "../models/InstructorProfile.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* Saving is for learners only — a provider shortlisting rivals is not a
   use case we want, and it would pollute the counts. */
router.use(requireAuth, requireRole(["user"]));

/* GET /api/favorites — the learner's shortlist, newest first. */
router.get("/", async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.session.user.id })
      .populate("instructorId", "name avatarUrl")
      .sort({ createdAt: -1 });

    /* Attach the profile summary each card needs, in one query rather than
       one per favourite. */
    const instructorIds = favorites
      .map((favorite) => favorite.instructorId?._id)
      .filter(Boolean);

    const profiles = await InstructorProfile.find({
      userId: { $in: instructorIds },
    }).select("userId counties testCentres licenceCategories transmission pricePerLesson profilePhotoUrl verification.status acceptingNewStudents");

    const profileByUser = new Map(
      profiles.map((profile) => [String(profile.userId), profile])
    );

    return res.json(
      favorites.map((favorite) => ({
        id: favorite._id,
        savedAt: favorite.createdAt,
        instructor: favorite.instructorId,
        profile: profileByUser.get(String(favorite.instructorId?._id)) ?? null,
      }))
    );
  } catch (error) {
    console.error("Favorites fetch error:", error.message);
    return res.status(500).json({ message: "Failed to fetch favorites" });
  }
});

/* POST /api/favorites — save an instructor. Idempotent. */
router.post("/", async (req, res) => {
  try {
    const { instructorId } = req.body;

    if (!isValidObjectId(instructorId)) {
      return res.status(400).json({ message: "Invalid instructor id" });
    }

    const instructor = await User.findOne({
      _id: instructorId,
      role: "enterprise",
    }).select("_id");
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    const favorite = await Favorite.findOneAndUpdate(
      { userId: req.session.user.id, instructorId },
      { $setOnInsert: { userId: req.session.user.id, instructorId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ message: "Instructor saved", favorite });
  } catch (error) {
    /* Two rapid saves can race past the upsert and hit the unique index.
       The user's intent is already satisfied, so report success. */
    if (error.code === 11000) {
      return res.status(200).json({ message: "Instructor already saved" });
    }
    console.error("Favorite create error:", error.message);
    return res.status(500).json({ message: "Failed to save instructor" });
  }
});

/* DELETE /api/favorites/:instructorId — remove from the shortlist. */
router.delete("/:instructorId", async (req, res) => {
  try {
    const { instructorId } = req.params;

    if (!isValidObjectId(instructorId)) {
      return res.status(400).json({ message: "Invalid instructor id" });
    }

    const removed = await Favorite.findOneAndDelete({
      userId: req.session.user.id,
      instructorId,
    });

    if (!removed) {
      return res.status(404).json({ message: "Not in your saved list" });
    }

    return res.json({ message: "Instructor removed from saved list" });
  } catch (error) {
    console.error("Favorite delete error:", error.message);
    return res.status(500).json({ message: "Failed to remove instructor" });
  }
});

export default router;
