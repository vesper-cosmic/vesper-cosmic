import { redirect } from "next/navigation";

export const metadata = {
  title: "Order Form | Vesper Cosmic",
  description:
    "The order form has moved to product-specific intake pages in the Vesper Cosmic shop.",
};

export default function LegacyOrderFormPage() {
  redirect("/shop");
}
