import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProfileIcon from "../profile/ProfileIcon";
import { useViewer } from "../profile/useViewer";
import { timeAgo } from "../../utils/timeAgo";
import Avatar from "./Avatar";

/*
 * Stories: each instructor's posts from this week, played oldest first, then
 * on to the next instructor, the way stories are watched. A tap on the right
 * half or the right arrow goes on, the left goes back. Like the highlights on
 * a profile they do not move on by a timer: the caption is there to be read.
 */
export default function StoryPlayer({ stories, start, onSeen, onClose, now }) {
  const [place, setPlace] = useState({ story: start, post: 0 });
  const story = stories[place.story];
  const post = story.posts[place.post];

  /* Each post shown counts as seen, so the ring turns grey once all are. */
  useEffect(() => {
    onSeen(story.author.id, post.postedAt);
  }, [story, post, onSeen]);

  const next = () => {
    if (place.post < story.posts.length - 1) setPlace({ story: place.story, post: place.post + 1 });
    else if (place.story < stories.length - 1) setPlace({ story: place.story + 1, post: 0 });
    else onClose();
  };
  const atStart = place.story === 0 && place.post === 0;
  const previous = atStart
    ? null
    : () => setPlace(place.post > 0 ? { story: place.story, post: place.post - 1 } : { story: place.story - 1, post: 0 });

  const dialog = useViewer({ onClose, onPrevious: previous, onNext: next });

  return (
    <div className="viewer" onClick={onClose} role="presentation">
      <section
        ref={dialog}
        className="story story-photo"
        role="dialog"
        aria-modal="true"
        aria-label={`${story.author.name}'s story, ${place.post + 1} of ${story.posts.length}`}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <img className="story-photo-img" src={post.url} alt={post.caption} />

        <div className="story-progress" aria-hidden="true">
          {story.posts.map((item, i) => (
            <span key={item.id} className={i <= place.post ? "is-seen" : ""} />
          ))}
        </div>
        <header className="story-head">
          <Link to={`/instructors/${story.author.id}`} className="story-author story-author-link">
            <Avatar author={story.author} size={30} />
            {story.author.name}
          </Link>
          <span className="story-time">{timeAgo(post.postedAt, now)}</span>
        </header>

        <footer className="story-foot">
          {post.caption && <p className="story-caption">{post.caption}</p>}
          {story.author.acceptingNewStudents && (
            <Link to={`/booking?instructor=${story.author.userId}`} className="ig-button ig-button-primary">
              Request a lesson
            </Link>
          )}
        </footer>

        <button type="button" className="story-tap story-tap-previous" onClick={previous ?? undefined} disabled={!previous} aria-label="Previous" />
        <button type="button" className="story-tap story-tap-next" onClick={next} aria-label="Next" />
      </section>

      <button type="button" className="viewer-close" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close">
        <ProfileIcon name="close" size={26} />
      </button>
    </div>
  );
}
