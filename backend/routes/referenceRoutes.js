import express from "express";

import { COUNTIES } from "../data/counties.js";
import { TEST_CENTRES, testCentresByCounty } from "../data/testCentres.js";
import {
  LICENCE_CATEGORIES,
  TRANSMISSIONS,
} from "../data/licenceCategories.js";

const router = express.Router();

/*
 * Reference data for the search filters and the instructor profile wizard.
 *
 * All of it is static, committed data — these handlers touch neither Mongo nor
 * rsa.ie, so they answer even when the database is down. The frontend reads its
 * filter options from here instead of hard-coding them, which is what kept the
 * old marketplace's category lists drifting out of sync across five files.
 */

/* A day of caching: this data changes when the RSA changes it, which is rare,
   and a stale county list is harmless. */
const CACHE_HEADER = "public, max-age=86400";

const sendCached = (res, payload) => {
  res.set("Cache-Control", CACHE_HEADER);
  return res.json(payload);
};

router.get("/counties", (_req, res) => sendCached(res, COUNTIES));

router.get("/test-centres", (req, res) => {
  /* ?grouped=true returns { countySlug: [centre, ...] } for the county-then-
     centre picker; the flat list is the default. */
  if (req.query.grouped === "true") {
    return sendCached(res, testCentresByCounty());
  }

  /* ?county=dublin narrows to one county without shipping all 62. */
  const county = typeof req.query.county === "string" ? req.query.county : null;
  if (county) {
    return sendCached(
      res,
      TEST_CENTRES.filter((centre) => centre.county === county)
    );
  }

  return sendCached(res, TEST_CENTRES);
});

router.get("/licence-categories", (_req, res) =>
  sendCached(res, { categories: LICENCE_CATEGORIES, transmissions: TRANSMISSIONS })
);

/* One round trip for a page that needs every list at once, which the search
   page does on first paint. */
router.get("/", (_req, res) =>
  sendCached(res, {
    counties: COUNTIES,
    testCentres: TEST_CENTRES,
    licenceCategories: LICENCE_CATEGORIES,
    transmissions: TRANSMISSIONS,
  })
);

export default router;
