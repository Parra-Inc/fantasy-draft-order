import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { WhyFair } from "@/components/marketing/why-fair";
import { Integrations } from "@/components/marketing/integrations";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/cta";
import { buildMetadata } from "@/lib/seo/metadata";
import { BreadcrumbLd, SoftwareApplicationLd } from "@/lib/seo/jsonld";

export const metadata = buildMetadata({
  title:
    "Fantasy Draft Order — Free, Open-Source Draft Randomizer for Every League",
  description:
    "Free fantasy draft order randomizer. Schedule the draw, share one link, and watch the order drawn live from open-source code. Sleeper, ESPN, MyFantasyLeague, Fleaflicker — football, basketball, baseball, and hockey leagues.",
  path: "/",
  keywords: [
    "fantasy draft order generator",
    "fantasy draft randomizer",
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
      <Faq />
      <FinalCta />
    </main>
  );
}
