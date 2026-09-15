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
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enterprise",
      required: true,
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
  },
  { timestamps: true }
);

/* One review per customer per service.
   Partial, so the rule only binds real reviewers: Mongo treats repeated nulls
   as duplicate keys, so a plain unique index here would make the second
   anonymised review of any one service impossible to write. */
reviewSchema.index(
  { reviewerId: 1, serviceId: 1 },
  { unique: true, partialFilterExpression: { reviewerId: { $type: "objectId" } } }
);

const Review = mongoose.model("Review", reviewSchema);

export default Review;
