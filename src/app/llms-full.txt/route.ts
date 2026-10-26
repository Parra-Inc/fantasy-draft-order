import { LANDING_PAGES } from "@/lib/seo/landing-pages";
import { listGuides, type GuideSection } from "@/lib/seo/guides";
import { LEAGUE_ID_GUIDES } from "@/lib/seo/league-id-guides";
import { GITHUB_URL, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/seo/metadata";

// Full-content Markdown dump for LLM crawlers (ChatGPT, Claude, Perplexity,
// Gemini). Where /llms.txt is a curated map of links, this inlines the actual
// prose — every landing-page intro and FAQ, every league-ID walkthrough, and
// the full body of every guide — so an answer engine can cite the site without
// a second fetch.
//
// Same sourcing discipline as /llms.txt: assembled from the same registries the
// pages render from (LANDING_PAGES, LEAGUE_ID_GUIDES, GUIDES), so it cannot
// drift from the real content. No database reads (the D1 binding only exists
// inside a request and this route must stay static). No `revalidate`: the
// output only changes on deploy, and setting it made OpenNext try to write into
// the read-only static-assets incremental cache (see the note in llms.txt).

// The guide and landing-page copy still carries em dashes in places, so the
// assembled output is scrubbed rather than trusting each source: a spaced em
// dash becomes a comma, an unspaced one a hyphen.
function withoutEmDashes(text: string): string {
  return text.replace(/\s+—\s+/g, ", ").replace(/—/g, "-");
}

function renderSection(s: GuideSection): string[] {
  switch (s.kind) {
    case "h2":
      return ["", `## ${s.text}`, ""];
    case "h3":
      return ["", `### ${s.text}`, ""];
    case "p":
      return [s.text, ""];
    case "ul":
      return [...s.items.map((i) => `- ${i}`), ""];
    case "ol":
      return [...s.items.map((i, n) => `${n + 1}. ${i}`), ""];
    case "quote":
      return [`> ${s.text}`, ...(s.cite ? [`> (${s.cite})`] : []), ""];
    case "callout":
      return [`**Note:** ${s.text}`, ""];
    case "code":
      return ["```" + (s.language ?? ""), s.text, "```", ""];
    default:
      return [];
  }
}

export async function GET() {
  const guides = listGuides();
  const lines: string[] = [];

  lines.push(`# ${SITE_NAME}`);
  lines.push("");
  lines.push(`> ${SITE_TAGLINE}`);
  lines.push("");
  lines.push(
    `${SITE_NAME} is a free, open-source, no-account website for drawing a fantasy draft order in public. A commissioner schedules a draw, shares one link, and the whole league watches the order revealed live at the announced second. Once a draft is scheduled it is immutable: there are no edit endpoints and no re-roll. The order is drawn server-side by a Fisher-Yates shuffle over Node's crypto.randomInt, and every results page links the randomizer source, pinned to the exact commit that produced the draw whenever that commit was recorded. Source code: ${GITHUB_URL}.`,
  );
  lines.push("");
  lines.push(
    "This file inlines the full content of the site's indexable pages for answer engines. The canonical URL for each section is given under its heading.",
  );
  lines.push("");

  // Platform and format landing pages: intro + FAQs.
  lines.push("---");
  lines.push("");
  lines.push("# Platform and format pages");
  lines.push("");
  for (const p of LANDING_PAGES) {
    lines.push(`## ${p.breadcrumbName}`);
    lines.push("");
    lines.push(`URL: ${SITE_URL}/${p.slug}`);
    lines.push("");
    lines.push(p.intro);
    lines.push("");
    if (p.faqs.length) {
      lines.push("### FAQ");
      lines.push("");
      for (const f of p.faqs) {
        lines.push(`**${f.q}**`);
        lines.push("");
        lines.push(f.a);
        lines.push("");
      }
    }
  }

  // League ID finders: the most-crawled cluster. Inline the whole walkthrough.
  lines.push("---");
  lines.push("");
  lines.push("# League ID finders");
  lines.push("");
  lines.push(
    `League ID finder hub: ${SITE_URL}/league-id — find your league ID on Sleeper, ESPN, Yahoo, MyFantasyLeague, or Fleaflicker.`,
  );
  lines.push("");
  for (const g of LEAGUE_ID_GUIDES) {
    lines.push(`## How to find your ${g.platform} league ID`);
    lines.push("");
    lines.push(`URL: ${SITE_URL}/league-id/${g.slug}`);
    lines.push("");
    lines.push(g.intro);
    lines.push("");
    lines.push(`- ID shape: ${g.idShape}`);
    lines.push(`- Example URL: ${g.exampleUrl}`);
    lines.push(`- Example ID: ${g.exampleId}`);
    lines.push("");
    lines.push("### On the web");
    lines.push("");
    for (const [i, step] of g.webSteps.entries()) lines.push(`${i + 1}. ${step}`);
    lines.push("");
    lines.push(`### ${g.appLabel}`);
    lines.push("");
    for (const [i, step] of g.appSteps.entries()) lines.push(`${i + 1}. ${step}`);
    lines.push("");
    if (g.gotchas.length) {
      lines.push("### Gotchas");
      lines.push("");
      for (const got of g.gotchas) lines.push(`- ${got}`);
      lines.push("");
    }
    if (g.faqs.length) {
      lines.push("### FAQ");
      lines.push("");
      for (const f of g.faqs) {
        lines.push(`**${f.q}**`);
        lines.push("");
        lines.push(f.a);
        lines.push("");
      }
    }
  }

  // Guides: full body.
  lines.push("---");
  lines.push("");
  lines.push("# Guides");
  lines.push("");
  for (const g of guides) {
    lines.push(`## ${g.title}`);
    lines.push("");
    lines.push(`URL: ${SITE_URL}/guides/${g.slug}`);
    lines.push("");
    lines.push(`_${g.description}_`);
    lines.push("");
    for (const s of g.sections) lines.push(...renderSection(s));
    if (g.faqs.length) {
      lines.push("### FAQ");
      lines.push("");
      for (const f of g.faqs) {
        lines.push(`**${f.q}**`);
        lines.push("");
        lines.push(f.a);
        lines.push("");
      }
    }
  }

  lines.push("---");
  lines.push("");
  lines.push("# Crawl guidance");
  lines.push("");
  lines.push(`- Full sitemap: ${SITE_URL}/sitemap.xml`);
  lines.push("- Every page is public. There are no accounts, no paywall, and no sign-in anywhere on the site.");
  lines.push(
    `- Draft pages live at ${SITE_URL}/d/[slug] and punishment wheels at ${SITE_URL}/p/[slug]. Both are noindex until their result has been revealed, after which they are listed in sitemap.xml.`,
  );
  lines.push("- Routes under /api/ are disallowed and carry no content worth citing.");
  lines.push("");

  return new Response(withoutEmDashes(lines.join("\n")), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
