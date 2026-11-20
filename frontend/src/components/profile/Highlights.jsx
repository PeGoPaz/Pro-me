import { useState } from "react";
import HighlightViewer from "./HighlightViewer";
import ProfileIcon from "./ProfileIcon";

/* The row of highlight circles under the profile header, and the viewer they open. */
export default function Highlights({ highlights, author }) {
  const [open, setOpen] = useState(null);
  if (!highlights.length) return null;

  return (
    <>
      <ul className="highlights" aria-label="Highlights">
        {highlights.map((highlight, index) => (
          <li key={highlight.id}>
            <button type="button" className="highlight" onClick={() => setOpen(index)}>
              <span className="highlight-ring">
                <ProfileIcon name={highlight.icon} size={26} />
              </span>
              {highlight.title}
            </button>
          </li>
        ))}
      </ul>
      {open !== null && (
        <HighlightViewer highlights={highlights} index={open} author={author} onIndex={setOpen} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
