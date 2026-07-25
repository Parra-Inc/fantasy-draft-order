/**
 * Values for the columns that were Postgres enums before the move to D1.
 *
 * SQLite has no enum type, so Prisma types these columns as plain `String`.
 * These tuples are the single source of truth: the Zod schemas at the API
 * boundary are built from them, so validation and the TS types cannot drift
 * from each other the way two hand-written lists would.
 */

export const IMPORT_SOURCES = [
  "SLEEPER",
  "MFL",
  "FLEAFLICKER",
  "ESPN",
  "MANUAL",
] as const;

export type ImportSource = (typeof IMPORT_SOURCES)[number];

/** Import sources a user can actually pick: MANUAL is the absence of an import. */
export const IMPORTABLE_SOURCES = [
  "SLEEPER",
  "MFL",
  "FLEAFLICKER",
  "ESPN",
] as const;

export type ImportableSource = (typeof IMPORTABLE_SOURCES)[number];

/**
 * Narrow a raw column value to the union.
 *
 * The column is a plain String on SQLite, so nothing at the database level
 * stops an unexpected value from being read back. Everything is written
 * through Zod-validated routes, so this should never actually reject, but
 * returning null on a surprise beats rendering raw column data in the UI.
 */
export function toImportSource(value: string | null): ImportSource | null {
  return (IMPORT_SOURCES as readonly string[]).includes(value ?? "")
    ? (value as ImportSource)
    : null;
}

export const FEEDBACK_TYPES = ["BUG", "FEATURE", "PRAISE", "OTHER"] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

/**
 * The surface a draft's creator arrived from, recorded on Draft.entrySource.
 *
 * Every value except DIRECT corresponds to one link in the app, and each of
 * those links hard-codes its own `?src=`. Adding a new place that points at
 * /new means adding a value here, otherwise the param is dropped and the draft
 * records DIRECT — a silent measurement hole rather than a broken page, which
 * is the right failure mode on a create path but is easy to miss.
 */
export const ENTRY_SOURCES = [
  /** No ?src= at all: organic, SEO, or a link somebody typed. */
  "DIRECT",
  /** The persistent header button on a draft page. */
  "DRAFT_HEADER",
  /** The call to action shown once the last pick lands. */
  "AFTER_DRAW",
  /** Same call to action, but the "re-run for this league" branch. */
  "AFTER_DRAW_RERUN",
  /** The calendar invite body (/d/<slug>/draft.ics). */
  "CALENDAR",
  /** /ask-your-commissioner, i.e. a viewer who is not the commissioner. */
  "SKEPTIC",
  /** The punishment ideas database, via the "spin these" tray. */
  "PUNISHMENT_IDEAS",
  /** The call to action on a finished punishment wheel. */
  "PUNISHMENT_RESULT",
] as const;

export type EntrySource = (typeof ENTRY_SOURCES)[number];

/**
 * Narrow a raw ?src= value (or column read) to the union, falling back to
 * DIRECT. Case-insensitive because these travel in URLs people copy by hand.
 */
export function toEntrySource(value: string | null | undefined): EntrySource {
  const upper = (value ?? "").toUpperCase();
  return (ENTRY_SOURCES as readonly string[]).includes(upper)
    ? (upper as EntrySource)
    : "DIRECT";
}

/**
 * Moderation state of a PunishmentIdea. Anyone can submit; only APPROVED rows
 * are ever rendered. There is no admin route — approval is manual SQL, see the
 * punishment-ideas section of CLAUDE.md.
 */
export const PUNISHMENT_IDEA_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;

export type PunishmentIdeaStatus = (typeof PUNISHMENT_IDEA_STATUSES)[number];

/**
 * How punishment ideas are grouped on /fantasy-football-punishments.
 *
 * Order matters: this is the render order of the sections on that page, run
 * roughly cheap-and-silly first to genuinely-grim last.
 */
export const PUNISHMENT_CATEGORIES = [
  "FOOD",
  "WARDROBE",
  "PUBLIC",
  "ENDURANCE",
  "DIGITAL",
  "CHARITY",
  "PERMANENT",
] as const;

export type PunishmentCategory = (typeof PUNISHMENT_CATEGORIES)[number];

export const PUNISHMENT_CATEGORY_LABELS: Record<PunishmentCategory, string> = {
  FOOD: "Food and drink",
  WARDROBE: "Wardrobe",
  PUBLIC: "Public humiliation",
  ENDURANCE: "Endurance",
  DIGITAL: "Online and social",
  CHARITY: "Charitable",
  PERMANENT: "Permanent",
};

/** Narrow a raw column read to the union, or null if it is not a known value. */
export function toPunishmentCategory(
  value: string | null,
): PunishmentCategory | null {
  return (PUNISHMENT_CATEGORIES as readonly string[]).includes(value ?? "")
    ? (value as PunishmentCategory)
    : null;
}
