import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { WhyFair } from "@/components/marketing/why-fair";
import { Integrations } from "@/components/marketing/integrations";
import { GuidesTeaser } from "@/components/marketing/guides-teaser";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/cta";
import { buildMetadata } from "@/lib/seo/metadata";
import { BreadcrumbLd, SoftwareApplicationLd } from "@/lib/seo/jsonld";

export const metadata = buildMetadata({
  title: "Fantasy Football Draft Order: Free, Open-Source Randomizer",
  description:
    "Free fantasy football draft order generator. Schedule the draw, share one link, and watch the randomizer pick your order live from open-source code. Sleeper, ESPN, MyFantasyLeague, Fleaflicker — football, basketball, baseball, and hockey leagues.",
  path: "/",
  keywords: [
    "fantasy football draft order generator",
    "fantasy football draft order picker",
    "fantasy draft order generator",
    "fantasy draft randomizer",
    "draft order wheel",
    "random draft order picker",
    "fantasy football draft order",
    "open source draft randomizer",
    "fair draft order",
    "draft lottery",
  ],
});

export default function HomePage() {
  return (
    <main>
      <SoftwareApplicationLd />
      <BreadcrumbLd items={[{ name: "Home", path: "/" }]} />
      <Hero />
      <HowItWorks />
      <WhyFair />
      <Integrations />
      <GuidesTeaser />
      <Faq />
      <FinalCta />
    </main>
  );
}
