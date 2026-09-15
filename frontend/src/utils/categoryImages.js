import drivingImage from "../assets/images/driving.jpg";

/* Only the two live verticals remain. "Other" has no cover image of its own —
   callers fall back to a gradient when this returns null. */
const CATEGORY_IMAGES = {
  Driving: drivingImage,
};

export function getCategoryImage(category) {
  return CATEGORY_IMAGES[category] ?? null;
}
