import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    /* Null once the reviewer deletes their account. The review itself stays —
       it is about the instructor as much as it is by the learner, and removing
       it would silently rewrite that instructor's rating history. The UI shows
       these as "Deleted user". */
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    /* Optional. A review is about the instructor, not about one listing —
       which is why uniqueness is keyed on providerId below. This stays only so
       an Other-category review can still say which listing it came from. */
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enterprise",
      default: null,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    /* Set when a moderator hides the review after a report (DSA Article 17).
       It then counts nowhere public - see utils/reviews.js - but is kept with
       the decision, for an appeal and the Article 24(3) transparency report. */
    hiddenAt: { type: Date, default: null },
    hiddenReason: { type: String, trim: true, maxlength: 2000, default: "" },
    hiddenByReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      default: null,
    },
  },
  { timestamps: true }
);

/* One review per learner per INSTRUCTOR — it used to be per service, which let
   one learner leave several reviews of the same instructor simply by reviewing
   several of their listings.

   Still partial, and for the same reason as before: Mongo counts repeated nulls
   as duplicate keys, so once a learner deletes their account and their reviews
   are anonymised to reviewerId: null, a plain unique index would refuse to
   write the second anonymised review of any one instructor. */
reviewSchema.index(
  { reviewerId: 1, providerId: 1 },
  { unique: true, partialFilterExpression: { reviewerId: { $type: "objectId" } } }
);

/* The profile page and the search page's rating lookup. */
reviewSchema.index({ providerId: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
