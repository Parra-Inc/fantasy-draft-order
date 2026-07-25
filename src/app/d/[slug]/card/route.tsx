import { ImageResponse } from "next/og";
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
 *   /d/<slug>/card              final order, portrait
 *   /d/<slug>/card?t=<teamId>   one team's pick, portrait (the flex or the cope)
 *   /d/<slug>/card?format=wide  1200x630, for anywhere that wants landscape
 *
 * An unknown or unrevealed team falls back to the full-order card rather than
 * erroring: these URLs get shared, edited, and reopened weeks later.
 */

const FORMATS = {
  story: { width: 1080, height: 1350 },
  wide: { width: 1200, height: 630 },
} as const;

const BG =
  "radial-gradient(circle at 50% 0%, rgba(0, 230, 118, 0.18), transparent 60%), #0A1628";

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

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const url = new URL(req.url);
  const teamId = url.searchParams.get("t");
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
        teams: { select: { id: true } },
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

  // A team card only makes sense once that team's pick is actually out. Before
  // then there is nothing to show and guessing would be a lie.
  const mine = teamId
    ? (revealed.find((p) => p.teamId === teamId) ?? null)
    : null;

  const footer = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "#64748B",
        fontSize: isWide ? 22 : 26,
        fontFamily: "DM Mono, monospace",
      }}
    >
      <span>fantasyfootballdraftorder.com</span>
      <span>crypto.randomInt</span>
    </div>
  );

  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      {/* Satori, not the DOM: next/image has nothing to do here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoSrc}
        width={isWide ? 52 : 60}
        height={isWide ? 52 : 60}
        alt=""
      />
      <div
        style={{
          fontSize: isWide ? 22 : 26,
          fontWeight: 600,
          color: "#94A3B8",
        }}
      >
        Fantasy Football Draft Order
      </div>
    </div>
  );

  let body: React.ReactElement;

  if (mine) {
    const pick = mine.pickNumber;
    body = (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            fontSize: isWide ? 26 : 32,
            color: "#64748B",
            fontWeight: 500,
          }}
        >
          {mine.team.name}
        </div>
        {/* Satori requires an explicit `display` on any element with more than
            one child, and treats adjacent text and expressions as separate
            children, hence the flex row here and the template strings below
            rather than `pick of {teamCount}`. Getting this wrong does not warn,
            it fails the render. */}
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span
            style={{
              fontSize: isWide ? 200 : 280,
              fontWeight: 800,
              lineHeight: 0.9,
              letterSpacing: "-0.05em",
              color: "#00E676",
              fontFamily: "DM Mono, monospace",
            }}
          >
            {pick}
          </span>
          <span
            style={{
              fontSize: isWide ? 80 : 110,
              fontWeight: 800,
              color: "#00E676",
              fontFamily: "DM Mono, monospace",
            }}
          >
            {ordinalSuffix(pick)}
          </span>
        </div>
        <div
          style={{
            fontSize: isWide ? 40 : 54,
            fontWeight: 700,
            color: "#F5F5F0",
            letterSpacing: "-0.02em",
          }}
        >
          {`pick of ${teamCount}`}
        </div>
        <div
          style={{
            fontSize: isWide ? 24 : 30,
            color: "#94A3B8",
            maxWidth: isWide ? 900 : 940,
          }}
        >
          {`${draft.leagueName} · drawn live from open-source code, seed recorded before anyone saw it.`}
        </div>
      </div>
    );
  } else {
    // Full-order card. Rows shrink as the league grows so a 14-team order still
    // fits without a scroll that an image cannot have.
    const rows = revealed;
    const rowFont = rows.length > 12 ? 34 : rows.length > 10 ? 38 : 44;
    const rowGap = rows.length > 12 ? 6 : 10;
    const badge = rows.length > 12 ? 52 : 60;

    body = (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontSize: isWide ? 22 : 26,
              color: "#00E676",
              fontFamily: "DM Mono, monospace",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {status === "COMPLETED" ? "Final draft order" : "Drawn so far"}
          </div>
          <div
            style={{
              fontSize: isWide ? 52 : 64,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#F5F5F0",
              maxWidth: isWide ? 1050 : 930,
            }}
          >
            {draft.leagueName}
          </div>
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: rowGap }}
        >
          {rows.map((p) => (
            <div
              key={p.pickNumber}
              style={{ display: "flex", alignItems: "center", gap: 20 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: badge,
                  height: badge,
                  borderRadius: 16,
                  background: "rgba(0, 230, 118, 0.15)",
                  border: "1px solid rgba(0, 230, 118, 0.3)",
                  color: "#00E676",
                  fontSize: rowFont - 12,
                  fontWeight: 700,
                  fontFamily: "DM Mono, monospace",
                }}
              >
                {p.pickNumber}
              </div>
              <div
                style={{
                  fontSize: rowFont,
                  fontWeight: 600,
                  color: "#F5F5F0",
                  letterSpacing: "-0.01em",
                  maxWidth: isWide ? 980 : 860,
                  overflow: "hidden",
                }}
              >
                {p.team.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: isWide ? "64px" : "72px",
          background: BG,
          color: "#F5F5F0",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {header}
        {body}
        {footer}
      </div>
    ),
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
