/**
 * Moves focus to a panel's heading (tabIndex -1) when it opens, so keyboard and
 * screen-reader users land in it, and scrolls it into view: on narrow screens
 * the side column sits below the calendar.
 */
export function focusPanel(heading: HTMLElement | null) {
  if (!heading) return;
  heading.focus({ preventScroll: true });
  heading
    .closest("section")
    ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
