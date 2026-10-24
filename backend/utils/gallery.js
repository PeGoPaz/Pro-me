import InstructorProfile from "../models/InstructorProfile.js";

/* The same cap the InstructorProfile schema validates. */
export const GALLERY_LIMIT = 12;

/*
 * Adds a photo URL to an instructor's gallery unless it is full. The check and
 * the push are a single update, so two uploads racing at 11 photos cannot end
 * with 13. Returns the new gallery, or null if the profile is missing or full.
 */
export const addToGallery = async (userId, url) => {
  const updated = await InstructorProfile.findOneAndUpdate(
    { userId, [`gallery.${GALLERY_LIMIT - 1}`]: { $exists: false } },
    { $push: { gallery: url } },
    { new: true }
  );
  return updated ? updated.gallery : null;
};

/* Removes a URL from the gallery, and from the profile photo if it was that
   too - the file is about to be deleted. Returns the new gallery, or null if
   the URL was not in it. */
export const removeFromGallery = async (userId, url) => {
  const updated = await InstructorProfile.findOneAndUpdate(
    { userId, gallery: url },
    { $pull: { gallery: url } },
    { new: true }
  );
  if (!updated) return null;
  await InstructorProfile.updateOne({ userId, profilePhotoUrl: url }, { $set: { profilePhotoUrl: "" } });
  return updated.gallery;
};

/* Where an instructor's uploads live on Cloudinary. Deleting is only ever done
   inside it, so nobody can remove another instructor's photo by naming it. */
export const galleryFolder = (userId) => `pro-me/gallery/${userId}`;

/*
 * What PUT /me may change about photos, now that they are uploaded rather than
 * linked: reorder the gallery, and pick one of its photos (or none) as the
 * profile photo. A URL the instructor did not upload is refused - otherwise a
 * public profile could show an image from anywhere, outside moderation.
 * Adding goes through POST /me/gallery and removing through DELETE, which also
 * deletes the file from Cloudinary. Returns an error message, or null.
 */
export const checkPhotoEdits = ({ gallery, profilePhotoUrl }, storedGallery = []) => {
  if (gallery !== undefined) {
    const isReorder =
      Array.isArray(gallery) &&
      gallery.length === storedGallery.length &&
      new Set(gallery).size === gallery.length &&
      gallery.every((url) => storedGallery.includes(url));
    if (!isReorder) {
      return "gallery can only reorder your photos: add them with POST and remove them with DELETE /api/instructors/me/gallery";
    }
  }
  if (profilePhotoUrl !== undefined && profilePhotoUrl !== "" && !storedGallery.includes(profilePhotoUrl)) {
    return "profilePhotoUrl must be one of your gallery photos";
  }
  return null;
};
