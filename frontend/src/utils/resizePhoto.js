/*
 * Shrinks a chosen photo in the browser before it is uploaded.
 *
 * The server takes files up to 5 MB, and a photo straight off a phone is often
 * larger. Redrawing it at a sensible size first means any photo works, and the
 * upload is a few hundred kilobytes rather than megabytes over mobile data.
 * Drawing through a canvas also leaves the photo's EXIF block behind - GPS
 * position included - before anything leaves the device; Cloudinary strips it
 * again on its side.
 */

const JPEG_QUALITY = 0.85;

/* Longest side, in pixels, for each kind of photo. Cloudinary makes the final
   size; these only keep the upload small. */
export const AVATAR_SIDE = 800;
export const GALLERY_SIDE = 2048;

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      /* Typically HEIC on a desktop browser that cannot decode it. iPhones
         hand the page a JPEG when picking from the photo library. */
      reject(new Error("That image could not be read. Please choose a JPEG, PNG or WebP photo."));
    };
    img.src = url;
  });

/* Returns a JPEG Blob no larger than maxSide on its longest side. */
export async function resizePhoto(file, maxSide) {
  if (!file || !file.type?.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const img = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  /* JPEG has no transparency; a transparent PNG would otherwise turn black. */
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("That photo could not be prepared for upload."))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}
