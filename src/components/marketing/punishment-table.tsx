"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { Check, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  PUNISHMENT_CATEGORIES,
  PUNISHMENT_CATEGORY_LABELS,
  type PunishmentCategory,
} from "@/lib/db-enums";
import {
  PUNISHMENT_TAGS,
  type PunishmentRow,
  type PunishmentTag,
} from "@/lib/punishments";

const MAX_SELECTED = 24;

/**
 * The searchable punishments database.
 *
 * Everything is client-side: the full list is small (a few hundred rows at
 * most) and is already in the server-rendered HTML for crawlers, so filtering
 * in the browser costs nothing and keeps the page free of a query endpoint.
 *
 * Tag filters are AND (each chip narrows the list), categories are a single
 * choice. Initial filters come from `?tag=` and `?category=` so a filtered view
 * can be linked to from guides.
 */
export function PunishmentTable({
  rows,
  initialTags = [],
  initialCategory = null,
}: {
  rows: PunishmentRow[];
  initialTags?: PunishmentTag[];
  initialCategory?: PunishmentCategory | null;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PunishmentCategory | null>(
    initialCategory,
  );
  const [tags, setTags] = useState<PunishmentTag[]>(initialTags);
  const [selected, setSelected] = useState<string[]>([]);

  const tagCounts = useMemo(() => {
    const counts = new Map<PunishmentTag, number>();
    for (const row of rows)
      for (const t of row.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return counts;
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (row) =>
        (!category || row.category === category) &&
        tags.every((t) => row.tags.includes(t)) &&
        (!q ||
          row.label.toLowerCase().includes(q) ||
          row.tags.some((t) => PUNISHMENT_TAGS[t].toLowerCase().includes(q))),
    );
  }, [rows, query, category, tags]);

  const labelById = useMemo(
    () => new Map(rows.map((r) => [r.id, r.label])),
    [rows],
  );

  function toggleTag(tag: PunishmentTag) {
    setTags((cur) =>
      cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag],
    );
  }

  function toggleRow(id: string) {
    setSelected((cur) =>
      cur.includes(id)
        ? cur.filter((x) => x !== id)
        : cur.length >= MAX_SELECTED
          ? cur
          : [...cur, id],
    );
  }

  const filtersActive = !!query || !!category || tags.length > 0;
  const href = `/punishment/new?src=PUNISHMENT_IDEAS&ideas=${selected.join(",")}`;

  return (
    <>
      <div className="flex flex-col gap-4">
        <label className="border-sideline/60 bg-sideline/10 focus-within:border-signal/50 flex h-12 items-center gap-3 rounded-xl border px-4 transition-colors">
          <Search className="text-hashmark size-4 shrink-0" aria-hidden />
          <span className="sr-only">Search punishments</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search punishments, e.g. wings, jersey, tattoo"
            className="text-chalk placeholder:text-hashmark/70 h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>

        <div
          role="group"
          aria-label="Filter by category"
          className="flex flex-wrap gap-2"
        >
          <Chip active={!category} onClick={() => setCategory(null)}>
            All categories
          </Chip>
          {PUNISHMENT_CATEGORIES.map((c) => (
            <Chip
              key={c}
              active={category === c}
              onClick={() => setCategory(category === c ? null : c)}
            >
              {PUNISHMENT_CATEGORY_LABELS[c]}
            </Chip>
          ))}
        </div>

        <div
          role="group"
          aria-label="Filter by tag"
          className="flex flex-wrap gap-1.5"
        >
          {(Object.keys(PUNISHMENT_TAGS) as PunishmentTag[])
            .filter((t) => tagCounts.has(t))
            .map((t) => (
              <Chip
                key={t}
                small
                active={tags.includes(t)}
                onClick={() => toggleTag(t)}
              >
                #{PUNISHMENT_TAGS[t]}
                <span className="ml-1 opacity-60">{tagCounts.get(t)}</span>
              </Chip>
            ))}
        </div>

        <div className="text-hashmark flex items-center justify-between text-xs">
          <p aria-live="polite">
            Showing {visible.length} of {rows.length}
          </p>
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory(null);
                setTags([]);
              }}
              className="hover:text-chalk underline-offset-2 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="border-sideline/50 mt-4 overflow-hidden rounded-2xl border">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-sideline/20 text-hashmark text-xs tracking-wide uppercase">
            <tr>
              <th scope="col" className="w-12 px-3 py-3">
                <span className="sr-only">Select</span>
              </th>
              <th scope="col" className="px-3 py-3">
                Punishment
              </th>
              <th scope="col" className="hidden w-40 px-3 py-3 sm:table-cell">
                Category
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const isSelected = selected.includes(row.id);
              return (
                <tr
                  key={row.id}
                  className={`border-sideline/40 border-t align-top transition-colors ${
                    isSelected ? "bg-signal/10" : "hover:bg-sideline/10"
                  }`}
                >
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => toggleRow(row.id)}
                      aria-pressed={isSelected}
                      aria-label={`${isSelected ? "Remove" : "Add"} ${row.label}`}
                      className={`flex size-6 items-center justify-center rounded-md ring-1 transition-colors ${
                        isSelected
                          ? "bg-signal text-midnight ring-signal"
                          : "text-hashmark ring-sideline hover:ring-signal/50"
                      }`}
                    >
                      {isSelected ? (
                        <Check className="size-3.5" />
                      ) : (
                        <Plus className="size-3.5" />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <p
                      className={
                        isSelected ? "text-chalk font-medium" : "text-chalk/90"
                      }
                    >
                      {row.label}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <span className="text-signal text-[11px] sm:hidden">
                        {PUNISHMENT_CATEGORY_LABELS[row.category]}
                      </span>
                      {row.tags.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTag(t)}
                          className={`rounded px-1.5 text-[11px] transition-colors ${
                            tags.includes(t)
                              ? "bg-signal/20 text-signal"
                              : "text-hashmark hover:text-chalk"
                          }`}
                        >
                          #{PUNISHMENT_TAGS[t]}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="text-hashmark hidden px-3 py-3 sm:table-cell">
                    <button
                      type="button"
                      onClick={() => setCategory(row.category)}
                      className="hover:text-chalk text-left"
                    >
                      {PUNISHMENT_CATEGORY_LABELS[row.category]}
                    </button>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={3} className="text-hashmark px-4 py-10 text-center">
                  Nothing matches those filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
                  {selected.length >= MAX_SELECTED && " (max)"}
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

function Chip({
  active,
  onClick,
  small,
  children,
}: {
  active: boolean;
  onClick: () => void;
  small?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center rounded-full border font-medium transition-colors ${
        small ? "h-7 px-2.5 text-xs" : "h-8 px-3.5 text-sm"
      } ${
        active
          ? "border-signal bg-signal text-midnight"
          : "border-sideline/60 text-hashmark hover:border-signal/40 hover:text-chalk"
      }`}
    >
      {children}
    </button>
  );
}
