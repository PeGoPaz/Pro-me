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

/* Removes a URL from the gallery. Returns the new gallery, or null if it was not there. */
export const removeFromGallery = async (userId, url) => {
  const updated = await InstructorProfile.findOneAndUpdate(
    { userId, gallery: url },
    { $pull: { gallery: url } },
    { new: true }
  );
  return updated ? updated.gallery : null;
};

/* Where an instructor's uploads live on Cloudinary. Deleting is only ever done
   inside it, so nobody can remove another instructor's photo by naming it. */
export const galleryFolder = (userId) => `pro-me/gallery/${userId}`;
