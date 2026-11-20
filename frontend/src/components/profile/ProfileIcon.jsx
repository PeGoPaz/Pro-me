/*
 * The few line icons the profile uses, drawn in currentColor so they take
 * the colour of whatever they sit in.
 */
const PATHS = {
  shield: "M12 2l7 3v6c0 4.5-3 8.6-7 11-4-2.4-7-6.5-7-11V5l7-3z M9 12l2 2 4-4",
  pin: "M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z M12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  car: "M5 16h14v-4l-2-5H7l-2 5v4z M5 12h14 M7.5 19.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M16.5 19.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  euro: "M17 6.5A6.5 6.5 0 007 12a6.5 6.5 0 0010 5.5 M4 10h9 M4 14h9",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18z M12 7v5l3 2",
  grid: "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
  star: "M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3z",
  info: "M12 21a9 9 0 100-18 9 9 0 000 18z M12 11v6 M12 7.5h.01",
  close: "M6 6l12 12 M18 6L6 18",
  left: "M15 5l-7 7 7 7",
  right: "M9 5l7 7-7 7",
  home: "M4 10.5L12 4l8 6.5V20h-5v-6h-6v6H4z",
  search: "M11 18a7 7 0 100-14 7 7 0 000 14z M16 16l4 4",
  heart: "M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z",
  person: "M12 12a4 4 0 100-8 4 4 0 000 8z M4 20c0-4 3.6-7 8-7s8 3 8 7",
  list: "M8 6h12 M8 12h12 M8 18h12 M4 6h.01 M4 12h.01 M4 18h.01",
};

export default function ProfileIcon({ name, size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d={PATHS[name]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
