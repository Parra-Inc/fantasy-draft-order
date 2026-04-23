import type { Importer, ImportedTeam } from "./types";

type MflFranchise = {
  id: string;
  name: string;
  owner_name?: string;
  icon?: string;
};

type MflResponse = {
  league?: {
    name?: string;
    franchises?: { franchise: MflFranchise[] | MflFranchise };
  };
  error?: { $t: string };
};

export const mflImporter: Importer = {
  async fetchLeague(leagueId) {
    const year = new Date().getFullYear();
    const url = `https://api.myfantasyleague.com/${year}/export?TYPE=league&L=${encodeURIComponent(leagueId)}&JSON=1`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`MFL league ${leagueId} not found`);
    const json = (await res.json()) as MflResponse;
    if (json.error) throw new Error(`MFL: ${json.error.$t}`);

    const raw = json.league?.franchises?.franchise;
    if (!raw) throw new Error("MFL: no franchises in response");
    const franchises = Array.isArray(raw) ? raw : [raw];

    const teams = franchises.map<ImportedTeam>((f) => ({
      name: f.name,
      ownerName: f.owner_name,
      avatarUrl: f.icon,
      sourceId: f.id,
    }));
    return { name: json.league?.name, teams };
  },
};
