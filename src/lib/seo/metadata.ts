import type { Metadata } from "next";
import { env } from "@/lib/env";

export const SITE_NAME = "Fantasy Football Draft Order";
export const SITE_URL = env.NEXT_PUBLIC_BASE_URL;
export const SITE_TAGLINE =
  "The transparent, open-source fantasy football draft order randomizer. Schedule the draw. Share the link. Watch it drawn live.";
export const SITE_TWITTER = "@fantasydraftord";
export const GITHUB_URL = "https://github.com/Parra-Inc/fantasy-draft-order";

export const MAX_TITLE = 60;
export const MAX_DESCRIPTION = 160;

/**
 * Length as an HTML crawler counts it: React escapes & < > " ' in attribute
 * and text output, so "&" costs 5 chars and "'" costs 6 (&#x27;).
 */
export function encodedLength(text: string): number {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;").length;
}

/** Trim text (on a word boundary, with an ellipsis) until its encoded length fits. */
export function clampMeta(text: string, max: number): string {
  if (encodedLength(text) <= max) return text;
  const words = text.split(/\s+/);
  while (words.length > 1) {
    words.pop();
    const out = `${words.join(" ").replace(/[\s,;:.!?\u2014-]+$/, "")}\u2026`;
    if (encodedLength(out) <= max) return out;
  }
  let out = text;
  while (out.length && encodedLength(`${out}\u2026`) > max)
    out = out.slice(0, -1);
  return `${out}\u2026`;
}

type BuildMetadataInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noindex?: boolean;
  type?: "website" | "article";
  keywords?: string[];
};

export function buildMetadata({
  title,
  description,
  path = "/",
  image,
  noindex = false,
  type = "website",
  keywords,
}: BuildMetadataInput): Metadata {
  title = clampMeta(title, MAX_TITLE);
  description = clampMeta(description, MAX_DESCRIPTION);
  const url = path === "/" ? SITE_URL : `${SITE_URL}${path}`;
  const ogImage = image ?? "/opengraph-image";

  return {
    title: { absolute: title },
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      site: SITE_TWITTER,
      creator: SITE_TWITTER,
    },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}
