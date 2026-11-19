import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/productServer", () => ({
  getAllProducts: vi.fn(async () => ({
    products: [
      { id: "a", slug: "nails-a", published: true },
      { id: "b", slug: "hidden", published: false },
    ],
  })),
}));

describe("sitemap and robots", () => {
  it("lists public pages and only published products", async () => {
    const sitemap = (await import("@/app/sitemap.js")).default;
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain("https://vespercosmos.com");
    expect(urls).toContain("https://vespercosmos.com/shop");
    expect(urls).toContain("https://vespercosmos.com/order/nails-a");
    expect(urls.some((u) => u.includes("hidden"))).toBe(false);
  });
  it("keeps private areas out and points at the sitemap", async () => {
    const robots = (await import("@/app/robots.js")).default();
    expect(robots.rules[0].disallow).toEqual(expect.arrayContaining(["/admin", "/api/", "/checkout", "/account"]));
    expect(robots.sitemap).toBe("https://vespercosmos.com/sitemap.xml");
  });
});
