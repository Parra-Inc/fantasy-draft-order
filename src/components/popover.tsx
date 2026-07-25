"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * A small popover: a button that toggles a panel anchored beneath it.
 *
 * Hand-rolled rather than pulled from a headless library because this app ships
 * no Radix and the requirement is narrow: one trigger, one panel, dismiss on
 * outside click or Escape, focus back on the trigger afterwards. The panel is
 * rendered inline (no portal), so nothing here has to reason about z-index
 * stacking beyond the one ancestor it sits in.
 *
 * `children` is a render prop taking `close` so an action inside the panel can
 * dismiss it without the panel having to own the open state.
 */
export function Popover({
  label,
  trigger,
  triggerClassName,
  align = "start",
  className,
  children,
}: {
  /** Accessible name for the panel, e.g. "Share options". */
  label: string;
  trigger: ReactNode;
  triggerClassName?: string;
  align?: "start" | "end";
  className?: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // Deliberately ref-free: it is handed to `children` during render, and a
  // callback that touched triggerRef there would be reading a ref from render.
  // Focus restoration lives in the Escape handler below instead, which is the
  // path that actually matters: a pointer user who taps an action has already
  // told the browser where they are looking.
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;

    // pointerdown, not click: a click listener fires after the target has
    // already moved or unmounted, which makes "did this land inside?" unreliable
    // for anything that re-renders on press.
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        className={triggerClassName}
      >
        {trigger}
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={label}
          className={[
            "border-sideline bg-midnight absolute top-full z-30 mt-2 rounded-2xl border p-3 shadow-2xl shadow-black/50",
            // Never wider than the viewport on a phone, where this trigger is
            // a full-width button inside a padded card.
            "w-[min(20rem,calc(100vw-3rem))]",
            align === "end" ? "right-0" : "left-0",
            className ?? "",
          ].join(" ")}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}
