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

/* The same caps the server enforces. */
export const POST_LIMIT = 24;
export const CAPTION_MAX = 500;

/* Resizes a photo and posts it, with its caption, for the signed-in
   instructor; resolves to the new post: { id, url, caption, postedAt }. */
export async function createPost(file, caption = "") {
  const blob = await resizePhoto(file, GALLERY_SIDE);
  const form = photoForm(blob);
  form.append("caption", caption);
  const res = await api.post("/instructors/me/posts", form);
  return res.data.post;
}

/* Changes a post's caption; resolves to the post as saved. */
export async function editPostCaption(postId, caption) {
  const res = await api.patch(`/instructors/me/posts/${postId}`, { caption });
  return res.data.post;
}

/* Removes a post and its file on Cloudinary. */
export async function deletePost(postId) {
  await api.delete(`/instructors/me/posts/${postId}`);
}
