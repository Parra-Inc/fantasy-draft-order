import { ImageResponse } from "next/og";
import { loadLogoDataUri } from "@/lib/og-logo";
import { prisma } from "@/lib/prisma";
import { serializePunishmentState } from "@/lib/punishment-state";

// Reads the database, so it cannot be prerendered (see src/lib/prisma.ts).
export const dynamic = "force-dynamic";

/**
 * The shareable punishment card.
 *
 * Distinct from opengraph-image.tsx, which exists to make a pasted link unfurl
 * nicely. This is the artifact people save and post on purpose, and for this
 * feature it is the whole point: a punishment nobody posts is a punishment
 * nobody serves. Portrait by default, because it is going into a group chat or
 * a story rather than a link preview.
 *
 *   /p/<slug>/card                    the result, portrait
 *   /p/<slug>/card?format=wide        1200x630, for anywhere that wants landscape
 *   /p/<slug>/card?tz=America/Denver  render the draw time in that zone
 *
 * It has to work standalone: someone screenshots it out of a chat with no link
 * attached, so it carries the product name, the wheel's own URL and the draw
 * time. Nothing about it depends on the surrounding message.
 *
 * Before the reveal this renders the sealed state, never the answer — it goes
 * through the same serializer as everything else for exactly that reason.
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
 * Shrink a headline until it fits, rather than letting it ellipsis. Satori
 * hands out no text measurement, so this approximates at ~0.52em per
 * character; the caller still sets an explicit maxWidth so a pathological
 * label clips instead of escaping the card. Same helper as the draft card.
 */
function fitFontSize(text: string, maxWidth: number, maxSize: number): number {
  if (!text.length) return maxSize;
  return Math.max(
    Math.round(maxSize * 0.45),
    Math.min(maxSize, Math.floor(maxWidth / (text.length * 0.52))),
  );
}

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
  const timeZone = url.searchParams.get("tz");
  const format =
    url.searchParams.get("format") === "wide" ? "wide" : ("story" as const);
  const size = FORMATS[format];
  const isWide = format === "wide";

  const [logoSrc, punishment] = await Promise.all([
    loadLogoDataUri("logo-128.png"),
    prisma.punishment.findUnique({
      where: { slug },
      include: { options: { orderBy: { position: "asc" } } },
    }),
  ]);

  if (!punishment) {
    return new Response("Not found", { status: 404 });
  }

  const state = serializePunishmentState(punishment);
  const pad = isWide ? 64 : 72;
  const contentWidth = size.width - pad * 2;

  const headline = state.chosen
    ? state.chosen.label
    : `${state.options.length} punishments. One sealed answer.`;
  const headlineSize = fitFontSize(headline, contentWidth, isWide ? 68 : 80);

  const header = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <img src={logoSrc} width={isWide ? 44 : 52} height={isWide ? 44 : 52} alt="" />
        <div
          style={{
            display: "flex",
            fontSize: isWide ? 20 : 24,
            fontWeight: 600,
            color: SLATE,
          }}
        >
          Fantasy Football Draft Order
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 16px",
          borderRadius: 999,
          border: `1px solid ${state.chosen ? "rgba(0, 230, 118, 0.4)" : SIDELINE}`,
          background: state.chosen ? "rgba(0, 230, 118, 0.08)" : "transparent",
          color: state.chosen ? SIGNAL : HASHMARK,
          fontSize: isWide ? 16 : 18,
          fontWeight: 600,
          fontFamily: MONO,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {state.chosen ? "Final" : "Sealed"}
      </div>
    </div>
  );

  const body = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isWide ? 20 : 32,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: isWide ? 24 : 30,
          color: HASHMARK,
          fontWeight: 500,
        }}
      >
        {`${state.loserName} finished last in ${state.leagueName}`}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: headlineSize,
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          color: CHALK,
          maxWidth: contentWidth,
        }}
      >
        {headline}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          color: SLATE,
          fontSize: isWide ? 22 : 26,
        }}
      >
        <span>{`Drawn from ${state.options.length}`}</span>
        <span style={{ color: SIDELINE }}>·</span>
        <span>{formatDrawTime(new Date(state.revealedAt), timeZone)}</span>
      </div>
    </div>
  );

  const footer = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        color: HASHMARK,
        fontSize: isWide ? 18 : 22,
        fontFamily: MONO,
      }}
    >
      <div style={{ display: "flex" }}>
        {`fantasyfootballdraftorder.com/p/${slug}`}
      </div>
      <div style={{ display: "flex", color: SIDELINE }}>
        Fisher–Yates · crypto.randomInt · sealed before the draw
      </div>
    </div>
  );

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
        // A completed wheel is immutable; a card requested before the spin must
        // never be cached as though it were the final one.
        "cache-control":
          state.status === "COMPLETED"
            ? "public, max-age=3600, s-maxage=86400"
            : "no-store",
      },
    },
  );
}
