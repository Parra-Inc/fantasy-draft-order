import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt =
  "Fantasy Draft Order — open-source fantasy draft randomizer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoSrc = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public", "logo-192.png")
).toString("base64")}`;

export default function TwitterImage() {
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
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={logoSrc} width={64} height={64} alt="" />
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            Fantasy Draft Order
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              alignItems: "center",
              gap: 10,
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid rgba(0, 230, 118, 0.4)",
              background: "rgba(0, 230, 118, 0.08)",
              color: "#00E676",
              fontSize: 18,
              fontWeight: 500,
            }}
          >
            Open source · No accounts · Free forever
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0 18px",
              fontSize: 78,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              maxWidth: 940,
            }}
          >
            <span>The draft order your league</span>
            <span style={{ color: "#00E676" }}>can trust.</span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#94A3B8",
              maxWidth: 880,
              lineHeight: 1.35,
            }}
          >
            Schedule the draw. Share one link. Watch it drawn live from
            open-source code.
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
          <span>fantasydraftorder.com</span>
          <span>Fisher–Yates · crypto.randomInt</span>
        </div>
      </div>
    ),
    size
  );
}
