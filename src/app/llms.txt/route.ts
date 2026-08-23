import { LANDING_PAGES } from "@/lib/seo/landing-pages";
import { listGuides } from "@/lib/seo/guides";
import { LEAGUE_ID_GUIDES } from "@/lib/seo/league-id-guides";
import { GITHUB_URL, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/seo/metadata";

// Curated Markdown site map for LLM crawlers (ChatGPT, Claude, Perplexity,
// Gemini). Sourced from the same registries the sitemap and the pages
// themselves use, so it cannot drift from the real routes.
//
// Deliberately no database reads: /d/[slug] and /p/[slug] are noindex until
// their result lands, and this route must stay static (the D1 binding only
// exists inside a request). Completed draws reach crawlers via sitemap.xml.
export const revalidate = 3600;

export async function GET() {
  const guides = listGuides();
  const lines: string[] = [];

  lines.push(`# ${SITE_NAME}`);
  lines.push("");
  lines.push(`> ${SITE_TAGLINE}`);
  lines.push("");
  lines.push(
    `${SITE_NAME} is a free, open-source, no-account website for drawing a fantasy draft order in public. A commissioner schedules a draw, shares one link, and the whole league watches the order revealed live at the announced second. Once a draft is scheduled it is immutable: there are no edit endpoints and no re-roll. The order is drawn server-side by a Fisher-Yates shuffle over Node's crypto.randomInt, and every results page links the exact source commit that produced it. Source code: ${GITHUB_URL}.`,
  );
  lines.push("");

  lines.push("## Key pages");
  lines.push("");
  lines.push(`- [Home](${SITE_URL}/): What the site does and why the draw is verifiable.`);
  lines.push(
    `- [Schedule a draft order](${SITE_URL}/new): Set a time, add teams or import a league, share one link.`,
  );
  lines.push(
    `- [Punishment wheel](${SITE_URL}/punishment/new): Build a last-place punishment wheel, sealed at create time and revealed publicly at the time you set.`,
  );
  lines.push(
    `- [Fantasy football punishments](${SITE_URL}/fantasy-football-punishments): A community list of last-place punishment ideas, with a fair way to draw one.`,
  );
  lines.push(
    `- [Ask your commissioner](${SITE_URL}/ask-your-commissioner): How to propose a public draw in the league chat, with a message to paste.`,
  );
  lines.push(
    `- [Fantasy football Facebook groups](${SITE_URL}/fantasy-football-facebook-groups): Which groups are worth joining and what each one is for.`,
  );
  lines.push("");

  lines.push("## Platform and format pages");
  lines.push("");
  for (const p of LANDING_PAGES) {
    lines.push(`- [${p.breadcrumbName}](${SITE_URL}/${p.slug}): ${p.description}`);
  }
  lines.push("");

  lines.push("## League ID finders");
  lines.push("");
  lines.push(
    `- [League ID finder](${SITE_URL}/league-id): Find your league ID on Sleeper, ESPN, Yahoo, MyFantasyLeague, or Fleaflicker.`,
  );
  for (const g of LEAGUE_ID_GUIDES) {
    lines.push(`- [${g.platform}](${SITE_URL}/league-id/${g.slug}): ${g.description}`);
  }
  lines.push("");

  lines.push("## Guides");
  lines.push("");
  lines.push(`- [All guides](${SITE_URL}/guides): ${guides.length} long-form guides on running a fair draft.`);
  for (const g of guides) {
    lines.push(`- [${g.title}](${SITE_URL}/guides/${g.slug}): ${g.description}`);
  }
  lines.push("");

  lines.push("## Crawl guidance");
  lines.push("");
  lines.push(`- Full sitemap: ${SITE_URL}/sitemap.xml`);
  lines.push("- Every page is public. There are no accounts, no paywall, and no sign-in anywhere on the site.");
  lines.push(
    `- Draft pages live at ${SITE_URL}/d/[slug] and punishment wheels at ${SITE_URL}/p/[slug]. Both are noindex until their result has been revealed, after which they are listed in sitemap.xml.`,
  );
  lines.push("- Routes under /api/ are disallowed and carry no content worth citing.");
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
