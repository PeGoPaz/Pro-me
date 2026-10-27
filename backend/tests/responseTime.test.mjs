import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import Booking from "../models/Booking.js";
import {
  MIN_REQUESTS, responseBucket, responseTimeFor, responseTimesFor, statusUpdate,
} from "../utils/responseTime.js";

let memoryServer;

before(async () => {
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri("prome-response-time-test"));
});

beforeEach(async () => {
  await Booking.deleteMany({});
});

after(async () => {
  await mongoose.disconnect();
  await memoryServer.stop();
});

const HOUR = 60 * 60 * 1000;
const NOW = new Date(Date.UTC(2026, 9, 27, 12));
const hoursAgo = (h) => new Date(NOW.getTime() - h * HOUR);
const objectId = () => new mongoose.Types.ObjectId();

/* Written straight into the collection so createdAt can be set in the past. */
const requests = (instructorId, ...docs) =>
  Booking.collection.insertMany(
    docs.map((doc) => ({
      userId: objectId(),
      instructorId,
      bookingDate: NOW,
      status: "pending",
      confirmedAt: null,
      respondedAt: null,
      ...doc,
    }))
  );

/* A request made `age` hours ago and answered after `took` hours. */
const answered = (age, took, status = "confirmed") => ({
  status, createdAt: hoursAgo(age), respondedAt: hoursAgo(age - took),
});

describe("responseBucket", () => {
  it("rounds a median into how people talk about replies", () => {
    assert.deepEqual([0.5, 1, 3, 20, 50, 100].map(responseBucket), ["hour", "hour", "hours", "day", "days", "slow"]);
  });
});

describe("statusUpdate", () => {
  it("keeps the first answer when the instructor changes their mind", () => {
    const first = statusUpdate({ respondedAt: null }, "cancelled", hoursAgo(5));
    assert.deepEqual(first, { status: "cancelled", confirmedAt: null, respondedAt: hoursAgo(5) });

    const again = statusUpdate(first, "confirmed", NOW);
    assert.equal(again.respondedAt, first.respondedAt);
    assert.equal(again.confirmedAt, NOW);
  });

  it("does not count putting a request back to pending as an answer", () => {
    assert.equal(statusUpdate({ respondedAt: null }, "pending", NOW).respondedAt, null);
  });
});

describe("responseTimeFor", () => {
  it("says nothing until there are enough requests", async () => {
    const id = objectId();
    await requests(id, ...Array.from({ length: MIN_REQUESTS - 1 }, () => answered(30, 1)));
    assert.equal(await responseTimeFor(id, NOW), null);
  });

  it("takes the median, declines included", async () => {
    const id = objectId();
    await requests(id, answered(30, 1), answered(30, 2), answered(30, 3, "cancelled"),
      answered(30, 4, "cancelled"), answered(30, 20));
    assert.deepEqual(await responseTimeFor(id, NOW), { medianHours: 3, bucket: "hours", basedOn: 5 });
  });

  it("counts ignored requests, but not ones still too new to judge", async () => {
    const id = objectId();
    await requests(id, answered(30, 1), answered(30, 1),
      // Ignored for five days: counts with the 120 hours waited so far.
      { createdAt: hoursAgo(120) }, { createdAt: hoursAgo(120) }, { createdAt: hoursAgo(120) },
      // Asked an hour ago: no answer expected yet, left out.
      { createdAt: hoursAgo(1) });
    assert.deepEqual(await responseTimeFor(id, NOW), { medianHours: 120, bucket: "slow", basedOn: 5 });
  });

  it("uses confirmedAt for requests answered before respondedAt existed", async () => {
    const id = objectId();
    await requests(id, ...Array.from({ length: 5 }, () => ({
      status: "confirmed", createdAt: hoursAgo(30), confirmedAt: hoursAgo(28),
    })));
    assert.equal((await responseTimeFor(id, NOW)).medianHours, 2);
  });

  it("ignores answers dated before the request", async () => {
    const id = objectId();
    await requests(id, ...Array.from({ length: 4 }, () => answered(30, 6)),
      { status: "confirmed", createdAt: hoursAgo(10), confirmedAt: hoursAgo(20) });
    assert.equal(await responseTimeFor(id, NOW), null, "four sound requests are not enough");
  });

  it("only looks at the last 90 days", async () => {
    const id = objectId();
    await requests(id, ...Array.from({ length: 5 }, () => answered(24 * 100, 1)));
    assert.equal(await responseTimeFor(id, NOW), null);
  });
});

describe("responseTimesFor", () => {
  it("answers for a whole page of instructors at once", async () => {
    const quick = objectId();
    const unknown = objectId();
    await requests(quick, ...Array.from({ length: 5 }, () => answered(30, 0.5)));
    const times = await responseTimesFor([quick, unknown], NOW);
    assert.equal(times.get(String(quick)).bucket, "hour");
    assert.equal(times.get(String(unknown)), null);
  });
});
