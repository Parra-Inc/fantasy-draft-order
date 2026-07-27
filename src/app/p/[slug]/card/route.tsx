import { ImageResponse } from "next/og";
import { env } from "@/lib/env";
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
 * nobody serves.
 *
 *   /p/<slug>/card                    square, the group-chat default
 *   /p/<slug>/card?format=story       1080x1350, for a story or a feed post
 *   /p/<slug>/card?format=wide        1200x630, for anywhere that wants landscape
 *   /p/<slug>/card?tz=America/Denver  render the draw time in that zone
 *
 * Square by default because the destination is a message thread, where an
 * image is scaled to the bubble width and everything else is scroll. A wheel
 * has exactly one fact on it, so a tall canvas spent most of its height on
 * empty background and shrank that fact to nothing at thumbnail size. The
 * layout here is a single bordered card that fills the frame at every format,
 * and the punishment is sized off the space actually left for it, so a short
 * label renders enormous and a 120-character one still fits.
 *
 * It has to work standalone: someone screenshots it out of a chat with no link
 * attached, so it carries the product name, the wheel's own URL and the draw
 * time. Nothing about it depends on the surrounding message.
 *
 * Before the reveal this renders the sealed state, never the answer — it goes
 * through the same serializer as everything else for exactly that reason.
 */

const FORMATS = {
  chat: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1350 },
  wide: { width: 1200, height: 630 },
} as const;

type Format = keyof typeof FORMATS;

/**
 * Per-format type and spacing. Explicit rather than derived from a single
 * scale: landscape has under half the height for the same content and needs
 * proportionally tighter chrome, not a uniformly smaller copy of the square.
 *
 * `heroBudget` is the vertical room the punishment gets: everything inside the
 * card that is not the two fixed blocks around it. It is deliberately the whole
 * remainder rather than a comfortable fraction of it, because leftover height
 * is exactly what made the old card read as empty — a two-word punishment
 * should be a poster, not a caption floating in a frame.
 */
const METRICS: Record<
  Format,
  {
    pad: number;
    cardPad: number;
    logo: number;
    brand: number;
    pill: number;
    eyebrow: number;
    subject: number;
    kicker: number;
    heroMax: number;
    heroMin: number;
    heroBudget: number;
    foot: number;
  }
> = {
  chat: {
    pad: 52,
    cardPad: 44,
    logo: 50,
    brand: 27,
    pill: 18,
    eyebrow: 26,
    subject: 46,
    kicker: 23,
    heroMax: 190,
    heroMin: 40,
    heroBudget: 490,
    foot: 24,
  },
  story: {
    pad: 60,
    cardPad: 52,
    logo: 56,
    brand: 30,
    pill: 20,
    eyebrow: 28,
    subject: 50,
    kicker: 25,
    heroMax: 240,
    heroMin: 46,
    heroBudget: 700,
    foot: 26,
  },
  wide: {
    pad: 40,
    cardPad: 32,
    logo: 40,
    brand: 22,
    pill: 15,
    eyebrow: 20,
    subject: 32,
    kicker: 17,
    heroMax: 110,
    heroMin: 28,
    heroBudget: 200,
    foot: 19,
  },
};

const CHALK = "#F5F5F0";
const SIGNAL = "#00E676";
const SLATE = "#94A3B8";
const HASHMARK = "#64748B";
const SIDELINE = "#1E293B";
const MONO = "DM Mono, monospace";

const BG =
  "radial-gradient(circle at 50% 0%, rgba(0, 230, 118, 0.18), transparent 60%), #0A1628";

/**
 * Shrink a one-line label until it fits, rather than letting it ellipsis.
 * Satori hands out no text measurement, so this approximates at ~0.52em per
 * character; the caller still sets an explicit maxWidth so a pathological
 * value clips instead of escaping the card. Same helper as the draft card.
 */
function fitFontSize(text: string, maxWidth: number, maxSize: number): number {
  if (!text.length) return maxSize;
  return Math.max(
    Math.round(maxSize * 0.45),
    Math.min(maxSize, Math.floor(maxWidth / (text.length * 0.52))),
  );
}

/** Average advance width of the display face, in em. See fitHero. */
const HERO_CHAR_EM = 0.56;

/**
 * The largest size at which the punishment fits its box, wrapping included.
 *
 * The single-line helper above is no use here: labels run to 120 characters and
 * the hero is the one thing on this card that must not be small, so it wraps
 * rather than shrinking to fit one line. Satori exposes no text measurement, so
 * this walks the sizes down and predicts the line count arithmetically. Word
 * breaks make the real count a little higher than characters-over-capacity
 * suggests, hence the extra half line of slack once it wraps at all. Both
 * numbers are approximations: over-estimating costs one step of size,
 * under-estimating overflows the card, so they lean generous.
 */
