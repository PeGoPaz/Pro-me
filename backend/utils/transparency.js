import Report from "../models/Report.js";

/*
 * The numbers for a year's moderation transparency report (see the DSA
 * section of driving-instructor-roadmap.md): how many notices came in and of
 * what kind, what was done about them, how long that took, and how many were
 * passed to the authorities. Counted from the reports themselves, so the
 * figures cannot drift from the queue they describe.
 *
 * A notice belongs to the year it was received in. Handling time is measured
 * only for notices already closed; the median, because one report left open
 * over a holiday should not drag the figure the way an average would.
 */

const countBy = (items, key) =>
  items.reduce((counts, item) => {
    const value = item[key] ?? "none";
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});

export const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const HOUR = 60 * 60 * 1000;

export const transparencyReport = async (year) => {
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));

  const notices = await Report.find({ createdAt: { $gte: from, $lt: to } })
    .select("targetType reason status reporterId contentAction referredToAuthoritiesAt createdAt handledAt")
    .lean();

  const handled = notices.filter((n) => n.handledAt);
  const handlingHours = handled.map((n) => (n.handledAt - n.createdAt) / HOUR);
  const medianHours = median(handlingHours);

  return {
    year,
    period: { from, to },
    notices: {
      total: notices.length,
      anonymous: notices.filter((n) => !n.reporterId).length,
      byReason: countBy(notices, "reason"),
      byTarget: countBy(notices, "targetType"),
    },
    outcomes: {
      actioned: notices.filter((n) => n.status === "actioned").length,
      dismissed: notices.filter((n) => n.status === "dismissed").length,
      stillOpen: notices.filter((n) => n.status === "received" || n.status === "reviewing").length,
      contentActions: countBy(notices.filter((n) => n.contentAction), "contentAction"),
      referredToAuthorities: notices.filter((n) => n.referredToAuthoritiesAt).length,
    },
    medianHoursToClose: medianHours === null ? null : Math.round(medianHours * 10) / 10,
  };
};
