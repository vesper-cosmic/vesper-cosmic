import "./globals.css";
import { Cormorant_Garamond } from "next/font/google";
import Providers from "@/components/Providers";
import { CartProvider } from "@/lib/cartContext";
import { ProductProvider } from "@/components/ProductProvider";
import SiteHeader from "@/components/SiteHeader";
import AnnouncementBar from "@/components/AnnouncementBar";
import { REVEAL_BOOT_SCRIPT, RevealOnScroll } from "@/components/ScrollEffects";
import SiteFooter from "@/components/SiteFooter";
import CartDrawer from "@/components/shop/CartDrawer";

export const metadata = {
  metadataBase: new URL("https://vespercosmos.com"),
  title: {
    default:
      "VESPER COSMOS | Custom BaZi Crystal Press-On Nails & Modern Astrology",
    template: "%s | VESPER COSMOS",
  },
  description:
    "Elevate your frequency with VESPER COSMOS. Modern BaZi energy bottles, personalized astrological reports, and custom birth chart crystal press-on nails. Handcrafted for your personal element alignment.",
  keywords: [
    "Custom BaZi Press-On Nails",
    "Crystal Energy Bottle",
    "Personalized Eastern Astrology Report PDF",
    "Modern Feng Shui & BaZi Ritual Objects",
    "Four Pillars of Destiny",
    "BaZi crystal nails",
    "personalized astrology report",
    "luxury ritual objects",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "VESPER COSMOS",
    title:
      "VESPER COSMOS | Custom BaZi Crystal Press-On Nails & Modern Astrology",
    description:
      "Elevate your frequency with VESPER COSMOS. Modern BaZi energy bottles, personalized astrological reports, and custom birth chart crystal press-on nails. Handcrafted for your personal element alignment.",
    url: "https://vespercosmos.com/",
    images: [
      {
        url: "/images/vesper-logo.png",
        width: 1200,
        height: 630,
        alt: "VESPER COSMOS — custom BaZi crystal press-on nails and modern astrology",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "VESPER COSMOS | Custom BaZi Crystal Press-On Nails & Modern Astrology",
    description:
      "Elevate your frequency with VESPER COSMOS. Modern BaZi energy bottles, personalized astrological reports, and custom birth chart crystal press-on nails.",
    images: ["/images/vesper-logo.png"],
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
  alternates: {
    canonical: "./", // each page canonicalises to its own URL (resolved against metadataBase)
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1C2B48",
};

// Display serif for headings (self-hosted by Next at build time).
const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://vespercosmos.com/#organization",
  name: "VESPER COSMOS",
  url: "https://vespercosmos.com/",
  logo: "https://vespercosmos.com/images/vesper-logo.png",
  description:
    "Haute occult ritual objects — custom BaZi press-on nails, crystal energy bottles, and personalized eastern astrology reports.",
  slogan: "where ancient eastern wisdom meets modern daily rituals",
  sameAs: [],
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: the boot script adds a class to <html> before React loads.
    <html lang="en" className={displayFont.variable} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: REVEAL_BOOT_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Providers>
          <CartProvider>
            <ProductProvider>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded focus:bg-[#1C2B48] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
              >
                Skip to main content
              </a>
              <AnnouncementBar />
              <SiteHeader />
              <div id="main-content" tabIndex={-1} className="outline-none">
                {children}
              </div>
              <SiteFooter />
              <CartDrawer />
              <RevealOnScroll />
            </ProductProvider>
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
