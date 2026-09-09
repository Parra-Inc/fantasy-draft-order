import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * The raised panel every section on the site sits inside: `rounded-2xl
 * border border-sideline/50 bg-sideline/20 p-6`, repeated across the new-draft
 * form, the punishment form, the draft header, and every callout box on the
 * marketing pages, with the padding wobbling between p-5 and p-7 each time it
 * was retyped. `padded` is the default; `flush` drops the padding for a card
 * that lays out its own rows (a list, a table).
 */
export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "padded" | "flush";
};

export function Card({ variant = "padded", className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-sideline/50 bg-sideline/20",
        variant === "padded" && "p-6 sm:p-7",
        variant === "flush" && "overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

/** The small-caps eyebrow title used above a card's body (see new-draft-form.tsx's local `Card`). */
export function CardTitle({
  eyebrow,
  actions,
  className,
}: {
  eyebrow: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-center justify-between gap-3", className)}>
      <h2 className="font-display text-sm font-bold tracking-wider text-signal uppercase">{eyebrow}</h2>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
