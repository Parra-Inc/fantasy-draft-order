import { espnImporter } from "./espn";
import { fleaflickerImporter } from "./fleaflicker";
import { mflImporter } from "./mfl";
import { sleeperImporter } from "./sleeper";
import type { ImportSource, Importer } from "./types";

const IMPORTERS: Record<ImportSource, Importer> = {
  SLEEPER: sleeperImporter,
  MFL: mflImporter,
  FLEAFLICKER: fleaflickerImporter,
  ESPN: espnImporter,
};

export function getImporter(source: ImportSource): Importer {
  return IMPORTERS[source];
}

export type { ImportedTeam, ImportSource } from "./types";
