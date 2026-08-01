import barberImage from "../assets/images/barber.jpg";
import drivingImage from "../assets/images/driving.jpg";
import tutoringImage from "../assets/images/tutoring.jpg";
import spaBeautyImage from "../assets/images/spabeauty.jpg";
import healthWellnessImage from "../assets/images/healthwellness.jpeg";

const CATEGORY_IMAGES = {
  Barber: barberImage,
  Driving: drivingImage,
  Tutoring: tutoringImage,
  "Beauty & Spa": spaBeautyImage,
  "Health & Wellness": healthWellnessImage,
};

export function getCategoryImage(category) {
  return CATEGORY_IMAGES[category] ?? null;
}
