import { useState } from "react";
import { Link } from "react-router-dom";

function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.47 11.47 0 0 0 3.59.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.59a1 1 0 0 1-.25 1.01l-2.2 2.2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

const INFO_CARDS = [
  {
    icon: <MailIcon />,
    label: "Email us",
    value: "hello@pro.me",
    sub: "We reply within 24 hours",
  },
  {
    icon: <PhoneIcon />,
    label: "Call us",
    value: "+353 1 234 5678",
    sub: "Mon – Fri, 9 am – 6 pm",
  },
  {
    icon: <LocationIcon />,
    label: "Visit us",
    value: "14 Grafton Street",
    sub: "Dublin 2, Ireland",
  },
  {
    icon: <ClockIcon />,
    label: "Working hours",
    value: "Mon – Fri",
    sub: "9:00 am – 6:00 pm IST",
  },
];

const SUBJECTS = [
  "General enquiry",
  "Booking issue",
  "Provider support",
  "Billing & payments",
  "Report a problem",
  "Partnership",
  "Other",
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim())    next.name    = "Please enter your name.";
    if (!form.email.trim())   next.email   = "Please enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                              next.email   = "Please enter a valid email address.";
    if (!form.subject)        next.subject = "Please choose a subject.";
    if (!form.message.trim()) next.message = "Please write your message.";
    return next;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSending(true);
    // Simulate network delay — replace with real API call when ready
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 900);
  };

  return (
    <div className="contact-page">

      {/* ── Hero ── */}
      <div className="contact-hero">
        <p className="contact-hero-eyebrow">Get in touch</p>
        <h1 className="contact-hero-title">We'd love to hear from you</h1>
        <p className="contact-hero-sub">
          Have a question, problem, or idea? Our team is here to help.
        </p>
      </div>

      {/* ── Info cards ── */}
      <ul className="contact-info-grid">
        {INFO_CARDS.map((card) => (
          <li key={card.label} className="contact-info-card">
            <span className="contact-info-icon">{card.icon}</span>
            <p className="contact-info-label">{card.label}</p>
            <p className="contact-info-value">{card.value}</p>
            <p className="contact-info-sub">{card.sub}</p>
          </li>
        ))}
      </ul>

      {/* ── Main split ── */}
      <div className="contact-split">

        {/* Left — copy + FAQ */}
        <div className="contact-left">
          <h2 className="contact-left-title">Frequently asked questions</h2>

          <details className="contact-faq">
            <summary className="contact-faq-q">How do I book a service?</summary>
            <p className="contact-faq-a">
              Browse services on the <Link to="/services" className="contact-link">Services</Link> page,
              click "Book Appointment", choose a date and confirm.
            </p>
          </details>

          <details className="contact-faq">
            <summary className="contact-faq-q">How do I become a provider?</summary>
            <p className="contact-faq-a">
              <Link to="/register" className="contact-link">Register</Link> and choose the
              "Service Provider" role. You can post your first service immediately after signing up.
            </p>
          </details>

          <details className="contact-faq">
            <summary className="contact-faq-q">Can I cancel a booking?</summary>
            <p className="contact-faq-a">
              Yes. Head to <Link to="/dashboard/customer" className="contact-link">My Bookings</Link>,
              find the appointment and hit "Cancel". No fees apply.
            </p>
          </details>

          <details className="contact-faq">
            <summary className="contact-faq-q">How long until I get a reply?</summary>
            <p className="contact-faq-a">
              We aim to respond to all messages within one business day.
              Urgent issues are usually handled within a few hours.
            </p>
          </details>
        </div>

        {/* Right — form */}
        <div className="contact-form-wrap">
          {sent ? (
            <div className="contact-success">
              <div className="contact-success-icon" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#1a8a5a" strokeWidth="2"/>
                  <path d="M7 12l4 4 6-6" stroke="#1a8a5a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="contact-success-title">Message sent!</h3>
              <p className="contact-success-body">
                Thanks for reaching out, {form.name.split(" ")[0]}. We'll get back to you at{" "}
                <strong>{form.email}</strong> within one business day.
              </p>
              <button
                type="button"
                className="contact-reset-btn"
                onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
              >
                Send another message
              </button>
            </div>
          ) : (
            <>
              <h2 className="contact-form-title">Send us a message</h2>
              <form className="contact-form" onSubmit={handleSubmit} noValidate>

                <div className="contact-row">
                  <div className="contact-field">
                    <label className="contact-label" htmlFor="c-name">Your name</label>
                    <input
                      id="c-name" name="name" type="text"
                      className={`contact-input${errors.name ? " contact-input-err" : ""}`}
                      placeholder="Jane Smith"
                      value={form.name} onChange={handleChange}
                      autoComplete="name"
                    />
                    {errors.name && <p className="contact-err">{errors.name}</p>}
                  </div>

                  <div className="contact-field">
                    <label className="contact-label" htmlFor="c-email">Email address</label>
                    <input
                      id="c-email" name="email" type="email"
                      className={`contact-input${errors.email ? " contact-input-err" : ""}`}
                      placeholder="jane@example.com"
                      value={form.email} onChange={handleChange}
                      autoComplete="email"
                    />
                    {errors.email && <p className="contact-err">{errors.email}</p>}
                  </div>
                </div>

                <div className="contact-field">
                  <label className="contact-label" htmlFor="c-subject">Subject</label>
                  <select
                    id="c-subject" name="subject"
                    className={`contact-input contact-select${errors.subject ? " contact-input-err" : ""}`}
                    value={form.subject} onChange={handleChange}
                  >
                    <option value="">Select a topic…</option>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.subject && <p className="contact-err">{errors.subject}</p>}
                </div>

                <div className="contact-field">
                  <label className="contact-label" htmlFor="c-message">Message</label>
                  <textarea
                    id="c-message" name="message"
                    className={`contact-input contact-textarea${errors.message ? " contact-input-err" : ""}`}
                    rows="5"
                    placeholder="Tell us how we can help…"
                    value={form.message} onChange={handleChange}
                    maxLength={2000}
                  />
                  <div className="contact-char-row">
                    {errors.message
                      ? <p className="contact-err">{errors.message}</p>
                      : <span />}
                    <span className="contact-char-count">{form.message.length}/2000</span>
                  </div>
                </div>

                <button type="submit" className="contact-submit" disabled={sending}>
                  {sending ? (
                    <span className="contact-submit-sending">Sending…</span>
                  ) : (
                    <>
                      Send message
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
