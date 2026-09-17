/*
 * Runs the API against a throwaway in-memory MongoDB, seeded with sample
 * instructors.
 *
 *   npm run dev:memory
 *
 * Why this exists: server.js refuses to boot without MONGO_URI, so until an
 * Atlas cluster is set up nobody can run the backend at all — which means the
 * search page cannot be looked at either. This gets the whole stack running in
 * one command with no external service and no configuration.
 *
 * Nothing here is persisted. The database is created fresh on every run and
 * discarded on exit, so it is safe to re-run and impossible to confuse with
 * real data. Never point this at anything but local development.
 */

import { MongoMemoryServer } from "mongodb-memory-server";

const memoryServer = await MongoMemoryServer.create();

process.env.MONGO_URI = memoryServer.getUri("prome");
process.env.SESSION_SECRET ||= "in-memory-dev-secret-not-for-production";
process.env.NODE_ENV ||= "development";
process.env.PORT ||= "9000";

/* server.js connects and starts listening as a side effect of being imported,
   so the env has to be set before this line. */
await import("../server.js");

/* Wait for that connection rather than racing it. */
const mongoose = (await import("mongoose")).default;
await new Promise((resolve) => {
  if (mongoose.connection.readyState === 1) return resolve();
  return mongoose.connection.once("connected", resolve);
});

const User = (await import("../models/User.js")).default;
const InstructorProfile = (await import("../models/InstructorProfile.js")).default;
const Enterprise = (await import("../models/Enterprise.js")).default;
const Review = (await import("../models/Review.js")).default;

const now = new Date();
const trialEnd = new Date(now);
trialEnd.setMonth(trialEnd.getMonth() + 3);

/* Chosen to exercise the cases that are easy to get wrong: a dual-transmission
   instructor (must still match a single-transmission filter), a verified and an
   unverified profile (ranking and the self-reported label), someone not taking
   students, and a non-car category. */
const SAMPLE_INSTRUCTORS = [
  {
    name: "Aoife Byrne", adiNumber: "ADI-10231",
    counties: ["dublin"], testCentres: ["finglas", "raheny"],
    licenceCategories: ["B"], transmission: ["automatic", "manual"],
    pricePerLesson: 45, lessonsDone: 4200, verified: true, accepting: true,
    headline: "Patient with nervous beginners",
    bio: "Fifteen years teaching in north Dublin. I specialise in nervous and\nmature learners, and I will never shout at you at a roundabout.\n\nAutomatic and manual, pick-up anywhere inside the M50.",
    gallery: 3,
  },
  {
    name: "Cian Murphy", adiNumber: "ADI-20984",
    counties: ["dublin", "kildare"], testCentres: ["tallaght", "naas"],
    licenceCategories: ["B", "BE"], transmission: ["manual"],
    pricePerLesson: 40, lessonsDone: 180, verified: false, accepting: true,
    headline: "Evenings and weekends",
    bio: "Full-time job during the week, so I teach evenings and Saturdays.\nManual only. Happy to do motorway lessons once you are ready.",
    gallery: 0,
  },
  {
    name: "Niamh Walsh", adiNumber: "ADI-33112",
    counties: ["cork"], testCentres: ["cork-wilton"],
    licenceCategories: ["B"], transmission: ["automatic"],
    pricePerLesson: 50, lessonsDone: 120, verified: true, accepting: false,
    headline: "Automatic only, Cork city",
    bio: "Automatic tuition around Cork city and the Wilton test route.\nCurrently full — please check back in a few weeks.",
    gallery: 2,
  },
  {
    name: "Darragh Kelly", adiNumber: "ADI-44820",
    counties: ["galway"], testCentres: ["galway-carnmore", "tuam"],
    licenceCategories: ["C", "C1", "D1"], transmission: ["manual"],
    pricePerLesson: 75, lessonsDone: 60, verified: false, accepting: true,
    headline: "Truck and bus categories",
    bio: "C, C1 and D1 tuition out of Galway. Also do CPC preparation.",
    gallery: 0,
  },
];

for (const sample of SAMPLE_INSTRUCTORS) {
  const firstName = sample.name.split(" ")[0].toLowerCase();

  const instructorUser = await User.create({
    name: sample.name,
    email: `${firstName}@example.com`,
    /* Already-hashed shape; these accounts are not meant to be signed into. */
    password: "x".repeat(60),
    role: "enterprise",
    providerType: "driving_instructor",
  });

  await InstructorProfile.create({
    userId: instructorUser._id,
    adiNumber: sample.adiNumber,
    counties: sample.counties,
    testCentres: sample.testCentres,
    licenceCategories: sample.licenceCategories,
    transmission: sample.transmission,
    pricePerLesson: sample.pricePerLesson,
    lessonsDone: sample.lessonsDone,
    acceptingNewStudents: sample.accepting,
    headline: sample.headline,
    bio: sample.bio,
    /* Placeholder images, so the gallery grid can be seen working before the
       real upload pipeline exists. Deterministic seeds keep them stable
       across restarts. */
    gallery: Array.from(
      { length: sample.gallery },
      (_, i) => `https://picsum.photos/seed/${firstName}${i}/600/600`
    ),
    isPublished: true,
    profileCompleteness: 85,
    verification: { status: sample.verified ? "verified" : "unverified" },
    subscription: { status: "trial", trialStartedAt: now, trialEndsAt: trialEnd },
  });

  /* Give the verified ones a review, so the corroboration rule can be seen
     working: their lesson count loses the "self-reported" label. */
  if (sample.verified) {
    const service = await Enterprise.create({
      userId: instructorUser._id,
      subject: "Driving lesson",
      category: "Driving",
      price: sample.pricePerLesson,
    });

    const learner = await User.create({
      name: `Sample learner (${firstName})`,
      email: `learner-${firstName}@example.com`,
      password: "x".repeat(60),
      role: "user",
    });

    await Review.create({
      reviewerId: learner._id,
      providerId: instructorUser._id,
      serviceId: service._id,
      rating: 5,
      comment: "Sample review created by the in-memory dev server.",
    });
  }
}

/* One learner with a booking against each instructor who is taking students,
   so both dashboards and the instructor profile have something to show. */
const Booking = (await import("../models/Booking.js")).default;

const demoLearner = await User.create({
  name: "Sample learner",
  email: "learner@example.com",
  password: "x".repeat(60),
  role: "user",
});

const openInstructors = await InstructorProfile.find({
  acceptingNewStudents: true,
}).select("userId");

for (const [index, profile] of openInstructors.entries()) {
  const when = new Date();
  when.setDate(when.getDate() + 7 + index);

  await Booking.create({
    userId: demoLearner._id,
    instructorId: profile.userId,
    bookingDate: when,
    status: index === 0 ? "confirmed" : "pending",
    confirmedAt: index === 0 ? new Date() : null,
    notes: "Sample booking created by the in-memory dev server.",
  });
}

console.log(
  `\nIn-memory API ready on http://localhost:${process.env.PORT}\n` +
  `Seeded ${SAMPLE_INSTRUCTORS.length} instructors and ${openInstructors.length} bookings. Nothing is persisted.\n` +
  `Run the frontend with: npm --prefix ../frontend run dev\n`
);

const shutdown = async () => {
  await mongoose.disconnect().catch(() => {});
  await memoryServer.stop().catch(() => {});
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
