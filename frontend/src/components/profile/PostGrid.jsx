/*
 * Posts as a square grid, three across at every width, the way people expect
 * to scan a profile's photos. A post's caption is its button's label, and
 * shows over the photo on hover.
 */
export default function PostGrid({ posts, onOpen }) {
  if (!posts.length) {
    return <p className="ig-empty">No posts yet.</p>;
  }
  return (
    <ul className="post-grid">
      {posts.map((post, index) => (
        <li key={post.id}>
          <button
            type="button"
            className="post-tile"
            onClick={() => onOpen(index)}
            aria-label={post.caption ? `Open post: ${post.caption}` : `Open post ${index + 1}`}
          >
            <img src={post.url} alt="" loading="lazy" />
            {post.caption && <span className="post-tile-caption" aria-hidden="true">{post.caption}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
