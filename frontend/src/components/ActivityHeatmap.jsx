import { useMemo } from "react";

/* ── Helpers ──────────────────────────────────────────────────────── */
function dayKey(dateValue) {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildActivityData(bookings, services) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 364);

  const countsByDay = new Map();

  bookings.forEach((booking) => {
    const dateSource =
      booking.status === "confirmed" && booking.confirmedAt
        ? booking.confirmedAt
        : booking.createdAt;
    const key = dayKey(dateSource);
    if (!key) return;
    const cur = countsByDay.get(key) ?? { pending: 0, confirmed: 0, cancelled: 0, servicePosted: 0 };
    if (["pending", "confirmed", "cancelled"].includes(booking.status)) cur[booking.status] += 1;
    countsByDay.set(key, cur);
  });

  services.forEach((service) => {
    const key = dayKey(service.createdAt);
    if (!key) return;
    const cur = countsByDay.get(key) ?? { pending: 0, confirmed: 0, cancelled: 0, servicePosted: 0 };
    cur.servicePosted += 1;
    countsByDay.set(key, cur);
  });

  const leadingEmpty = start.getDay();
  const cells = Array.from({ length: leadingEmpty }, () => null);

  for (let i = 0; i < 365; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = dayKey(date);
    const c = countsByDay.get(key) ?? { pending: 0, confirmed: 0, cancelled: 0, servicePosted: 0 };
    cells.push({ key, date, ...c });
  }

  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabels = [];
  cells.forEach((cell, index) => {
    if (!cell) return;
    if (index !== leadingEmpty && cell.date.getDate() !== 1) return;
    const column = Math.floor(index / 7);
    if (monthLabels.some((m) => m.column === column)) return;
    monthLabels.push({ column, label: cell.date.toLocaleDateString("en-US", { month: "short" }) });
  });

  const totals = cells.reduce(
    (acc, cell) => {
      if (!cell) return acc;
      acc.pending += cell.pending;
      acc.confirmed += cell.confirmed;
      acc.servicePosted += cell.servicePosted;
      return acc;
    },
    { pending: 0, confirmed: 0, servicePosted: 0 }
  );

  return { cells, monthLabels, weekCount: cells.length / 7, totals };
}

function cellClass(cell) {
  if (!cell || (!cell.pending && !cell.confirmed && !cell.cancelled && !cell.servicePosted)) {
    return "dash-activity-cell dash-activity-cell-empty";
  }
  const level = (n) => Math.min(n >= 4 ? 4 : n, 4);
  if (cell.servicePosted > 0) return `dash-activity-cell dash-activity-cell-posted-${level(cell.servicePosted)}`;
  if (cell.confirmed > 0)     return `dash-activity-cell dash-activity-cell-confirmed-${level(cell.confirmed)}`;
  if (cell.cancelled > 0)     return `dash-activity-cell dash-activity-cell-cancelled-${level(cell.cancelled)}`;
  return `dash-activity-cell dash-activity-cell-pending-${level(cell.pending)}`;
}

/* ── Component ────────────────────────────────────────────────────── */
export default function ActivityHeatmap({ bookings, services }) {
  const activity = useMemo(() => buildActivityData(bookings, services), [bookings, services]);

  return (
    <section className="dash-section">
      <div className="dash-activity-head">
        <h2 className="dash-section-title dash-activity-title">Activity</h2>
        <p className="dash-activity-summary">
          {activity.totals.confirmed} confirmed · {activity.totals.pending} pending · {activity.totals.servicePosted} services posted in the last 12 months
        </p>
      </div>

      <div className="dash-activity-scroll">
        <div
          className="dash-activity-months"
          style={{ gridTemplateColumns: `repeat(${activity.weekCount}, 12px)` }}
        >
          {activity.monthLabels.map((m) => (
            <span
              key={`${m.label}-${m.column}`}
              className="dash-activity-month"
              style={{ gridColumnStart: m.column + 1 }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="dash-activity-body">
          <div className="dash-activity-weekdays" aria-hidden="true">
            <span className="dash-activity-weekday dash-activity-weekday-mon">Mon</span>
            <span className="dash-activity-weekday dash-activity-weekday-wed">Wed</span>
            <span className="dash-activity-weekday dash-activity-weekday-fri">Fri</span>
          </div>

          <div
            className="dash-activity-grid"
            style={{ gridTemplateColumns: `repeat(${activity.weekCount}, 12px)` }}
          >
            {activity.cells.map((cell, index) => (
              <span
                key={cell ? cell.key : `empty-${index}`}
                className={cellClass(cell)}
                style={{
                  gridColumnStart: Math.floor(index / 7) + 1,
                  gridRowStart: (index % 7) + 1,
                }}
                title={
                  cell
                    ? `${cell.date.toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}: ${cell.confirmed} confirmed, ${cell.pending} pending, ${cell.servicePosted} posted`
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>

      <div className="dash-activity-legend">
        <span className="dash-activity-legend-label">Pending</span>
        <span className="dash-activity-cell dash-activity-cell-pending-2" aria-hidden="true" />
        <span className="dash-activity-legend-label">Confirmed</span>
        <span className="dash-activity-cell dash-activity-cell-confirmed-2" aria-hidden="true" />
        <span className="dash-activity-legend-label">Cancelled</span>
        <span className="dash-activity-cell dash-activity-cell-cancelled-2" aria-hidden="true" />
        <span className="dash-activity-legend-label">Service Posted</span>
        <span className="dash-activity-cell dash-activity-cell-posted-2" aria-hidden="true" />
      </div>
    </section>
  );
}
