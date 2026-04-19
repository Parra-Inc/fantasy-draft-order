import { NextResponse } from "next/server";
import { getImporter, type ImportSource } from "@/lib/importers";

const VALID: ImportSource[] = ["SLEEPER", "MFL", "FLEAFLICKER", "ESPN"];

export async function GET(req: Request, ctx: { params: Promise<{ source: string }> }) {
  const { source } = await ctx.params;
  const upper = source.toUpperCase() as ImportSource;
  if (!VALID.includes(upper)) {
    return NextResponse.json({ error: "invalid source" }, { status: 400 });
  }
  const leagueId = new URL(req.url).searchParams.get("leagueId");
  if (!leagueId) return NextResponse.json({ error: "leagueId required" }, { status: 400 });

  try {
    const teams = await getImporter(upper).fetchTeams(leagueId);
    return NextResponse.json({ teams });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "import failed" },
      { status: 400 },
    );
  }
}
