import { GITHUB_URL, SITE_NAME, SITE_URL } from "./metadata";

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logo-512.png`,
        sameAs: [GITHUB_URL],
        description:
          "Open-source, transparent fantasy draft order randomizer. Trust by design.",
      }}
    />
  );
}

export function WebsiteLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
          "@type": "Action",
          name: "Create a fantasy draft order",
          target: `${SITE_URL}/new`,
        },
      }}
    />
  );
}

export function SoftwareApplicationLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "SportsApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        description:
          "Schedule a fantasy draft order, share one link, and watch the order drawn live from open-source code.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        author: { "@type": "Organization", name: SITE_NAME },
        codeRepository: GITHUB_URL,
      }}
    />
  );
}

type Faq = { q: string; a: string };

export function FaqLd({ faqs }: { faqs: Faq[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }}
    />
  );
}

type Crumb = { name: string; path: string };

export function BreadcrumbLd({ items }: { items: Crumb[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.name,
          item: c.path === "/" ? SITE_URL : `${SITE_URL}${c.path}`,
        })),
      }}
    />
  );
}

type EventLdProps = {
  name: string;
  startDate: string;
  endDate?: string;
  url: string;
  status: "SCHEDULED" | "DRAWING" | "COMPLETED";
  organizerName?: string;
};

export function EventLd({
  name,
  startDate,
  endDate,
  url,
  status: _status,
  organizerName,
}: EventLdProps) {
  const eventStatus = "https://schema.org/EventScheduled";
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Event",
        name,
        startDate,
        ...(endDate ? { endDate } : {}),
        eventStatus,
        eventAttendanceMode:
          "https://schema.org/OnlineEventAttendanceMode",
        location: {
          "@type": "VirtualLocation",
          url,
        },
        url,
        organizer: organizerName
          ? { "@type": "Organization", name: organizerName }
          : { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        description: `Live draft order randomization for ${name}.`,
      }}
    />
  );
}

type ArticleLdProps = {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
};

export function ArticleLd({
  title,
  description,
  path,
  datePublished,
  dateModified,
  image,
}: ArticleLdProps) {
  const url = `${SITE_URL}${path}`;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        url,
        mainEntityOfPage: url,
        datePublished,
        dateModified: dateModified ?? datePublished,
        image: image ? `${SITE_URL}${image}` : `${SITE_URL}/opengraph-image`,
        author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
          logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-512.png` },
        },
      }}
    />
  );
}
