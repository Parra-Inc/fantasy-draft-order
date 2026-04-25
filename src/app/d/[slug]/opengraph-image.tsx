import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { deriveStatus } from "@/lib/reveal";

export const alt = "Fantasy draft order draw";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoSrc = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public", "logo-128.png")
).toString("base64")}`;

type Props = { params: Promise<{ slug: string }> };

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Scheduled",
  DRAWING: "Drawing live",
  COMPLETED: "Final order",
};

export default async function DraftOgImage({ params }: Props) {
  const { slug } = await params;
  const draft = await prisma.draft.findUnique({
    where: { slug },
    select: {
      leagueName: true,
      scheduledFor: true,
      teams: { select: { id: true } },
      picks: { select: { revealedAt: true }, orderBy: { pickNumber: "asc" } },
    },
  });

  const leagueName = draft?.leagueName ?? "Fantasy Draft Order";
  const teamCount = draft?.teams.length ?? 0;
  const status = draft
    ? deriveStatus({ now: new Date(), picks: draft.picks })
    : "SCHEDULED";
  const statusLabel = STATUS_LABEL[status];
  const when = draft?.scheduledFor
    ? new Date(draft.scheduledFor).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : "";

  return new ImageResponse(
    (
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
              Fantasy Draft Order
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

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 26, color: "#64748B", fontWeight: 500 }}>
            Draft order draw for
          </div>
          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              color: "#F5F5F0",
              maxWidth: 1080,
            }}
          >
            {leagueName}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              color: "#94A3B8",
              fontSize: 28,
            }}
          >
            <span>{teamCount} teams</span>
            {when ? (
              <>
                <span style={{ color: "#1E293B" }}>·</span>
                <span>{when}</span>
              </>
            ) : null}
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
          <span>fantasydraftorder.com/d/{slug}</span>
          <span>Fisher–Yates · crypto.randomInt</span>
        </div>
      </div>
    ),
    size
  );
}
