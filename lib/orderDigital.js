// An order is "digital only" when every item is a product that needs no shipping
// (requiresShipping === false, e.g. an emailed astrology report). Such orders
// have no parcel, tracking number, invoice or EZPost label.
// `productsById`: { [productId]: product }. Unknown products count as physical.

/** @param {Array<{productId: string}>} items */
export function isDigitalOnlyOrder(items, productsById = {}) {
  const list = Array.isArray(items) ? items : [];
  return list.length > 0 && list.every((item) => productsById[item?.productId]?.requiresShipping === false);
}
