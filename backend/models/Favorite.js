import mongoose from "mongoose";

/*
 * A learner saving an instructor to compare later.
 *
 * Saving is auth-gated on purpose — an anonymous favourite has nowhere to live,
 * and requiring an account is what makes the shortlist worth building.
 */

const favoriteSchema = new mongoose.Schema(
  {
    /* The learner. Always role "user". */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    /* The instructor's user id, not their profile id — the profile can be
       rebuilt or republished, the account is the stable thing to point at. */
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

/* Saving twice is a no-op, not a duplicate row. */
favoriteSchema.index({ userId: 1, instructorId: 1 }, { unique: true });
/* "My saved instructors", newest first. */
favoriteSchema.index({ userId: 1, createdAt: -1 });

const Favorite = mongoose.model("Favorite", favoriteSchema);

export default Favorite;
