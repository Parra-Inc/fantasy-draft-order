import type { Importer, ImportedTeam } from "./types";

type EspnTeam = {
  id: number;
  name?: string;
  location?: string;
  nickname?: string;
  logo?: string;
  owners?: string[];
};

type EspnResponse = {
  teams?: EspnTeam[];
};

export const espnImporter: Importer = {
  async fetchTeams(leagueId) {
    const year = new Date().getFullYear();
    const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${year}/segments/0/leagues/${encodeURIComponent(leagueId)}?view=mTeam`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "This ESPN league is private. Use manual entry — private ESPN leagues aren't supported yet.",
      );
    }
    if (!res.ok) throw new Error(`ESPN league ${leagueId} not found`);
    const json = (await res.json()) as EspnResponse;
    if (!json.teams?.length) throw new Error("ESPN: no teams in response");

    return json.teams.map<ImportedTeam>((t) => {
      const combined = [t.location, t.nickname].filter(Boolean).join(" ");
      return {
        name: t.name || combined || `Team ${t.id}`,
        avatarUrl: t.logo,
        sourceId: String(t.id),
      };
    });
  },
};
