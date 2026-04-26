import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, DM_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { FeedbackButton } from "@/components/feedback-button";
import { OrganizationLd, WebsiteLd } from "@/lib/seo/jsonld";
import {
  SITE_NAME,
  SITE_TAGLINE,
  SITE_TWITTER,
  SITE_URL,
} from "@/lib/seo/metadata";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A1628",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Free, Open-Source Fantasy Draft Randomizer`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  generator: "Next.js",
  keywords: [
    "fantasy draft order",
    "fantasy draft order generator",
    "fantasy draft randomizer",
    "fantasy football draft order",
    "draft lottery",
    "open source draft randomizer",
    "sleeper draft order",
    "espn draft order",
    "yahoo draft order",
    "fleaflicker draft order",
    "myfantasyleague draft order",
    "fantasy basketball draft order",
    "fantasy baseball draft order",
    "fantasy hockey draft order",
    "live draft order reveal",
  ],
  referrer: "origin-when-cross-origin",
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: SITE_URL,
    title: `${SITE_NAME} — Free, Open-Source Fantasy Draft Randomizer`,
    description: SITE_TAGLINE,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — transparent fantasy draft randomizer`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Free, Open-Source Fantasy Draft Randomizer`,
    description: SITE_TAGLINE,
    images: ["/opengraph-image"],
    site: SITE_TWITTER,
    creator: SITE_TWITTER,
  },
  robots: {
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
  category: "sports",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col bg-midnight text-chalk">
        <div className="relative z-10 flex min-h-full flex-col">{children}</div>
        <FeedbackButton />
        <Toaster
          theme="dark"
          richColors
          toastOptions={{
            style: {
              background: "var(--color-sideline)",
              color: "var(--color-chalk)",
              border: "1px solid rgba(100, 116, 139, 0.3)",
            },
          }}
        />
        <OrganizationLd />
        <WebsiteLd />
      </body>
    </html>
  );
}
