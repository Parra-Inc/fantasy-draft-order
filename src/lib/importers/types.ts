export type ImportedTeam = {
  name: string;
  ownerName?: string;
  avatarUrl?: string;
  sourceId?: string;
};

export type ImportedLeague = {
  name?: string;
  teams: ImportedTeam[];
};

export type Importer = {
  fetchLeague(leagueId: string): Promise<ImportedLeague>;
};

export type ImportSource = "SLEEPER" | "MFL" | "FLEAFLICKER" | "ESPN";
