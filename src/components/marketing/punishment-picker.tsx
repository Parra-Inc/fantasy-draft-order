"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { Check, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { PunishmentIdeaGroup } from "@/lib/punishments";
import { SuggestPunishmentButton } from "./suggest-punishment";

/**
 * The `+` selection layer over the ideas list.
 *
 * Selection is client state only. It leaves as `?ideas=<id>,<id>` on the way to
 * /punishment/new, which keeps this page free of any write path and means a
 * shortlist can be pasted to someone else and still work.
 */
export function PunishmentPicker({ groups }: { groups: PunishmentIdeaGroup[] }) {
  const [selected, setSelected] = useState<string[]>([]);

  const labelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of groups) {
      for (const idea of group.ideas) map.set(idea.id, idea.label);
    }
    return map;
  }, [groups]);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : // Cap matches the API's max options, so the tray can never build a
          // link the create endpoint would reject.
          current.length >= 24
          ? current
          : [...current, id],
    );
  }

  const href = `/punishment/new?src=PUNISHMENT_IDEAS&ideas=${selected.join(",")}`;

  return (
    <>
      <div className="flex flex-col gap-12">
        {groups.map((group) => (
          <section key={group.category} id={group.category.toLowerCase()}>
            <h2 className="font-display text-chalk text-2xl font-bold tracking-tight">
              {group.label}
            </h2>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {group.ideas.map((idea) => {
                const isSelected = selected.includes(idea.id);
                return (
                  <li key={idea.id}>
                    <button
                      type="button"
                      onClick={() => toggle(idea.id)}
                      aria-pressed={isSelected}
                      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? "border-signal/50 bg-signal/10"
                          : "border-sideline/50 bg-sideline/10 hover:border-signal/30"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md ring-1 ${
                          isSelected
                            ? "bg-signal text-midnight ring-signal"
                            : "text-hashmark ring-sideline"
                        }`}
                      >
                        {isSelected ? (
                          <Check className="size-3.5" />
                        ) : (
                          <Plus className="size-3.5" />
                        )}
                      </span>
                      <span
                        className={`text-sm ${isSelected ? "text-chalk font-medium" : "text-hashmark"}`}
                      >
                        {idea.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="border-sideline/50 mt-14 border-t pt-8">
        <h2 className="font-display text-chalk text-xl font-bold">
          Got a better one?
        </h2>
        <p className="text-hashmark mt-2 max-w-prose text-sm">
          Send it in. Every suggestion is read by a human before it shows up
          here, so nothing lands on this page automatically.
        </p>
        <div className="mt-4">
          <SuggestPunishmentButton />
        </div>
      </div>

      {/* Sticky tray. Only mounted once something is selected, so it never
          covers content on a page someone is just reading. */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6 sm:pb-6"
          >
            <div className="border-sideline bg-midnight/95 mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border p-3 shadow-2xl backdrop-blur-md sm:p-4">
              <button
                type="button"
                onClick={() => setSelected([])}
                aria-label="Clear selection"
                className="text-hashmark hover:text-chalk shrink-0 transition-colors"
              >
                <X className="size-4" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-chalk text-sm font-semibold">
                  {selected.length} selected
                </p>
                <p className="text-hashmark truncate text-xs">
                  {selected.map((id) => labelById.get(id)).join(" · ")}
                </p>
              </div>
              {selected.length < 2 ? (
                <span className="text-hashmark shrink-0 text-xs">
                  Pick one more
                </span>
              ) : (
                <Link
                  href={href}
                  className="bg-signal text-midnight hover:bg-signal-dark inline-flex h-10 shrink-0 items-center rounded-xl px-4 text-sm font-semibold transition-colors"
                >
                  Spin these
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
