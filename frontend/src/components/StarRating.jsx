import { useState } from "react";

const STAR_PATH = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

/** Read-only star row. */
export function StarDisplay({ rating, size = 16 }) {
  return (
    <span className="star-display" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={n <= Math.round(rating) ? "star star-on" : "star"}
          strokeWidth="1.5"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

/** Interactive star picker with hover preview. */
export function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <span className="star-picker" role="group" aria-label="Select rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="star-picker-btn"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={n <= active ? "star star-on" : "star"}
            strokeWidth="1.5"
          >
            <path d={STAR_PATH} />
          </svg>
        </button>
      ))}
    </span>
  );
}
