import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import Report from "../models/Report.js";
import { median, transparencyReport } from "../utils/transparency.js";

let memoryServer;

before(async () => {
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri("prome-transparency-test"));
});

beforeEach(async () => {
  await Report.deleteMany({});
});

after(async () => {
  await mongoose.disconnect();
  await memoryServer.stop();
});

const HOUR = 60 * 60 * 1000;

/* Written straight into the collection so createdAt can be set; through the
   model, timestamps would stamp them with today's date. */
const reports = (...docs) =>
  Report.collection.insertMany(
    docs.map((doc) => ({
      targetType: "review",
      targetId: new mongoose.Types.ObjectId(),
      reporterId: null,
      reason: "spam",
      status: "received",
      contentAction: null,
      referredToAuthoritiesAt: null,
      handledAt: null,
      ...doc,
    }))
  );

describe("median", () => {
  it("takes the middle value, or the mean of the middle two", () => {
    assert.equal(median([5, 1, 3]), 3);
    assert.equal(median([4, 1, 2, 3]), 2.5);
    assert.equal(median([]), null);
  });
});

describe("transparencyReport", () => {
  it("counts a year's notices by kind and outcome", async () => {
    const received = (month, day) => new Date(Date.UTC(2026, month, day, 9));
    await reports(
      { reason: "fake_reviews", status: "actioned", contentAction: "hidden_review",
        createdAt: received(8, 1), handledAt: new Date(received(8, 1).getTime() + 2 * HOUR) },
      { reason: "fake_reviews", status: "dismissed", reporterId: new mongoose.Types.ObjectId(),
        createdAt: received(9, 3), handledAt: new Date(received(9, 3).getTime() + 30 * HOUR) },
      { reason: "not_an_adi", targetType: "profile", status: "actioned", contentAction: "unpublished_profile",
        referredToAuthoritiesAt: received(10, 2), createdAt: received(10, 1),
        handledAt: new Date(received(10, 1).getTime() + 10 * HOUR) },
      { reason: "spam", status: "received", createdAt: received(11, 30) },
      /* Last year: not this year's report. */
      { reason: "spam", status: "actioned", createdAt: new Date(Date.UTC(2025, 11, 31, 23)) }
    );

    const report = await transparencyReport(2026);
    assert.equal(report.notices.total, 4);
    assert.equal(report.notices.anonymous, 3);
    assert.deepEqual(report.notices.byReason, { fake_reviews: 2, not_an_adi: 1, spam: 1 });
    assert.deepEqual(report.notices.byTarget, { review: 3, profile: 1 });
    assert.deepEqual(report.outcomes, {
      actioned: 2,
      dismissed: 1,
      stillOpen: 1,
      contentActions: { hidden_review: 1, unpublished_profile: 1 },
      referredToAuthorities: 1,
    });
    /* 2, 10 and 30 hours; the open one is not counted. */
    assert.equal(report.medianHoursToClose, 10);
  });

  it("has no handling time while nothing is closed", async () => {
    await reports({ createdAt: new Date(Date.UTC(2026, 9, 1)) });
    const report = await transparencyReport(2026);
    assert.equal(report.medianHoursToClose, null);
    assert.equal(report.outcomes.stillOpen, 1);
  });
});
