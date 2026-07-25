import { ImageResponse } from "next/og";
import { env } from "@/lib/env";
import { loadLogoDataUri } from "@/lib/og-logo";
import { prisma } from "@/lib/prisma";
import { deriveStatus } from "@/lib/reveal";

// Reads the database, so it cannot be prerendered (see src/lib/prisma.ts).
export const dynamic = "force-dynamic";

/**
 * The shareable result card.
 *
 * Distinct from opengraph-image.tsx, which exists to make a pasted link unfurl
 * nicely. This one is the thing people save and post on purpose: portrait by
 * default, because it is going into a group chat or a story, not a link
 * preview. It is a route handler rather than a second metadata image because
 * metadata images get no access to the query string, and every interesting
 * variant here is a query param.
 *
 *   /d/<slug>/card                    the whole order, portrait
 *   /d/<slug>/card?t=<teamId>         one team's pick, portrait (flex or cope)
 *   /d/<slug>/card?format=wide        1200x630, for anywhere that wants landscape
 *   /d/<slug>/card?tz=America/Denver  render the draw time in that zone
 *
 * The card has to work as a standalone artifact: someone screenshots it out of
 * a group chat with no link attached, so it carries the product name at the
 * top, the draft's own URL and draw time in the card footer, and the bare
 * domain along the bottom. Nothing about it depends on the surrounding message.
 *
 * An unknown or unrevealed team falls back to the full-order card rather than
 * erroring: these URLs get shared, edited, and reopened weeks later.
 */

const FORMATS = {
  story: { width: 1080, height: 1350 },
  wide: { width: 1200, height: 630 },
} as const;

const CHALK = "#F5F5F0";
const SIGNAL = "#00E676";
const SLATE = "#94A3B8";
const HASHMARK = "#64748B";
const SIDELINE = "#1E293B";
const MONO = "DM Mono, monospace";

const BG =
  "radial-gradient(circle at 50% 0%, rgba(0, 230, 118, 0.18), transparent 60%), #0A1628";

/**
 * Shrink a headline until it fits one line, rather than letting it ellipsis.
 *
 * League names run to 120 characters and the good ones are long. Satori has no
 * text measurement to hand out here, so this approximates: ~0.52em per
 * character is close enough for a sans-serif at these sizes, and the caller
 * still sets an explicit maxWidth so a pathological name clips instead of
 * escaping the card.
 */
function fitFontSize(text: string, maxWidth: number, maxSize: number): number {
  if (!text.length) return maxSize;
  return Math.max(
    Math.round(maxSize * 0.55),
    Math.min(maxSize, Math.floor(maxWidth / (text.length * 0.52))),
  );
}

