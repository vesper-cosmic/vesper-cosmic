import { redirect } from "next/navigation";

export const metadata = {
  title: "Success | Vesper Cosmic",
  description: "Vesper Cosmic order success page.",
};

export default function LegacySuccessPage() {
  redirect("/thank-you");
}
