import { useRef } from "react";
import { Link } from "react-router-dom";
import ChipGroup from "./ChipGroup";
import { GALLERY_LIMIT } from "../../api/photos.js";
import DashboardAvatar from "../DashboardAvatar";
import { formatIrishPhone } from "../../utils/formatPhone";

/*
 * The six steps of instructor onboarding. Each is purely presentational: the
 * page owns the draft, saving and navigation.
 */

const toggle = (list, value) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

/* ── 1. Basic details ────────────────────────────────────────────────────── */
export function StepBasics({ draft, setField, user, avatar }) {
  return (
    <>
      <div className="ob-photo-row">
        <DashboardAvatar
          name={user.name}
          avatarUrl={avatar.url}
          uploading={avatar.uploading}
          error={avatar.error}
          onUpload={avatar.onUpload}
          onOpen={() => {}}
        />
        <p className="ob-help">
          A clear photo of your face. Learners choose someone they will sit next
          to in a car for hours — profiles with a photo get chosen.
        </p>
      </div>

      <label className="ob-field">
        <span className="ob-label">Name</span>
        <input type="text" value={user.name} disabled />
        <span className="ob-help">The name on your account.</span>
      </label>

      <label className="ob-field">
        <span className="ob-label">RSA ADI number</span>
        <input
          type="text"
          value={draft.adiNumber}
          onChange={(e) => setField("adiNumber", e.target.value)}
          placeholder="As shown on your ADI permit"
          autoComplete="off"
        />
        <span className="ob-help">
          Never shown publicly. We use it to check your entry on the RSA
          register, which is what earns the Verified ADI badge.
        </span>
      </label>

      <label className="ob-field">
        <span className="ob-label">Contact phone</span>
        <input
          type="tel"
          value={draft.phone}
          onChange={(e) => setField("phone", e.target.value)}
          placeholder="087 123 4567"
          autoComplete="tel"
        />
        <span className="ob-help">
          Shown on your profile to signed-in learners only, so it cannot be
          scraped from the directory.
        </span>
      </label>
    </>
  );
}

