# VESPER COSMOS — 官網文案與 SEO 設定完整參考

> 用途：品牌故事、Footer 條款、SEO / Meta 數據。
> 下方所有片段皆可直接帶入 Next.js（App Router）專案使用。

---

## 1. 品牌故事 (About Us)

### 1-1. 首頁品牌故事區塊

放置位置：首頁 `/`（`app/page.js`）Hero 下方。

```jsx
{/* About Section — 首頁品牌故事區塊 */}
<section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="about-vesper-cosmos">
  <div className="mx-auto max-w-3xl text-center">
    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8EB1D1]">
      About
    </p>
    <h2
      id="about-vesper-cosmos"
      className="mt-4 text-3xl font-semibold leading-tight text-[#1C2B48] sm:text-4xl"
    >
      About VESPER COSMOS
    </h2>
    <p className="mt-3 text-base italic text-[#5B7893] sm:text-lg">
      where ancient eastern wisdom meets modern daily rituals.
    </p>
    <p className="mt-6 text-base leading-7 text-[#35506B] sm:text-lg sm:leading-8">
      We believe energy isn&rsquo;t something abstract—it is a personal
      frequency you carry every single day.
    </p>
    <p className="mt-5 text-base leading-7 text-[#35506B] sm:text-lg sm:leading-8">
      <strong className="font-semibold text-[#1C2B48]">VESPER COSMOS</strong>{" "}
      was born at the intersection of modern aesthetic design and authentic
      BaZi (Four Pillars of Destiny) metaphysics. We translate complex natal
      element analysis into tangible, beautifully crafted physical ritual
      objects—from custom crystal energy bottles to bespoke BaZi press-on
      nails tailored to your personal birth chart.
    </p>
    <p className="mt-5 text-base leading-7 text-[#35506B] sm:text-lg sm:leading-8">
      Every custom piece is individually aligned with your core elements,
      designed not just to adorn, but to empower your daily energy, intention,
      and growth.
    </p>
    <Link
      href="/about"
      className="mt-8 inline-block rounded-lg border border-[#8EB1D1]/40 bg-white/60 px-6 py-3 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5]"
    >
      Discover Our Story
    </Link>
  </div>
</section>
```

### 1-2. `/about` 獨立頁面

建立 `app/about/page.js`：

```jsx
export const metadata = {
  title: "About VESPER COSMOS | Modern BaZi Mystic Boutique",
  description:
    "Discover the story behind VESPER COSMOS — where modern aesthetic design meets authentic BaZi (Four Pillars of Destiny) metaphysics, crafting custom crystal energy bottles and bespoke press-on nails aligned to your birth chart.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8EB1D1]">
            Haute Occult · Modern Mystic Boutique
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#1C2B48] sm:text-5xl">
            About VESPER COSMOS
          </h1>
          <p className="mt-4 text-lg italic text-[#5B7893] sm:text-xl">
            where ancient eastern wisdom meets modern daily rituals.
          </p>
        </header>

        <div className="mt-12 space-y-6 text-base leading-8 text-[#35506B] sm:text-lg sm:leading-9">
          <p>
            We believe energy isn&rsquo;t something abstract—it is a personal
            frequency you carry every single day.
          </p>
          <p>
            <strong className="font-semibold text-[#1C2B48]">
              VESPER COSMOS
            </strong>{" "}
            was born at the intersection of modern aesthetic design and
            authentic BaZi (Four Pillars of Destiny) metaphysics. We translate
            complex natal element analysis into tangible, beautifully crafted
            physical ritual objects—from custom crystal energy bottles to
            bespoke BaZi press-on nails tailored to your personal birth chart.
          </p>
          <p>
            Every custom piece is individually aligned with your core elements,
            designed not just to adorn, but to empower your daily energy,
            intention, and growth.
          </p>
        </div>
      </section>
    </main>
  );
}
```

---

## 2. 電商頁面底部 (Footer) 架構

### 2-1. Footer 導覽結構

| 區塊 | 連結 |
|---|---|
| **Shop** | All Products · Press-On Nails · Energy Bottles · Sachets · Digital Reports |
| **Customer Care** | Shipping & Delivery · Return & Refund Policy · FAQ · Contact Us |
| **Legal** | Privacy Policy · Terms of Service |
| **Payment** | Apple Pay · Visa · Mastercard · PayPal · Shopify Payments |

