import { StarDisplay } from "./StarRating";
import { formatShortDate } from "../utils/formatDate";

function initials(name) {
  const parts = (name || "?").trim().split(" ");
  return (
    parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].slice(0, 2)
  ).toUpperCase();
}

/**
 * A single review card — avatar, reviewer name, service name, stars, date, comment.
 * Works on both the public provider profile and the provider's own dashboard.
 *
 * Props:
 *   review  — populated review object from the API
 */
export default function ReviewCard({ review }) {
  const name = review.reviewerId?.name ?? "Anonymous";
  const avatarUrl = review.reviewerId?.avatarUrl ?? "";
  const service = review.serviceId?.subject ?? "Service";

  return (
    <li className="review-card">
      <div className="review-card-top">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="review-avatar review-avatar-img" />
        ) : (
          <span className="review-avatar">{initials(name)}</span>
        )}

        <div className="review-card-meta">
          <span className="review-card-name">{name}</span>
          <span className="review-card-service">for: {service}</span>
        </div>

        <div className="review-card-right">
          <StarDisplay rating={review.rating} size={14} />
          <span className="review-card-date">{formatShortDate(review.createdAt)}</span>
        </div>
      </div>

      {review.comment && (
        <p className="review-card-comment">"{review.comment}"</p>
      )}
    </li>
  );
}
