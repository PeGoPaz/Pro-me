/*
 * Which instructors' stories this browser has already watched, so their ring
 * turns grey until they post again. Kept in localStorage: it is a convenience
 * for one person on one device, not something the server needs to know - and
 * a private window, or storage turned off, just means every ring stays amber.
 */
const KEY = "prome.seenStories";

const read = () => {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) ?? "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
};

/* Whether the newest of these posts has been seen. */
export const hasSeen = (instructorId, newestPostedAt) => {
  const seen = read()[instructorId];
  return Boolean(seen) && new Date(seen) >= new Date(newestPostedAt);
};

/* Remembers a post as seen; an older one never undoes a newer one. */
export const markSeen = (instructorId, postedAt) => {
  const all = read();
  if (all[instructorId] && new Date(all[instructorId]) >= new Date(postedAt)) return;
  all[instructorId] = new Date(postedAt).toISOString();
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* Storage full or blocked: the ring simply stays amber. */
  }
};
