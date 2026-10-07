/*
 * Shrinks a chosen photo in the browser before it is uploaded.
 *
 * Avatars are stored as base64 inside the user document until a real upload
 * pipeline exists, and the server caps them at 2MB of base64 (~1.4MB of file).
 * A normal phone photo is 2–5MB, so without this most instructors uploading
 * from their phone — which is most instructors — were simply told their photo
 * was too large. The old client check also compared the *file* size against a
 * limit the server applies to the *encoded* size, so files between ~1.5MB and
 * 2MB passed here and then failed there with a generic error.
 *
 * Resizing to 512px on the longest side fixes both: any photo works, and it is
 * stored at roughly 50–100KB instead of megabytes.
 */

const MAX_SIDE = 512;
const JPEG_QUALITY = 0.85;

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

/* Returns a JPEG data URL no larger than MAX_SIDE on its longest side. */
export async function resizePhotoToDataUrl(file) {
  if (!file || !file.type?.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
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

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}
