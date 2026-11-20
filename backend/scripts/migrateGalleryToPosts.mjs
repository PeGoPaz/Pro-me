/*
 * Turns instructors' old galleries (a list of photo URLs) into posts (a photo,
 * a caption and when it went up). Run it once against a database that has
 * profiles saved before posts existed:
 *
 *   npm run migrate:posts
 *
 * It needs MONGO_URI, like make-admin. Safe to run twice: a profile is only
 * touched while it still has a gallery, and the gallery is removed in the
 * same update that writes the posts. The photos keep their place on
 * Cloudinary; only the record of them changes.
 */
import "dotenv/config";
import mongoose from "mongoose";

import { galleryToPosts } from "../utils/posts.js";

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is not set. Point it at the database you want to change.");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

try {
  /* The raw collection: the model no longer has a gallery field to read. */
  const profiles = mongoose.connection.collection("instructorprofiles");
  const old = profiles.find({ gallery: { $exists: true } }, { projection: { gallery: 1, posts: 1, updatedAt: 1, createdAt: 1 } });

  let moved = 0;
  for await (const profile of old) {
    const posts = [
      ...(profile.posts ?? []),
      ...galleryToPosts(profile.gallery, profile.updatedAt ?? profile.createdAt ?? new Date()).map((post) => ({
        _id: new mongoose.Types.ObjectId(),
        ...post,
      })),
    ];
    await profiles.updateOne({ _id: profile._id, gallery: { $exists: true } }, { $set: { posts }, $unset: { gallery: "" } });
    moved += 1;
  }
  console.log(moved ? `Moved the gallery of ${moved} profile${moved === 1 ? "" : "s"} to posts.` : "No galleries left to move.");
} finally {
  await mongoose.disconnect();
}
