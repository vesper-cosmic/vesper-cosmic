import { redirect } from "next/navigation";

export const metadata = {
  title: "Order Form | Vesper Cosmos",
  description:
    "The order form has moved to product-specific intake pages in the Vesper Cosmos shop.",
};

export default function LegacyOrderFormPage() {
  redirect("/shop");
}
