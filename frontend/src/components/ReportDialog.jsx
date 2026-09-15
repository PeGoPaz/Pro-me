import { useEffect, useState } from "react";
import api from "../api/index.js";

/*
 * Report dialog — the user-facing half of the DSA Article 16 notice-and-action
 * mechanism.
 *
 * Signing in is deliberately NOT required: Article 16 does not let a platform
 * gate the ability to flag illegal content behind an account. Anonymous
 * reporters can leave an email so we can send them the Article 17 statement of
 * reasons, but it is optional.
 */
function ReportDialog({ targetType, targetId, targetLabel, onClose }) {
  const [reasons, setReasons] = useState([]);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState(null);

  useEffect(() => {
    let ignore = false;
    api.get("/reports/reasons")
      .then((res) => { if (!ignore) setReasons(res.data); })
      .catch(() => { if (!ignore) setError("Could not load report reasons."); });
    return () => { ignore = true; };
  }, []);

  /* Escape closes, as a dialog should. */
  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!reason) {
      setError("Please choose a reason.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/reports", {
        targetType,
        targetId,
        reason,
        details: details.trim(),
        ...(email.trim() ? { reporterEmail: email.trim() } : {}),
      });
      setReference(res.data.reference);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not submit your report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-backdrop" onClick={onClose} role="presentation">
      <div
        className="report-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        onClick={(event) => event.stopPropagation()}
      >
        {reference ? (
          <>
            <h2 id="report-title" className="report-title">Report received</h2>
            <p className="report-copy">
              Thanks — we review every report and will act where needed. If you
              gave us an email address, we will tell you what we decided.
            </p>
            <p className="report-reference">
              Your reference: <code>{String(reference)}</code>
            </p>
            <button type="button" className="button button-primary" onClick={onClose}>
              Close
            </button>
          </>
        ) : (
          <>
            <h2 id="report-title" className="report-title">Report this {targetType}</h2>
            {targetLabel && <p className="report-target">{targetLabel}</p>}

            <form className="report-form" onSubmit={handleSubmit} noValidate>
              {error && <div className="report-error" role="alert">{error}</div>}

              <label className="report-field">
                <span className="report-label">Why are you reporting this?</span>
                <select value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option value="">Choose a reason…</option>
                  {reasons.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>

              <label className="report-field">
                <span className="report-label">
                  Anything else we should know? <span className="report-optional">(optional)</span>
                </span>
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Add any detail that will help us look into this."
                />
              </label>

              <label className="report-field">
                <span className="report-label">
                  Your email <span className="report-optional">(optional)</span>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="so we can tell you what we decided"
                />
              </label>

              <p className="report-note">
                You do not need an account to report something.
              </p>

              <div className="report-actions">
                <button type="button" className="button button-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={submitting}>
                  {submitting ? "Sending…" : "Send report"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default ReportDialog;
