import { useCallback, useState } from "react";
import { hasSeen, markSeen } from "../../utils/seenStories";
import Avatar from "./Avatar";
import StoryPlayer from "./StoryPlayer";

/*
 * The row of instructors who posted this week, at the top of the home page.
 * An amber ring means there is something this browser has not watched yet;
 * watched ones go grey and move to the end, as on any phone.
 */
export default function StoriesRow({ stories, now }) {
  const [open, setOpen] = useState(null);
  const [, setSeenVersion] = useState(0);

  const onSeen = useCallback((instructorId, postedAt) => {
    markSeen(instructorId, postedAt);
    setSeenVersion((version) => version + 1);
  }, []);

  if (!stories.length) return null;

  const newest = (story) => story.posts[story.posts.length - 1].postedAt;
  const ordered = [...stories].sort((a, b) => Number(hasSeen(a.author.id, newest(a))) - Number(hasSeen(b.author.id, newest(b))));

  return (
    <>
      <ul className="stories" aria-label="Stories from this week">
        {ordered.map((story, index) => {
          const seen = hasSeen(story.author.id, newest(story));
          return (
            <li key={story.author.id}>
              <button type="button" className={`story-bubble ${seen ? "is-seen" : ""}`} onClick={() => setOpen({ list: ordered, index })}>
                <span className="story-bubble-ring">
                  <Avatar author={story.author} size={62} />
                </span>
                <span className="story-bubble-name">{story.author.name.split(" ")[0]}</span>
                <span className="sr-only">{seen ? ", seen" : ", new"}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {open && (
        <StoryPlayer stories={open.list} start={open.index} onSeen={onSeen} onClose={() => setOpen(null)} now={now} />
      )}
    </>
  );
}
