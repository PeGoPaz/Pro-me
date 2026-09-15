/* Query-builder tests — the filter logic the whole product hangs on. */
import assert from "node:assert/strict";

import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  buildInstructorQuery,
  buildInstructorSort,
  buildPagination,
  isValidSort,
  SORT_OPTIONS,
} from "../utils/instructorSearch.js";

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

/* ── filters ──────────────────────────────────────────────────────────── */

test("only published profiles are searchable", () => {
  assert.equal(buildInstructorQuery({}).isPublished, true);
});

test("no filters means no filter clauses beyond visibility", () => {
  const q = buildInstructorQuery({});
  assert.equal(q.counties, undefined);
  assert.equal(q.testCentres, undefined);
  assert.equal(q.licenceCategories, undefined);
  assert.equal(q.pricePerLesson, undefined);
});

test("a single county filters", () => {
  assert.deepEqual(buildInstructorQuery({ county: "dublin" }).counties, { $in: ["dublin"] });
});

test("comma separated counties all apply", () => {
  assert.deepEqual(
    buildInstructorQuery({ county: "dublin,cork" }).counties,
    { $in: ["dublin", "cork"] }
  );
});

test("an array of counties works the same", () => {
  assert.deepEqual(
    buildInstructorQuery({ county: ["dublin", "cork"] }).counties,
    { $in: ["dublin", "cork"] }
  );
});

test("unknown counties are dropped, not errored on", () => {
  /* A stale bookmark must not produce an error page. */
  assert.deepEqual(buildInstructorQuery({ county: "dublin,atlantis" }).counties, { $in: ["dublin"] });
  assert.equal(buildInstructorQuery({ county: "atlantis" }).counties, undefined);
});

test("duplicate values collapse", () => {
  assert.deepEqual(
    buildInstructorQuery({ county: "dublin,dublin" }).counties,
    { $in: ["dublin"] }
  );
});

test("test centres filter and validate", () => {
  assert.deepEqual(buildInstructorQuery({ testCentre: "finglas" }).testCentres, { $in: ["finglas"] });
  assert.equal(buildInstructorQuery({ testCentre: "narnia" }).testCentres, undefined);
});

test("licence categories filter on real RSA codes only", () => {
  assert.deepEqual(buildInstructorQuery({ category: "B" }).licenceCategories, { $in: ["B"] });
  /* "B Auto" is not an RSA code — transmission is its own axis. */
  assert.equal(buildInstructorQuery({ category: "B Auto" }).licenceCategories, undefined);
});

test("transmission uses $in so dual-transmission instructors still match", () => {
  /* The instructor teaching both must not disappear when filtering for one. */
  assert.deepEqual(
    buildInstructorQuery({ transmission: "automatic" }).transmission,
    { $in: ["automatic"] }
  );
});

test("maxPrice becomes an upper bound", () => {
  assert.deepEqual(buildInstructorQuery({ maxPrice: "45" }).pricePerLesson, { $lte: 45 });
});

test("a free price bound is honoured, garbage is ignored", () => {
  assert.deepEqual(buildInstructorQuery({ maxPrice: 0 }).pricePerLesson, { $lte: 0 });
  assert.equal(buildInstructorQuery({ maxPrice: "banana" }).pricePerLesson, undefined);
  assert.equal(buildInstructorQuery({ maxPrice: -10 }).pricePerLesson, undefined);
});

test("accepting-new-students only narrows when asked for", () => {
  assert.equal(buildInstructorQuery({ acceptingNewStudents: "true" }).acceptingNewStudents, true);
  assert.equal(buildInstructorQuery({ acceptingNewStudents: "false" }).acceptingNewStudents, undefined);
  assert.equal(buildInstructorQuery({}).acceptingNewStudents, undefined);
});

test("filters combine", () => {
  const q = buildInstructorQuery({
    county: "dublin",
    testCentre: "finglas",
    category: "B",
    transmission: "manual",
    maxPrice: 50,
    acceptingNewStudents: "true",
  });
  assert.deepEqual(q.counties, { $in: ["dublin"] });
  assert.deepEqual(q.testCentres, { $in: ["finglas"] });
  assert.deepEqual(q.licenceCategories, { $in: ["B"] });
  assert.deepEqual(q.transmission, { $in: ["manual"] });
  assert.deepEqual(q.pricePerLesson, { $lte: 50 });
  assert.equal(q.acceptingNewStudents, true);
});

/* ── subscription visibility ──────────────────────────────────────────── */

test("archived profiles are always excluded", () => {
  assert.equal(buildInstructorQuery({})["subscription.archivedAt"], null);
});

test("trial and active are visible, grace only inside its window", () => {
  const now = new Date("2026-09-16T12:00:00Z");
  const q = buildInstructorQuery({ now });
  assert.deepEqual(q.$or[0], { "subscription.status": { $in: ["trial", "active"] } });
  assert.deepEqual(q.$or[1], {
    "subscription.status": { $in: ["grace", "past_due"] },
    "subscription.graceEndsAt": { $gt: now },
  });
});

test("cancelled never appears in the visible states", () => {
  const serialised = JSON.stringify(buildInstructorQuery({}).$or);
  assert.equal(serialised.includes("cancelled"), false);
});

/* ── sorting ──────────────────────────────────────────────────────────── */

test("the default sort is trust-first, not lessons-done", () => {
  const sort = buildInstructorSort(undefined);
  assert.deepEqual(sort, SORT_OPTIONS.trust);
  assert.equal(Object.hasOwn(sort, "lessonsDone"), false);
});

test("no sort option ranks on lessons-done at all yet", () => {
  /* Self-reported numbers must not drive ranking before corroboration. */
  const all = JSON.stringify(SORT_OPTIONS);
  assert.equal(all.includes("lessonsDone"), false);
});

test("verified profiles outrank unverified in the default sort", () => {
  assert.equal(SORT_OPTIONS.trust.verificationRank, -1);
});

test("an unknown sort key falls back to trust instead of erroring", () => {
  assert.deepEqual(buildInstructorSort("most_lessons"), SORT_OPTIONS.trust);
  assert.equal(isValidSort("most_lessons"), false);
  assert.equal(isValidSort("price_low"), true);
  assert.equal(isValidSort(undefined), true);
});

/* ── pagination ───────────────────────────────────────────────────────── */

test("pagination defaults to page one", () => {
  assert.deepEqual(buildPagination({}), { page: 1, limit: DEFAULT_PAGE_SIZE, skip: 0 });
});

test("skip follows the page number", () => {
  const { skip, limit } = buildPagination({ page: 3, limit: 10 });
  assert.equal(limit, 10);
  assert.equal(skip, 20);
});

test("page size is capped so nobody can ask for everything", () => {
  assert.equal(buildPagination({ limit: 5000 }).limit, MAX_PAGE_SIZE);
});

test("nonsense paging falls back to sane values", () => {
  assert.deepEqual(buildPagination({ page: -4, limit: 0 }), {
    page: 1, limit: DEFAULT_PAGE_SIZE, skip: 0,
  });
  assert.deepEqual(buildPagination({ page: "banana" }), {
    page: 1, limit: DEFAULT_PAGE_SIZE, skip: 0,
  });
});

console.log(`instructorSearch: ${passed} assertions passed`);
