import { Link } from "react-router-dom";
import ProfileIcon from "../profile/ProfileIcon";
import { timeAgo } from "../../utils/timeAgo";
import Avatar from "./Avatar";

/*
 * One post in the home feed: who posted it and when, the photo, then what to
 * do about it - see the instructor, or ask them for a lesson while they take
 * new learners - and the caption under the instructor's name.
 */
export default function FeedPost({ post, now }) {
  const { author } = post;
  const profile = `/instructors/${author.id}`;
  return (
    <article className="feed-post" aria-label={`Post by ${author.name}`}>
      <header className="feed-post-head">
        <Link to={profile} className="feed-post-author">
          <Avatar author={author} />
          <span className="feed-post-name">{author.name}</span>
          {author.isVerified && (
            <span className="feed-post-verified" title="ADI number checked against the RSA register">
              <ProfileIcon name="shield" size={14} />
              <span className="sr-only">Verified ADI</span>
            </span>
          )}
        </Link>
        <time className="feed-post-time" dateTime={post.postedAt}>{timeAgo(post.postedAt, now)}</time>
      </header>

      <img className="feed-post-img" src={post.url} alt={post.caption} loading="lazy" />

      <div className="feed-post-actions">
        <Link to={profile} className="ig-button">View profile</Link>
        {author.acceptingNewStudents && (
          <Link to={`/booking?instructor=${author.userId}`} className="ig-button ig-button-primary">Request a lesson</Link>
        )}
      </div>

      {post.caption && (
        <p className="feed-post-caption">
          <Link to={profile} className="feed-post-caption-name">{author.name}</Link> {post.caption}
        </p>
      )}
    </article>
  );
}
