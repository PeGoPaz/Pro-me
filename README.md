# Pro.me — Professional Services Booking Platform

Pro.me is a full-stack web application that connects customers with local service professionals. Users can browse available services, book appointments, leave reviews, and manage their schedules — all in one seamless flow.

## Features

- **Service Discovery**: Browse professionals by category (Barber, Driving, Tutoring, Beauty & Spa, Health & Wellness)
- **User Authentication**: Secure login/registration for customers and service providers
- **Appointment Booking**: Real-time scheduling with availability management
- **Review System**: Rate and review service providers
- **Provider Dashboard**: Manage services, view bookings, and track performance
- **Customer Dashboard**: View booking history and manage appointments
- **Responsive Design**: Mobile-first approach with modern UI

## Tech Stack

### Backend
- Node.js + Express
- MongoDB with Mongoose
- Express Session with MongoDB Store
- Security: Helmet, Rate Limiting, CORS, NoSQL Injection Protection

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
- `MONGO_URI`: MongoDB connection string
- `SESSION_SECRET`: Secure random string for session encryption
- `CLIENT_ORIGIN`: Frontend URL for CORS

## Project Structure

```
Pro-me/
├── backend/
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth & validation
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
