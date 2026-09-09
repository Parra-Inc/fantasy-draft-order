import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * The header/footer content width from `(marketing)/layout.tsx`
 * (`mx-auto max-w-6xl px-4 sm:px-6`), retyped on every page that needed the
 * same gutter instead of shared once.
 */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto max-w-6xl px-4 sm:px-6", className)} {...props} />;
}

/**
 * The small-caps section label (`text-signal font-mono text-xs font-medium
 * tracking-wider uppercase`) that opens nearly every section on the marketing
 * site and the draft header. `tone="muted"` is the hashmark variant used for
 * secondary labels (`AuditRow`'s `dt`, the sibling-draft timestamps).
 */
export function Eyebrow({
  tone = "signal",
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { tone?: "signal" | "muted" }) {
  return (
    <p
      className={cn(
        "font-mono text-xs font-medium tracking-wider uppercase",
        tone === "signal" ? "text-signal" : "text-hashmark",
        className,
      )}
      {...props}
    />
  );
}
