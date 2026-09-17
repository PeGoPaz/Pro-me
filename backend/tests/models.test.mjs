/*
 * Integration tests against a real MongoDB.
 *
 * These exist because the three worst defects in this project so far were all
 * invisible to schema-loading checks and only appeared once a real Mongo was
 * asked to build the indexes and write a document:
 *
 *   - a compound index across two array fields ("cannot index parallel
 *     arrays") failed every instructor profile insert;
 *   - a unique index counted repeated nulls as duplicates, so the second
 *     anonymised review of one instructor could not be written;
 *   - bookings pointed at a listing rather than the instructor.
 *
 * So the assertions below deliberately exercise index behaviour, not just
 * validation. `syncIndexes()` is what makes Mongo actually build them.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import Booking from "../models/Booking.js";
import InstructorProfile from "../models/InstructorProfile.js";
import Review from "../models/Review.js";

let memoryServer;

const objectId = () => new mongoose.Types.ObjectId();

before(async () => {
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri("prome-test"));
  /* Build every index for real — this is the step that catches the
     parallel-array class of bug. */
  await Promise.all([
    Booking.syncIndexes(),
    InstructorProfile.syncIndexes(),
    Review.syncIndexes(),
  ]);
});

after(async () => {
  await mongoose.disconnect();
  await memoryServer.stop();
});

describe("InstructorProfile", () => {
  it("builds its indexes and accepts a profile", async () => {
    /* Regression: licenceCategories and transmission are both arrays, so they
       must be separate indexes. A compound one fails the insert, not the
       index build, which is why this asserts on a write. */
    const profile = await InstructorProfile.create({
      userId: objectId(),
      adiNumber: "ADI-00001",
      counties: ["dublin"],
      testCentres: ["finglas"],
      licenceCategories: ["B", "BE"],
      transmission: ["automatic", "manual"],
    });

    assert.equal(profile.licenceCategories.length, 2);
    assert.equal(profile.transmission.length, 2);
  });

  it("rejects values that are not in the RSA reference data", async () => {
    await assert.rejects(
      InstructorProfile.create({
        userId: objectId(),
        adiNumber: "ADI-00002",
        counties: ["atlantis"],
      }),
      /counties/
    );
  });
});

describe("Booking", () => {
  it("requires an instructor", async () => {
    await assert.rejects(
      Booking.create({ userId: objectId(), bookingDate: new Date() }),
      /instructorId/
    );
  });

  it("stores a lesson booking with no service listing", async () => {
    /* The driving-instructor path: a learner books a person, not a listing. */
    const booking = await Booking.create({
      userId: objectId(),
      instructorId: objectId(),
      bookingDate: new Date("2026-10-01T10:00:00Z"),
    });

    assert.equal(booking.serviceId, null);
    assert.equal(booking.status, "pending");
    assert.equal(booking.confirmedAt, null);
  });

  it("keeps an optional service link for the Other category", async () => {
    const serviceId = objectId();
    const booking = await Booking.create({
      userId: objectId(),
      instructorId: objectId(),
      serviceId,
      bookingDate: new Date(),
    });

    assert.equal(String(booking.serviceId), String(serviceId));
  });
});

describe("Review", () => {
  it("saves without a service, because a review is about the instructor", async () => {
    const review = await Review.create({
      reviewerId: objectId(),
      providerId: objectId(),
      rating: 5,
    });

    assert.equal(review.serviceId, null);
  });

  it("allows one review per learner per instructor", async () => {
    const reviewerId = objectId();
    const providerId = objectId();

    await Review.create({ reviewerId, providerId, rating: 5 });

    /* Previously keyed on serviceId, which let one learner review the same
       instructor once per listing. */
    await assert.rejects(
      Review.create({ reviewerId, providerId, rating: 1 }),
      (error) => error.code === 11000
    );
  });

  it("still allows the same learner to review a different instructor", async () => {
    const reviewerId = objectId();
    await Review.create({ reviewerId, providerId: objectId(), rating: 4 });
    const second = await Review.create({ reviewerId, providerId: objectId(), rating: 3 });

    assert.equal(second.rating, 3);
  });

  it("writes several anonymised reviews for one instructor", async () => {
    /* The partial index earns its keep here. Mongo treats repeated nulls as
       duplicate keys, so without partialFilterExpression the second deleted
       learner's review of this instructor would be refused — silently losing
       a review that the instructor's rating already reflected. */
    const providerId = objectId();

    await Review.create({ reviewerId: null, providerId, rating: 5 });
    await Review.create({ reviewerId: null, providerId, rating: 2 });

    const anonymised = await Review.countDocuments({ reviewerId: null, providerId });
    assert.equal(anonymised, 2);
  });
});
