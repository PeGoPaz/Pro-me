/*
 * Hidden reviews, against a real MongoDB: once a moderator hides a review it
 * must drop out of every public number - the profile's stats and the search
 * aggregation - while staying in the database with the decision attached.
 */
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import InstructorProfile from "../models/InstructorProfile.js";
import Review from "../models/Review.js";
import { hideReview, ratingStats, reviewStatsFor, visibleReviewsLookup } from "../utils/reviews.js";

let memoryServer;

const objectId = () => new mongoose.Types.ObjectId();

before(async () => {
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri("prome-reviews-test"));
  await Promise.all([InstructorProfile.syncIndexes(), Review.syncIndexes()]);
});

beforeEach(async () => {
  await Promise.all([InstructorProfile.deleteMany({}), Review.deleteMany({})]);
});

after(async () => {
  await mongoose.disconnect();
  await memoryServer.stop();
});

const reviewsFor = (providerId, ratings) =>
  Review.create(ratings.map((rating) => ({ providerId, reviewerId: objectId(), rating })));

describe("ratingStats", () => {
  it("averages to one decimal", () => {
    assert.deepEqual(ratingStats([5, 4, 4]), { reviewCount: 3, averageRating: 4.3 });
  });

  it("has no average without reviews", () => {
    assert.deepEqual(ratingStats([]), { reviewCount: 0, averageRating: null });
  });
});

describe("hideReview", () => {
  it("keeps the review and the decision, once", async () => {
    const [review] = await reviewsFor(objectId(), [1]);
    const reportId = objectId();

    assert.equal(await hideReview(review._id, { reason: "Abusive language", reportId }), true);
    assert.equal(await hideReview(review._id, { reason: "Again", reportId }), false);

    const stored = await Review.findById(review._id).lean();
    assert.ok(stored.hiddenAt instanceof Date);
    assert.equal(stored.hiddenReason, "Abusive language");
    assert.equal(String(stored.hiddenByReport), String(reportId));
  });

  it("does nothing for a review that no longer exists", async () => {
    assert.equal(await hideReview(objectId(), { reason: "Gone", reportId: objectId() }), false);
  });
});

describe("hidden reviews count nowhere public", () => {
  it("drop out of an instructor's stats", async () => {
    const providerId = objectId();
    const [, , low] = await reviewsFor(providerId, [5, 5, 1]);
    assert.deepEqual(await reviewStatsFor(providerId), { reviewCount: 3, averageRating: 3.7 });

    await hideReview(low._id, { reason: "Fake review", reportId: objectId() });
    assert.deepEqual(await reviewStatsFor(providerId), { reviewCount: 2, averageRating: 5 });
  });

  it("still count when written before reviews could be hidden", async () => {
    const providerId = objectId();
    /* Straight into the collection, so the document has no hiddenAt at all. */
    await Review.collection.insertOne({ providerId, reviewerId: objectId(), rating: 4 });
    assert.deepEqual(await reviewStatsFor(providerId), { reviewCount: 1, averageRating: 4 });
  });

  it("drop out of the search aggregation", async () => {
    const providerId = objectId();
    await InstructorProfile.create({
      userId: providerId,
      adiNumber: "ADI-00002",
      counties: ["dublin"],
      testCentres: ["finglas"],
      licenceCategories: ["B"],
      transmission: ["manual"],
    });
    const [, hidden] = await reviewsFor(providerId, [4, 1]);
    await hideReview(hidden._id, { reason: "Spam", reportId: objectId() });

    const [row] = await InstructorProfile.aggregate([{ $match: { userId: providerId } }, visibleReviewsLookup]);
    assert.deepEqual(row.reviews.map((review) => review.rating), [4]);
  });
});
