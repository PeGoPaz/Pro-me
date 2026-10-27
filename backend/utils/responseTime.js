import Booking from "../models/Booking.js";
import { median } from "./transparency.js";

/*
 * How quickly an instructor answers a lesson request (roadmap, Phase 2): the
 * time from a learner asking to the instructor accepting or declining, as a
 * median over recent requests. No messaging is needed for it - the booking
 * already records both ends.
 *
 * Requests the instructor ignores have to count, or ignoring them would be the
 * way to look quick. One left unanswered for more than PENDING_COUNTS_AFTER
 * enters with the time it has waited so far: a lower bound, so it can only make
 * the figure worse. A younger one is left out until it is answered or old
 * enough, since its outcome is not known yet.
 */

const HOUR = 60 * 60 * 1000;
export const WINDOW_DAYS = 90;
export const MIN_REQUESTS = 5;
const PENDING_COUNTS_AFTER = 48 * HOUR;

/* The wording buckets, so the figure reads as a habit, not a stopwatch. */
export const responseBucket = (hours) => {
  if (hours <= 1) return "hour";
  if (hours <= 6) return "hours";
  if (hours <= 24) return "day";
  if (hours <= 72) return "days";
  return "slow";
};

/* The status change an instructor makes, with the time of their first
   answer kept: answering, then changing their mind, is still one answer. */
export const statusUpdate = (booking, status, now = new Date()) => ({
  status,
  confirmedAt: status === "confirmed" ? now : null,
  respondedAt: booking.respondedAt ?? (status === "pending" ? null : now),
});

/* Hours to answer each request that counts, keyed by instructor id. */
const hoursByInstructor = async (instructorIds, now) => {
  const since = new Date(now.getTime() - WINDOW_DAYS * 24 * HOUR);
  const bookings = await Booking.find({
    instructorId: { $in: instructorIds },
    createdAt: { $gte: since },
  })
    .select("instructorId status createdAt respondedAt confirmedAt")
    .lean();

  const hours = new Map();
  for (const b of bookings) {
    // Bookings answered before respondedAt existed only have confirmedAt.
    const answeredAt = b.respondedAt ?? b.confirmedAt;
    let waited;
    if (answeredAt) waited = answeredAt - b.createdAt;
    else if (b.status === "pending" && now - b.createdAt > PENDING_COUNTS_AFTER) waited = now - b.createdAt;
    else continue;
    // An answer dated before the request (imported data, a clock out of step)
    // would pull the median towards an impossible zero.
    if (waited < 0) continue;

    const key = String(b.instructorId);
    if (!hours.has(key)) hours.set(key, []);
    hours.get(key).push(waited / HOUR);
  }
  return hours;
};

const summarise = (hours) => {
  if (!hours || hours.length < MIN_REQUESTS) return null;
  const medianHours = Math.round(median(hours) * 10) / 10;
  return { medianHours, bucket: responseBucket(medianHours), basedOn: hours.length };
};

/* null until there are MIN_REQUESTS requests to go on: one quick reply is
   luck, not a habit, and the profile should not claim otherwise. */
export const responseTimeFor = async (instructorId, now = new Date()) =>
  summarise((await hoursByInstructor([instructorId], now)).get(String(instructorId)));

/* The same for a page of search results, in one query. */
export const responseTimesFor = async (instructorIds, now = new Date()) => {
  const hours = await hoursByInstructor(instructorIds, now);
  return new Map(instructorIds.map((id) => [String(id), summarise(hours.get(String(id)))]));
};
