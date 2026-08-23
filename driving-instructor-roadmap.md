# Pro.me Roadmap: Ireland Driving Instructor Focus

## Overview

Pro.me is being refocused from a broad professional-services marketplace into a platform centered on **driving instructors in Ireland**. The long-term vision is to expand into other sectors later, but the first version should feel purpose-built for instructors, learners, and local driving schools.

The current product direction is:

- **Primary focus:** Driving instructors
- **Geography:** Ireland
- **Secondary category:** Other businesses as a generic fallback
- **Discovery model:** One searchable instructor listing page with filters
- **Profile style:** Instagram-inspired, simple, visual, and trust-based
- **Business model:** Flat subscription fee per business (see Business Model section)

## Product Principles

The roadmap should follow a few simple rules:

- **Ireland first:** every core flow should make sense for Irish users.
- **Driving instructors first:** the first strong use case should be easy to understand and quick to use.
- **Trust before scale:** profiles and search results should help people feel safe choosing an instructor.
- **Visual, not cluttered:** the product should feel modern and personal, not like a heavy directory.
- **Grow later:** other sectors can be added after the driving-instructor experience is strong.

### Competitive note

The RSA runs a free, official, complete directory of instructors (searchable by category and county). Pro.me's value-add over it must be trust and UX: verified ADI status, photos, reviews, availability, and comparison. Those four are the launch identity — generic directory fields are not.

## Current Direction

### Provider account types

When a provider creates an account, they can choose only:

- **Driving Instructor**
- **Other**

`Other` exists as a generic fallback for non-driving businesses for now.

### Core user roles

The platform should eventually support these roles:

- **Learner / customer**: searches, bookmarks, books, and reviews instructors.
- **Driving instructor**: builds a profile, manages visibility, and receives lesson requests.
- **Other business owner**: uses the fallback category for now.
- **Admin**: manages moderation, verification, and platform growth later.

### Other-business direction

The `Other` category should remain simple for now, but later it can grow into a separate SaaS-style offering for non-driving businesses. That future path can include:

- area-based tags
- response-time indicators
- featured slots
- cancellation policy display

Those features should apply to the broader business side later, not the instructor core.

## Core User Journeys

### 1. A learner finds an instructor

1. Opens the search page.
2. Chooses a county.
3. Optionally narrows to one or more test centres.
4. Filters by category, rating, lessons done, price, or availability status.
5. Opens a profile.
6. Checks photos, bio, reviews, and lesson history.
7. Saves the instructor or books later.

### 2. An instructor creates a profile

1. Signs up as Driving Instructor.
2. Completes setup step by step.
3. Provides their RSA ADI number (required — see Trust & Safety).
4. Adds county coverage and test centres served.
5. Adds licence categories and transmission taught.
6. Uploads profile and gallery images.
7. Publishes the profile.

### 3. A returning user compares instructors

1. Searches by county or test centre.
2. Sorts using the default trust-first ranking.
3. Opens multiple profiles.
4. Saves favorites.
5. Picks the instructor that feels most trustworthy and relevant.

### Driving instructor profile setup

Driving instructor profiles should be created in a **step-by-step flow** rather than one long form.

The setup should collect:

- Name
- Email
- Phone number
- RSA ADI number
- County coverage
- Test centre(s) served
- Licence category(ies) and transmission taught
- Short bio
- Profile photo
- Gallery photos

### Suggested setup steps

The onboarding wizard can be split into these parts:

1. **Basic details** - name, email, phone, ADI number, and profile image.
2. **Location coverage** - counties and test centres served.
3. **Category details** - licence categories and transmission offered.
4. **About section** - short bio and teaching style.
5. **Media** - gallery photos and optional cover image.
6. **Review** - summary before publishing.

### Category model (RSA-verified)

Instructor licence categories use the **actual EU/RSA licence category letters** exactly as they appear on the ADI register and permit. RSA.ie recognises these categories for the ADI register:

A, A1, A2, AM, B, BE, C, C1, C1E, CE, D, D1, D1E, DE, W

Rules verified against rsa.ie:

