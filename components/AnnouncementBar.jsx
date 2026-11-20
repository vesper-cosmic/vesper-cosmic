import { announcements } from "@/data/homeContent";

/**
 * Scrolling announcement strip above the header. The list is repeated so the
 * loop is seamless; screen readers get it once. Stops when the visitor prefers
 * reduced motion, and pauses on hover.
 */
export default function AnnouncementBar() {
  if (!announcements.length) return null;
  const loop = [...announcements, ...announcements];

  return (
    <div className="announcement-bar overflow-hidden bg-[#121C30] text-[#E8ECEF]">
      <p className="sr-only">{announcements.join(". ")}</p>
      <div aria-hidden="true" className="announcement-track flex w-max">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {loop.map((text, i) => (
              <li
                key={`${copy}-${i}`}
                className="flex items-center whitespace-nowrap py-2 font-display text-[13px] tracking-[0.12em] sm:text-sm"
              >
                <span className="px-6 sm:px-10">{text}</span>
                <span className="text-[#BFA06A]">✦</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
