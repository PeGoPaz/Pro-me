import { useEffect, useRef } from "react";

/*
 * What every full-screen viewer on the profile needs: Escape closes it, the
 * arrow keys step through it, the page behind does not scroll, and focus goes
 * into the viewer when it opens and back to whatever opened it when it closes,
 * so a keyboard user is not left at the top of the page.
 */
export function useViewer({ onClose, onPrevious, onNext }) {
  const dialog = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    dialog.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft" && onPrevious) onPrevious();
      else if (event.key === "ArrowRight" && onNext) onNext();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, onPrevious, onNext]);

  return dialog;
}
