import { formatShortDate } from "./formatDate";

/*
 * How long ago a post went up, the short way feeds say it: "just now",
 * "12 min", "3 h", "2 d", "1 w". After four weeks the date itself is
 * clearer than a count of weeks.
 */
export function timeAgo(when, now = new Date()) {
  const minutes = Math.floor((new Date(now) - new Date(when)) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} w`;
  return formatShortDate(when);
}