/* ── 2. Location coverage ────────────────────────────────────────────────── */
export function StepCoverage({ draft, setField, updateDraft, reference }) {
  const countyOptions = reference.counties.map((c) => ({ value: c.slug, label: c.name }));

  /* Centres only for the counties chosen — 62 at once is unusable. */
  const centresByCounty = draft.counties.map((slug) => ({
    county: reference.counties.find((c) => c.slug === slug),
    centres: reference.testCentres.filter((centre) => centre.county === slug),
  }));

  /* One atomic update: dropping a county drops its centres, or they would
     linger invisibly in the saved profile. */
  const toggleCounty = (slug) => {
    updateDraft((prev) => {
      const counties = toggle(prev.counties, slug);
      const keep = new Set(
        reference.testCentres.filter((c) => counties.includes(c.county)).map((c) => c.slug)
      );
      return { ...prev, counties, testCentres: prev.testCentres.filter((s) => keep.has(s)) };
    });
  };

  return (
    <>
      <div className="ob-field">
        <span className="ob-label">Counties you cover</span>
        <ChipGroup
          label="Counties"
          options={countyOptions}
          selected={draft.counties}
          onToggle={toggleCounty}
        />
      </div>

      {centresByCounty.length > 0 && (
        <div className="ob-field">
          <span className="ob-label">Test centres you prepare learners for</span>
          <span className="ob-help">
            Learners search by the centre they are booked into. Pick every one
            you know the routes for.
          </span>
          {centresByCounty.map(({ county, centres }) => (
            <div key={county.slug} className="ob-subgroup">
              <p className="ob-subgroup-title">{county.name}</p>
              <ChipGroup
                label={`Test centres in ${county.name}`}
                options={centres.map((c) => ({ value: c.slug, label: c.name, hint: c.address }))}
                selected={draft.testCentres}
                onToggle={(slug) => setField("testCentres", (list) => toggle(list, slug))}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── 3. What you teach ───────────────────────────────────────────────────── */
const GROUP_LABELS = {
  car: "Car",
  motorcycle: "Motorcycle",
  truck: "Truck",
  bus: "Bus",
  work: "Work vehicle",
};

export function StepTeaching({ draft, setField, reference }) {
  const groups = Object.keys(GROUP_LABELS)
    .map((group) => ({
      group,
      categories: reference.licenceCategories.filter((c) => c.group === group),
    }))
    .filter((g) => g.categories.length);

  return (
    <>
      <div className="ob-field">
        <span className="ob-label">Licence categories on your ADI permit</span>
        <span className="ob-help">
          Only categories your permit covers — the badge depends on them
          matching the register.
        </span>
        {groups.map(({ group, categories }) => (
          <div key={group} className="ob-subgroup">
            <p className="ob-subgroup-title">{GROUP_LABELS[group]}</p>
            <ChipGroup
              label={GROUP_LABELS[group]}
              options={categories.map((c) => ({
                value: c.code,
                label: `${c.code} · ${c.label}`,
                hint: c.description,
              }))}
              selected={draft.licenceCategories}
              onToggle={(code) => setField("licenceCategories", (list) => toggle(list, code))}
            />
          </div>
        ))}
      </div>

      <div className="ob-field">
        <span className="ob-label">Transmission</span>
        <span className="ob-help">
          For car lessons this is the first thing learners filter on. Pick both
          if you have both cars.
        </span>
        <ChipGroup
          label="Transmission"
          options={reference.transmissions.map((t) => ({ value: t.value, label: t.label }))}
          selected={draft.transmission}
          onToggle={(value) => setField("transmission", (list) => toggle(list, value))}
        />
      </div>
    </>
  );
}

/* ── 4. About you ────────────────────────────────────────────────────────── */
export function StepAbout({ draft, setField }) {
  return (
    <>
      <label className="ob-field">
        <span className="ob-label">Headline</span>
        <input
          type="text"
          maxLength={120}
          value={draft.headline}
          onChange={(e) => setField("headline", e.target.value)}
          placeholder="e.g. Patient with nervous beginners"
        />
        <span className="ob-help">One line shown under your name in search results.</span>
      </label>

      <label className="ob-field">
        <span className="ob-label">About you</span>
        <textarea
          rows={6}
          maxLength={2000}
          value={draft.bio}
          onChange={(e) => setField("bio", e.target.value)}
          placeholder="How you teach, who you are best with, areas you pick up from…"
        />
        <span className="ob-help">{draft.bio.length}/2000</span>
      </label>

      <label className="ob-field">
        <span className="ob-label">Price per lesson (€)</span>
        <input
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={draft.pricePerLesson}
          onChange={(e) => setField("pricePerLesson", e.target.value)}
          placeholder="e.g. 45"
        />
        <span className="ob-help">
          Learners pay you directly — Pro.me never takes a cut of lesson fees.
        </span>
      </label>

      <label className="ob-field">
        <span className="ob-label">Lessons taught so far <span className="ob-help">(optional)</span></span>
        <input
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={draft.lessonsDone}
          onChange={(e) => setField("lessonsDone", e.target.value)}
          placeholder="e.g. 1200"
        />
        <span className="ob-help">
          Shown as self-reported until bookings and reviews here back it up.
          Until your ADI number is verified, very large figures are reduced to
          a lower cap — it rises once you are verified.
        </span>
      </label>

      <label className="ob-field ob-check">
        <input
          type="checkbox"
          checked={draft.acceptingNewStudents}
          onChange={(e) => setField("acceptingNewStudents", e.target.checked)}
        />
        <span>I am taking new learners</span>
      </label>
    </>
  );
}

/* ── 5. Photos ────────────────────────────────────────────────────────────
   Optional. Every change is saved the moment it is made. Reordering uses
   buttons rather than dragging, which works from a keyboard and on a phone. */
export function StepMedia({ draft, media }) {
  const input = useRef(null);
  const count = draft.gallery.length;
  const full = count >= GALLERY_LIMIT;

  return (
    <>
      <p className="ob-help">
        The car learners will drive, where lessons usually start, you teaching.
        Profiles with photos look like someone real is behind them. JPEG, PNG or
        WebP; location data is removed from every photo. The first photo leads
        your gallery, and the starred one replaces your avatar on your profile.
      </p>

      {count > 0 && (
        <ul className="ob-gallery">
          {draft.gallery.map((url, index) => (
            <li key={url} className="ob-gallery-item">
              <img src={url} alt={`Photo ${index + 1}`} loading="lazy" />
              <button
                type="button"
                className="ob-gallery-remove"
                onClick={() => media.onRemove(url)}
                disabled={Boolean(media.busy)}
                aria-label={`Remove photo ${index + 1}`}
              >
                ×
              </button>
              <div className="ob-gallery-tools">
                <button
                  type="button"
                  onClick={() => media.onMove(index, -1)}
                  disabled={index === 0 || Boolean(media.busy)}
                  aria-label={`Move photo ${index + 1} earlier`}
                >
                  ←
                </button>
                <button
                  type="button"
                  className={draft.profilePhotoUrl === url ? "is-on" : ""}
                  onClick={() => media.onChooseProfile(url)}
                  disabled={Boolean(media.busy)}
                  aria-pressed={draft.profilePhotoUrl === url}
                  aria-label={`Use photo ${index + 1} as your profile photo`}
                >
                  ★
                </button>
                <button
                  type="button"
                  onClick={() => media.onMove(index, 1)}
                  disabled={index === count - 1 || Boolean(media.busy)}
                  aria-label={`Move photo ${index + 1} later`}
                >
                  →
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="ob-gallery-actions">
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            const files = [...e.target.files];
            e.target.value = "";
            if (files.length) media.onAdd(files);
          }}
        />
        <button
          type="button"
          className="button button-ghost"
          onClick={() => input.current?.click()}
          disabled={full || Boolean(media.busy)}
        >
          {full ? "Gallery full" : "Add photos"}
        </button>
        <span className="ob-help" role="status">
          {media.busy || `${count} of ${GALLERY_LIMIT} photos`}
        </span>
      </div>

      {media.error && <div className="report-error" role="alert">{media.error}</div>}
    </>
  );
}

/* ── 6. Review and publish ───────────────────────────────────────────────── */
export function StepReview({ draft, setField, reference, user, onEdit, blockers, published, userId }) {
  const names = (slugs, list, key = "slug") =>
    slugs.map((s) => list.find((item) => item[key] === s)?.name ?? s).join(", ") || "—";

  const rows = [
    { step: "basics", label: "ADI number", value: draft.adiNumber || "—" },
    { step: "basics", label: "Phone", value: draft.phone ? formatIrishPhone(draft.phone) : "—" },
    { step: "coverage", label: "Counties", value: names(draft.counties, reference.counties) },
    { step: "coverage", label: "Test centres", value: names(draft.testCentres, reference.testCentres) },
    { step: "teaching", label: "Categories", value: draft.licenceCategories.join(", ") || "—" },
    {
      step: "teaching",
      label: "Transmission",
      value: draft.transmission.map((t) => (t === "automatic" ? "Automatic" : "Manual")).join(", ") || "—",
    },
    { step: "about", label: "Headline", value: draft.headline || "—" },
    { step: "about", label: "Price", value: draft.pricePerLesson !== "" ? `€${draft.pricePerLesson}` : "—" },
    { step: "about", label: "Lessons taught", value: draft.lessonsDone ? `${draft.lessonsDone} (self-reported)` : "—" },
    { step: "media", label: "Photos", value: draft.gallery.length ? `${draft.gallery.length} of ${GALLERY_LIMIT}` : "None yet (optional)" },
  ];

  return (
    <>
      {published && (
        <div className="ob-live" role="status">
          <strong>Your profile is live.</strong> Learners can find you in search.{" "}
          <Link to={`/instructors/${userId}`} className="legal-link">View your profile</Link>
        </div>
      )}

      <dl className="ob-summary">
        {rows.map((row) => (
          <div key={row.label} className="ob-summary-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
            <button type="button" className="ob-edit" onClick={() => onEdit(row.step)}>
              Edit
            </button>
          </div>
        ))}
      </dl>

      {/* The wording mirrors the terms of service, section 4. These are what
          the roadmap requires every instructor to confirm before listing. */}
      <div className="ob-field">
        <span className="ob-label">Before you go live, {user.name.split(" ")[0]}</span>
        <label className="ob-check">
          <input
            type="checkbox"
            checked={draft.declarations.adiConfirmed}
            onChange={(e) => {
              const checked = e.target.checked;
              setField("declarations", (d) => ({ ...d, adiConfirmed: checked }));
            }}
          />
          <span>
            I hold a current ADI permit, the number above is mine, and I only
            advertise categories that are on my permit.
          </span>
        </label>
        <label className="ob-check">
          <input
            type="checkbox"
            checked={draft.declarations.holdsInsurance}
            onChange={(e) => {
              const checked = e.target.checked;
              setField("declarations", (d) => ({ ...d, holdsInsurance: checked }));
            }}
          />
          <span>
            I hold insurance covering paid driving instruction, and I understand
            that I alone am responsible for the lessons I give. See the{" "}
            <Link to="/terms" className="legal-link">terms</Link>.
          </span>
        </label>
      </div>

      {blockers.length > 0 && (
        <div className="ob-blockers" role="alert">
          <p>Almost there — still needed:</p>
          <ul>
            {blockers.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>
      )}

      {!published && (
        <p className="ob-help">
          Your profile will be listed as <em>unverified</em> until we have
          checked your ADI number against the RSA register. You can still be
          found and contacted in the meantime.
        </p>
      )}
    </>
  );
}
