import Booking from "../models/Booking.js";
import Review from "../models/Review.js";

/*
 * Which reviews count, and what they add up to.
 *
 * A review a moderator hid after a report stays in the database, for an
 * appeal and for the DSA Article 24(3) transparency report, but it counts
 * nowhere public: not on the profile, not on the search cards, not in any
 * rating or ranking. Every public read filters with VISIBLE_REVIEW.
 * `hiddenAt: null` also matches reviews written before the field existed.
 */
export const VISIBLE_REVIEW = { hiddenAt: null };

/* For aggregations over instructor profiles: their visible reviews' ratings as
   `reviews`. Using localField together with a pipeline needs MongoDB 5.0+. */
export const visibleReviewsLookup = {
  $lookup: {
    from: "reviews",
    localField: "userId",
    foreignField: "providerId",
    pipeline: [{ $match: VISIBLE_REVIEW }, { $project: { rating: 1 } }],
    as: "reviews",
  },
};

/* Count and average, rounded to one decimal; null average when there are none. */
export const ratingStats = (ratings) => {
  const reviewCount = ratings.length;
  const averageRating =
    reviewCount > 0
      ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / reviewCount) * 10) / 10
      : null;
  return { reviewCount, averageRating };
};

export const reviewStatsFor = async (providerId) => {
  const reviews = await Review.find({ providerId, ...VISIBLE_REVIEW }).select("rating").lean();
  return ratingStats(reviews.map((review) => review.rating));
};

/*
 * A learner's own reviews, newest first, hidden ones included. When a
 * moderator hides a review, its author is the person Article 17 says must be
 * told what was decided and why, so the statement of reasons comes with it.
 */
export const ownReviewsFor = async (reviewerId) => {
  const reviews = await Review.find({ reviewerId })
    .populate("providerId", "name")
    .select("providerId rating comment createdAt hiddenAt hiddenReason")
    .sort({ createdAt: -1 })
    .lean();

  return reviews.map((review) => ({
    _id: review._id,
    instructor: review.providerId ? { id: review.providerId._id, name: review.providerId.name } : null,
    rating: review.rating,
    comment: review.comment ?? "",
    createdAt: review.createdAt,
    hidden: Boolean(review.hiddenAt),
    ...(review.hiddenAt ? { hiddenAt: review.hiddenAt, hiddenReason: review.hiddenReason } : {}),
  }));
};

/*
 * A moderator's decision on a reported review (DSA Article 17): hide it and
 * keep the statement of reasons with it. Nothing is deleted.
 * Returns true if this call hid it, false if it was gone or already hidden.
 */
export const hideReview = async (reviewId, { reason, reportId }) => {
  const result = await Review.updateOne(
    { _id: reviewId, ...VISIBLE_REVIEW },
    { $set: { hiddenAt: new Date(), hiddenReason: reason, hiddenByReport: reportId } }
  );
  return result.modifiedCount > 0;
};

/*
 * Whether a learner may review an instructor: only after a lesson that
 * actually happened - a booking the instructor confirmed, whose date has
 * passed. Without this anyone with a learner account could rate any
 * instructor, a competitor included. One review per instructor is still
 * enforced by the unique index; this only answers it early for the form.
 * Returns "ok", "no_lesson" or "already_reviewed".
 */
export const reviewEligibility = async (learnerId, instructorId) => {
  const [lesson, existing] = await Promise.all([
    Booking.exists({
      userId: learnerId,
      instructorId,
      status: "confirmed",
      bookingDate: { $lte: new Date() },
    }),
    Review.exists({ reviewerId: learnerId, providerId: instructorId }),
  ]);
  if (existing) return "already_reviewed";
  return lesson ? "ok" : "no_lesson";
};
