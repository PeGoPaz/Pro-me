# Pro.me — Find a driving instructor in Ireland

[![CI](https://github.com/PeGoPaz/Pro-me/actions/workflows/ci.yml/badge.svg)](https://github.com/PeGoPaz/Pro-me/actions/workflows/ci.yml)

Pro.me helps learner drivers find and compare approved driving instructors across
Ireland. The official RSA register already tells you who is approved; this exists
to help you choose between them — with verified ADI status, photos, reviews and
real coverage.

See [`driving-instructor-roadmap.md`](driving-instructor-roadmap.md) for the
product direction. That file is the source of truth, not this one.

## Features

- **Instructor search**: filter by county, RSA test centre, licence category, transmission, price and whether they are taking students
- **Trust-first ranking**: verified instructors first, then profile completeness and review count. Self-reported lesson counts never affect ranking and are always labelled as self-reported
- **RSA-grounded reference data**: 26 counties and all 62 test centres, imported from the RSA's own register with Eircodes, coordinates and the categories each centre tests
- **Instructor profiles**: photo, ADI verification badge, coverage, category badges, bio, gallery and reviews
- **Photo uploads**: instructors upload a gallery of up to 12 photos, put them in order and choose their profile photo; everyone can upload an avatar. The type is checked from the file's bytes, not its name, and Cloudinary re-encodes every image, which strips EXIF data and GPS location
- **Response time**: the profile and search card say how quickly an instructor usually accepts or declines a lesson request - the median over recent requests, with ignored requests counted against them
- **Reviews after a real lesson**: a learner can review an instructor only after a lesson the instructor confirmed and whose date has passed. Moving a confirmed lesson to a new date sends it back for confirmation
- **Save and compare**: learners shortlist instructors (requires an account)
- **Lesson requests**: a learner requests a lesson from an instructor, who accepts or declines. The platform never handles lesson money — learners pay instructors directly
- **Reporting**: anyone can report a profile or review, signed in or not (DSA Article 16). A moderator can take a reported profile off the listing or hide a reported review, always with a statement of reasons (Article 17). The author of a hidden review still sees it on their dashboard, with those reasons
- **Account deletion**: a departing learner's reviews are anonymised rather than deleted, because a review is also about the instructor
- **Mobile-first**: most browsing and comparison happens on phones

### For instructors and admins

- **Onboarding** at `/onboarding`: a step-by-step profile setup that saves as it goes. An instructor without a published profile is sent there after signing in.
- **Admin** at `/admin`: verify ADI numbers against the RSA register, work through reported content, and see a year's figures for the DSA Article 24(3) transparency report. Grant the role with:

  ```bash
  cd backend
  npm run make-admin -- someone@example.com
  ```

  It only promotes an existing learner account, and only through the database — there is no way to become an admin through the website. Locally, `npm run dev:memory` seeds a dev-only admin and a learner with one past lesson to review, and prints both logins.

## Tech Stack

### Backend
- Node.js + Express 5
- MongoDB with Mongoose
- Express Session with MongoDB Store
- Security: Helmet with a strict CSP, rate limiting, strict CORS allowlist, in-house NoSQL injection sanitiser
- Photos: multer (in memory, 5 MB) and Cloudinary

### Tests

`npm test` in `backend/` runs unit tests for the trust and search rules plus
integration tests against a real in-memory MongoDB. The integration tests exist
because every serious bug in this project so far has been index behaviour that
schema checks could not see.

CI runs them on every push and pull request, alongside `npm run lint` and
`npm run build` in `frontend/`. Both sides install with `npm ci` from the
committed lockfiles.

### Frontend
- React 19
- Vite
- React Router
- Modern CSS with responsive design

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend Setup

The quickest way to get running is against a throwaway in-memory database —
no MongoDB instance, no configuration, seeded with sample instructors:

```bash
cd backend
npm install
npm run dev:memory
```

Nothing is persisted; the database is rebuilt on every run.

To run against a real MongoDB instead:

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and session secret,
# and CLOUDINARY_URL if you want photo uploads
npm start
```

Backend runs on `http://localhost:9000`

Run the backend tests with `npm test`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Deployment

`render.yaml` is a Render Blueprint for **one** free web service in Frankfurt.
Express serves both the API and the built frontend, so the whole site is a
single origin.

That is deliberate. With the frontend and API on two `onrender.com` subdomains
the session cookie becomes third-party (onrender.com is on the Public Suffix
List), and Safari blocks third-party cookies outright — login would never work
on an iPhone.

What the Blueprint pins down, and why:

- `plan: free` — without it Render creates the service on a paid instance.
- `region: frankfurt` — the default is Oregon, it cannot be changed after the
  service exists, and the roadmap requires EU hosting for GDPR.
- `SESSION_SECRET` — generated by Render.
- Node 22, via `engines` in the root `package.json` (Render would otherwise use 24).

You supply `MONGO_URI` and, for photo uploads, `CLOUDINARY_URL`; without the
latter the site runs and uploads answer 503. Create the Atlas cluster in
**Frankfurt** (AWS `eu-central-1`) so the app and database sit in the same
region, and allow access from anywhere (`0.0.0.0/0`) in Atlas Network Access —
Render's free tier has no fixed outbound IP.

Free instances sleep after 15 minutes without traffic; the first request after
that takes up to a minute.

To build and run exactly as Render does:

```bash
npm run build
NODE_ENV=production MONGO_URI=... SESSION_SECRET=... npm start
```

## Project Structure

```
Pro-me/
├── backend/
│   ├── data/            # Committed RSA reference data (counties, test centres, categories)
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth, NoSQL sanitiser
│   ├── utils/           # Pure trust/search rules, kept testable without a DB
│   ├── scripts/         # dev:memory seeded server
│   ├── tests/           # Unit + integration tests
│   └── server.js        # Express app entry
└── frontend/
    ├── src/
    │   ├── components/  # Reusable UI components
    │   ├── pages/       # Route pages
    │   ├── context/     # React context providers
    │   ├── api/         # API client
    │   └── utils/       # Helper functions
    └── index.html
```

## License

Private project — all rights reserved.
