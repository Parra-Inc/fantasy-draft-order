import { env } from "@/lib/env";

// Served as a route handler (not app/robots.ts) because MetadataRoute.Robots
// cannot emit the Content-Signal line. Every group carries it: a bot that
// matches a named group ignores "*".
const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=no";

// AI/LLM crawlers we explicitly welcome. Citations in ChatGPT, Claude,
// Perplexity, and Gemini answers are valuable exposure for a free tool with no
// ad budget; llms.txt gives them a curated map of the site.
const AI_CRAWLERS = [
  // OpenAI
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic
  "ClaudeBot",
  "Claude-Web",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Google (Gemini / Vertex grounding)
  "Google-Extended",
  "Google-CloudVertexBot",
  // Apple Intelligence
  "Applebot-Extended",
  // Meta AI
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  "FacebookBot",
  // Other answer engines that cite their sources
  "DuckAssistBot",
  "Amazonbot",
  "cohere-ai",
  "MistralAI-User",
  "Kagibot",
  "YouBot",
  "Bytespider",
  "CCBot",
];

// /.well-known/ must never be covered by a Disallow.
const ALLOW = ["/", "/llms.txt"];
const DISALLOW = ["/api/"];

export const dynamic = "force-static";

export function GET() {
  const group = (ua: string) =>
    [
      `User-agent: ${ua}`,
      `Content-Signal: ${CONTENT_SIGNAL}`,
      ...ALLOW.map((p) => `Allow: ${p}`),
      ...DISALLOW.map((p) => `Disallow: ${p}`),
    ].join("\n");
  const body = [
    group("*"),
    ...AI_CRAWLERS.map(group),
    `Sitemap: ${env.NEXT_PUBLIC_BASE_URL}/sitemap.xml`,
  ].join("\n\n");
  return new Response(body + "\n", {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
