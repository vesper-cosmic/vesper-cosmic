import LegalDoc, { A, B } from "@/components/legal/LegalDoc";

export const metadata = {
  title: "Member & Referral Program Agreement | VESPER COSMOS",
  description:
    "Member benefits, Referral Program rules, commissions, payouts and FTC disclosure requirements for VESPER COSMOS members.",
};

const sections = [
  {
    title: "Membership",
    paragraphs: [
      <>
        Membership is free. You become a member by signing in with Google and accepting this
        Agreement together with our <A href="/terms">Terms of Service</A> and{" "}
        <A href="/privacy">Privacy Policy</A>. You must be at least 13 years old to be a member. You
        may have only one member account.
      </>,
    ],
  },
  {
    title: "Member Benefits",
    bullets: [
      "Your cart and default shipping address are saved and restored on any device.",
      "Order history and live order status in your account.",
      "Optional newsletter with new arrivals and offers (you choose; unsubscribe any time).",
      "A personal referral link and code, and the chance to earn commissions (see below).",
      "Member level shown in your account based on your purchases. Any perks tied to levels will be announced on the site; levels have no cash value.",
    ],
    after: [
      "We may add, change or end member benefits. Changes do not affect orders already placed or commissions already earned.",
    ],
  },
  {
    title: "Referral Program — Eligibility",
    bullets: [
      "You must be at least 18 years old and have a valid PayPal account in your own name to take part in the Referral Program and receive payouts.",
      "Employees of VESPER COSMOS and their household members may share links but are not eligible for commissions.",
      "We may refuse or end participation where we reasonably suspect fraud, abuse or a breach of this Agreement.",
    ],
  },
  {
    title: "How Commissions Are Earned",
    bullets: [
      "Share your personal referral link or code. When someone buys through your link (it is remembered on their device for 30 days) or enters your code at checkout, the order is credited to you. If a member signed up through your link, their later orders are credited to you too.",
      "Each product has its own commission amount per unit, shown in U.S. dollars. The commission is fixed when the order is placed.",
      "You earn a commission on every qualifying purchase, with no limit on the number of orders.",
      "Purchases you make yourself, or with your own email or account, do not earn commissions.",
      "If more than one referral could apply, the referral code entered at checkout takes priority.",
    ],
  },
  {
    title: "Commission Status",
    bullets: [
      <>
        <B>Pending</B> — your friend has ordered. A commission becomes available only after the
        order is paid, shipped, and 8 days have passed since shipping.
      </>,
      <>
        <B>Available to Withdraw</B> — commissions that have passed the 8-day period.
      </>,
      <>
        <B>Payout Processing</B> — amounts you asked to withdraw that we are paying out.
      </>,
      <>
        <B>Lifetime Earnings</B> — the total commissions you have earned since joining.
      </>,
    ],
    after: [
      "If an order is cancelled, refunded, charged back or found to be fraudulent, its commission is cancelled. If that commission was already paid, we may deduct it from your future commissions.",
    ],
  },
  {
    title: "Payouts",
    bullets: [
      "You can request a payout once your available balance reaches $15.00 USD. The whole available balance is paid out in one request.",
      "Payouts are made only by PayPal, to the PayPal email you provide, usually within 5 business days. Make sure the email is correct — we are not responsible for payouts sent to an address you entered incorrectly.",
      "Any PayPal or currency-conversion fees charged to the recipient are your responsibility.",
      "We may ask you to confirm your identity or provide tax information before paying out, and may hold a payout while we review suspected fraud.",
    ],
  },
  {
    title: "Taxes",
    paragraphs: [
      "Commissions may be taxable income where you live. You are responsible for reporting and paying any taxes on commissions you receive. If the law requires us to collect tax information or issue tax forms, you agree to provide accurate information when asked.",
    ],
  },
  {
    title: "How You May Promote — FTC Disclosure Rules",
    paragraphs: [
      <>
        U.S. law (the FTC Endorsement Guides) requires you to <B>clearly disclose that you earn a
        commission</B> whenever you share your link or code. Put the disclosure right next to the
        link or recommendation — not hidden in a profile or behind &quot;more&quot; — for example:
        &quot;I earn a commission if you buy through my link&quot; or &quot;#ad&quot; /
        &quot;#commissionearned&quot;.
      </>,
    ],
    bullets: [
      "Only share honest opinions about products you have actually tried or know about.",
      "Do not claim that any product or reading cures, treats or prevents illness or guarantees results (money, love, health or otherwise).",
      "Do not send spam: no unsolicited bulk emails or text messages, and follow anti-spam laws (such as CAN-SPAM and the TCPA) and platform rules.",
      "Do not pretend to be VESPER COSMOS, use our name or logo in ads or domain names, or bid on our brand name in paid search ads.",
      "Do not post your link on coupon or deal sites, or offer cash back or other incentives that we have not approved.",
      "Do not create fake accounts, refer yourself, or place orders to generate commissions.",
    ],
    after: [
      "If you break these rules, we may cancel the affected commissions and end your participation.",
    ],
  },
  {
    title: "Relationship",
    paragraphs: [
      "You take part as an independent individual. Nothing in this Agreement makes you an employee, agent, partner or representative of VESPER COSMOS, and you may not make promises on our behalf.",
    ],
  },
  {
    title: "Changes and Ending Participation",
    paragraphs: [
      "We may change the Referral Program, commission amounts or this Agreement, or end the program, by updating this page. Material changes will be shown to members for acceptance when they next sign in. Commissions earned before a change are paid under the rules that applied when they were earned.",
      "You may stop participating at any time by emailing us. When participation ends, your available balance will be paid out if it meets the minimum and you are not in breach of this Agreement; balances below the minimum will be paid on request where the law requires it.",
    ],
  },
  {
    title: "Other Terms",
    paragraphs: [
      <>
        Our <A href="/terms">Terms of Service</A> — including the disclaimers, limitation of
        liability and governing-law sections — also apply to membership and the Referral Program.
        If this Agreement conflicts with the Terms of Service on a Referral Program matter, this
        Agreement controls.
      </>,
    ],
  },
];

export default function MemberAgreementPage() {
  return (
    <LegalDoc
      kicker="Legal · Membership"
      title="Member & Referral Program Agreement"
      intro={[
        "This Agreement explains the benefits of a VESPER COSMOS membership and the rules of our Referral Program. By becoming a member you agree to it.",
      ]}
      sections={sections}
    />
  );
}
