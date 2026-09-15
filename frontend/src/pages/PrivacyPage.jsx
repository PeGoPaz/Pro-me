import { Link } from "react-router-dom";

/*
 * Privacy policy.
 *
 * Written around the data this platform actually holds and the parts that are
 * genuinely awkward: reviews contain two people's personal data, gallery photos
 * may show learners including minors, and instructors publish a phone number.
 * The Data Protection Commission is the supervisory authority.
 *
 * Company-specific values are [PLACEHOLDER]s — nothing is invented.
 */
function PrivacyPage() {
  return (
    <div className="legal-page">
      <h1 className="legal-title">Privacy Policy</h1>
      <p className="legal-updated">Last updated: [EFFECTIVE_DATE]</p>

      <div className="legal-callout" role="note">
        <strong>Draft.</strong> This document is a working draft and has not
        been reviewed by a data protection professional. The bracketed values
        and the retention periods in particular must be confirmed before the
        platform processes anyone's real data.
      </div>

      <section className="legal-section">
        <h2>1. Who controls your data</h2>
        <p>
          [COMPANY_NAME], [REGISTERED_ADDRESS], is the data controller for
          Pro.me. For anything about your personal data, contact
          [PRIVACY_CONTACT_EMAIL].
        </p>
        <p>
          You have the right to lodge a complaint with the Data Protection
          Commission, Ireland's supervisory authority, at dataprotection.ie.
        </p>
      </section>

      <section className="legal-section">
        <h2>2. What we collect and why</h2>
        <table className="legal-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Why</th>
              <th>Lawful basis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Name, email, password</td>
              <td>To create and secure your account</td>
              <td>Contract</td>
            </tr>
            <tr>
              <td>ADI number (instructors)</td>
              <td>To check you are on the RSA register</td>
              <td>Legal obligation and legitimate interest in learner safety</td>
            </tr>
            <tr>
              <td>Phone number (instructors)</td>
              <td>Published so learners can contact you</td>
              <td>Contract — you choose to publish it</td>
            </tr>
            <tr>
              <td>County and test centre coverage</td>
              <td>To make you findable in search</td>
              <td>Contract</td>
            </tr>
            <tr>
              <td>Profile and gallery photos</td>
              <td>To show learners who you are</td>
              <td>Consent</td>
            </tr>
            <tr>
              <td>Reviews and ratings</td>
              <td>To help learners judge an instructor</td>
              <td>Legitimate interest in a trustworthy directory</td>
            </tr>
            <tr>
              <td>Booking history</td>
              <td>To manage and evidence lessons arranged</td>
              <td>Contract</td>
            </tr>
            <tr>
              <td>Session cookie</td>
              <td>To keep you signed in</td>
              <td>Strictly necessary</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="legal-section">
        <h2>3. Photographs</h2>
        <p>
          Only upload photographs you have the right to publish. If a learner is
          identifiable in a photo, you need their consent — and if they are
          under 18, their parent or guardian's consent. Do not upload
          photographs of children without it.
        </p>
        <p>
          Anyone who appears in a photo on Pro.me can ask us to remove it by
          contacting [PRIVACY_CONTACT_EMAIL] or using the report link on the
          profile, whether or not they have an account.
        </p>
      </section>

      <section className="legal-section">
        <h2>4. Reviews contain two people's data</h2>
        <p>
          A review is personal data about the learner who wrote it and about the
          instructor it describes. That shapes what we can do with it.
        </p>
        <p>
          If you delete your learner account, we anonymise your reviews rather
          than removing them: the rating and text remain, shown as written by a
          deleted user, but they are no longer linked to you. Deleting them
          outright would silently rewrite an instructor's rating history, which
          would not be fair to the other learners relying on it.
        </p>
        <p>
          If you believe a review about you is unlawful or inaccurate, report it
          and we will review it under our notice-and-action process.
        </p>
      </section>

      <section className="legal-section">
        <h2>5. What we keep and for how long</h2>
        <ul className="legal-list">
          <li><strong>Account data</strong> — until you delete your account.</li>
          <li><strong>Instructor profiles</strong> — removed on account deletion. A profile hidden because a subscription lapsed is retained for [LAPSE_RETENTION_PERIOD] so it can be restored, then archived.</li>
          <li><strong>Reviews</strong> — retained for [REVIEW_RETENTION_PERIOD], anonymised if the author deletes their account.</li>
          <li><strong>Booking history</strong> — retained for [BOOKING_RETENTION_PERIOD]. A learner's booking history is their record and survives the instructor deleting their account.</li>
          <li><strong>Reports of illegal content</strong> — retained for [REPORT_RETENTION_PERIOD] so we can evidence our moderation decisions.</li>
          <li><strong>Photographs</strong> — until you remove them or delete your account.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>6. Who else sees your data</h2>
        <p>
          We do not sell your data and we do not use it for advertising. We share
          it only with the providers that run the service for us, under data
          processing agreements:
        </p>
        <ul className="legal-list">
          <li>[HOSTING_PROVIDER] — application hosting</li>
          <li>[DATABASE_PROVIDER] — database hosting</li>
          <li>[IMAGE_HOSTING_PROVIDER] — image storage and delivery</li>
          <li>[PAYMENT_PROVIDER] — instructor subscription billing</li>
        </ul>
        <p>
          We host data in the EU. Where a provider processes data outside the
          EEA, that transfer relies on an adequacy decision or on standard
          contractual clauses.
        </p>
        <p>
          Anything you put on your public profile — your name, photo, county
          coverage, phone number and prices — is visible to everyone on the
          internet. That is the point of a directory, but please be deliberate
          about it.
        </p>
      </section>

      <section className="legal-section">
        <h2>7. Your rights</h2>
        <p>Under the GDPR you can ask us to:</p>
        <ul className="legal-list">
          <li>give you a copy of the data we hold about you;</li>
          <li>correct anything inaccurate;</li>
          <li>delete your data, subject to the review and booking rules above;</li>
          <li>restrict or object to how we process it;</li>
          <li>hand your data to another service in a portable format;</li>
          <li>withdraw consent for anything based on consent, such as photographs.</li>
        </ul>
        <p>
          Write to [PRIVACY_CONTACT_EMAIL]. We respond within one month. You can
          delete your account yourself at any time from your profile settings.
        </p>
      </section>

      <section className="legal-section">
        <h2>8. Cookies</h2>
        <p>
          We set one strictly necessary cookie to keep you signed in. We do not
          use advertising or tracking cookies.
        </p>
      </section>

      <section className="legal-section">
        <h2>9. Security</h2>
        <p>
          Passwords are stored hashed, never in plain text. Traffic is encrypted
          in transit. If a breach puts your rights at risk, we will tell you and
          the Data Protection Commission as the GDPR requires.
        </p>
      </section>

      <p className="legal-footer-note">
        See also our{" "}
        <Link to="/terms" className="legal-link">Terms of Service</Link>.
      </p>
    </div>
  );
}

export default PrivacyPage;
