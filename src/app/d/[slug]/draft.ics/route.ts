import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

// Reads the database, and the D1 binding only exists inside a request.
export const dynamic = "force-dynamic";

/**
 * The draw as a calendar invite.
 *
 * This is a distribution channel, not a convenience feature. A commissioner who
 * adds this and forwards it puts the draft URL into a dozen calendars, which is
 * the one inbox everybody actually reads, and it raises the number of people
 * present at the live draw, which is the entire input to every other loop on
 * the draft page.
 *
 * Hand-rolled rather than pulled from a library: RFC 5545 for a single VEVENT
 * is about forty lines, and the escaping and folding rules below are the whole
 * of it.
 */

/** RFC 5545 §3.3.5: UTC form, no punctuation. */
function icsDate(d: Date): string {
  return `${d.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

/**
 * RFC 5545 §3.3.11. Backslash first, or it double-escapes what follows.
 * Literal newlines become \n, since a raw newline would terminate the property.
 */
function icsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * RFC 5545 §3.1: content lines wrap at 75 octets, continuations begin with a
 * space. Measured in UTF-8 bytes, not characters, because league names contain
 * emoji far more often than you would hope, and splitting mid-sequence produces
 * an invite that Google Calendar silently refuses.
 */
function fold(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const chunks: string[] = [];
  let start = 0;
  // First line takes 75 octets, continuations 74 (the leading space costs one).
  let limit = 75;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Back off to a UTF-8 boundary: continuation bytes are 0b10xxxxxx.
    while (end > start && end < bytes.length && (bytes[end]! & 0xc0) === 0x80) {
      end--;
    }
    chunks.push(bytes.subarray(start, end).toString("utf8"));
    start = end;
    limit = 74;
  }
  return chunks.join("\r\n ");
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const draft = await prisma.draft.findUnique({
    where: { slug },
    select: {
      id: true,
      leagueName: true,
      creatorName: true,
      scheduledFor: true,
      createdAt: true,
      teams: { select: { id: true } },
      picks: {
        select: { revealedAt: true },
        orderBy: { revealedAt: "desc" },
        take: 1,
      },
    },
  });
  if (!draft) return new Response("Not found", { status: 404 });

  const base = env.NEXT_PUBLIC_BASE_URL;
  const url = `${base}/d/${slug}`;
  const start = draft.scheduledFor;
  // The event runs until the last pick lands. Floor it at five minutes so a
  // two-team draw is not a 19-second sliver nobody can see in a week view.
  const lastReveal = draft.picks[0]?.revealedAt ?? start;
  const end = new Date(
    Math.max(lastReveal.getTime(), start.getTime() + 5 * 60 * 1000),
  );

  const description = [
    `${draft.leagueName} draft order draw, scheduled by ${draft.creatorName}.`,
    "",
    `Watch it live: ${url}`,
    "",
    `${draft.teams.length} teams. The order is drawn server-side at the scheduled time from open-source code, with a recorded seed. Nobody can run it early, twice, or differently.`,
    "",
    `Run one for your own league: ${base}/new?src=calendar`,
  ].join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fantasy Football Draft Order//Draw//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    // Stable per draft, so re-downloading updates the entry instead of adding
    // a second one. Drafts are immutable, so this never needs a SEQUENCE bump.
    `UID:${draft.id}@fantasyfootballdraftorder.com`,
    `DTSTAMP:${icsDate(draft.createdAt)}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(`${draft.leagueName} draft order draw`)}`,
    `DESCRIPTION:${icsText(description)}`,
    `URL:${icsText(url)}`,
    "STATUS:CONFIRMED",
    "TRANSP:TRANSPARENT",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsText(`${draft.leagueName} draft order draw starts in 15 minutes`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const body = lines.map(fold).join("\r\n") + "\r\n";

  return new Response(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="draft-order-${slug}.ics"`,
      // The draw time is immutable, but the file is cheap and drafts are
      // deleted rarely enough that a short cache is not worth the staleness.
      "cache-control": "no-store",
    },
  });
}
