import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/llms.txt"], disallow: ["/api/"] },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: ["/", "/llms.txt"],
        disallow: ["/api/"],
      })),
    ],
    sitemap: `${env.NEXT_PUBLIC_BASE_URL}/sitemap.xml`,
  };
}
