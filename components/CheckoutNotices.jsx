"use client";

import Link from "next/link";

/**
 * Notices shown before an order is placed:
 * - final-sale acknowledgment for custom / personalized items (required);
 * - import duties for shipped orders (prepaid for the U.S.);
 * - terms, returns and privacy notice.
 */
export default function CheckoutNotices({ hasCustomItems, hasShippingItems, ackFinalSale, onAckChange }) {
  return (
    <div className="space-y-3">
      {hasCustomItems ? (
        <label className="flex items-start gap-2 rounded border border-[#C77A0A]/40 bg-[#FDF6E3] p-3 text-sm leading-6 text-[#5B4210]">
          <input
            type="checkbox"
            checked={ackFinalSale}
            onChange={(event) => onAckChange(event.target.checked)}
            className="mt-1"
            required
          />
          <span>
            I understand that custom and personalized items (made from my birth details or nail
            sizes, including digital reports) are made to order and are <strong>final sale</strong>,
            and I ask you to start preparing them after payment. They can&apos;t be returned for a
            change of mind or incorrect details I provide, but are covered if damaged or defective.
          </span>
        </label>
      ) : null}

      {hasShippingItems ? (
        <p className="text-xs leading-5 text-[#5B7893]">
          Ships from Taiwan. <strong>U.S. orders: duties prepaid — nothing to pay on delivery.</strong>{" "}
          Other countries may charge local duties or taxes on delivery.{" "}
          <Link href="/shipping" target="_blank" className="underline">
            Details
          </Link>
        </p>
      ) : null}

      <p className="text-xs leading-5 text-[#5B7893]">
        By placing your order you agree to our{" "}
        <Link href="/terms" target="_blank" className="underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/returns" target="_blank" className="underline">
          Return &amp; Refund Policy
        </Link>
        . We use your details only to process and deliver your order, as described in our{" "}
        <Link href="/privacy" target="_blank" className="underline">
          Privacy Policy
        </Link>
        . Astrology readings and crystal products are for reflection and entertainment and are not
        medical or other professional advice.
      </p>
    </div>
  );
}
