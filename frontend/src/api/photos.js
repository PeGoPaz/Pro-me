import api from "./index.js";
import { AVATAR_SIDE, GALLERY_SIDE, resizePhoto } from "../utils/resizePhoto.js";

/* One photo as multipart/form-data, in the "photo" field the server expects.
   The server checks the type from the file's own bytes; the name is cosmetic. */
const photoForm = (blob) => {
  const form = new FormData();
  form.append("photo", blob, "photo.jpg");
  return form;
};

/* Resizes and uploads a new avatar; resolves to the updated user. */
export async function uploadAvatar(file) {
  const blob = await resizePhoto(file, AVATAR_SIDE);
  const res = await api.post("/auth/me/avatar", photoForm(blob));
  return res.data.user;
}

/* The same cap the server enforces. */
export const GALLERY_LIMIT = 12;

/* Resizes and adds one photo to the signed-in instructor's gallery; resolves
   to the gallery as the server now has it. */
export async function uploadGalleryPhoto(file) {
  const blob = await resizePhoto(file, GALLERY_SIDE);
  const res = await api.post("/instructors/me/gallery", photoForm(blob));
  return res.data.gallery;
}

/* Removes one photo (and its file on Cloudinary); resolves to the new gallery. */
export async function removeGalleryPhoto(url) {
  const res = await api.delete("/instructors/me/gallery", { params: { url } });
  return res.data.gallery;
}
