/*
 * The 26 counties of the Republic of Ireland.
 *
 * This is the primary location axis for instructor coverage and for the search
 * page, matching how the RSA's own ADI register lets people search. Cities are
 * display-only and never a structured filter.
 *
 * Verified against the county list served by the RSA driving-test-centre
 * finder (rsa.ie/services/learner-drivers/the-driving-test/driving-test-centres):
 * every one of these 26 counties has at least one test centre.
 *
 * Northern Ireland counties are deliberately absent — the RSA register covers
 * the Republic only.
 */

export const COUNTIES = [
  { slug: "carlow", name: "Carlow" },
  { slug: "cavan", name: "Cavan" },
  { slug: "clare", name: "Clare" },
  { slug: "cork", name: "Cork" },
  { slug: "donegal", name: "Donegal" },
  { slug: "dublin", name: "Dublin" },
  { slug: "galway", name: "Galway" },
  { slug: "kerry", name: "Kerry" },
  { slug: "kildare", name: "Kildare" },
  { slug: "kilkenny", name: "Kilkenny" },
  { slug: "laois", name: "Laois" },
  { slug: "leitrim", name: "Leitrim" },
  { slug: "limerick", name: "Limerick" },
  { slug: "longford", name: "Longford" },
  { slug: "louth", name: "Louth" },
  { slug: "mayo", name: "Mayo" },
  { slug: "meath", name: "Meath" },
  { slug: "monaghan", name: "Monaghan" },
  { slug: "offaly", name: "Offaly" },
  { slug: "roscommon", name: "Roscommon" },
  { slug: "sligo", name: "Sligo" },
  { slug: "tipperary", name: "Tipperary" },
  { slug: "waterford", name: "Waterford" },
  { slug: "westmeath", name: "Westmeath" },
  { slug: "wexford", name: "Wexford" },
  { slug: "wicklow", name: "Wicklow" },
];

export const COUNTY_SLUGS = COUNTIES.map((county) => county.slug);

export const COUNTY_NAMES = COUNTIES.map((county) => county.name);

const COUNTY_BY_SLUG = new Map(COUNTIES.map((county) => [county.slug, county]));

export const isValidCounty = (slug) => COUNTY_BY_SLUG.has(slug);

export const getCounty = (slug) => COUNTY_BY_SLUG.get(slug) ?? null;

/* Accepts either a slug ("dublin") or a display name ("Dublin") and returns
   the slug, so data coming from the RSA feed can be matched against our list. */
export const toCountySlug = (value) => {
  if (typeof value !== "string") return null;
  const candidate = value.trim().toLowerCase().replace(/\s+/g, "-");
  return COUNTY_BY_SLUG.has(candidate) ? candidate : null;
};

export default COUNTIES;
