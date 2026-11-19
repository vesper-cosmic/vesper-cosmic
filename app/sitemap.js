import { getAllProducts } from "@/lib/productServer";
import { isProductPublished } from "@/lib/productData";
import { SITE_URL } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

// Public pages plus every published product's order page. If the product
// source is unreachable the static pages are still listed.
export default async function sitemap() {
  const now = new Date();
  const pages = ["", "/shop", "/about", "/faq", "/contact", "/shipping", "/returns", "/terms", "/privacy", "/accessibility", "/member-agreement"].map(
    (path) => ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency: path === "" || path === "/shop" ? "weekly" : "monthly", priority: path === "" ? 1 : path === "/shop" ? 0.9 : 0.5 })
  );

  let products = [];
  try {
    const result = await getAllProducts();
    products = (result.products || []).filter(isProductPublished);
  } catch (error) {
    console.error("sitemap: products unavailable:", error.message);
  }

  return [
    ...pages,
    ...products
      .filter((p) => p.slug)
      .map((p) => ({ url: `${SITE_URL}/order/${p.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.8 })),
  ];
}
