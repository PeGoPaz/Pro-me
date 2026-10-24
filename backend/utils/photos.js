import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

/*
 * Photo uploads: instructors' gallery photos, stored on Cloudinary.
 *
 * The browser sends the file as multipart/form-data. It stays in memory - 5 MB
 * at most - and its type is read from its first bytes, not from the name or
 * the Content-Type the client sent, both of which the client controls. Only
 * JPEG, PNG and WebP pass; SVG in particular never does, since it can carry
 * script.
 *
 * Cloudinary re-encodes every upload (longest side 1600 px). Re-encoding is
 * also what drops the EXIF block, and with it the GPS position a phone writes
 * into each photo - for an instructor photographing the car outside their
 * home, that is their address.
 *
 * Credentials come from CLOUDINARY_URL. Without it uploads answer 503, so the
 * rest of the app runs without a Cloudinary account.
 */

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_BYTES, files: 1 },
}).single("photo");

/* "image/jpeg", "image/png" or "image/webp" from the file's own signature, else null. */
export const sniffImageType = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
};

export const uploadsConfigured = () => Boolean(process.env.CLOUDINARY_URL);

/* The SDK reads CLOUDINARY_URL itself; this only asks for https URLs back. */
let configured = false;
const client = () => {
  if (!configured) {
    cloudinary.config({ secure: true });
    configured = true;
  }
  return cloudinary;
};

/* Uploads one photo and returns { url, publicId }. */
export const uploadPhoto = async (buffer, { folder }) => {
  const type = sniffImageType(buffer);
  const result = await client().uploader.upload(`data:${type};base64,${buffer.toString("base64")}`, {
    folder,
    resource_type: "image",
    transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto" }],
  });
  return { url: result.secure_url, publicId: result.public_id };
};

/*
 * The public id inside one of our Cloudinary URLs, e.g.
 *   https://res.cloudinary.com/<cloud>/image/upload/v1729700000/pro-me/gallery/abc/x1y2.jpg
 *   -> pro-me/gallery/abc/x1y2
 * Null for anything that is not an upload in our account.
 */
export const publicIdFromUrl = (url) => {
  const cloud = process.env.CLOUDINARY_URL?.split("@")[1];
  const match = /^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i.exec(
    String(url ?? "")
  );
  if (!match || (cloud && match[1] !== cloud)) return null;
  return match[2];
};

/* Removes the photo from the account. A copy Cloudinary's CDN already cached
   can keep answering for a few minutes; `invalidate` asks it to drop it. */
export const deletePhoto = async (publicId) => {
  await client().uploader.destroy(publicId, { resource_type: "image", invalidate: true });
};
