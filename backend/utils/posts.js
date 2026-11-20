import InstructorProfile from "../models/InstructorProfile.js";

/*
 * Posts: an instructor's photos, each with a caption and the time it went up,
 * shown newest first like any feed. They replace the old gallery, which was a
 * plain list of image URLs in an order the instructor set by hand.
 */

/* The same cap the InstructorProfile schema validates. */
export const POST_LIMIT = 24;
export const CAPTION_MAX = 500;

/* Newest first: the order every screen shows posts in. */
export const newestFirst = (posts = []) =>
  [...posts].sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

/*
 * Adds a post unless the instructor already has POST_LIMIT. The check and the
 * push are one update, so two uploads racing for the last place cannot both
 * get in. Returns the new post, or null if the profile is missing or full.
 */
export const addPost = async (userId, { url, caption = "" }, postedAt = new Date()) => {
  const updated = await InstructorProfile.findOneAndUpdate(
    { userId, [`posts.${POST_LIMIT - 1}`]: { $exists: false } },
    { $push: { posts: { url, caption: String(caption).trim().slice(0, CAPTION_MAX), postedAt } } },
    { new: true, runValidators: true }
  );
  return updated ? updated.posts[updated.posts.length - 1] : null;
};

/* Changes the caption of one of the instructor's own posts. Returns the post,
   or null if it is not theirs. */
export const editCaption = async (userId, postId, caption) => {
  const text = String(caption ?? "").trim().slice(0, CAPTION_MAX);
  const updated = await InstructorProfile.findOneAndUpdate(
    { userId, "posts._id": postId },
    { $set: { "posts.$.caption": text } },
    { new: true }
  );
  return updated ? updated.posts.find((post) => String(post._id) === String(postId)) : null;
};

/* Removes one post, and the profile photo too if it was that post's photo -
   the file is about to be deleted. Returns the removed post, or null if the
   instructor has no such post. */
export const removePost = async (userId, postId) => {
  const before = await InstructorProfile.findOneAndUpdate(
    { userId, "posts._id": postId },
    { $pull: { posts: { _id: postId } } }
  );
  if (!before) return null;
  const removed = before.posts.find((post) => String(post._id) === String(postId));
  await InstructorProfile.updateOne({ userId, profilePhotoUrl: removed.url }, { $set: { profilePhotoUrl: "" } });
  return removed;
};

/* Where an instructor's uploads live on Cloudinary. The folder keeps its old
   name, so photos uploaded to the gallery stay where they are. Deleting is only
   ever done inside it, so nobody can remove another instructor's photo. */
export const postsFolder = (userId) => `pro-me/gallery/${userId}`;

/*
 * What PUT /me may change about photos: pick one of the instructor's own posts
 * (or none) as the profile photo. Posts themselves are added, captioned and
 * removed through /me/posts. A URL the instructor did not upload is refused -
 * otherwise a public profile could show an image from anywhere, outside
 * moderation. Returns an error message, or null.
 */
export const checkPhotoEdits = ({ posts, gallery, profilePhotoUrl }, storedPosts = []) => {
  if (posts !== undefined || gallery !== undefined) {
    return "posts are added with POST, captioned with PATCH and removed with DELETE /api/instructors/me/posts";
  }
  if (profilePhotoUrl !== undefined && profilePhotoUrl !== "" && !storedPosts.some((post) => post.url === profilePhotoUrl)) {
    return "profilePhotoUrl must be the photo of one of your posts";
  }
  return null;
};

/* A gallery from before posts, as posts: no captions, and every photo dated to
   when the profile was last changed, keeping the instructor's order (the first
   photo shown first, so it gets the latest time). */
export const galleryToPosts = (gallery = [], when = new Date()) =>
  gallery
    .filter((url) => typeof url === "string" && url.trim())
    .map((url, index) => ({ url, caption: "", postedAt: new Date(new Date(when).getTime() - index * 1000) }));
