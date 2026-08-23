# Pro.me Roadmap: Ireland Driving Instructor Focus

## Overview

Pro.me is being refocused from a broad professional-services marketplace into a platform centered on **driving instructors in Ireland**. The long-term vision is to expand into other sectors later, but the first version should feel purpose-built for instructors, learners, and local driving schools.

The current product direction is:

- **Primary focus:** Driving instructors
- **Geography:** Ireland
- **Secondary category:** Other businesses as a generic fallback
- **Discovery model:** One searchable instructor listing page with filters
- **Profile style:** Instagram-inspired, simple, visual, and trust-based

## Product Principles

The roadmap should follow a few simple rules:

- **Ireland first:** every core flow should make sense for Irish users.
- **Driving instructors first:** the first strong use case should be easy to understand and quick to use.
- **Trust before scale:** profiles and search results should help people feel safe choosing an instructor.
- **Visual, not cluttered:** the product should feel modern and personal, not like a heavy directory.
- **Grow later:** other sectors can be added after the driving-instructor experience is strong.

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
2. Chooses a city.
3. Chooses one or more test centres.
4. Filters by category, rating, lessons done, price, or availability.
5. Opens a profile.
6. Checks photos, bio, reviews, and lesson history.
7. Saves the instructor or books later.

### 2. An instructor creates a profile

1. Signs up as Driving Instructor.
2. Completes setup step by step.
3. Adds city and test centre coverage.
4. Adds categories such as automatic or manual.
5. Uploads profile and gallery images.
6. Publishes the profile.

### 3. A returning user compares instructors

1. Searches by city or test centre.
2. Sorts by lessons done count.
3. Opens multiple profiles.
4. Saves favorites.
5. Picks the instructor that feels most trustworthy and relevant.

### Driving instructor profile setup

Driving instructor profiles should be created in a **step-by-step flow** rather than one long form.

The setup should collect:

- Name
- Email
- Phone number
- City
- Examination centre(s)
- Category type(s)
- Short bio
- Profile photo
- Gallery photos

### Suggested setup steps

The onboarding wizard can be split into these parts:

1. **Basic details** - name, email, phone, and profile image.
2. **Location coverage** - cities and test centres served.
3. **Category details** - driving categories offered.
4. **About section** - short bio and teaching style.
5. **Media** - gallery photos and optional cover image.
6. **Review** - summary before publishing.

### Category type display

Instructor category choices should use a **friendly label plus RSA-style code**.

Examples:

- Automatic (B Auto)
- Manual (B Manual)
- Truck (C)
- Bus (D)

One instructor can select multiple category types.

### Location model

Cities and test centres should work together:

- An instructor can select **multiple cities**.
- Under each selected city, they can select **multiple test centres**.
- The test-centre options should only come from the chosen cities.
- This keeps the setup relevant and avoids unrelated combinations.

### Profile content hierarchy

The public profile should show information in this order:

1. Profile image and name
2. Rating and lessons done count
3. City and test-centre coverage
4. Category badges
5. Short bio
6. Photo gallery
7. Reviews and activity history
8. Booking or save action

## Search Experience

The driving instructor search should be **one list-based page with filters**, not separate SEO pages for every city or test centre.

### Filters

The first version should include:

- City
- Test centre
- Category type
- Rating
- Lessons done count
- Price
- Availability

### Default sorting

Results should default to sorting by **lessons done count**.

### Search behavior

- The page should update results without feeling heavy or slow.
- City and test centre filters should be the strongest filters.
- Rating and lessons done count should help people compare trust quickly.
- Price should support users who are budget-sensitive.
- Availability should help match users to instructors who can take lessons soon.

### Result card behavior

Each card should behave like a mini profile preview:

- Show the instructor photo prominently.
- Show trust signals near the top.
- Show location and category badges clearly.
- Keep the card compact enough to scan fast.
- Let users save the instructor from the card later.

### Card layout

Instructor result cards should feel clean and social, with:

- Profile picture
- Rating
- Lessons done count
- City badge
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
- Lessons done count
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

- Years of experience
- Response time
- Languages spoken
- Manual or automatic focus
- Student success highlights
- Verified contact details
- Availability status

These are not required for the first version, but they can help reduce uncertainty for learners.

## Phased Implementation

### Phase 1

- Limit provider onboarding to Driving Instructor or Other
- Add instructor-specific profile fields
- Build the filtered driving instructor search page
- Show city, test centre, and category on listings
- Add profile picture, rating, lessons count, bio, and gallery to profiles
- Add save/favorite capability
- Add profile completion progress
- Add a simple public-facing instructor summary card
- Keep the Other category available as a fallback

### Phase 2

- Improve verification flow for lessons done count
- Expand instructor discovery and profile completeness
- Refine search filters and result ranking
- Add lesson packages
- Add availability calendar
- Add student reviews with photos
- Add saved instructors
- Add instructor availability indicators
- Add richer profile stats
- Add local comparison and shortlist flows
- Add cancellation policy display
- Add response-time indicator
- Add area-based tags for non-instructor businesses
- Prepare the `Other` category for a future SaaS path

### Phase 3

- Expand the platform beyond driving instructors into more sectors
- Reuse the same profile and search pattern for other industries
- Add profile completion meter
- Add better review sorting and filtering
- Add stronger admin tools for content quality

## Very Late Development Ideas

These are future ideas worth noting, but they should stay out of the early roadmap:

- Verified instructor badge
- Instant booking request
- Area coverage map
- Messaging between learner and instructor
- Calendar sync with external services
- Automated reminder notifications
- Special offer and promotion posts
- Instructor response-time badge
- Multilingual support for English and Irish
- Public instructor availability feed
- Business SaaS dashboard for the `Other` category
- Business feature marketplace for later monetization

## Ideas Rejected for Now

- Test-centre specific pages
- Instructor specialties

## Additional Features Worth Considering Later

These are not committed for now, but they could make the platform stronger if the core marketplace succeeds:

- Booking deposits
- Cancellations and rescheduling rules
- Lesson package discounts
- Featured instructor placement
- "Near me" radius search
- Saved search alerts
- PDF export of booking history
- FAQ section for learner drivers
- Blog or guides for passing the driving test in Ireland
- Admin moderation queue for photos, bios, and reviews
- Report / abuse flow
- Analytics dashboard for instructors
- Review response feature
- Social proof widgets on the home page
- Related instructor recommendations
- City landing pages for SEO after the core product is stable
- Test-centre landing pages for SEO after the core product is stable
- Referral program for instructors and learners
- Loyalty or repeat-booking rewards
- Verification document upload for instructors
- Instructor-specific FAQ section
- Instructor cancellation policy settings
- Instructor availability badge system
- Public business area tags
- Public business response-time label
- Featured slots for later business monetization

## Technical Notes

- The database is **not configured yet**, so persistence work is a future dependency.
- The app already has a backend and frontend structure that can support this direction.
- The current product model should stay flexible enough to expand later without redesigning the core account and profile flow.
- The data model will likely need separate concepts for users, instructor profiles, cities, test centres, categories, bookings, reviews, favorites, and verification metadata.
- The UI should stay mobile-first because most browsing and comparison will likely happen on phones.
- Any future expansion should avoid breaking the driving-instructor experience that the brand starts with.

## Summary

Pro.me should become an Ireland-first platform for finding and booking driving instructors, with a clean searchable directory, step-based instructor onboarding, and profile pages that feel modern and visual.
