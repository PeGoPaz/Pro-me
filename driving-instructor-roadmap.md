# Pro.me Roadmap: Ireland Driving Instructor Focus

## Overview

Pro.me is being refocused from a broad professional-services marketplace into a platform centered on **driving instructors in Ireland**. The long-term vision is to expand into other sectors later, but the first version should feel purpose-built for instructors, learners, and local driving schools.

The current product direction is:

- **Primary focus:** Driving instructors
- **Geography:** Ireland
- **Secondary category:** Other businesses as a generic fallback
- **Discovery model:** One searchable instructor listing page with filters
- **Profile style:** Instagram-inspired, simple, visual, and trust-based

## Current Direction

### Provider account types

When a provider creates an account, they can choose only:

- **Driving Instructor**
- **Other**

`Other` exists as a generic fallback for non-driving businesses for now.

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

### Category type display

Instructor category choices should use a **friendly label plus RSA-style code**.

Examples:

- Automatic (B Auto)
- Manual (B Manual)
- Truck (C)
- Bus (D)

One instructor can select multiple category types.

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

## Phased Implementation

### Phase 1

- Limit provider onboarding to Driving Instructor or Other
- Add instructor-specific profile fields
- Build the filtered driving instructor search page
- Show city, test centre, and category on listings
- Add profile picture, rating, lessons count, bio, and gallery to profiles

### Phase 2

- Improve verification flow for lessons done count
- Expand instructor discovery and profile completeness
- Refine search filters and result ranking

### Phase 3

- Expand the platform beyond driving instructors into more sectors
- Reuse the same profile and search pattern for other industries

## Technical Notes

- The database is **not configured yet**, so persistence work is a future dependency.
- The app already has a backend and frontend structure that can support this direction.
- The current product model should stay flexible enough to expand later without redesigning the core account and profile flow.

## Summary

Pro.me should become an Ireland-first platform for finding and booking driving instructors, with a clean searchable directory, step-based instructor onboarding, and profile pages that feel modern and visual.

