import LegalDoc, { A, B } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/lib/legal";

export const metadata = {
  title: "Terms of Service | VESPER COSMOS",
  description:
    "Terms of Service for VESPER COSMOS: eligibility, orders and payment, astrology disclaimer, member accounts, liability and dispute resolution.",
};

const sections = [
  {
    title: "Who We Are",
    paragraphs: [
      <>
        This website is operated by {LEGAL.operatorDescription} (&quot;VESPER COSMOS&quot;,
        &quot;we&quot;, &quot;us&quot;). By accessing the site, creating a member account or
        placing an order, you agree to these Terms of Service, our{" "}
        <A href="/privacy">Privacy Policy</A>, our <A href="/returns">Return &amp; Refund Policy</A>{" "}
        and, if you are a member, the <A href="/member-agreement">Member &amp; Referral Program
        Agreement</A>. If you do not agree, please do not use the site.
      </>,
    ],
  },
  {
    title: "Eligibility",
    bullets: [
      "You must be at least 13 years old to create a member account.",
      "If you are under 18 (or the age of majority where you live), you may only use the site and make purchases with the involvement and consent of a parent or legal guardian, who agrees to these Terms on your behalf.",
      "You must be at least 18 years old to take part in the Referral Program or receive commission payouts.",
      "We do not knowingly collect personal information from children under 13. See our Privacy Policy.",
    ],
  },
  {
    title: "Member Accounts",
    paragraphs: [
      "Member accounts are created by signing in with Google. You are responsible for keeping access to your Google account secure and for activity under your member account. Tell us promptly if you believe your account has been used without permission.",
      "We may suspend or close an account that violates these Terms, is used fraudulently, or abuses the Referral Program.",
    ],
  },
  {
    title: "Products, Pricing and Orders",
    bullets: [
      "All prices are listed in U.S. dollars (USD). Prices, availability and product details may change without notice. Any applicable taxes, duties or import fees charged by your country are your responsibility unless stated otherwise at checkout.",
      "Placing an order is an offer to buy. An order is accepted only after we verify your payment. We may refuse or cancel an order — for example if an item is out of stock, a pricing error occurred, or we suspect fraud — and we will refund any payment received for a cancelled order.",
      "Many of our items are handcrafted from natural materials. Natural variations in color, texture and pattern are expected and are not defects.",
      <>
        Shipping times are described on our <A href="/shipping">Shipping &amp; Delivery</A> page. If
        we cannot ship within the stated time (or, if no time is stated, within 30 days), we will
        notify you and give you the option to cancel for a full refund.
      </>,
      <>
        Returns and refunds are governed by our <A href="/returns">Return &amp; Refund Policy</A>.
        Custom and personalized items are final sale except where they arrive damaged or defective,
        or where applicable law gives you additional rights. Customers in Taiwan have a 7-day right
        of withdrawal for distance purchases, subject to the statutory exceptions described there.
      </>,
      <>
        We ship from Taiwan. Import duties, tariffs, taxes and carrier customs-handling fees charged
        by your country are your responsibility. In the United States, duty-free &quot;de
        minimis&quot; entry has been suspended, so U.S. orders may incur duties or fees on delivery.
        See <A href="/shipping">Shipping &amp; Delivery</A>.
      </>,
      <>
        Any &quot;compare at&quot; or crossed-out price shows a price at which the item was actually
        offered for a reasonable period before the sale.
      </>,
    ],
  },
  {
    title: "Business Information",
    paragraphs: [
      <>
        Seller: {LEGAL.businessName}
        {LEGAL.representative ? `, represented by ${LEGAL.representative}` : ""}
        {LEGAL.taiwanBusinessId ? ` (Taiwan Business ID ${LEGAL.taiwanBusinessId})` : ""}, based in
        Taiwan. Contact: <A href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</A>
        {LEGAL.phone ? `, ${LEGAL.phone}` : ""}
        {LEGAL.mailingAddress ? `. Address: ${LEGAL.mailingAddress}` : ""}.
      </>,
    ],
  },
  {
    title: "Payment",
    paragraphs: [
      "Payments are processed by PayPal. We never receive or store your full card details. After you pay, your order shows as \"Payment Under Review\" until we confirm the payment was received, after which it is marked paid and moves into production.",
    ],
  },
  {
    title: "Astrology, Crystal and Wellness Disclaimer",
    paragraphs: [
      <>
        Our astrology reports (including BaZi and Zi Wei Dou Shu), crystal products and
        energy-themed items are offered for <B>spiritual reflection, inspiration and entertainment</B>.
      </>,
    ],
    bullets: [
      "They are not medical, psychological, legal, financial or other professional advice, and are not a substitute for it. Always consult a qualified professional about health, legal or financial decisions.",
      "We make no claim that any product or reading will diagnose, treat, cure or prevent any condition, or produce any particular outcome in your life.",
      "Crystals and small components may be a choking hazard. Keep products away from young children and pets. Do not ingest crystals or use them in drinks.",
    ],
  },
  {
    title: "Acceptable Use",
    paragraphs: ["You agree not to:"],
    bullets: [
      "break any law or infringe anyone's rights while using the site;",
      "interfere with the site's security or operation, or try to access accounts or data that are not yours;",
      "scrape, copy or resell site content or products without our written permission;",
      "submit false information, place fraudulent orders, or game the Referral Program.",
    ],
  },
  {
    title: "Intellectual Property",
    paragraphs: [
      "All content on this site — including text, images, logos, product designs and digital reports — belongs to VESPER COSMOS or its licensors and is protected by copyright and other laws. Digital reports are licensed to you for personal, non-commercial use only.",
    ],
  },
  {
    title: "Disclaimer of Warranties",
    paragraphs: [
      "Except as expressly stated in these Terms or required by law, the site and our products and services are provided \"as is\" and \"as available\", without warranties of any kind, express or implied, including implied warranties of merchantability, fitness for a particular purpose and non-infringement. Some jurisdictions do not allow these exclusions, so they may not apply to you.",
    ],
  },
  {
    title: "Limitation of Liability",
    paragraphs: [
      "To the fullest extent permitted by law, VESPER COSMOS will not be liable for any indirect, incidental, special, consequential or punitive damages, or for lost profits, data or goodwill, arising from your use of the site or our products. Our total liability for any claim relating to an order is limited to the amount you paid for that order.",
      "Nothing in these Terms limits liability that cannot be limited by law, or removes any rights you have as a consumer under the mandatory laws of the place where you live.",
    ],
  },
  {
    title: "Indemnity",
    paragraphs: [
      "You agree to indemnify VESPER COSMOS against claims, losses and costs (including reasonable legal fees) arising from your breach of these Terms or misuse of the site, including any content you publish when promoting the Referral Program.",
    ],
  },
  {
    title: "Governing Law and Disputes",
    paragraphs: [
      "These Terms are governed by the laws of Taiwan (Republic of China), without regard to conflict-of-law rules. This does not deprive you of the protection of mandatory consumer-protection laws of the U.S. state or country where you live.",
      <>
        If you have a problem, please contact us first at{" "}
        <A href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</A> — we will try to resolve it
        within 30 days. If we cannot, either of us may bring a claim in the Taipei District Court,
        or you may bring an individual claim in a small-claims court where you live if it has
        jurisdiction.
      </>,
    ],
  },
  {
    title: "Changes to These Terms",
    paragraphs: [
      "We may update these Terms from time to time. The effective date above shows when they last changed. For material changes we will ask members to review and accept the updated terms when they next sign in. Continuing to use the site after changes take effect means you accept them.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDoc
      kicker="Legal · Guidelines & Agreements"
      title="Terms of Service"
      intro={[
        "Please read these Terms carefully. They explain your rights and obligations when you use the VESPER COSMOS website, become a member, or buy from us.",
      ]}
      sections={sections}
    />
  );
}
