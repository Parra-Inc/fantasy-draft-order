import type { HTMLAttributes, ReactNode } from "react";
import { AlertTriangle, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type BannerTone = "warning" | "trust" | "info";

/*
 * The full-width callout box: the "read this before you trust the result"
 * warning above the draft order (`PreShareWarning` in draft-live.tsx) and the
 * info/trust callouts inside guide bodies (guide-renderer.tsx's `callout`
 * section), pulled into one component so a third instance does not reinvent
 * the amber-vs-signal choice again. `warning` is amber and used exactly once
 * a viewer needs to slow down before trusting something; `trust` is signal
 * green, reserved for the open-source/fairness claims; `info` is neutral.
 */
const tones: Record<BannerTone, { classes: string; icon: ReactNode; iconClass: string }> = {
  warning: {
    classes: "border-amber-400/30 bg-amber-400/5",
    icon: <AlertTriangle aria-hidden className="size-5 shrink-0" />,
    iconClass: "text-amber-300",
  },
  trust: {
    classes: "border-signal/30 bg-signal/5",
    icon: <ShieldCheck aria-hidden className="size-5 shrink-0" />,
    iconClass: "text-signal",
  },
  info: {
    classes: "border-sideline/60 bg-sideline/30",
    icon: <Info aria-hidden className="size-5 shrink-0" />,
    iconClass: "text-hashmark",
  },
};

export function Banner({
  tone = "info",
  title,
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: BannerTone; title?: ReactNode }) {
  const t = tones[tone];
  return (
    <div className={cn("rounded-2xl border p-5 sm:p-6", t.classes, className)} {...props}>
      <div className="flex gap-3">
        <span className={t.iconClass}>{t.icon}</span>
        <div className="text-hashmark space-y-2 text-sm">
          {title ? (
            <p className={cn("font-display text-sm font-bold tracking-wider uppercase", t.iconClass)}>{title}</p>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
