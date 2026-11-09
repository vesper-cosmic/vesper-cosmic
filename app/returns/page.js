import LegalDoc, { A, B } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/lib/legal";

export const metadata = {
  title: "Return & Refund Policy | VESPER COSMOS",
  description:
    "VESPER COSMOS return and refund policy: final sale for custom and personalized items, returns for unopened ready-made items, damaged or defective orders, and refund timing.",
};

const mail = <A href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</A>;

const sections = [
  {
    title: "Custom & Personalized Items — Final Sale",
    paragraphs: [
      "Custom BaZi press-on nails, custom energy bottles, DIY BaZi sachet kits and personalized astrology reports are made to order from the birth details and sizes you provide. Because they cannot be resold, they are final sale and cannot be returned or exchanged for a change of mind or for sizes you entered incorrectly.",
      "Digital astrology reports are delivered by email. By ordering, you ask us to start preparing your report after payment, and you acknowledge that it cannot be returned once preparation has begun.",
      "You are always protected if a custom item arrives damaged, defective or different from what you ordered — see section 3.",
    ],
  },
  {
    title: "Ready-Made Items",
    bullets: [
      <>
        You may return <B>unopened, unused</B> ready-to-ship items — including ready-made press-on
        nails, energy bottles and sachets — within <B>14 days of delivery</B> for a refund of the item
        price.
      </>,
      "For hygiene reasons, press-on nails whose sealed packaging has been opened cannot be returned unless defective.",
      "Items must be returned in their original packaging. Unless the item is defective or we sent the wrong item, return shipping is paid by you and the original shipping fee is not refunded.",
    ],
  },
  {
    title: "Damaged, Defective or Wrong Items",
    paragraphs: [
      <>
        If your order arrives damaged, defective or is not what you ordered, email {mail} within{" "}
        <B>48 hours of delivery</B> (or as soon as you reasonably can) with your order ID, a short
        description and photos of the item and packaging. We will offer, at your choice, a{" "}
        <B>replacement or a full refund</B> including the original shipping fee, and we cover any
        return shipping. This does not limit any rights you have under the law where you live.
      </>,
    ],
  },
  {
    title: "Customers in Taiwan — 7-Day Right of Withdrawal",
    paragraphs: [
      "Under Taiwan's Consumer Protection Act, for distance (online) purchases you may cancel the contract within 7 days after receiving the goods, without giving a reason and without charge, by notifying us by email or returning the item. Under the Regulations Governing Reasonable Exceptions to the Right of Withdrawal for Distance Sales, this right does not apply to:",
    ],
    bullets: [
      "items made to your specifications (custom and personalized items);",
      "personal hygiene products whose seal has been opened (such as press-on nails);",
      "digital content not supplied on a physical medium, and online services completed upon delivery, where you agreed in advance that we begin supplying it.",
    ],
    after: [
      "Our 14-day return window for ready-made items is longer than the statutory 7 days and applies to customers everywhere.",
    ],
  },
  {
    title: "How to Return an Item",
    bullets: [
      <>Email {mail} with your order ID and the item you want to return. Please do not send items back without contacting us first.</>,
      "We will reply with the return address and instructions.",
      "Pack the item securely; we recommend a tracked shipping method.",
    ],
  },
  {
    title: "Refunds",
    paragraphs: [
      "Approved refunds are issued to your original payment method (PayPal) within 15 days after we receive the returned item or your valid cancellation notice (or, for damaged items where no return is needed, after we approve your claim). Your bank or PayPal may take additional time to show the credit.",
      "If you opened a PayPal dispute or chargeback, we will handle the refund through that process instead. Referral commissions on refunded orders are cancelled.",
    ],
  },
];

export default function ReturnsPage() {
  return (
    <LegalDoc
      kicker="Customer Care · Returns"
      title="Return & Refund Policy"
      intro={[
        "Because many of our creations are personalized and handcrafted, our return policy depends on the type of item. Your statutory consumer rights are not affected.",
      ]}
      sections={sections}
    />
  );
}
