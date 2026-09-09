import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "live" | "complete" | "warning" | "destructive";

/*
 * The status pill from the live draft header (`StatusPill` /
 * `SiblingStatusPill` in d/[slug]/draft-live.tsx), pulled out so the same
 * three draft states read the same way everywhere they show up: on the draft
 * itself, in the sibling-drafts list, and anywhere a future screen needs one.
 * Signal green means "drawing or done", never a plain status change, so it
 * always carries a word or an icon and never travels on color alone.
 */
const tones: Record<BadgeTone, string> = {
  neutral: "border-sideline bg-sideline/40 text-hashmark",
  live: "border-signal/30 bg-signal/10 text-signal",
  complete: "border-signal/30 bg-signal/10 text-signal",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  destructive: "border-blitz/30 bg-blitz/10 text-blitz",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  icon?: ReactNode;
};

export function Badge({ tone = "neutral", icon, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
