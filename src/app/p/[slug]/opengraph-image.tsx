import { ImageResponse } from "next/og";
import { loadLogoDataUri } from "@/lib/og-logo";
import { prisma } from "@/lib/prisma";
import { serializePunishmentState } from "@/lib/punishment-state";

export const alt = "Fantasy league punishment wheel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Reads the database, so it cannot be prerendered (see src/lib/prisma.ts).
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function PunishmentOgImage({ params }: Props) {
  const { slug } = await params;
  const logoSrc = await loadLogoDataUri("logo-128.png");
  const punishment = await prisma.punishment.findUnique({
    where: { slug },
    include: { options: { orderBy: { position: "asc" } } },
  });

  // Same serializer the page and the API use, so a link pasted before the spin
  // cannot unfurl with the answer in it.
  const state = punishment ? serializePunishmentState(punishment) : null;

  const loserName = state?.loserName ?? "Last place";
  const leagueName = state?.leagueName ?? "Fantasy Football Draft Order";
  const headline = state?.chosen?.label ?? `${state?.options.length ?? 0} punishments on the wheel`;
  const statusLabel = state?.chosen ? "Sealed and drawn" : "Sealed until the draw";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background:
          "radial-gradient(circle at 50% 0%, rgba(0, 230, 118, 0.18), transparent 60%), #0A1628",
        color: "#F5F5F0",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={logoSrc} width={52} height={52} alt="" />
          <div style={{ fontSize: 22, fontWeight: 600, color: "#94A3B8" }}>
            Fantasy Football Draft Order
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 16px",
            borderRadius: 999,
            border: "1px solid rgba(0, 230, 118, 0.4)",
            background: "rgba(0, 230, 118, 0.08)",
            color: "#00E676",
            fontSize: 18,
            fontWeight: 600,
            fontFamily: "DM Mono, monospace",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {statusLabel}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", fontSize: 26, color: "#64748B", fontWeight: 500 }}>
          {`${loserName} finished last in ${leagueName}`}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "#F5F5F0",
            maxWidth: 1050,
          }}
        >
          {headline}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#64748B",
          fontSize: 22,
          fontFamily: "DM Mono, monospace",
        }}
      >
        <span>fantasyfootballdraftorder.com/p/{slug}</span>
        <span>Fisher–Yates · crypto.randomInt</span>
      </div>
    </div>,
    size,
  );
}
