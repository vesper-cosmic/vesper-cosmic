import { notFound } from "next/navigation";
import OrderIntakeForm from "@/components/forms/OrderIntakeForm";
import CheckoutGate from "@/components/CheckoutGate";
import { getProductBySlug } from "@/lib/productServer";
import { isProductPublished, isProductSoldOut } from "@/lib/productData";
import { SITE_URL } from "@/lib/siteUrl";

const absolute = (url) => (/^https?:\/\//i.test(url) ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`);

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { product } = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Order | Vesper Cosmos",
    };
  }

  const description =
    (product.description || "").replace(/\s+/g, " ").trim().slice(0, 200) ||
    `Order ${product.name} from Vesper Cosmos. ${product.fulfillmentTime || ""}`.trim();
  const image = product.images?.[0] ? absolute(product.images[0]) : `${SITE_URL}/images/vesper-logo.png`;
  const url = `${SITE_URL}/order/${product.slug}`;

  return {
    title: `${product.name} | Vesper Cosmos`,
    description,
    alternates: { canonical: url },
    openGraph: { title: product.name, description, url, type: "website", images: [image] },
    twitter: { card: "summary_large_image", title: product.name, description, images: [image] },
  };
}

export default async function ProductOrderPage({ params }) {
  const { slug } = await params;
  const { product } = await getProductBySlug(slug);

  if (!isProductPublished(product)) {
    notFound();
  }

  // Internal fields stay on the server (this prop is sent to the browser).
  const { referralCommission, customs, cost, ...publicProduct } = product;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: (product.description || "").replace(/\s+/g, " ").trim().slice(0, 500) || undefined,
    image: (product.images || []).map(absolute),
    brand: { "@type": "Brand", name: "VESPER COSMOS" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/order/${product.slug}`,
      priceCurrency: product.currency || "USD",
      price: Number(product.price).toFixed(2),
      availability: isProductSoldOut(product) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <main className="min-h-screen bg-transparent px-4 py-10 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-3xl">
        <CheckoutGate>
          <OrderIntakeForm product={publicProduct} />
        </CheckoutGate>
      </div>
    </main>
  );
}