- An ADI may only instruct in categories on their permit; permits are renewed every two years.
- **Transmission is NOT a category.** "B Auto" / "B Manual" are not RSA codes. Transmission is stored as a separate multi-select attribute on the profile: **Automatic / Manual** (what the instructor teaches).
- Category A (motorcycle) ADIs may additionally deliver IBT — worth surfacing later.

Display examples:

- Car — Automatic (Category B, automatic)
- Car — Manual (Category B, manual)
- Truck (Category C)
- Bus (Category D)
- Motorcycle (Category A / A1 / A2 / AM)

One instructor can select multiple categories. The data model must store category letters and transmission separately so filtering works on both axes.

### Location model (RSA-verified)

The RSA ADI register organises instructors by **county** (26 counties), and driving test centres (41 locations nationwide) are also listed by county. Centres do not nest cleanly under cities — some counties have multiple centres, some have none, and Dublin has several. Therefore:

- **Primary location axis: county (multi-select).** This matches the RSA's own search UX and how instructors think about coverage.
- **Secondary axis: test centres served** — a flat, admin-curated list of the 41 RSA test centre locations, optionally grouped by county. Instructors pick any centres they serve; centres are not constrained under a city.
- **City is display-only**, if shown at all — never the structured filter axis.

This replaces the earlier "multi-select city → constrained test centre" model, which did not match Irish geography.

### Profile content hierarchy

The public profile should show information in this order:

1. Profile image and name
2. Verification badge (ADI status) where verified, rating, and lessons done count
3. County and test-centre coverage
4. Category badges (letters + transmission)
5. Short bio
6. Photo gallery
7. Reviews and activity history
8. Booking or save action

## Search Experience

The driving instructor search should be **one list-based page with filters**, not separate SEO pages for every county or test centre.

### Filters

The first version should include:

- County
- Test centre
- Category type
- Transmission (automatic / manual)
- Rating
- Lessons done count
- Price
- Availability status (accepting new students: yes/no — see Phase notes)

### Default sorting

Results should **not** default to lessons-done, because that number is self-reported and unverified at launch (abuse risk, and ranking on unverified data undermines the trust product). Default sort at launch: **profile completeness + review count** (trust-first, non-gameable), with verified profiles ranked above unverified. Lessons-done sorting becomes available once verification/corroboration exists (Phase 2). DSA note: ranking-parameter disclosure (Art. 27) is an online-platform obligation that micro/small enterprises are exempt from under Art. 19 — not a launch blocker — but documenting the sort in the ToS is cheap and becomes mandatory if the platform outgrows micro/small status.

### Search behavior

- The page should update results without feeling heavy or slow.
- County and test centre filters should be the strongest filters.
- Rating and review count should help people compare trust quickly.
- Price should support users who are budget-sensitive.
- Availability should help match users to instructors who can take lessons soon.

### Result card behavior

Each card should behave like a mini profile preview:

- Show the instructor photo prominently.
- Show trust signals near the top (verified badge, rating, review count).
- Show location and category badges clearly.
- Keep the card compact enough to scan fast.
- Let users save the instructor from the card (requires login).

### Card layout

Instructor result cards should feel clean and social, with:

- Profile picture
- Rating
- Lessons done count (labelled "self-reported" until verified)
- County badge
- Test centre badge
- Category badge(s)

## Profile Experience

Instructor profiles should feel a little **Instagram-ish**, but still professional and useful.

### Visual style goals

- Large profile photo
- Strong username-style identity
- Simple stat row
- Photo grid / gallery section
- Clean spacing and minimal clutter

### Why this style fits

The platform is meant to support individual instructors and small businesses, so the profile should feel personal, approachable, and easy to trust. The Instagram-like pattern helps users quickly understand who the instructor is, how active they are, and what their work looks like.

### Core profile content

- Profile picture
- Rating
- Lessons done count (self-reported, labelled as such until verified)
- Short bio
- Photo gallery

### Tone

The profile should be:

- Visual first
- Simple to scan
- Trust building
- Suitable for small businesses and individual instructors

