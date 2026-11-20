/* An instructor's round photo, or their initials when they have none. */
export default function Avatar({ author, size = 36 }) {
  const initials = (author.name ?? "")
    .split(" ").filter(Boolean).slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "DI";
  return author.photo ? (
    <img className="feed-avatar" src={author.photo} alt="" width={size} height={size} />
  ) : (
    <span className="feed-avatar feed-avatar-initials" style={{ width: size, height: size }} aria-hidden="true">
      {initials}
    </span>
  );
}
