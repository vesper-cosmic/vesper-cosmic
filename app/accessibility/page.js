import LegalDoc, { A } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/lib/legal";

export const metadata = {
  title: "Accessibility | VESPER COSMOS",
  description:
    "VESPER COSMOS is committed to making our website accessible to everyone, including people with disabilities.",
};

const sections = [
  {
    title: "Our Commitment",
    paragraphs: [
      "We want everyone — including people who use screen readers, keyboard navigation, magnification or other assistive technology — to be able to browse and shop with us. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA.",
    ],
  },
  {
    title: "What We Do",
    bullets: [
      "Text alternatives for product and brand images.",
      "A \"Skip to main content\" link and visible focus outlines for keyboard users.",
      "Labelled form fields, with clear error messages at checkout.",
      "Respecting your device's \"reduce motion\" setting.",
      "Reviewing new pages and features for accessibility as we build them.",
    ],
  },
  {
    title: "Need Help or Found a Problem?",
    paragraphs: [
      <>
        If any part of the site is hard to use, email{" "}
        <A href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</A> with the page and the
        problem. We will reply within 2 business days, and we are happy to help you place an order
        or get product information another way in the meantime.
      </>,
    ],
  },
];

export default function AccessibilityPage() {
  return (
    <LegalDoc
      kicker="Customer Care · Accessibility"
      title="Accessibility Statement"
      sections={sections}
    />
  );
}
