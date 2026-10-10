import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GUIDES } from "./guides";
import { LANDING_PAGES } from "./landing-pages";
import { LEAGUE_ID_GUIDES } from "./league-id-guides";

// Google truncates titles past ~60 characters and descriptions past ~160.
// The SEO crawler flags both, so keep every page inside the limits here
// instead of finding out from the next audit.
const MAX_TITLE = 60;
const MAX_DESCRIPTION = 160;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

describe("SEO metadata length", () => {
  it("guides fit", () => {
    for (const g of GUIDES) {
      expect((g.metaTitle ?? g.title).length, g.slug).toBeLessThanOrEqual(
        MAX_TITLE,
      );
      expect(g.description.length, g.slug).toBeLessThanOrEqual(MAX_DESCRIPTION);
    }
  });

  it("landing pages and league ID guides fit", () => {
    for (const p of [...LANDING_PAGES, ...LEAGUE_ID_GUIDES]) {
      expect(p.title.length, p.title).toBeLessThanOrEqual(MAX_TITLE);
      expect(p.description.length, p.title).toBeLessThanOrEqual(
        MAX_DESCRIPTION,
      );
    }
  });

  it("literal buildMetadata titles and descriptions in src/app fit", () => {
    const files = walk(join(__dirname, "../../app")).filter((f) =>
      /page\.tsx$/.test(f),
    );
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      if (!src.includes("buildMetadata(")) continue;
      for (const m of src.matchAll(/\btitle:\s*"([^"]+)"/g)) {
        expect(m[1].length, `${f}: ${m[1]}`).toBeLessThanOrEqual(MAX_TITLE);
      }
      for (const m of src.matchAll(/\bdescription:\s*"([^"]+)"/g)) {
        expect(m[1].length, `${f}: ${m[1]}`).toBeLessThanOrEqual(
          MAX_DESCRIPTION,
        );
      }
    }
  });
});
