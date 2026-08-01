/**
 * Formats a date string as "Mon, 2 May 2026" in the Irish locale.
 * @param {string|Date} dateStr
 */
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
