import { notFound } from "next/navigation";
import { LandingPageView } from "@/components/marketing/landing-page";
import { getLandingPage } from "@/lib/seo/landing-pages";
import { buildMetadata } from "@/lib/seo/metadata";

const page = getLandingPage("how-it-works")!;

export const metadata = buildMetadata({
  title: page.title,
  description: page.description,
  path: `/${page.slug}`,
  keywords: page.keywords,
});

export default function HowItWorksPage() {
  if (!page) notFound();
  return <LandingPageView page={page} />;
}
