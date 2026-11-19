import {
  PUNISHMENT_CATEGORIES,
  PUNISHMENT_CATEGORY_LABELS,
  toPunishmentCategory,
  type PunishmentCategory,
} from "@/lib/db-enums";
import { prisma } from "@/lib/prisma";

/**
 * Reading the punishment ideas database.
 *
 * Every idea lives in D1, including the ~40 curated ones the initial migration
 * inserts pre-approved, so there is exactly one list and one code path whether
 * an entry was written by me or submitted by a stranger. The cost of that
 * choice is that /fantasy-football-punishments has to be force-dynamic.
 *
 * Only APPROVED rows are ever returned. Submissions land as PENDING and are
 * promoted by hand in SQL (see CLAUDE.md) — there is no admin route, because
 * adding one would give this app its first secret.
 */

export type PunishmentIdeaView = {
  id: string;
  label: string;
  category: PunishmentCategory;
};

export type PunishmentIdeaGroup = {
  category: PunishmentCategory;
  label: string;
  ideas: PunishmentIdeaView[];
};

/** Copy for each section of the ideas page. */
export const CATEGORY_BLURBS: Record<PunishmentCategory, string> = {
  FOOD: "Cheap, immediate, and easy to film. The safest place to start if your league has never done this before.",
  WARDROBE:
    "One bad outfit, worn in public, for a fixed period. Low effort to enforce and it photographs well.",
  PUBLIC:
    "The classics. These are the ones that end up on the league group chat for years.",
  ENDURANCE:
    "Time and discomfort rather than embarrassment. Popular with leagues where everyone is competitive about everything.",
  DIGITAL:
    "The league takes over some corner of the loser's online life for a set period. Nothing permanent, all visible.",
  CHARITY:
    "Turn last place into something useful. The one category nobody argues about at the vote.",
  PERMANENT:
    "Real stakes. Agree these at the start of the season, in writing, before anyone knows who will need them.",
};

/**
 * Approved ideas, grouped in PUNISHMENT_CATEGORIES order.
 *
 * Categories with no approved ideas are dropped rather than rendered empty, so
 * rejecting the last entry in a category tidies the page instead of leaving a
 * heading over nothing.
 */
export async function listApprovedIdeas(): Promise<PunishmentIdeaGroup[]> {
  const rows = await prisma.punishmentIdea.findMany({
    where: { status: "APPROVED" },
    select: { id: true, label: true, category: true },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });

  const byCategory = new Map<PunishmentCategory, PunishmentIdeaView[]>();
  for (const row of rows) {
    const category = toPunishmentCategory(row.category);
    // An unknown category means a hand-written row with a typo. Skip it rather
    // than inventing a section for it.
    if (!category) continue;
    const list = byCategory.get(category) ?? [];
    list.push({ id: row.id, label: row.label, category });
    byCategory.set(category, list);
  }

  return PUNISHMENT_CATEGORIES.flatMap((category) => {
    const ideas = byCategory.get(category);
    if (!ideas?.length) return [];
    return [
      { category, label: PUNISHMENT_CATEGORY_LABELS[category], ideas },
    ];
  });
}

/**
 * Resolve `?ideas=id,id,id` into labels for the create form.
 *
 * Unknown ids are skipped rather than treated as an error: a shortlist link can
 * outlive the idea it points at (rejected after the fact, or simply mistyped),
 * and a 500 on a create page is a far worse outcome than a slightly shorter
 * list the commissioner can top up by hand.
 *
 * Returns labels in the order the ids were given, so the URL controls the
 * order the options appear in the form.
 */
export async function resolveIdeaLabels(
  idsParam: string | undefined,
): Promise<string[]> {
  if (!idsParam) return [];
  const ids = [
    ...new Set(
      idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 24),
    ),
  ];
  if (!ids.length) return [];

  const rows = await prisma.punishmentIdea.findMany({
    where: { id: { in: ids }, status: "APPROVED" },
    select: { id: true, label: true },
  });
  const labelById = new Map(rows.map((r) => [r.id, r.label]));
  return ids.map((id) => labelById.get(id)).filter((l): l is string => !!l);
}

/**
 * Tag vocabulary for the punishments database table.
 *
 * Stored on PunishmentIdea.tags as a comma-separated list of these slugs.
 * Unknown slugs are dropped on read, so a typo in a hand-written row hides a
 * tag rather than inventing a filter chip for it. Order here is the order the
 * filter chips render in.
 */
export const PUNISHMENT_TAGS = {
  free: "Free",
  cheap: "Cheap",
  "costs-money": "Costs money",
  "one-day": "One day",
  "multi-day": "Multi-day",
  "season-long": "Season-long",
  permanent: "Permanent",
  "remote-friendly": "Remote-friendly",
  "in-person": "In person",
  online: "Online",
  outdoors: "Outdoors",
  physical: "Physical",
  food: "Food",
  wearable: "Wearable",
  creative: "Creative",
  embarrassing: "Embarrassing",
  "family-friendly": "Family-friendly",
  "commissioner-duty": "League chores",
  "photo-proof": "Photo proof",
  "video-proof": "Video proof",
  classic: "Classic",
} as const;

export type PunishmentTag = keyof typeof PUNISHMENT_TAGS;

export function parseTags(raw: string | null | undefined): PunishmentTag[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter((t): t is PunishmentTag => t in PUNISHMENT_TAGS);
}

export type PunishmentRow = PunishmentIdeaView & { tags: PunishmentTag[] };

/** Every approved idea with its tags, for the searchable database table. */
export async function listApprovedRows(): Promise<PunishmentRow[]> {
  const rows = await prisma.punishmentIdea.findMany({
    where: { status: "APPROVED" },
    select: { id: true, label: true, category: true, tags: true },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });
  const order = new Map(PUNISHMENT_CATEGORIES.map((c, i) => [c, i]));
  return rows
    .flatMap((row) => {
      const category = toPunishmentCategory(row.category);
      if (!category) return [];
      return [{ id: row.id, label: row.label, category, tags: parseTags(row.tags) }];
    })
    .sort((a, b) => order.get(a.category)! - order.get(b.category)!);
}
