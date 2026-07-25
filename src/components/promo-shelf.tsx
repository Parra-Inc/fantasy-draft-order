import { Heart } from "lucide-react";
import { livePromos, promoHref } from "@/lib/promos";

type Props = {
  /**
   * Which placement this is. Only affects attribution, not layout: the shelf is
   * identical in both slots so it reads as a fixture of the page rather than
   * something that follows you around.
   */
  surface: "pre-draw" | "results";
};

/**
 * The "also built by me" shelf. Deliberately the quietest card on the page.
 *
 * Every visual choice here is subordination: muted `hashmark` label instead of
 * the `signal` green the trust panels use, `bg-midnight/40` cards that sit back
 * from the surface rather than lifting off it, and no motion at all. It has to
 * lose the fight for attention against the draw and the audit trail, because a
 * page whose whole claim is "this cannot be rigged" cannot afford to look like
 * it is selling something.
 *
 * Never render this during DRAWING. The staggered reveal is the product.
 */
export function PromoShelf({ surface }: Props) {
  if (livePromos.length === 0) return null;

  return (
    <section
      className="border-sideline/50 bg-sideline/10 rounded-2xl border p-5 sm:p-6"
      aria-labelledby={`promo-shelf-${surface}`}
    >
      <div className="mb-1 flex items-center gap-2">
        <Heart className="text-hashmark size-4" />
        <h3
          id={`promo-shelf-${surface}`}
          className="font-display text-hashmark text-sm font-bold tracking-wider uppercase"
        >
          Also built by me
        </h3>
      </div>
      <p className="text-hashmark mb-4 text-xs">
        This site is free and always will be. Nothing below is a paid placement,
        they are just my other apps.
      </p>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {livePromos.map((promo) => (
          <li key={promo.key}>
            <a
              href={promoHref(promo, surface)}
              target="_blank"
              rel="noreferrer"
              className="group border-sideline/60 bg-midnight/40 hover:border-signal/40 hover:bg-midnight/70 flex h-full gap-3 rounded-xl border p-3.5 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={promo.icon}
                alt=""
                width={40}
                height={40}
                loading="lazy"
                className="ring-sideline size-10 shrink-0 rounded-[10px] ring-1"
              />
              <div className="flex min-w-0 flex-col">
                <p className="text-chalk group-hover:text-signal text-sm font-semibold transition-colors">
                  {promo.name}
                </p>
                <p className="text-hashmark mt-1 text-xs leading-relaxed">
                  {promo.tagline}
                </p>
                {/* mt-auto pins the CTA to the card floor, so a tagline that
                    wraps to three lines does not leave one card's link sitting
                    below its neighbours' in the 3-up grid. */}
                <p className="text-signal/70 group-hover:text-signal mt-auto pt-2 text-[11px] font-medium transition-colors">
                  {promo.destination === "app-store"
                    ? "Free on the App Store"
                    : "diyproject.ai"}
                </p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
