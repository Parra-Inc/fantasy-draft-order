import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GUIDES } from "./guides";
import { LANDING_PAGES } from "./landing-pages";
import { LEAGUE_ID_GUIDES } from "./league-id-guides";
import {
  MAX_DESCRIPTION,
  MAX_TITLE,
  buildMetadata,
  clampMeta,
  encodedLength,
} from "./metadata";

// Google truncates titles past ~60 characters and descriptions past ~160.
// The SEO crawler counts the raw HTML, with entities like &#x27; and &amp;
// still encoded, so every check here uses the encoded length.

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

describe("SEO metadata length", () => {
  it("guides fit", () => {
    for (const g of GUIDES) {
      expect(encodedLength(g.metaTitle ?? g.title), g.slug).toBeLessThanOrEqual(
        MAX_TITLE,
      );
      expect(encodedLength(g.description), g.slug).toBeLessThanOrEqual(
        MAX_DESCRIPTION,
      );
    }
  });

  it("landing pages and league ID guides fit", () => {
    for (const p of [...LANDING_PAGES, ...LEAGUE_ID_GUIDES]) {
      expect(encodedLength(p.title), p.title).toBeLessThanOrEqual(MAX_TITLE);
      expect(encodedLength(p.description), p.title).toBeLessThanOrEqual(
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
        expect(encodedLength(m[1]), `${f}: ${m[1]}`).toBeLessThanOrEqual(
          MAX_TITLE,
        );
      }
      for (const m of src.matchAll(/\bdescription:\s*"([^"]+)"/g)) {
        expect(encodedLength(m[1]), `${f}: ${m[1]}`).toBeLessThanOrEqual(
          MAX_DESCRIPTION,
        );
      }
    }
  });

  it("buildMetadata clamps long user content by encoded length", () => {
    const long = `Pat O'Brien & friends ${"finished last again ".repeat(15)}`;
    const md = buildMetadata({ title: long, description: long });
    expect(encodedLength(md.description as string)).toBeLessThanOrEqual(
      MAX_DESCRIPTION,
    );
    expect(
      encodedLength((md.title as { absolute: string }).absolute),
    ).toBeLessThanOrEqual(MAX_TITLE);
    expect(clampMeta("short", 160)).toBe("short");
  });
});
