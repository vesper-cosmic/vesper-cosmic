/**
 * Verify the submitted confirmation payload matches the order that was
 * originally created. Compares the fields that uniquely identify the order
 * and its customer so an attacker cannot confirm an order they did not
 * create.
 *
 * When the order was recovered from the Notion database (source ===
 * "notion"), only the fields that were written to Notion are available, so
 * the comparison is limited to those fields. In-memory orders are compared
 * against the full payload.
 */
export function ordersMatch(stored, submitted, source) {
  if (source === "notion") {
    return (
      stored.orderId === submitted.orderId &&
      String(stored.email || "").toLowerCase() ===
        String(submitted.email || "").toLowerCase() &&
      Number(stored.amount || 0) === Number(submitted.total || 0)
    );
  }

  if (
    stored.orderId !== submitted.orderId ||
    String(stored.email || "").toLowerCase() !==
      String(submitted.email || "").toLowerCase() ||
    stored.total !== submitted.total
  ) {
    return false;
  }

  const storedItems = stored.items || [];
  const submittedItems = submitted.items || [];

  if (storedItems.length !== submittedItems.length) return false;

  for (let i = 0; i < storedItems.length; i += 1) {
    const a = storedItems[i];
    const b = submittedItems[i];
    if (
      a.productId !== b.productId ||
      a.quantity !== b.quantity ||
      a.price !== b.price
    ) {
      return false;
    }
  }

  return true;
}