### Profile trust signals

The profile can later include:

- Verified ADI badge
- Years of experience
- Response time (derived from booking confirmations — see Phase 2)
- Languages spoken
- Manual or automatic focus
- Student success highlights
- Availability status

These are not required for the first version, but they can help reduce uncertainty for learners.

## Lessons-Done Count: Anti-Abuse Rules

The lessons-done number is self-verified by the instructor, which makes it gameable (a new account can claim 12,000 lessons and rank first). To protect trust and legal standing:

- Cap initial self-reported values at a modest maximum.
- Unverified profiles keep the lowest self-reported cap; the cap lifts once ADI status is verified.
- Always label displayed values as "self-reported" until corroborated.
- Require corroboration (completed bookings and/or reviews) before high values display without the label.
- Do not use lessons-done as the default sort until verification exists.
- Admin can flag/adjust suspicious counts (Phase 3 admin tooling).

## Business Model: Flat Subscription

Every business on the platform pays a **fixed subscription fee** — not commission, not pay-per-feature. Consequences and rules:

- **No commission on lessons.** Learners pay instructors directly (cash/transfer typical in Ireland); the platform never touches lesson money unless a payments workstream is explicitly scheduled later.
- **Featured placement is not paid placement.** With a flat fee, "featured slots" cannot be sold individually. Featured positioning must be either (a) editorial/rotation-based, or (b) a higher subscription tier (e.g. Standard vs Pro). Decide before building any ranking feature. Per-feature sales and a "business feature marketplace" conflict with flat pricing and are removed from this roadmap.
- **Per-category listing limits** only make sense as tier differentiation; with a single flat price they should not exist.
- **Subscription status** is a first-class data field: active | trial | grace | past_due | cancelled.

### When a subscription lapses

1. **Grace period** (7–14 days after expiry): profile stays visible, instructor is notified.
2. **Suspended**: profile hidden from search and booking is disabled — but the profile is NOT deleted.
3. **After an extended lapse** (e.g. 90 days): profile archived.
4. **Reviews and booking history are retained** — they are partly learners' data and survive instructor suspension/deletion (see Data & Deletion).
5. **Resubscribing restores everything** (profile, photos, listing position resets naturally).

### Subscription mechanics

- Every new business account starts with a **3-month free trial**.
- **Card verification via Stripe is required to start the trial** — no card, no trial. This is the anti-throwaway-signup gate, not a paywall: the trial itself is free.
- At trial end, billing **converts automatically to €5/month** (flat fee).
- This slots into the existing status model with **no schema change**: **trial** covers the 3 free months → **active** once billing starts → **past_due / grace** if a card is declined → **cancelled**. The lapse handling above applies from the moment billing starts.
- **Implementation status:** Phase 1 ships the schema only — status field plus trial/billing date fields (`trialStartedAt`, `trialEndsAt`, `currentPeriodEnd`, `graceEndsAt`). Actual Stripe wiring (card verification, subscription creation, webhooks, dunning) is a defined **Phase 2 placeholder workstream**, not built at launch.

## Trust, Safety & Legal

This is a stranger-meets-stranger-in-a-car product involving minors (Irish learner permits start at 16). These items are obligations in Ireland, not optional features:

