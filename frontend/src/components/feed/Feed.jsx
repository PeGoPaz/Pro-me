import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api/index.js";
import FeedPost from "./FeedPost";
import StoriesRow from "./StoriesRow";

/*
 * The home feed: stories at the top, then every listed instructor's posts,
 * newest first. More load as the end comes into view, and there is a button
 * for the same, for browsers and readers that do not scroll it into view.
 */
export default function Feed() {
  const [stories, setStories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [next, setNext] = useState(null);
  const [state, setState] = useState("loading");
  const end = useRef(null);
  /* One "now" for the whole page, so times do not shift as more posts load. */
  const [now] = useState(() => new Date());

  const fetchPage = useCallback((cursor) =>
    api.get("/instructors/feed", { params: cursor ? { cursor } : {} })
      .then((res) => {
        setPosts((current) => (cursor ? [...current, ...res.data.posts] : res.data.posts));
        setNext(res.data.next);
        setState("ready");
      })
      .catch(() => setState("error")), []);

  useEffect(() => {
    fetchPage(null);
    api.get("/instructors/stories").then((res) => setStories(res.data.stories ?? [])).catch(() => {});
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    setState("loading");
    fetchPage(next);
  }, [fetchPage, next]);

  /* Load the next page when the end of the list comes into view. */
  useEffect(() => {
    if (!next || state !== "ready" || !end.current || !("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMore();
    }, { rootMargin: "400px" });
    observer.observe(end.current);
    return () => observer.disconnect();
  }, [next, state, loadMore]);

  return (
    <section className="feed" aria-label="Posts from instructors">
      <StoriesRow stories={stories} now={now} />

      {posts.map((post) => <FeedPost key={post.id} post={post} now={now} />)}

      {state === "ready" && posts.length === 0 && (
        <p className="ig-empty">No posts yet. Instructors' photos will show up here.</p>
      )}
      {state === "error" && <p className="ig-empty" role="alert">The feed could not be loaded. Try again in a moment.</p>}

      <div ref={end} className="feed-end">
        {next && (
          <button type="button" className="ig-button" onClick={loadMore} disabled={state === "loading"}>
            {state === "loading" ? "Loading…" : "Show older posts"}
          </button>
        )}
        {!next && posts.length > 0 && <p className="feed-end-note">You're all caught up.</p>}
      </div>
    </section>
  );
}
