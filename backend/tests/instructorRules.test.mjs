/*
 * Rules tests — run with `node tests/instructorRules.test.mjs`.
 *
 * Plain assertions on purpose: these cover the logic that is easy to get
 * quietly wrong, and they need no database, so they run anywhere.
 */
import assert from "node:assert/strict";

import {
  clampLessonsDone,
  isLessonsDoneCorroborated,
  isProfileVisible,
  lessonsDoneCap,
  profileCompleteness,
  subscriptionState,
} from "../utils/instructorRules.js";

let passed = 0;
const test = (name, fn) => {
  try {
    fn();
    passed += 1;
  } catch (error) {
    console.error(`FAIL  ${name}\n      ${error.message}`);
    process.exitCode = 1;
  }
};

/* ── lessons done ─────────────────────────────────────────────────────── */

test("unverified profiles are held to the low cap", () => {
  assert.equal(clampLessonsDone(12000, "unverified"), 250);
});

test("verified profiles may claim far more", () => {
  assert.equal(clampLessonsDone(12000, "verified"), 12000);
});

test("a rejected profile cannot display any lessons", () => {
  assert.equal(clampLessonsDone(500, "rejected"), 0);
});

test("garbage and negatives floor at zero", () => {
  assert.equal(clampLessonsDone("banana", "verified"), 0);
  assert.equal(clampLessonsDone(-5, "verified"), 0);
  assert.equal(clampLessonsDone(12.9, "verified"), 12);
});

test("an unknown status falls back to the strictest sensible cap", () => {
  assert.equal(lessonsDoneCap("nonsense"), 250);
});

test("corroboration needs verification AND real activity", () => {
  assert.equal(
    isLessonsDoneCorroborated({ verificationStatus: "verified", reviewCount: 3 }),
    true
  );
  /* Verified but nothing backing the number up — still labelled. */
  assert.equal(
    isLessonsDoneCorroborated({ verificationStatus: "verified" }),
    false
  );
  /* Activity but unverified — still labelled. */
  assert.equal(
    isLessonsDoneCorroborated({ verificationStatus: "unverified", reviewCount: 99 }),
    false
  );
});

/* ── subscription visibility ──────────────────────────────────────────── */

const now = new Date("2026-09-16T12:00:00Z");
const future = new Date("2026-09-30T12:00:00Z");
const past = new Date("2026-09-01T12:00:00Z");

test("trial and active are visible", () => {
  assert.equal(isProfileVisible({ status: "trial" }, now), true);
  assert.equal(isProfileVisible({ status: "active" }, now), true);
});

test("cancelled is hidden", () => {
  assert.equal(isProfileVisible({ status: "cancelled" }, now), false);
});

test("grace is visible until the window closes", () => {
  assert.equal(isProfileVisible({ status: "grace", graceEndsAt: future }, now), true);
  assert.equal(isProfileVisible({ status: "grace", graceEndsAt: past }, now), false);
});

test("past_due follows the same grace window", () => {
  assert.equal(isProfileVisible({ status: "past_due", graceEndsAt: future }, now), true);
  assert.equal(isProfileVisible({ status: "past_due", graceEndsAt: past }, now), false);
});

test("a grace status with no end date does not grant open-ended visibility", () => {
  assert.equal(isProfileVisible({ status: "grace" }, now), false);
});

test("archiving hides the profile whatever the status says", () => {
  assert.equal(
    isProfileVisible({ status: "active", archivedAt: past }, now),
    false
  );
});

test("a missing subscription is not visible", () => {
  assert.equal(isProfileVisible(null, now), false);
  assert.equal(isProfileVisible(undefined, now), false);
});

test("state names match what the dashboard should say", () => {
  assert.equal(subscriptionState({ status: "trial" }, now), "trial");
  assert.equal(subscriptionState({ status: "grace", graceEndsAt: future }, now), "grace");
  assert.equal(subscriptionState({ status: "grace", graceEndsAt: past }, now), "suspended");
  assert.equal(subscriptionState({ status: "active", archivedAt: past }, now), "archived");
  assert.equal(subscriptionState({ status: "cancelled" }, now), "cancelled");
});

/* ── completeness ─────────────────────────────────────────────────────── */

test("an empty profile scores zero", () => {
  assert.equal(profileCompleteness({}), 0);
});

test("a fully filled profile scores 100", () => {
  assert.equal(
    profileCompleteness({
      profilePhotoUrl: "https://example.com/a.jpg",
      counties: ["dublin"],
      testCentres: ["finglas"],
      licenceCategories: ["B"],
      transmission: ["automatic"],
      bio: "I teach nervous beginners.",
      pricePerLesson: 45,
      gallery: ["https://example.com/b.jpg"],
    }),
    100
  );
});

test("empty arrays and blank strings do not count", () => {
  assert.equal(
    profileCompleteness({ counties: [], bio: "   ", profilePhotoUrl: "" }),
    0
  );
});

test("a free lesson price still counts as filled in", () => {
  assert.equal(profileCompleteness({ pricePerLesson: 0 }), 10);
});

test("partial profiles land between the two", () => {
  const score = profileCompleteness({
    profilePhotoUrl: "https://example.com/a.jpg",
    counties: ["dublin"],
  });
  assert.equal(score, 35);
});

console.log(`instructorRules: ${passed} assertions passed`);