- **ADI verification:** teaching driving for reward without being on the RSA ADI register is a criminal offence (fine up to €2,000 or 6 months). The ADI number is a **required onboarding field**, but account creation is **immediate — no human gate at signup** (cold-start: with zero network effect, instructors won't wait for manual review). New profiles are publicly listed but clearly marked **unverified**, ranked below verified profiles, and subject to the lowest self-reported lessons cap. Admins verify against the RSA public register (name, ADI number, counties, categories) in a manual queue at launch; verification tooling comes later. The verified badge moves from "very late idea" to Phase 1–2.
- **GDPR (DPC is the regulator):** privacy policy and terms of service; lawful basis and retention schedule for reviews (two people's personal data per review), photos (which may show learners, possibly minors), published phone numbers, and booking history. Choose EU-region hosting (e.g. Atlas Dublin/Frankfurt) and DPAs for Mongo, image hosting, and app hosting.
- **DSA (Regulation EU 2022/2065) — size matters:** Pro.me is a hosting service and an online platform (it stores and publicly disseminates profiles, photos, and reviews). As a micro or small enterprise (<50 staff and ≤€10M turnover/balance sheet per Recommendation 2003/361/EC), Art. 19 exempts it from most Section 3 "online platform" obligations — Arts. 20–28, including Art. 27 ranking/recommender transparency — and Art. 29 likewise exempts the trader-traceability rules (Arts. 30–32). **Still required at launch regardless of size:** Art. 14 (terms of service), Art. 16 notice-and-action (so the report/abuse flow IS a launch requirement, not "worth considering later"), Art. 17 (statement of reasons when acting on content), Art. 18 (reporting suspected criminal offences), Arts. 11–12 (contact points), and Art. 24(3) — an annual content-moderation transparency report, the one Section 3 duty that survives the Art. 19 exclusion. The exemption lasts only while the company stays micro/small (12-month grace after losing that status); Art. 27 ranking disclosure becomes mandatory at that point. Cited from: Regulation (EU) 2022/2065, Arts. 16, 19, 24, 27, 29 (Official Journal text).
- **Deletion handling:** there must be account-deletion endpoints. Learner deletion anonymises their reviews ("Deleted user") or removes them per request; instructor deletion/suspension hides the profile but retains learners' own booking history, which belongs to the learner.
- **Minors:** ToS language covering 16–17 year olds; consider an explicit parent-booking flow later.
- **Insurance/liability disclaimer:** instructors confirm at signup that they hold insurance covering paid instruction; terms state the platform only introduces and the instructor is solely responsible for the lesson.

## Phased Implementation

### Phase 1 — Foundations & Trust

- Configure MongoDB and design the schema: users, instructor profiles, counties, test centres, categories, bookings, reviews, favorites, subscription status.
- Build the photo upload pipeline (multer + Cloudinary — both are already in backend dependencies but currently unused).
- Limit provider onboarding to Driving Instructor or Other; remove legacy verticals from the code (see Known Code Debt).
- Instructor-specific profile fields: counties, test centres, licence categories, transmission, ADI number.
- ADI number required at signup; account creation immediate; profile listed as **unverified** (badged, ranked below verified, lowest lessons cap) until an admin verifies it against the RSA register via a manual verification queue.
- Filtered instructor search page: county, test centre, category, transmission, rating, price, availability status (accepting new students: yes/no toggle only — the real calendar is Phase 2).
- Profile: picture, rating, self-reported lessons count (labelled), bio, gallery, ADI badge.
- Save/favorite instructor (auth-gated; requires logged-in learner account).
- Profile completion progress.
- Terms of service, privacy policy, report/abuse flow, account deletion.
- Subscription scaffolding (**schema only, no Stripe**): status field (trial/active/grace/past_due/cancelled) + trial date fields (`trialStartedAt`, `trialEndsAt`), grace/suspend/archive behaviour, lapse handling.
- Keep the Other category available as a fallback.

### Phase 2 — Depth & Corroboration

- Stripe subscription billing (**placeholder workstream — defined scope, not built in Phase 1**): card verification at trial start (no card = no trial), 3-month free trial auto-converting to €5/month, webhooks for trial-end/payment events, dunning on declined cards (past_due → grace → cancelled per the lapse rules).
- Availability calendar (replaces the boolean availability toggle) and availability filter wired to it.
- Reviews linked to completed bookings (block unauthenticated/competitor reviews).
- Student reviews with photos.
- Response-time indicator derived from booking createdAt → confirmedAt latency (no messaging needed).
- Lesson packages as display-only offerings (learner pays instructor directly).
- Lessons-done verification/corroboration; lessons-done sorting becomes available.
- Refine search filters and result ranking.
- Richer profile stats and local comparison/shortlist flows.
- Cancellation policy display.
- Area-based tags for non-instructor businesses; prepare `Other` for a future SaaS path.

### Phase 3 — Expansion

- Expand the platform beyond driving instructors into more sectors.
- Reuse the same profile and search pattern for other industries.
- Better review sorting and filtering.
- Stronger admin tools for content quality (count flags, adjustment of self-reported stats).

## Very Late Development Ideas

These are future ideas worth noting, but they should stay out of the early roadmap:

- Instant booking request
- Area coverage map
- Messaging between learner and instructor
- Calendar sync with external services
- Automated reminder notifications
- Special offer and promotion posts
- Multilingual support for English and Irish
- Public instructor availability feed
- Business SaaS dashboard for the `Other` category
- Lesson payments / booking deposits (distinct from subscription billing — requires its own explicit payments workstream)
- "RSA quality approved"-style second verification tier

## Ideas Rejected for Now

- Test-centre specific pages
- Instructor specialties
- Paid featured slots / per-feature sales / feature marketplace (conflicts with flat subscription)

## Additional Features Worth Considering Later

These are not committed for now, but they could make the platform stronger if the core marketplace succeeds:

- Cancellations and rescheduling rules
- "Near me" radius search
- Saved search alerts
- PDF export of booking history
- FAQ section for learner drivers
- Blog or guides for passing the driving test in Ireland
- Referral program for instructors and learners
- Loyalty or repeat-booking rewards
- Verification document upload for instructors
- Instructor-specific FAQ section
- Instructor cancellation policy settings
- Instructor availability badge system
- Public business area tags
- Public business response-time label
- City landing pages for SEO after the core product is stable
- Test-centre landing pages for SEO after the core product is stable

## Known Code Debt (legacy multi-vertical marketplace)

The current code still carries the old broad-marketplace assumptions and must be aligned in Phase 1:

- `backend/models/Enterprise.js` category enum includes Barber, Tutoring, Beauty & Spa, Health & Wellness — reduce to Driving / Other.
- `frontend/src/utils/categoryImages.js` and `ServiceSearchForm.jsx` hard-code the old verticals.
- No Favorite, Subscription, City/County, TestCentre, or moderation models exist yet.
- No delete-account endpoints exist anywhere.
- Avatars are stored as base64 data URLs (up to 2MB) in Mongo — fine for avatars, not viable for galleries.
- `xss-clean` is a deprecated dependency; remove or replace it.
- Production cookies use SameSite=strict — keep frontend and API under one registrable domain or sessions break.

## Technical Notes

- The database is **not configured yet**, so persistence work is a Phase 1 dependency.
- The app already has a backend and frontend structure that can support this direction.
- The current product model should stay flexible enough to expand later without redesigning the core account and profile flow.
- The data model will need separate concepts for users, instructor profiles, counties, test centres, categories, bookings, reviews, favorites, subscriptions, and verification metadata.
- The UI should stay mobile-first because most browsing and comparison will likely happen on phones.
- Any future expansion should avoid breaking the driving-instructor experience that the brand starts with.

## Verified Sources

- RSA ADI overview & permit categories: rsa.ie/services/professional-drivers/approved-driving-instructor-adi
- RSA official ADI register (categories + counties): rsa.ie/services/learner-drivers/driving-lessons/find-an-instructor/approved-driving-instructor
- Adding categories to an ADI permit: rsa.ie/.../add-categories-to-your-adi-permit
- ADI regulations & penalties: rsa.ie/.../regulations (S.I. No. 146/2009 et al.)
- Driving test centres by county (41 locations): rsa.ie/services/learner-drivers/the-driving-test/driving-test-centres
- DSA obligations cited above: Regulation (EU) 2022/2065, Arts. 16, 19, 24, 27, 29 (Official Journal text; e.g. eu-digital-services-act.com mirror)

## Summary

Pro.me should become an Ireland-first platform for finding and booking driving instructors, with a clean searchable directory, step-based instructor onboarding, and profile pages that feel modern and visual. Trust is the differentiator: verified ADI status, booking-linked reviews, and honest self-reported stats — built on a flat-subscription business model (3-month trial → €5/month) with clear lapse handling and Irish/EU legal compliance from day one.
