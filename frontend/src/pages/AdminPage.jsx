import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../api/index.js";
import { useAuth } from "../context/auth";
import { formatShortDate } from "../utils/formatDate";

/*
 * Admin: the two queues a person has to work through by hand at launch.
 *
 * 1. ADI verification — compare each new instructor with the RSA public
 *    register and record the outcome. This is the only way the Verified ADI
 *    badge can appear.
 * 2. Reports — the DSA Article 16 notices learners and visitors send in, with
 *    the Article 17 statement of reasons recorded on every decision.
 *
 * A third tab adds up a year of those reports: the figures the annual
 * Article 24(3) transparency report has to publish.
 */

/* County slugs are the county names in lower case ("galway"). */
const countyName = (slug) => slug.charAt(0).toUpperCase() + slug.slice(1);

const REASON_LABELS = {
  not_an_adi: "Not an approved driving instructor",
  fake_profile: "Fake or impersonating profile",
  fake_reviews: "Fake reviews",
  inappropriate_photo: "Inappropriate photo",
  harassment: "Harassment or abuse",
  unsafe_conduct: "Unsafe conduct during a lesson",
  spam: "Spam or misleading content",
  other: "Something else",
};

function VerificationQueue() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState({});
  const [busy, setBusy] = useState("");

  const load = useCallback(() => {
    api.get("/admin/verifications?status=unverified")
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load the verification queue."));
  }, []);

  useEffect(() => { load(); }, [load]);

  const decide = async (profileId, decision) => {
    try {
      setBusy(profileId);
      setError("");
      await api.post(`/admin/verifications/${profileId}`, {
        decision,
        note: notes[profileId] ?? "",
      });
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not record the decision.");
    } finally {
      setBusy("");
    }
  };

  if (!data) return <p className="adm-empty">{error || "Loading…"}</p>;

  return (
    <>
      <p className="adm-intro">
        Check each instructor on the{" "}
        <a href={data.registerUrl} target="_blank" rel="noreferrer" className="legal-link">
          RSA ADI register
        </a>{" "}
        — the name, ADI number, counties and categories should all match. Oldest first.
      </p>

      {error && <div className="report-error" role="alert">{error}</div>}

      {data.profiles.length === 0 ? (
        <p className="adm-empty">Nobody is waiting for verification.</p>
      ) : (
        <ul className="adm-list">
          {data.profiles.map((p) => (
            <li key={p.id} className="adm-item">
              <div className="adm-item-head">
                <div>
                  <p className="adm-item-title">{p.name}</p>
                  <p className="adm-item-meta">{p.email} · joined {formatShortDate(p.createdAt)}</p>
                </div>
                <span className={`ipc-status ${p.isPublished ? "ipc-status-live" : "ipc-status-draft"}`}>
                  {p.isPublished ? "Listed" : "Not listed"}
                </span>
              </div>

              <dl className="adm-facts">
                <div><dt>ADI number</dt><dd className="adm-adi">{p.adiNumber}</dd></div>
                <div><dt>Counties</dt><dd>{p.counties.map(countyName).join(", ") || "—"}</dd></div>
                <div><dt>Categories</dt><dd>{p.licenceCategories.join(", ") || "—"}</dd></div>
                <div>
                  <dt>Declarations</dt>
                  <dd>
                    {p.declarations?.adiConfirmedAt ? "ADI ✓" : "ADI ✗"} ·{" "}
                    {p.declarations?.holdsInsuranceAt ? "Insurance ✓" : "Insurance ✗"}
                  </dd>
                </div>
              </dl>

              <textarea
                className="adm-note"
                rows={2}
                maxLength={500}
                placeholder="Note — required when rejecting (e.g. number not on the register for this county)"
                value={notes[p.id] ?? ""}
                onChange={(e) => setNotes((prev) => ({ ...prev, [p.id]: e.target.value }))}
              />

              <div className="adm-actions">
                <Link to={`/instructors/${p.userId}`} className="button button-ghost">View profile</Link>
                <button type="button" className="button button-ghost adm-reject" disabled={busy === p.id} onClick={() => decide(p.id, "rejected")}>
                  Reject
                </button>
                <button type="button" className="button button-primary" disabled={busy === p.id} onClick={() => decide(p.id, "verified")}>
                  Verify
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ReportQueue() {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState("");

  const load = useCallback(() => {
    api.get("/admin/reports")
      .then((res) => setReports(res.data.reports))
      .catch(() => setError("Could not load reports."));
  }, []);

  useEffect(() => { load(); }, [load]);

  const draftFor = (id) => drafts[id] ?? { reasons: "", unpublish: false, hide: false, refer: false };
  const setDraft = (id, patch) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...draftFor(id), ...patch } }));

  const close = async (report, status) => {
    const d = draftFor(report._id);
    try {
      setBusy(report._id);
      setError("");
      await api.patch(`/admin/reports/${report._id}`, {
        status,
        statementOfReasons: d.reasons,
        unpublishProfile: status === "actioned" && d.unpublish,
        hideReview: status === "actioned" && d.hide,
        referToAuthorities: d.refer,
      });
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not update the report.");
    } finally {
      setBusy("");
    }
  };

  if (!reports) return <p className="adm-empty">{error || "Loading…"}</p>;

  return (
    <>
      <p className="adm-intro">
        Every decision needs a statement of reasons (DSA Article 17) — it is
        what the affected person and the reporter are told. Oldest first.
      </p>

      {error && <div className="report-error" role="alert">{error}</div>}

      {reports.length === 0 ? (
        <p className="adm-empty">No open reports.</p>
      ) : (
        <ul className="adm-list">
          {reports.map((r) => {
            const d = draftFor(r._id);
            return (
              <li key={r._id} className="adm-item">
                <div className="adm-item-head">
                  <div>
                    <p className="adm-item-title">{REASON_LABELS[r.reason] ?? r.reason}</p>
                    <p className="adm-item-meta">
                      {r.target?.kind}: {r.target?.link
                        ? <Link to={r.target.link} className="legal-link">{r.target.label}</Link>
                        : r.target?.label}
                      {" · "}{formatShortDate(r.createdAt)}
                      {" · "}from {r.reporterId?.name ?? (r.reporterEmail ? r.reporterEmail : "anonymous")}
                    </p>
                  </div>
                  <div className="adm-item-badges">
                    {r.target?.hidden && <span className="ipc-status ipc-status-draft">Review hidden</span>}
                    <span className="ipc-status ipc-status-pending">{r.status}</span>
                  </div>
                </div>

                {r.details && <p className="adm-details">“{r.details}”</p>}

                <textarea
                  className="adm-note"
                  rows={3}
                  maxLength={2000}
                  placeholder="Statement of reasons — what we decided and why"
                  value={d.reasons}
                  onChange={(e) => setDraft(r._id, { reasons: e.target.value })}
                />

                <div className="adm-checks">
                  {r.targetType === "profile" && (
                    <label className="ob-check">
                      <input type="checkbox" checked={d.unpublish} onChange={(e) => setDraft(r._id, { unpublish: e.target.checked })} />
                      <span>Take this profile off the listing</span>
                    </label>
                  )}
                  {/* A review can be reported more than once; after the first
                      decision hid it, the later reports only need closing. */}
                  {r.targetType === "review" && r.target?.link && !r.target.hidden && (
                    <label className="ob-check">
                      <input type="checkbox" checked={d.hide} onChange={(e) => setDraft(r._id, { hide: e.target.checked })} />
                      <span>Hide this review from the profile and every rating, keeping these reasons with it</span>
                    </label>
                  )}
                  <label className="ob-check">
                    <input type="checkbox" checked={d.refer} onChange={(e) => setDraft(r._id, { refer: e.target.checked })} />
                    <span>Referred to the authorities (Article 18 — a threat to someone's life or safety)</span>
                  </label>
                </div>

                <div className="adm-actions">
                  <button type="button" className="button button-ghost" disabled={busy === r._id} onClick={() => close(r, "dismissed")}>
                    Dismiss
                  </button>
                  <button type="button" className="button button-primary" disabled={busy === r._id} onClick={() => close(r, "actioned")}>
                    Take action
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

const TARGET_LABELS = { profile: "Profiles", review: "Reviews" };
const CONTENT_ACTION_LABELS = {
  unpublished_profile: "Profiles taken off the listing",
  hidden_review: "Reviews hidden",
};

/* Reports can only exist from the year the queue went live. */
const FIRST_REPORT_YEAR = 2026;

const Counts = ({ counts, labels }) => {
  const rows = Object.entries(counts).sort(([, a], [, b]) => b - a);
  if (!rows.length) return <p className="adm-item-meta">None</p>;
  return (
    <dl className="adm-facts">
      {rows.map(([key, count]) => (
        <div key={key}><dt>{labels[key] ?? key}</dt><dd>{count}</dd></div>
      ))}
    </dl>
  );
};

function TransparencyReport() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  /* Kept with the year it answers, so switching years shows "Loading…"
     rather than the previous year's figures. */
  const [loaded, setLoaded] = useState({ year: null, report: null, error: "" });

  useEffect(() => {
    let ignore = false;
    api.get(`/admin/transparency?year=${year}`)
      .then((res) => { if (!ignore) setLoaded({ year, report: res.data, error: "" }); })
      .catch(() => { if (!ignore) setLoaded({ year, report: null, error: "Could not load the figures." }); });
    return () => { ignore = true; };
  }, [year]);

  const { report, error } = loaded.year === year ? loaded : { report: null, error: "" };

  const years = [];
  for (let y = thisYear; y >= FIRST_REPORT_YEAR; y -= 1) years.push(y);

  return (
    <>
      <p className="adm-intro">
        What the annual transparency report (DSA Article 24(3)) has to publish,
        counted from the reports themselves. A report belongs to the year it was received in.
      </p>

      <label className="adm-year">
        <span>Year</span>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </label>

      {!report ? (
        <p className="adm-empty">{error || "Loading…"}</p>
      ) : (
        <div className="adm-list">
          <section className="adm-item">
            <p className="adm-item-title">Notices received</p>
            <dl className="adm-facts">
              <div><dt>Total</dt><dd>{report.notices.total}</dd></div>
              <div><dt>Sent without an account</dt><dd>{report.notices.anonymous}</dd></div>
            </dl>
            <Counts counts={report.notices.byTarget} labels={TARGET_LABELS} />
            <Counts counts={report.notices.byReason} labels={REASON_LABELS} />
          </section>

          <section className="adm-item">
            <p className="adm-item-title">What was done</p>
            <dl className="adm-facts">
              <div><dt>Actioned</dt><dd>{report.outcomes.actioned}</dd></div>
              <div><dt>Dismissed</dt><dd>{report.outcomes.dismissed}</dd></div>
              <div><dt>Still open</dt><dd>{report.outcomes.stillOpen}</dd></div>
              <div><dt>Referred to the authorities</dt><dd>{report.outcomes.referredToAuthorities}</dd></div>
              <div>
                <dt>Median time to a decision</dt>
                <dd>{report.medianHoursToClose === null ? "—" : `${report.medianHoursToClose} h`}</dd>
              </div>
            </dl>
            <Counts counts={report.outcomes.contentActions} labels={CONTENT_ACTION_LABELS} />
          </section>
        </div>
      )}
    </>
  );
}

const TABS = [
  ["verification", "ADI verification", VerificationQueue],
  ["reports", "Reports", ReportQueue],
  ["transparency", "Transparency", TransparencyReport],
];

function AdminPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState("verification");
  const Panel = TABS.find(([key]) => key === tab)[2];

  if (loading) return <div className="ip-state">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") {
    return (
      <div className="ip-state">
        <h1 className="ip-state-title">Not available</h1>
        <p>This page is for Pro.me administrators.</p>
      </div>
    );
  }

  return (
    <div className="adm-page">
      <h1 className="adm-title">Admin</h1>

      <div className="adm-tabs" role="tablist">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key}
            className={`adm-tab ${tab === key ? "adm-tab-active" : ""}`}
            onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      <Panel />
    </div>
  );
}

export default AdminPage;
