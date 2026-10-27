/*
 * Words for an instructor's response time. The API sends the median in hours
 * and a bucket (backend/utils/responseTime.js); the sentence is said in
 * buckets so it reads as a habit, not a stopwatch.
 */

const SENTENCES = {
  hour: "Usually replies within an hour",
  hours: "Usually replies within a few hours",
  day: "Usually replies within a day",
  days: "Usually replies within a few days",
  slow: "Can be slow to reply",
};

export const responseSentence = (responseTime) =>
  responseTime ? SENTENCES[responseTime.bucket] ?? null : null;

/* The figure itself, for the profile's stat row: "< 1 h", "3 h", "2 days". */
export const responseFigure = ({ medianHours }) => {
  if (medianHours < 1) return "< 1 h";
  if (medianHours < 24) return `${Math.round(medianHours)} h`;
  const days = Math.round(medianHours / 24);
  return `${days} ${days === 1 ? "day" : "days"}`;
};

export const responseExplanation = ({ basedOn }) =>
  `Median time to accept or decline a lesson request, from the last ${basedOn} requests ` +
  "in 90 days. Requests left unanswered for two days count with the time they have waited.";
