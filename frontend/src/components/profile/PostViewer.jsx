import { formatShortDate } from "../../utils/formatDate";
import ProfileIcon from "./ProfileIcon";
import { useViewer } from "./useViewer";

/*
 * One post, full screen: the photo, and beside it (below it on a phone) who
 * posted it, the caption and the date. The arrows step through the
 * instructor's posts in the order of the grid.
 */
export default function PostViewer({ posts, index, author, onIndex, onClose }) {
  const post = posts[index];
  const previous = index > 0 ? () => onIndex(index - 1) : null;
  const next = index < posts.length - 1 ? () => onIndex(index + 1) : null;
  const dialog = useViewer({ onClose, onPrevious: previous, onNext: next });

  return (
    <div className="viewer" onClick={onClose} role="presentation">
      <div
        ref={dialog}
        className="viewer-post"
        role="dialog"
        aria-modal="true"
        aria-label={`Post ${index + 1} of ${posts.length}`}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <img src={post.url} alt={post.caption} className="viewer-post-img" />
        <div className="viewer-post-side">
          <p className="viewer-post-author">
            {author.photo ? <img src={author.photo} alt="" /> : <span aria-hidden="true">{author.initials}</span>}
            {author.name}
          </p>
          {post.caption && <p className="viewer-post-caption">{post.caption}</p>}
          {post.postedAt && <p className="viewer-post-date">{formatShortDate(post.postedAt)}</p>}
        </div>
      </div>

      <button type="button" className="viewer-close" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close">
        <ProfileIcon name="close" size={26} />
      </button>
      {previous && (
        <button type="button" className="viewer-step viewer-step-previous" onClick={(e) => { e.stopPropagation(); previous(); }} aria-label="Previous post">
          <ProfileIcon name="left" size={26} />
        </button>
      )}
      {next && (
        <button type="button" className="viewer-step viewer-step-next" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next post">
          <ProfileIcon name="right" size={26} />
        </button>
      )}
    </div>
  );
}
