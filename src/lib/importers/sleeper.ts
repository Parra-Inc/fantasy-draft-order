import type { Importer, ImportedTeam } from "./types";

type SleeperUser = {
  user_id: string;
  display_name: string;
  avatar: string | null;
  metadata?: { team_name?: string; avatar?: string };
};

type SleeperRoster = {
  roster_id: number;
  owner_id: string | null;
};

const BASE = "https://api.sleeper.app/v1";

export const sleeperImporter: Importer = {
  async fetchTeams(leagueId) {
    const [usersRes, rostersRes] = await Promise.all([
      fetch(`${BASE}/league/${leagueId}/users`, { cache: "no-store" }),
      fetch(`${BASE}/league/${leagueId}/rosters`, { cache: "no-store" }),
    ]);
    if (!usersRes.ok || !rostersRes.ok) {
      throw new Error(`Sleeper league ${leagueId} not found`);
    }
    const users = (await usersRes.json()) as SleeperUser[];
    const rosters = (await rostersRes.json()) as SleeperRoster[];
    const userById = new Map(users.map((u) => [u.user_id, u]));

    const teams: ImportedTeam[] = rosters.map((roster) => {
      const user = roster.owner_id ? userById.get(roster.owner_id) : undefined;
      const avatar =
        user?.metadata?.avatar ||
        (user?.avatar ? `https://sleepercdn.com/avatars/${user.avatar}` : undefined);
      return {
        name: user?.metadata?.team_name || user?.display_name || `Team ${roster.roster_id}`,
        ownerName: user?.display_name,
        avatarUrl: avatar,
        sourceId: String(roster.roster_id),
      };
    });
    return teams;
  },
};
