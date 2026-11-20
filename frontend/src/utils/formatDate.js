const WEEKDAY_DATE = new Intl.DateTimeFormat("en-IE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * Formats a date string as "Mon, 2 May 2026" in the Irish locale.
 *
 * Built from the parts rather than taken whole: whether a comma follows the
 * weekday depends on the locale data a browser ships (newer versions of
 * CLDR drop it for en-IE), so the same code wrote the date two ways.
 * @param {string|Date} dateStr
 */
export function formatDate(dateStr) {
  const parts = Object.fromEntries(
    WEEKDAY_DATE.formatToParts(new Date(dateStr)).map((part) => [part.type, part.value]),
  );
  return `${parts.weekday}, ${parts.day} ${parts.month} ${parts.year}`;
}

/**
 * Formats a date as "May 2026" (month + year only).
 * @param {string|Date} dateStr
 */
export function formatMonthYear(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IE", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Formats a date as "2 May 2026" (short, no weekday).
 * @param {string|Date} dateStr
 */
export function formatShortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
