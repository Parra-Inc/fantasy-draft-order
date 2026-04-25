import type { Metadata } from "next";
import { env } from "@/lib/env";

export const SITE_NAME = "Fantasy Draft Order";
export const SITE_URL = env.NEXT_PUBLIC_BASE_URL;
export const SITE_TAGLINE =
  "The transparent, open-source fantasy draft order randomizer. Schedule the draw. Share the link. Watch it drawn live.";
export const SITE_TWITTER = "@fantasydraftord";
export const GITHUB_URL =
  "https://github.com/fantasy-draft-order/fantasy-draft-order";

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
