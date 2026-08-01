import { redirect } from "next/navigation";

export const metadata = {
  title: "Success | Vesper Cosmos",
  description: "Vesper Cosmos order success page.",
};

export default function LegacySuccessPage() {
  redirect("/thank-you");
}