function fitHero(
  text: string,
  maxWidth: number,
  maxHeight: number,
  maxSize: number,
  minSize: number,
): number {
  if (!text.length) return maxSize;
  for (let size = maxSize; size > minSize; size -= 2) {
    const perLine = Math.max(1, Math.floor(maxWidth / (size * HERO_CHAR_EM)));
    const lines = Math.ceil(text.length / perLine);
    const slack = lines > 1 ? 0.5 : 0;
    if ((lines + slack) * size * 1.06 <= maxHeight) return size;
  }
  return minSize;
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

function parseFormat(value: string | null): Format {
  if (value === "wide" || value === "story" || value === "chat") return value;
  return "chat";
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const url = new URL(req.url);
  const timeZone = url.searchParams.get("tz");
  const format = parseFormat(url.searchParams.get("format"));
  const size = FORMATS[format];
  const m = METRICS[format];

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
  const innerWidth = size.width - m.pad * 2 - m.cardPad * 2;

  // The bare host, so a local build shows localhost and production shows the
  // real domain rather than a hardcoded string that lies in dev.
  const host = env.NEXT_PUBLIC_BASE_URL.replace(/^https?:\/\//, "").replace(
    /\/+$/,
    "",
  );

  // Before the reveal the card's job is attendance, not information: it says
  // the answer exists and is out of everyone's reach, which is the entire
  // reason to be on the page at the scheduled second. The count is already in
  // the corner, so the hero does not repeat it.
  const hero = state.chosen
    ? state.chosen.label
    : "Nobody knows which one yet.";
  const heroSize = fitHero(
    hero,
    innerWidth,
    m.heroBudget,
    m.heroMax,
    m.heroMin,
  );

  const header = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Satori, not the DOM: next/image has nothing to do here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={m.logo} height={m.logo} alt="" />
        <div
          style={{
            display: "flex",
            fontSize: m.brand,
            fontWeight: 700,
            color: CHALK,
            letterSpacing: "-0.01em",
          }}
        >
          Fantasy Football Draft Order
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: `${Math.round(m.pill * 0.45)}px ${m.pill}px`,
          borderRadius: 999,
          border: `1px solid ${state.chosen ? "rgba(0, 230, 118, 0.4)" : SIDELINE}`,
          background: state.chosen ? "rgba(0, 230, 118, 0.08)" : "transparent",
          color: state.chosen ? SIGNAL : HASHMARK,
          fontSize: m.pill,
          fontWeight: 700,
          fontFamily: MONO,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {state.chosen ? "Final" : "Sealed"}
      </div>
    </div>
  );

  // Exactly three children, spaced apart inside a card that grows to fill the
  // frame: who it is about, the punishment, and where to check it. The card is
  // what keeps every format dense — leftover height lands inside a visible
  // border rather than as background nobody can tell from padding.
  const body = (
    <div
      style={{
        display: "flex",
        flexGrow: 1,
        flexDirection: "column",
        justifyContent: "space-between",
        gap: format === "wide" ? 14 : 24,
        margin: format === "wide" ? "14px 0" : "26px 0",
        padding: m.cardPad,
        borderRadius: 32,
        border: `1px solid ${SIDELINE}`,
        background: "rgba(30, 41, 59, 0.35)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: m.eyebrow,
              color: SIGNAL,
              fontFamily: MONO,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              maxWidth: innerWidth * 0.62,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {state.leagueName}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: m.eyebrow,
              color: HASHMARK,
              fontFamily: MONO,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {`${state.options.length} on the wheel`}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: fitFontSize(
              `${state.loserName} finished last`,
              innerWidth,
              m.subject,
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
          {`${state.loserName} finished last`}
        </div>
      </div>

      {/* Satori requires an explicit `display` on any element with more than one
          child and counts adjacent text and expressions as separate children,
          hence the flex column here and the template strings throughout. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          style={{
            display: "flex",
            fontSize: m.kicker,
            color: state.chosen ? SIGNAL : HASHMARK,
            fontFamily: MONO,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          {state.chosen ? "The punishment" : "Sealed until the draw"}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: heroSize,
            fontWeight: 800,
            lineHeight: 1.03,
            letterSpacing: "-0.035em",
            color: CHALK,
            maxWidth: innerWidth,
          }}
        >
          {hero}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", height: 1, background: SIDELINE }} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: format === "wide" ? 14 : 20,
            fontFamily: MONO,
            fontSize: m.foot,
          }}
        >
          <span style={{ color: SIGNAL }}>{`${host}/p/${slug}`}</span>
          <span style={{ color: HASHMARK }}>
            {formatDrawTime(new Date(state.revealedAt), timeZone)}
          </span>
        </div>
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
        fontSize: m.foot,
        fontFamily: MONO,
      }}
    >
      {/* The bare domain, not the wheel's URL: that one is already inside the
          card. This line is for the screenshot that reaches someone with no
          link attached and no idea what site drew this. */}
      <span style={{ color: SLATE }}>{host}</span>
      <span>Fisher–Yates · crypto.randomInt</span>
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
        padding: m.pad,
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