### 2-2. Footer 完整 JSX 元件

建立 `components/SiteFooter.jsx`：

```jsx
import Link from "next/link";

const footerNav = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/shop" },
      { label: "Press-On Nails", href: "/shop/category/press-on-nails" },
      { label: "Energy Bottles", href: "/shop/category/energy-bottles" },
      { label: "Sachets", href: "/shop/category/sachets" },
      { label: "Digital Reports", href: "/shop/category/digital-reports" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { label: "Shipping & Delivery", href: "/shipping" },
      { label: "Return & Refund Policy", href: "/returns" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

// Payment badge placeholders — replace with official SVGs / icons
const paymentMethods = [
  { label: "Apple Pay", initials: "",
    symbol: (
      <svg aria-hidden="true" className="h-5 w-8" viewBox="0 0 32 20" role="img">
        <rect width="32" height="20" rx="3" fill="#fff" stroke="#1C2B48/20" />
        <text x="16" y="14" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1C2B48">
           Pay
        </text>
      </svg>
    ),
  },
  { label: "Visa", initials: "VISA" },
  { label: "Mastercard", initials: "MC" },
  { label: "PayPal", initials: "PayPal" },
  { label: "Shopify Payments", initials: "Shop" },
];

export default function SiteFooter() {
  const year = 2026;

  return (
    <footer className="border-t border-[#8EB1D1]/20 bg-[#E8ECEF]/95" aria-label="Site footer">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr] lg:gap-14">
          {/* Brand column */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/images/vesper-logo.png"
                alt="Vesper Cosmos"
                className="h-9 w-auto"
              />
              <span className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1C2B48]">
                Vesper<span className="text-[#8EB1D1]"> Cosmos</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#5B7893]">
              Haute occult ritual objects — custom BaZi press-on nails,
              crystal energy bottles, and personalized eastern astrology
              reports.
            </p>
          </div>

          {/* Link columns */}
          <nav
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
            aria-label="Footer navigation"
          >
            {footerNav.map((group) => (
              <div key={group.title}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1C2B48]">
                  {group.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-[#35506B] transition hover:text-[#1C2B48]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Payment badges */}
        <div className="mt-10 border-t border-[#8EB1D1]/20 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8EB1D1]">
            We Accept
          </p>
          <ul className="mt-3 flex flex-wrap items-center gap-2" aria-label="Accepted payment methods">
            {paymentMethods.map((method) => (
              <li
                key={method.label}
                className="flex h-9 min-w-[3.5rem] items-center justify-center rounded border border-[#8EB1D1]/30 bg-white px-2.5 text-[10px] font-bold tracking-wide text-[#1C2B48]"
              >
                {method.symbol || method.initials}
              </li>
            ))}
          </ul>
        </div>

        {/* Copyright */}
        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-[#8EB1D1]/20 pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-[#5B7893]">
            © 2026 VESPER COSMOS. All Rights Reserved.
          </p>
          <p className="text-xs text-[#8EB1D1]">
            Crafted with intention · Aligned with your elements
          </p>
        </div>
      </div>
    </footer>
  );
}
```

### 2-3. 加入 RootLayout

於 `app/layout.js` 中，在 `<CartDrawer />` 之後加入：

```jsx
import SiteFooter from "@/components/SiteFooter";

// 於 <SiteHeader /> 之前或之後皆可，Render 順序為：
<Providers>
  <CartProvider>
    <SiteHeader />
    {children}
    <SiteFooter />
    <CartDrawer />
  </CartProvider>
</Providers>
```

---

## 3. SEO 與 Meta 數據設定

### 3-1. Homepage Meta（現行欄位）

| 欄位 | 值 |
|---|---|
| **Meta Title** | `VESPER COSMOS \| Custom BaZi Crystal Press-On Nails & Modern Astrology` |
| **Meta Description** | `Elevate your frequency with VESPER COSMOS. Modern BaZi energy bottles, personalized astrological reports, and custom birth chart crystal press-on nails. Handcrafted for your personal element alignment.` |
| **Core Keywords** | `Custom BaZi Press-On Nails`, `Crystal Energy Bottle`, `Personalized Eastern Astrology Report PDF`, `Modern Feng Shui & BaZi Ritual Objects` |

### 3-2. Next.js `app/layout.js` 完整設定（可直接覆蓋）

