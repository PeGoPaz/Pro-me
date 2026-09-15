import { Link } from "react-router-dom";

/*
 * Terms of service.
 *
 * Structured around what actually binds an Irish driving-instructor platform:
 * DSA Article 14 (clear terms, stated restrictions and moderation practice),
 * the ADI legal position, insurance and liability, and the fact that learner
 * permits start at 16 so minors will use this.
 *
 * Every company-specific value is a [PLACEHOLDER] on purpose — none of it is
 * invented. Replace them before this goes anywhere near production.
 */
function TermsPage() {
  return (
    <div className="legal-page">
      <h1 className="legal-title">Terms of Service</h1>
      <p className="legal-updated">Last updated: [EFFECTIVE_DATE]</p>

      <div className="legal-callout" role="note">
        <strong>Draft.</strong> This document is a working draft and has not
        been reviewed by a solicitor. Values in square brackets must be filled
        in, and the whole thing should be reviewed against Irish law, before
        the platform accepts real users.
      </div>

      <section className="legal-section">
        <h2>1. Who we are</h2>
        <p>
          Pro.me is operated by [COMPANY_NAME], a company registered in Ireland
          under number [COMPANY_NUMBER], with its registered office at
          [REGISTERED_ADDRESS]. You can contact us at [CONTACT_EMAIL]. That
          address is also our official point of contact for users and for
          authorities under Articles 11 and 12 of the Digital Services Act.
        </p>
      </section>

      <section className="legal-section">
        <h2>2. What Pro.me does</h2>
        <p>
          Pro.me is a directory. We help learner drivers find approved driving
          instructors in Ireland, and we give instructors a profile on which to
          present themselves. We introduce people — nothing more.
        </p>
        <p>
          <strong>
            We are not a driving school and we do not provide driving tuition.
          </strong>{" "}
          Any lesson you arrange is a contract between you and the instructor,
          and the instructor alone is responsible for it. We do not take payment
          for lessons and do not hold money on anyone's behalf.
        </p>
      </section>

      <section className="legal-section">
        <h2>3. Using Pro.me as a learner</h2>
        <p>
          You need an account to save instructors or leave a review. You may
          browse without one.
        </p>
        <p>
          Irish learner permits can be held from 16, so people under 18 may use
          this service. If you are under 18, please involve a parent or guardian
          in choosing an instructor and in arranging and paying for lessons.
        </p>
        <p>
          Reviews must describe your own genuine experience. Do not post reviews
          of instructors you have not been taught by, and do not post reviews of
          competitors.
        </p>
      </section>

      <section className="legal-section">
        <h2>4. Using Pro.me as a driving instructor</h2>
        <p>
          Teaching someone to drive for reward in Ireland without being on the
          RSA's Approved Driving Instructor register is a criminal offence. By
          creating an instructor profile you confirm that:
        </p>
        <ul className="legal-list">
          <li>
            you hold a current ADI permit and the ADI number on your profile is
            genuinely yours;
          </li>
          <li>
            you only advertise licence categories that appear on your permit;
          </li>
          <li>
            you hold valid insurance covering paid driving instruction, and your
            vehicle is roadworthy and correctly taxed;
          </li>
          <li>
            the photos, prices and coverage on your profile are accurate and
            kept up to date.
          </li>
        </ul>
        <p>
          New profiles are shown as <em>unverified</em> until we have checked
          your details against the RSA's public register. Unverified profiles
          are ranked below verified ones and are limited in the lesson figures
          they may display.
        </p>
      </section>

      <section className="legal-section">
        <h2>5. Lesson counts and other self-reported figures</h2>
        <p>
          The lesson count on a profile is entered by the instructor. Until it
          is corroborated, it is labelled as self-reported wherever it appears
          and it does not affect search ranking. Inflating it is a breach of
          these terms.
        </p>
      </section>

      <section className="legal-section">
        <h2>6. Subscriptions</h2>
        <p>
          Instructor accounts run on a flat subscription: [TRIAL_LENGTH] free,
          then [SUBSCRIPTION_PRICE] per month. There is no commission on
          lessons and no paid placement — you cannot buy a higher position in
          search results.
        </p>
        <p>
          If a subscription lapses, your profile stays visible during a grace
          period while we contact you. After that it is hidden from search and
          booking is disabled, but it is not deleted, and resubscribing restores
          it. Reviews and booking history are retained throughout, because they
          are partly your learners' data.
        </p>
      </section>

      <section className="legal-section">
        <h2>7. Content we do not allow</h2>
        <ul className="legal-list">
          <li>Impersonating another instructor or using someone else's ADI number.</li>
          <li>Fake, incentivised or retaliatory reviews.</li>
          <li>Photographs of identifiable learners published without their consent, or of any child without their parent or guardian's consent.</li>
          <li>Harassment, discrimination, or content that is unlawful in Ireland.</li>
          <li>Advertising driving tuition without a valid ADI permit.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>8. Reporting content</h2>
        <p>
          Anyone can report content on Pro.me, whether or not they have an
          account, using the report link on any profile or review. This is our
          notice-and-action mechanism under Article 16 of the Digital Services
          Act.
        </p>
        <p>
          We review every report. Where we restrict, remove or demote content,
          or suspend an account, we give the affected party a statement of
          reasons and an explanation of how to contest it, as required by
          Article 17. Where we suspect a criminal offence involving a threat to
          someone's life or safety, we will inform the appropriate authorities
          under Article 18. We publish an annual report on our content
          moderation activity.
        </p>
      </section>

      <section className="legal-section">
        <h2>9. How search results are ordered</h2>
        <p>
          By default, verified instructors are shown above unverified ones.
          Within each group, we order by how complete a profile is and how many
          reviews it has. Self-reported lesson counts are not used. You can
          re-sort by price or by newest at any time. No one can pay to rank
          higher.
        </p>
      </section>

      <section className="legal-section">
        <h2>10. Ending your use of Pro.me</h2>
        <p>
          You can delete your account at any time from your profile settings.
          What happens to your content is set out in our{" "}
          <Link to="/privacy" className="legal-link">Privacy Policy</Link>.
        </p>
        <p>
          We may suspend or remove an account that breaches these terms,
          particularly where someone advertises tuition without a valid ADI
          permit or where there is a risk to learners' safety.
        </p>
      </section>

      <section className="legal-section">
        <h2>11. Liability</h2>
        <p>
          We do our best to keep listings accurate, but we do not guarantee the
          quality, safety or legality of any instructor's services. Verification
          confirms that an ADI number matches the RSA register — it is not an
          endorsement or a guarantee of quality.
        </p>
        <p>
          Nothing in these terms limits liability that cannot be limited by law,
          including for death or personal injury caused by negligence, or for
          fraud. Nothing here affects your statutory rights as a consumer under
          Irish and EU law.
        </p>
      </section>

      <section className="legal-section">
        <h2>12. Changes and governing law</h2>
        <p>
          We will give reasonable notice of material changes to these terms.
          They are governed by the laws of Ireland and are subject to the
          jurisdiction of the Irish courts.
        </p>
      </section>
    </div>
  );
}

export default TermsPage;
