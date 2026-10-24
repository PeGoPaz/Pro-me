import api from "./index.js";
import { AVATAR_SIDE, resizePhoto } from "../utils/resizePhoto.js";

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
