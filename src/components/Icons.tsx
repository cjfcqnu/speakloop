type IconName =
  | "home"
  | "book"
  | "mic"
  | "calendar"
  | "settings"
  | "star"
  | "upload"
  | "play"
  | "pause"
  | "repeat"
  | "heart"
  | "alert"
  | "check"
  | "search"
  | "library"
  | "list"
  | "chart"
  | "trash"
  | "arrowRight"
  | "rotate";

const paths: Record<IconName, string> = {
  home: "M4 10.8 12 4l8 6.8V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z",
  book: "M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 0-4-4z M5 4v12",
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3",
  calendar: "M7 3v4 M17 3v4 M4 8h16 M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1z",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M4 12h2 M18 12h2 M12 4v2 M12 18v2 M6.3 6.3l1.4 1.4 M16.3 16.3l1.4 1.4 M17.7 6.3l-1.4 1.4 M7.7 16.3l-1.4 1.4",
  star: "m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  upload: "M12 4v11 M8 8l4-4 4 4 M5 16v3h14v-3",
  play: "M8 5v14l11-7z",
  pause: "M8 5h3v14H8z M14 5h3v14h-3z",
  repeat: "M17 2l4 4-4 4 M3 11V9a3 3 0 0 1 3-3h15 M7 22l-4-4 4-4 M21 13v2a3 3 0 0 1-3 3H3",
  heart: "M12 21s-7-4.4-9-9a5 5 0 0 1 8-5 5 5 0 0 1 8 5c-2 4.6-9 9-9 9z",
  alert: "M12 3 22 20H2z M12 9v5 M12 17h.01",
  check: "M4 12.5 9 17l11-11",
  search: "M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z M16 16l5 5",
  library: "M4 5h16v4H4z M4 11h16v8H4z M8 15h8",
  list: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
  chart: "M4 19V5 M4 19h16 M8 16v-4 M12 16V8 M16 16v-7 M20 16v-2",
  trash: "M4 7h16 M10 11v6 M14 11v6 M6 7l1 14h10l1-14 M9 7V4h6v3",
  arrowRight: "M5 12h14 M13 6l6 6-6 6",
  rotate: "M21 12a9 9 0 1 1-2.6-6.4 M21 4v6h-6",
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
