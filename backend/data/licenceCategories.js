/*
 * EU/RSA driving licence categories, exactly as they appear on the ADI register
 * and on an ADI permit.
 *
 * These 15 letters are the real codes. They were cross-checked against the
 * categories the RSA's own test-centre feed reports as testable nationwide
 * (see testCentres.js) — that set matches this list exactly.
 *
 * TRANSMISSION IS NOT A CATEGORY. "B Auto" and "B Manual" are not RSA codes:
 * an instructor teaches category B, and separately teaches automatic, manual or
 * both. The two are stored on separate axes so the search page can filter on
 * each independently. Collapsing them would make the data unfixable later.
 *
 * An ADI may only instruct in the categories on their permit, and permits are
 * renewed every two years — so a profile's categories are a claim to verify
 * against the register, not a fact we can trust at signup.
 */

export const LICENCE_CATEGORIES = [
  { code: "AM", group: "motorcycle", label: "Moped", description: "Mopeds and light quadricycles" },
  { code: "A1", group: "motorcycle", label: "Light motorcycle", description: "Motorcycles up to 125cc" },
  { code: "A2", group: "motorcycle", label: "Medium motorcycle", description: "Mid-power motorcycles" },
  { code: "A", group: "motorcycle", label: "Motorcycle", description: "Motorcycles of any power" },

  { code: "B", group: "car", label: "Car", description: "Cars and light vans" },
  { code: "BE", group: "car", label: "Car with trailer", description: "Category B towing a trailer" },

  { code: "C1", group: "truck", label: "Light truck", description: "Trucks 3,500–7,500kg" },
  { code: "C1E", group: "truck", label: "Light truck with trailer", description: "Category C1 towing a trailer" },
  { code: "C", group: "truck", label: "Truck", description: "Trucks over 3,500kg" },
  { code: "CE", group: "truck", label: "Truck with trailer", description: "Category C towing a trailer" },

  { code: "D1", group: "bus", label: "Minibus", description: "Buses with 9–16 passenger seats" },
  { code: "D1E", group: "bus", label: "Minibus with trailer", description: "Category D1 towing a trailer" },
  { code: "D", group: "bus", label: "Bus", description: "Buses with more than 8 passenger seats" },
  { code: "DE", group: "bus", label: "Bus with trailer", description: "Category D towing a trailer" },

  { code: "W", group: "work", label: "Work vehicle", description: "Tractors and land machinery" },
];

export const LICENCE_CATEGORY_CODES = LICENCE_CATEGORIES.map((category) => category.code);

const CATEGORY_BY_CODE = new Map(
  LICENCE_CATEGORIES.map((category) => [category.code, category])
);

export const isValidLicenceCategory = (code) => CATEGORY_BY_CODE.has(code);

export const getLicenceCategory = (code) => CATEGORY_BY_CODE.get(code) ?? null;

/* Transmission taught, the second and independent axis. An instructor can
   teach both; a learner filtering for "automatic" must not lose instructors
   who teach both. */
export const TRANSMISSIONS = [
  { value: "automatic", label: "Automatic" },
  { value: "manual", label: "Manual" },
];

export const TRANSMISSION_VALUES = TRANSMISSIONS.map((item) => item.value);

export const isValidTransmission = (value) => TRANSMISSION_VALUES.includes(value);

/* The display string the roadmap asks for on cards and profiles, e.g.
   "Car — Automatic (Category B)". Transmission is optional because some
   categories (motorcycle, work vehicle) do not have one in any useful sense. */
export const formatCategoryLabel = (code, transmission) => {
  const category = getLicenceCategory(code);
  if (!category) return code;

  const transmissionLabel =
    transmission && isValidTransmission(transmission)
      ? ` — ${transmission === "automatic" ? "Automatic" : "Manual"}`
      : "";

  return `${category.label}${transmissionLabel} (Category ${category.code})`;
};

export default LICENCE_CATEGORIES;
