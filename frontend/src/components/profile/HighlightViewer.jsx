import ProfileIcon from "./ProfileIcon";
import { useViewer } from "./useViewer";

/*
 * A highlight opened like a story: a tall card with a bar per highlight at
 * the top, stepped through with the arrows, a tap on either half, or the
 * keyboard. Unlike stories it does not move on by itself - there is text to
 * read, and moving it on a timer would take that out of the reader's hands.
 */
export default function HighlightViewer({ highlights, index, author, onIndex, onClose }) {
  const highlight = highlights[index];
  const previous = index > 0 ? () => onIndex(index - 1) : null;
  const next = index < highlights.length - 1 ? () => onIndex(index + 1) : onClose;
  const dialog = useViewer({ onClose, onPrevious: previous, onNext: next });

  return (
    <div className="viewer" onClick={onClose} role="presentation">
      <section
        ref={dialog}
        className="story"
        role="dialog"
        aria-modal="true"
        aria-label={`${highlight.title}, ${index + 1} of ${highlights.length}`}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="story-progress" aria-hidden="true">
          {highlights.map((item, i) => (
            <span key={item.id} className={i <= index ? "is-seen" : ""} />
          ))}
        </div>
        <header className="story-head">
          <span className="story-author">{author.name}</span>
          <span className="story-title">
            <ProfileIcon name={highlight.icon} size={18} />
            {highlight.title}
          </span>
        </header>

        <div className="story-body">
          {highlight.sections.map((section) => (
            <div key={section.heading} className="story-section">
              <h3>{section.heading}</h3>
              <ul>
                {section.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
          {highlight.note && <p className="story-note">{highlight.note}</p>}
        </div>

        {/* Tapping the left or right half steps back or on, as on a phone. */}
        <button type="button" className="story-tap story-tap-previous" onClick={previous ?? undefined} disabled={!previous} aria-label="Previous highlight" />
        <button type="button" className="story-tap story-tap-next" onClick={next} aria-label={index < highlights.length - 1 ? "Next highlight" : "Close"} />
      </section>

      <button type="button" className="viewer-close" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close">
        <ProfileIcon name="close" size={26} />
      </button>
    </div>
  );
}
