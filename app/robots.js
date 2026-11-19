import { SITE_URL } from "@/lib/siteUrl";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private or transactional pages: never useful in search results.
        disallow: ["/admin", "/api/", "/account", "/checkout", "/thank-you", "/auth", "/success"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
