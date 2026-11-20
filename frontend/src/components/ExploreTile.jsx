import { Link } from "react-router-dom";
import ProfileIcon from "./profile/ProfileIcon";
import { tileImage } from "../utils/tileImage";

/*
 * One instructor in the Explore grid: a square picture with their name,
 * rating and price over it, the whole tile a link to their profile.
 */
export default function ExploreTile({ instructor }) {
  const image = tileImage(instructor);
  const initials = (instructor.name ?? "")
    .split(" ").filter(Boolean).slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "DI";
  const facts = [
    instructor.averageRating !== null && instructor.averageRating !== undefined ? `★ ${instructor.averageRating.toFixed(1)}` : null,
    instructor.pricePerLesson !== null && instructor.pricePerLesson !== undefined ? `€${instructor.pricePerLesson}` : null,
  ].filter(Boolean);

  return (
    <Link to={`/instructors/${instructor.id}`} className="explore-tile">
      {image ? (
        <img src={image} alt="" loading="lazy" />
      ) : (
        <span className="explore-tile-initials" aria-hidden="true">{initials}</span>
      )}
      <span className="explore-tile-info">
        <span className="explore-tile-name">
          {instructor.name}
          {instructor.isVerified && (
            <>
              <ProfileIcon name="shield" size={14} />
              <span className="sr-only">, verified ADI</span>
            </>
          )}
        </span>
        {facts.length > 0 && <span className="explore-tile-facts">{facts.join(" · ")}</span>}
      </span>
    </Link>
  );
}
