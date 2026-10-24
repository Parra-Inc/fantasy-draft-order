import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { WhyFair } from "@/components/marketing/why-fair";
import { Integrations } from "@/components/marketing/integrations";
import { GuidesTeaser } from "@/components/marketing/guides-teaser";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/cta";
import { buildMetadata } from "@/lib/seo/metadata";
import { SoftwareApplicationLd } from "@/lib/seo/jsonld";

export const metadata = buildMetadata({
  title: "Fantasy Football Draft Order: Free, Open-Source Randomizer",
  description:
    "Free, open-source fantasy football draft order generator. Schedule the draw, share one link, and watch your order picked live. Sleeper, ESPN, MFL and more.",
  path: "/",
});

export default function HomePage() {
  return (
    <main>
      <SoftwareApplicationLd />
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