function ordinalSuffix(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/**
 * The draw time, in the sharer's zone when they told us what it is.
 *
 * The worker has no locale and no clock of its own, so without `?tz=` this
 * renders UTC, which is correct but is not what the league agreed to meet at.
 * share.tsx appends the browser's zone after mount, which covers every card
 * that leaves through the share panel.
 */
function formatDrawTime(date: Date, timeZone: string | null): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  };
  if (timeZone) {
    try {
      return date.toLocaleString("en-US", { ...options, timeZone });
    } catch {
      // A hand-edited or stale IANA zone throws RangeError. Fall through.
    }
  }
  return date.toLocaleString("en-US", { ...options, timeZone: "UTC" });
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const url = new URL(req.url);
  const teamId = url.searchParams.get("t");
  const timeZone = url.searchParams.get("tz");
  const format =
    url.searchParams.get("format") === "wide" ? "wide" : ("story" as const);
  const size = FORMATS[format];
  const isWide = format === "wide";

  const [logoSrc, draft] = await Promise.all([
    loadLogoDataUri("logo-128.png"),
    prisma.draft.findUnique({
      where: { slug },
      select: {
        leagueName: true,
        scheduledFor: true,
        teams: {
          select: { id: true, name: true },
          orderBy: { position: "asc" },
        },
        picks: {
          select: {
            revealedAt: true,
            pickNumber: true,
            teamId: true,
            team: { select: { name: true, ownerName: true } },
          },
          orderBy: { pickNumber: "asc" },
        },
      },
    }),
  ]);

  if (!draft) return new Response("Not found", { status: 404 });

  const now = new Date();
  const status = deriveStatus({ now, picks: draft.picks });
  const revealed = draft.picks.filter((p) => p.revealedAt <= now);
  const teamCount = draft.teams.length;
  const drawTime = formatDrawTime(draft.scheduledFor, timeZone);

  // The bare host, so a local build shows localhost and production shows the
  // real domain rather than a hardcoded string that lies in dev.
  const host = env.NEXT_PUBLIC_BASE_URL.replace(/^https?:\/\//, "").replace(
    /\/+$/,
    "",
  );
  const draftUrl = `${host}/d/${slug}`;

  // A team card only makes sense once that team's pick is actually out. Before
  // then there is nothing to show and guessing would be a lie.
  const mine = teamId
    ? (revealed.find((p) => p.teamId === teamId) ?? null)
    : null;

  const pad = isWide ? 40 : 60;
  const cardPad = isWide ? 28 : 40;
  const innerWidth = size.width - pad * 2 - cardPad * 2;

  // Logo and product name only. The card below already says what state the
  // draw is in, and a status pill up here just repeats it back.
  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      {/* Satori, not the DOM: next/image has nothing to do here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoSrc}
        width={isWide ? 48 : 56}
        height={isWide ? 48 : 56}
        alt=""
      />
      <div
        style={{
          fontSize: isWide ? 24 : 28,
          fontWeight: 700,
          color: CHALK,
          letterSpacing: "-0.01em",
        }}
      >
        Fantasy Football Draft Order
      </div>
    </div>
  );

  const footer = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: HASHMARK,
        fontSize: isWide ? 20 : 24,
        fontFamily: MONO,
      }}
    >
      <span>{host}</span>
      <span>Fisher–Yates · crypto.randomInt</span>
    </div>
  );

  /** The card's own footer: how to get to this draft, and when it was drawn. */
  const cardFooter = (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", height: 1, background: SIDELINE }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: isWide ? 16 : 20,
          fontFamily: MONO,
          fontSize: isWide ? 20 : 24,
        }}
      >
        <span style={{ color: SIGNAL }}>{draftUrl}</span>
        <span style={{ color: HASHMARK }}>{drawTime}</span>
      </div>
    </div>
  );

  // Grows to fill whatever the header and footer leave, so a four-team draw is
  // a poster rather than a small box floating in a tall frame. The blocks
  // inside space themselves out, which is why every variant below is exactly
  // three children: heading, subject, card footer.
  const cardStyle: React.CSSProperties = {
    display: "flex",
    flexGrow: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    gap: isWide ? 16 : 28,
    margin: isWide ? "16px 0" : "32px 0",
    padding: cardPad,
    borderRadius: 32,
    border: `1px solid ${SIDELINE}`,
    background: "rgba(30, 41, 59, 0.35)",
  };

  let body: React.ReactElement;

  if (mine) {
    const pick = mine.pickNumber;
    body = (
      <div style={cardStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              fontSize: isWide ? 20 : 24,
              color: SIGNAL,
              fontFamily: MONO,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {draft.leagueName}
          </div>
          <div
            style={{
              fontSize: fitFontSize(
                mine.team.name,
                innerWidth,
                isWide ? 40 : 50,
              ),
              fontWeight: 700,
              color: CHALK,
              letterSpacing: "-0.02em",
              maxWidth: innerWidth,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {mine.team.name}
          </div>
          {mine.team.ownerName ? (
            <div style={{ fontSize: isWide ? 22 : 26, color: HASHMARK }}>
              {mine.team.ownerName}
            </div>
          ) : null}
        </div>

        {/* Satori requires an explicit `display` on any element with more than
            one child, and treats adjacent text and expressions as separate
            children, hence the flex rows here and the template string below
            rather than `pick of {teamCount}`. Getting this wrong does not warn,
            it fails the render. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span
              style={{
                fontSize: isWide ? 190 : 340,
                fontWeight: 800,
                lineHeight: 0.9,
                letterSpacing: "-0.05em",
                color: SIGNAL,
                fontFamily: MONO,
              }}
            >
              {pick}
            </span>
            <span
              style={{
                fontSize: isWide ? 76 : 130,
                fontWeight: 800,
                color: SIGNAL,
                fontFamily: MONO,
              }}
            >
              {ordinalSuffix(pick)}
            </span>
          </div>
          <span
            style={{
              fontSize: isWide ? 34 : 54,
              fontWeight: 700,
              color: CHALK,
              letterSpacing: "-0.02em",
            }}
          >
            {`pick of ${teamCount}`}
          </span>
        </div>

        {cardFooter}
      </div>
    );
  } else {
    // Every slot, not just the drawn ones. Mid-draw the remaining rows stay
    // visibly empty rather than being dropped, so the card is the same shape
    // whenever it is grabbed and never implies the draw is further along than
    // it is. Before the draw there are no slots at all, only entrants, and
    // numbering those would read as an order nobody has drawn yet.
    const isPreDraw = status === "SCHEDULED";
    const allRows = isPreDraw
      ? draft.teams.map((t) => ({ key: t.id, name: t.name }))
      : Array.from({ length: teamCount }, (_, i) => {
          const pick = revealed.find((p) => p.pickNumber === i + 1);
          return { key: String(i + 1), name: pick?.team.name ?? null };
        });

    // Portrait carries all 32. Landscape has less than a third of the height
    // for the same list, so past 12 it cuts over to a count rather than
    // shrinking every row into illegibility; the URL under it is right there.
    const rows = isWide ? allRows.slice(0, 12) : allRows;
    const overflowCount = allRows.length - rows.length;

    // A list that cannot scroll: it wraps into columns and every row is sized
    // off the height actually left over rather than a fixed scale.
    const maxPerColumn = isWide ? 4 : 16;
    const columnCount = Math.min(
      4,
      Math.max(1, Math.ceil(rows.length / maxPerColumn)),
    );
    const perColumn = Math.ceil(rows.length / columnCount);
    const listBudget = isWide ? 230 : 730;
    const unit = Math.min(
      isWide ? 58 : 76,
      Math.floor(listBudget / Math.max(perColumn, 1)),
    );
    const rowGap = unit >= 62 ? 12 : unit >= 48 ? 9 : 6;
    const badge = unit - rowGap;
    const rowFont = Math.round(badge * 0.56);
    const badgeFont = Math.round(badge * 0.44);

    const colGap = isWide ? 24 : 28;
    const colWidth = Math.floor(
      (innerWidth - colGap * (columnCount - 1)) / columnCount,
    );
    const nameWidth = colWidth - badge - 16;

    const columns = Array.from({ length: columnCount }, (_, i) =>
      rows.slice(i * perColumn, (i + 1) * perColumn),
    );

    body = (
      <div style={cardStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              fontSize: isWide ? 20 : 24,
              color: SIGNAL,
              fontFamily: MONO,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {/* Landscape folds the team count up here: it has less than a
                third of the height and cannot spare a line for it. */}
            {`${
              isPreDraw
                ? "Teams in the draw"
                : status === "COMPLETED"
                  ? "Final draft order"
                  : "Drawing now"
            }${isWide ? ` · ${teamCount} teams` : ""}`}
          </div>
          <div
            style={{
              fontSize: fitFontSize(
                draft.leagueName,
                innerWidth,
                isWide ? 44 : 60,
              ),
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: CHALK,
              maxWidth: innerWidth,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {draft.leagueName}
          </div>
          {isWide ? null : (
            <div style={{ fontSize: 26, color: SLATE }}>
              {`${teamCount} teams`}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: colGap }}>
            {columns.map((column, columnIndex) => (
              <div
                key={columnIndex}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: rowGap,
                  width: colWidth,
                }}
              >
                {column.map((row, rowIndex) => (
                  <div
                    key={row.key}
                    style={{ display: "flex", alignItems: "center", gap: 16 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: badge,
                        height: badge,
                        borderRadius: Math.round(badge * 0.3),
                        background:
                          row.name && !isPreDraw
                            ? "rgba(0, 230, 118, 0.15)"
                            : "rgba(30, 41, 59, 0.5)",
                        border:
                          row.name && !isPreDraw
                            ? "1px solid rgba(0, 230, 118, 0.3)"
                            : `1px solid ${SIDELINE}`,
                        color: row.name ? SIGNAL : HASHMARK,
                        fontSize: badgeFont,
                        fontWeight: 700,
                        fontFamily: MONO,
                      }}
                    >
                      {isPreDraw ? (
                        // A drawn glyph, not a "·": the character sits off centre
                        // at this size, and a number here would read as an order
                        // nobody has drawn yet.
                        <div
                          style={{
                            display: "flex",
                            width: Math.max(6, Math.round(badge * 0.16)),
                            height: Math.max(6, Math.round(badge * 0.16)),
                            borderRadius: 999,
                            background: HASHMARK,
                          }}
                        />
                      ) : (
                        String(columnIndex * perColumn + rowIndex + 1)
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: rowFont,
                        fontWeight: 600,
                        color: row.name ? CHALK : HASHMARK,
                        letterSpacing: "-0.01em",
                        maxWidth: nameWidth,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {row.name ?? "Not drawn yet"}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {overflowCount > 0 ? (
            <div style={{ fontSize: 20, color: HASHMARK, fontFamily: MONO }}>
              {`+ ${overflowCount} more, in order, at the link below`}
            </div>
          ) : null}
        </div>

        {cardFooter}
      </div>
    );
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: pad,
        background: BG,
        color: CHALK,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {header}
      {body}
      {footer}
    </div>,
    {
      ...size,
      headers: {
        // Drafts are immutable once complete, but a card requested mid-draw
        // must not be cached as the final one.
        "cache-control":
          status === "COMPLETED"
            ? "public, max-age=3600, s-maxage=86400"
            : "no-store",
      },
    },
  );
}
