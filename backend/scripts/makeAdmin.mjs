/*
 * Grant the admin role to an existing account.
 *
 *   npm run make-admin -- someone@example.com
 *
 * Deliberately a script and not an endpoint: there must be no HTTP path by
 * which anyone becomes an admin. Running this needs MONGO_URI, i.e. database
 * access, which is the real authority here.
 *
 * Only learner accounts ("user") can be promoted. An admin decides whether
 * instructors are verified, so the admin account must not also be an
 * instructor's account — use a separate one.
 */
import "dotenv/config";
import mongoose from "mongoose";

import User from "../models/User.js";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: npm run make-admin -- someone@example.com");
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is not set. Point it at the database you want to change.");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

try {
  const user = await User.findOne({ email });

  if (!user) {
    console.error(`No account with email ${email}. Register it on the site first, as a learner.`);
    process.exitCode = 1;
  } else if (user.role === "admin") {
    console.log(`${email} is already an admin.`);
  } else if (user.role !== "user") {
    console.error(`${email} is an instructor/provider account. Admins must use a separate learner account.`);
    process.exitCode = 1;
  } else {
    user.role = "admin";
    await user.save();
    console.log(`${email} is now an admin. They must sign out and back in for it to take effect.`);
  }
} finally {
  await mongoose.disconnect();
}
