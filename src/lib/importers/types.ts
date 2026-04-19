export type ImportedTeam = {
  name: string;
  ownerName?: string;
  avatarUrl?: string;
  sourceId?: string;
};

export type Importer = {
  fetchTeams(leagueId: string): Promise<ImportedTeam[]>;
};

export type ImportSource = "SLEEPER" | "MFL" | "FLEAFLICKER" | "ESPN";
