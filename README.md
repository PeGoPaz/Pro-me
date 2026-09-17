# Pro.me — Find a driving instructor in Ireland

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
- **Save and compare**: learners shortlist instructors (requires an account)
- **Lesson requests**: a learner requests a lesson from an instructor, who accepts or declines. The platform never handles lesson money — learners pay instructors directly
- **Reporting**: anyone can report a profile or review, signed in or not (DSA Article 16)
- **Account deletion**: a departing learner's reviews are anonymised rather than deleted, because a review is also about the instructor
- **Mobile-first**: most browsing and comparison happens on phones

### Not built yet

Instructor onboarding has no UI — profiles can currently only be created through
the API. There is also no admin role, so the verified badge cannot yet be granted,
and photo upload (Cloudinary) is not wired up.

## Tech Stack

### Backend
- Node.js + Express 5
- MongoDB with Mongoose
- Express Session with MongoDB Store
- Security: Helmet, rate limiting, strict CORS allowlist, in-house NoSQL injection sanitiser

### Tests

`npm test` in `backend/` runs unit tests for the trust and search rules plus
integration tests against a real in-memory MongoDB. The integration tests exist
because every serious bug in this project so far has been index behaviour that
schema checks could not see.

### Frontend
- React 18
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
# Edit .env with your MongoDB URI and session secret
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

The project includes a `render.yaml` configuration for one-click deployment to Render.com:

- Backend: Node.js service
- Frontend: Static site with SPA routing

Configure environment variables in Render Dashboard:
- `MONGO_URI`: MongoDB connection string. Use an EU region (Dublin or Frankfurt) — the roadmap requires EU hosting for GDPR
- `SESSION_SECRET`: secure random string for session encryption
- `CLIENT_ORIGIN`: exact frontend URL, no trailing slash. This drives both CORS and, with cross-site cookies, the CSRF protection
- `COOKIE_SAMESITE`: optional. Leave unset — production defaults to `none`, which is required because Render serves the frontend and API from two different registrable domains. Set it to `strict` only once both live under one domain

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
