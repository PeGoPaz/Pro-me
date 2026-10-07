/*
 * Avatars are still stored as base64 data URLs inside the User document (up to
 * 2MB each) until the upload pipeline exists. Storing them that way is
 * tolerable; *sending* them that way is not. Embedded in JSON, a single avatar
 * turned the search response from a few kilobytes into ~1.5MB, and a page of
 * twenty instructors would be ~30MB — refetched on every filter change, mostly
 * over mobile data.
 *
 * So the API never ships the data URL to anyone but its owner. Everywhere else
 * it becomes a short link to GET /api/users/:id/avatar, which decodes the image
 * once and lets the browser cache it.
 */

/* The image types the upload endpoint accepts. Re-checked on the way out so a
   stored value can never be served as something executable, e.g. SVG. */
const SERVABLE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

/* Versioned by updatedAt, so a changed avatar gets a new URL and the old one
   can be cached indefinitely. */
export const avatarPath = (userId, updatedAt) => {
  const version = updatedAt ? new Date(updatedAt).getTime() : 0;
  return `/api/users/${userId}/avatar?v=${version}`;
};

/* What a public response should carry instead of the raw avatar value. */
export const publicAvatarUrl = (user) => {
  const value = user?.avatarUrl;
  if (!value || typeof value !== "string") return "";
  /* Already a real URL (what Cloudinary uploads will produce) — pass through. */
  if (value.startsWith("https://")) return value;
  if (value.startsWith("data:") && user._id) return avatarPath(user._id, user.updatedAt);
  return "";
};

/* A shallow copy of a populated user with the avatar replaced by its link.
   Accepts Mongoose documents or plain objects. */
export const withPublicAvatar = (user) => {
  if (!user || typeof user !== "object") return user;
  const plain = typeof user.toObject === "function" ? user.toObject() : { ...user };
  if ("avatarUrl" in plain) plain.avatarUrl = publicAvatarUrl(plain);
  delete plain.updatedAt;
  return plain;
};

/* data:image/png;base64,AAAA → { type, buffer }, or null if unusable. */
export const decodeAvatar = (dataUrl) => {
  if (typeof dataUrl !== "string") return null;
  const match = /^data:([a-z/+-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl);
  if (!match) return null;
  const type = match[1].toLowerCase();
  if (!SERVABLE_TYPES.has(type)) return null;
  return { type: type === "image/jpg" ? "image/jpeg" : type, buffer: Buffer.from(match[2], "base64") };
};

/* Aggregation-side equivalent of publicAvatarUrl, for $lookup pipelines: keeps
   an https URL as-is but collapses a data URL to the bare marker "data:", so
   megabytes of base64 never leave the database for a list query. */
export const avatarProjection = {
  $cond: [
    { $eq: [{ $substrBytes: [{ $ifNull: ["$avatarUrl", ""] }, 0, 5] }, "data:"] },
    "data:",
    { $ifNull: ["$avatarUrl", ""] },
  ],
};
