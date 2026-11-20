/**
 * Navy title band at the top of storefront pages (matches the homepage hero).
 * size="sm" is a slimmer band for task pages like checkout and sign-in.
 */
export default function PageHero({ eyebrow, title, subtitle, size = "md", children }) {
  const pad = size === "sm" ? "py-9 sm:py-11" : "py-14 sm:py-20";
  return (
    <header className={`relative overflow-hidden bg-[#1C2B48] px-4 text-center sm:px-6 lg:px-8 ${pad}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(142,177,209,0.22),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-3xl">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#BFA06A] sm:text-xs">{eyebrow}</p>
        ) : null}
        <h1
          className={`font-display font-medium leading-[1.05] text-white ${
            size === "sm" ? "mt-3 text-[34px] sm:text-5xl" : "mt-4 text-[40px] sm:text-6xl"
          }`}
        >
          {title}
        </h1>
        <span aria-hidden="true" className="mx-auto mt-5 block h-px w-14 bg-[#BFA06A]" />
        {subtitle ? (
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-[#C4D8E5] sm:text-base">{subtitle}</p>
        ) : null}
        {children}
      </div>
    </header>
  );
}
