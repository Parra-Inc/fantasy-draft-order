import type { Importer, ImportedTeam } from "./types";

type FleaflickerUser = {
  displayName?: string;
};

type FleaflickerTeam = {
  id: number;
  name: string;
  logoUrl?: string;
  owners?: FleaflickerUser[];
};

type FleaflickerDivision = {
  teams?: FleaflickerTeam[];
};

type FleaflickerResponse = {
  league?: { name?: string };
  divisions?: FleaflickerDivision[];
};

export const fleaflickerImporter: Importer = {
  async fetchLeague(leagueId) {
    const url = `https://www.fleaflicker.com/api/FetchLeagueStandings?league_id=${encodeURIComponent(leagueId)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fleaflicker league ${leagueId} not found`);
    const json = (await res.json()) as FleaflickerResponse;

    const teams: ImportedTeam[] = [];
    for (const div of json.divisions ?? []) {
      for (const t of div.teams ?? []) {
        teams.push({
          name: t.name,
          ownerName: t.owners?.[0]?.displayName,
          avatarUrl: t.logoUrl,
          sourceId: String(t.id),
        });
      }
    }
    if (teams.length === 0) throw new Error("Fleaflicker: no teams in response");
    return { name: json.league?.name, teams };
  },
};
