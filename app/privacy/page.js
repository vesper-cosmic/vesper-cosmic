import LegalDoc, { A, B } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/lib/legal";

export const metadata = {
  title: "Privacy Policy | VESPER COSMOS",
  description:
    "How VESPER COSMOS collects, uses, shares and protects personal information, and the privacy rights available to you, including California residents.",
};

const CATEGORIES = [
  ["Identifiers", "Name, email address, shipping address, Google account email used to sign in, member referral code.", "From you and from Google sign-in"],
  ["Commercial information", "Orders, products purchased, amounts, payment status (not card numbers), saved cart, member level and spending totals.", "From you and our order records"],
  ["Personalization details", "Birth date, birth time, birth city, daylight-saving information, biological gender, intentions, nail sizes and style preferences you choose to give for custom items.", "From you"],
  ["Referral Program information", "Who referred you or whom you referred (shown to referrers only as a first initial), commissions earned, payout requests and the PayPal email you give for payouts.", "From you and our records"],
  ["Communications and preferences", "Messages you send us, newsletter preference, and records of which version of our terms you accepted and when.", "From you"],
  ["Technical information", "Basic server logs (such as IP address and browser type) kept by our hosting provider for security and troubleshooting.", "Automatically"],
];

const sections = [
  {
    title: "Information We Collect",
    paragraphs: [
      "We collect only what we need to run the shop, make your custom items and operate member features:",
    ],
    after: [
      <div key="table" className="overflow-x-auto rounded-lg border border-[#8EB1D1]/25 bg-white/60">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-[#E8ECEF] text-xs uppercase tracking-[0.08em] text-[#5B7893]">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Examples</th>
              <th className="px-4 py-3">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#8EB1D1]/20 text-[#35506B]">
            {CATEGORIES.map(([category, examples, source]) => (
              <tr key={category}>
                <td className="px-4 py-3 align-top font-semibold text-[#1C2B48]">{category}</td>
                <td className="px-4 py-3 align-top">{examples}</td>
                <td className="px-4 py-3 align-top">{source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
      "We do not receive or store your payment card details — payments are handled by PayPal. Birth details are optional and are requested only for products that need them. If you tick “Save my birth details for my next order” at checkout, we keep them on your account (or, if you are not signed in, only in your own browser) to fill in your next order; you can delete them any time from your account page or by unticking the box on your next order.",
    ],
  },
  {
    title: "How We Use Information",
    bullets: [
      "To process, make, ship and support your orders, including verifying payments.",
      "To prepare personalized astrology reports and custom products you request.",
      "To run member features: saved cart and address, order history, member level, Referral Program tracking and commission payouts.",
      "To send order, shipping and account messages, and — only if you subscribe — our newsletter.",
      "To keep the site secure, prevent fraud and Referral Program abuse, and comply with legal, tax and accounting obligations.",
    ],
  },
  {
    title: "How We Share Information",
    paragraphs: [
      <>
        <B>We do not sell your personal information, and we do not share it for cross-context
        behavioral advertising.</B> We have not done so in the past 12 months. We share personal
        information only with service providers that help us run the shop, under their terms that
        restrict how they use it:
      </>,
    ],
    bullets: [
      "Google — sign-in (we receive your name and email address).",
      "PayPal — payments and commission payouts.",
      "Notion — secure database where orders and member records are stored.",
      "Resend — sending order and account emails.",
      "Vercel — website hosting.",
      "Postal and courier services — delivering physical orders (name and shipping address).",
    ],
    after: [
      "We may also disclose information if required by law, to protect our rights or users' safety, or as part of a sale or reorganization of the business. If you join the Referral Program, the friends you refer are not shown your details, and you see only a first initial for their orders.",
    ],
  },
  {
    title: "Cookies and Browser Storage",
    paragraphs: [
      "We do not use advertising or analytics trackers. We use only what the site needs to work:",
    ],
    bullets: [
      "A sign-in session cookie that keeps you logged in.",
      "Browser storage that remembers your cart and checkout progress on your device.",
      "Browser storage that remembers a referral code from a friend's link for up to 30 days, so the referral can be credited at checkout.",
    ],
    after: [
      "Because we do not sell or share personal information, there is nothing to opt out of, but we still treat Global Privacy Control (GPC) signals as a request to opt out of sale and sharing.",
    ],
  },
  {
    title: "How Long We Keep Information",
    paragraphs: [
      "We keep order records for as long as needed to fulfil orders, handle returns and meet tax and accounting obligations (generally up to 7 years). Member account information is kept while your account is active. Referral and payout records are kept for as long as needed to pay commissions and meet legal obligations. When information is no longer needed, we delete or anonymize it. You can ask us to delete your information at any time (see below).",
    ],
  },
  {
    title: "Security",
    paragraphs: [
      "We use encrypted connections (HTTPS), sign-in through Google, restricted admin access and reputable service providers to protect your information. No system is perfectly secure; if a breach affecting your personal information occurs, we will notify you as required by law.",
    ],
  },
  {
    title: "International Transfers",
    paragraphs: [
      "We are based in Taiwan and our service providers operate in the United States and other countries. By using the site, your information may be processed outside the state or country where you live, with appropriate safeguards.",
    ],
  },
  {
    title: "Children's Privacy",
    paragraphs: [
      <>
        Our site is not directed to children under 13, and we do not knowingly collect personal
        information from them. If you believe a child under 13 has given us personal information,
        contact us and we will delete it.
      </>,
    ],
  },
  {
    title: "Your Choices",
    bullets: [
      <>
        <B>Newsletter:</B> you can subscribe or unsubscribe any time in your{" "}
        <A href="/account">account</A> under Email Preferences, or by using the unsubscribe link in
        any newsletter. Order and account emails will still be sent.
      </>,
      <>
        <B>Account details:</B> you can update your address and preferences in your account.
      </>,
    ],
  },
  {
    title: "Your Privacy Rights (including California and other U.S. states)",
    paragraphs: [
      "Depending on where you live — including California (CCPA/CPRA) and other U.S. states with consumer privacy laws such as Virginia, Colorado, Connecticut, Utah, Texas and Oregon — you may have the right to:",
    ],
    bullets: [
      "Know and access the personal information we have about you, including the categories, sources, purposes and recipients described in this policy.",
      "Delete personal information we collected from you, subject to legal exceptions (for example, records we must keep for tax purposes).",
      "Correct inaccurate personal information.",
      "Receive a copy of your information in a portable format.",
      "Opt out of the sale or sharing of personal information and of targeted advertising — we do not do either.",
      "Limit the use of sensitive personal information — we use any such information only to provide the products and services you request.",
      "Not be discriminated against for exercising any of these rights.",
    ],
    after: [
      <>
        To make a request, email <A href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</A>{" "}
        from the email address linked to your orders or member account, with the subject
        &quot;Privacy Request&quot;. We will verify your identity by confirming control of that email
        address and respond within 45 days (we may extend this once by another 45 days where
        allowed, and will tell you why). You may use an authorized agent; we will ask for proof of
        their authority and may ask you to verify your identity directly. If we deny your request,
        you may appeal by replying to our decision with the subject &quot;Privacy Appeal&quot;; we
        will respond within the time required by your state&apos;s law.
      </>,
      "California residents may also request information about disclosures of personal information to third parties for their direct marketing purposes (California \"Shine the Light\" law). We do not make such disclosures.",
    ],
  },
  {
    title: "Notice Under Taiwan's Personal Data Protection Act",
    paragraphs: [
      "As we are based in Taiwan, the following notice is given under Article 8 of Taiwan's Personal Data Protection Act (個人資料保護法):",
    ],
    bullets: [
      <>
        <B>Collector:</B> {LEGAL.operatorDescription}.
      </>,
      <>
        <B>Purposes:</B> online retail and fulfilment of orders, customer and member management and
        services, marketing (only with your consent), referral program administration, and
        compliance with tax, accounting and other legal obligations.
      </>,
      <>
        <B>Categories:</B> identification data (such as name, email, address), personal details you
        choose to give for custom items (such as birth date, time and place, gender, nail sizes),
        transaction and payment-status records, and PayPal payout email for referral members.
      </>,
      <>
        <B>Period:</B> for as long as needed for the purposes above or as required by law (see
        &quot;How Long We Keep Information&quot;). <B>Area:</B> Taiwan and the countries where our
        service providers operate (including the United States). <B>Recipients:</B> us and the
        service providers listed above. <B>Method:</B> automated and manual processing.
      </>,
      <>
        <B>Your rights</B> (Article 3): to ask to view or obtain a copy of your data, supplement or
        correct it, stop its collection, processing or use, and have it deleted. Email{" "}
        <A href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</A>.
      </>,
      <>
        <B>If you do not provide data:</B> you can browse freely, but we may be unable to process an
        order (for example without a shipping address) or make a personalized item (without birth
        details or sizes).
      </>,
    ],
  },
  {
    title: "Changes to This Policy",
    paragraphs: [
      "We will update this policy when our practices change. The effective date above shows the latest version. For material changes we will notify members, for example when they next sign in.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDoc
      kicker="Legal · Your Privacy Matters"
      title="Privacy Policy"
      intro={[
        "This Privacy Policy explains how VESPER COSMOS collects, uses, shares and protects your personal information when you visit our website, become a member or buy from us, and the choices and rights you have.",
      ]}
      sections={sections}
    />
  );
}