```jsx
import "./globals.css";
import Providers from "@/components/Providers";
import { CartProvider } from "@/lib/cartContext";
import SiteHeader from "@/components/SiteHeader";
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
    canonical: "https://vespercosmos.com/",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E8ECEF",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <CartProvider>
            <SiteHeader />
            {children}
            <SiteFooter />
            <CartDrawer />
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
```

### 3-3. 純 HTML 版本（非 Next.js 場景 / Head 片段）

```html
<!-- Primary Meta Tags -->
<title>VESPER COSMOS | Custom BaZi Crystal Press-On Nails & Modern Astrology</title>
<meta name="title" content="VESPER COSMOS | Custom BaZi Crystal Press-On Nails & Modern Astrology" />
<meta name="description" content="Elevate your frequency with VESPER COSMOS. Modern BaZi energy bottles, personalized astrological reports, and custom birth chart crystal press-on nails. Handcrafted for your personal element alignment." />
<meta name="keywords" content="Custom BaZi Press-On Nails, Crystal Energy Bottle, Personalized Eastern Astrology Report PDF, Modern Feng Shui & BaZi Ritual Objects" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://vespercosmos.com/" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://vespercosmos.com/" />
<meta property="og:site_name" content="VESPER COSMOS" />
<meta property="og:title" content="VESPER COSMOS | Custom BaZi Crystal Press-On Nails & Modern Astrology" />
<meta property="og:description" content="Elevate your frequency with VESPER COSMOS. Modern BaZi energy bottles, personalized astrological reports, and custom birth chart crystal press-on nails. Handcrafted for your personal element alignment." />
<meta property="og:image" content="https://vespercosmos.com/images/vesper-logo.png" />
<meta property="og:image:alt" content="VESPER COSMOS — custom BaZi crystal press-on nails and modern astrology" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="VESPER COSMOS | Custom BaZi Crystal Press-On Nails & Modern Astrology" />
<meta name="twitter:description" content="Elevate your frequency with VESPER COSMOS. Modern BaZi energy bottles, personalized astrological reports, and custom birth chart crystal press-on nails. Handcrafted for your personal element alignment." />
<meta name="twitter:image" content="https://vespercosmos.com/images/vesper-logo.png" />
```

### 3-4. 品牌故事 JSON-LD（結構化資料，SEO 加分）

於首頁 `<head>` 或 Next.js `app/layout.js` 的 `jsonLd` 中引入：

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://vespercosmos.com/#organization",
  "name": "VESPER COSMOS",
  "url": "https://vespercosmos.com/",
  "logo": "https://vespercosmos.com/images/vesper-logo.png",
  "description": "Haute occult ritual objects — custom BaZi press-on nails, crystal energy bottles, and personalized eastern astrology reports.",
  "slogan": "where ancient eastern wisdom meets modern daily rituals",
  "sameAs": []
}
</script>
```

### 3-5. 商品圖片 Alt Text 範例

| 圖片類型 | Alt Text |
|---|---|
| 穿戴甲圖片 | `Custom BaZi crystal press-on nails tailored to birth chart elements` |
| 水晶瓶圖片 | `Handcrafted crystal energy bottle for wealth and abundance` |
| 香囊/福袋（Sachets） | `Ritual sachet infused with birth-chart aligned botanicals for daily protection` |
| 數位命盤報告 | `Personalized BaZi astrological report PDF aligned to your natal elements` |

對應 JSX 使用範例：

```jsx
<img
  src="/images/celestial-nails-1.svg"
  alt="Custom BaZi crystal press-on nails tailored to birth chart elements"
/>
<img
  src="/images/spell-jar-1.svg"
  alt="Handcrafted crystal energy bottle for wealth and abundance"
/>
```

---

## 4. Footer Legal 頁面（建議目錄）

以下頁面路徑建議預先建立對應路由（內容可於正式上線前補齊）：

| 路徑 | 頁面 |
|---|---|
| `/shipping` | Shipping & Delivery |
| `/returns` | Return & Refund Policy |
| `/faq` | FAQ |
| `/contact` | Contact Us |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |
| `/about` | About Us |

> 提示：Footer 中 `Press-On Nails / Energy Bottles / Sachets / Digital Reports` 的 URL 可依 `productCategories` 實際 id 調整（參照 `data/products.js`），若目前無獨立分類頁，可暫時全部指向 `/shop`。