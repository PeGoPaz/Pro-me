/*
 * Builds the Mongo query and sort for the instructor search page.
 *
 * Pure on purpose — the filter logic is the heart of the product and the part
 * that most needs testing, and this way it is testable without a database.
 * Unknown or malformed filter values are dropped rather than rejected: a
 * learner should never get an error page because a stale bookmark carries a
 * county that no longer exists.
 */

import { COUNTY_SLUGS } from "../data/counties.js";
import { TEST_CENTRE_SLUGS } from "../data/testCentres.js";
import {
  LICENCE_CATEGORY_CODES,
  TRANSMISSION_VALUES,
} from "../data/licenceCategories.js";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

/* Accepts "dublin", "dublin,cork" or ["dublin","cork"], keeping only values
   that exist in the reference data. */
const parseList = (raw, allowed) => {
  if (raw === undefined || raw === null) return [];
  const values = Array.isArray(raw) ? raw : String(raw).split(",");
  const cleaned = values
    .map((value) => String(value).trim())
    .filter((value) => allowed.includes(value));
  return [...new Set(cleaned)];
};

const parseNumber = (raw) => {
  if (raw === undefined || raw === null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

export const buildInstructorQuery = (params = {}) => {
  /* Only published profiles are searchable. */
  const query = { isPublished: true };

  const counties = parseList(params.county, COUNTY_SLUGS);
  if (counties.length) query.counties = { $in: counties };

  const testCentres = parseList(params.testCentre, TEST_CENTRE_SLUGS);
  if (testCentres.length) query.testCentres = { $in: testCentres };

  const categories = parseList(params.category, LICENCE_CATEGORY_CODES);
  if (categories.length) query.licenceCategories = { $in: categories };

  /* $in, not an exact match: filtering for "automatic" must still return the
     instructor who teaches both automatic and manual. */
  const transmissions = parseList(params.transmission, TRANSMISSION_VALUES);
  if (transmissions.length) query.transmission = { $in: transmissions };

  const maxPrice = parseNumber(params.maxPrice);
  if (maxPrice !== null && maxPrice >= 0) {
    query.pricePerLesson = { $lte: maxPrice };
  }

  /* Phase 1 availability is this boolean; the real calendar arrives in Phase 2
     and replaces it. Only "true" narrows — "false" would be a strange thing to
     ask for and is treated as no filter. */
  if (params.acceptingNewStudents === "true" || params.acceptingNewStudents === true) {
    query.acceptingNewStudents = true;
  }

  /* Hide profiles whose subscription has lapsed past its grace window. The
     visible states are expressed as a query rather than filtered in JS so
     pagination counts stay correct. */
  const now = params.now instanceof Date ? params.now : new Date();
  query["subscription.archivedAt"] = null;
  query.$or = [
    { "subscription.status": { $in: ["trial", "active"] } },
    {
      "subscription.status": { $in: ["grace", "past_due"] },
      "subscription.graceEndsAt": { $gt: now },
    },
  ];

  return query;
};

/*
 * Default ordering is trust-first, and deliberately NOT lessons-done.
 *
 * That number is self-reported and unverified at launch: ranking on it would
 * hand the top of every result page to whoever types the biggest number, which
 * undermines the one thing this product sells over the RSA's free register.
 * Verified profiles rank above unverified, then completeness and review count
 * — both things an instructor earns rather than declares. Lessons-done sorting
 * becomes available in Phase 2, once corroboration exists.
 */
export const SORT_OPTIONS = {
  trust: { verificationRank: -1, profileCompleteness: -1, createdAt: -1 },
  price_low: { pricePerLesson: 1, profileCompleteness: -1 },
  price_high: { pricePerLesson: -1, profileCompleteness: -1 },
  newest: { createdAt: -1 },
};

export const DEFAULT_SORT = "trust";

export const buildInstructorSort = (sortKey) =>
  SORT_OPTIONS[sortKey] ?? SORT_OPTIONS[DEFAULT_SORT];

export const isValidSort = (sortKey) =>
  sortKey === undefined || Object.hasOwn(SORT_OPTIONS, sortKey);

export const buildPagination = (params = {}) => {
  const rawPage = parseNumber(params.page);
  const rawLimit = parseNumber(params.limit);

  const page = rawPage !== null && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const limit =
    rawLimit !== null && rawLimit >= 1
      ? Math.min(Math.floor(rawLimit), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  return { page, limit, skip: (page - 1) * limit };
};
