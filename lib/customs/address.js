// Read the order's 收件地址 text back into fields.
//
// New orders: "Name, Line 1[, Line 2], City, State, ZIP, Country, Tel: phone"
// Older orders: "Line 1[, Line 2], City, State, ZIP, Country" (no name/phone)
// Fields never contain commas (they are removed when the order is saved).

export function parseShippingAddress(text, fallbackName = "") {
  let parts = String(text || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  let phone = "";
  const last = parts[parts.length - 1] || "";
  if (/^tel:/i.test(last)) {
    phone = last.replace(/^tel:\s*/i, "");
    parts = parts.slice(0, -1);
  }
  const hasName = Boolean(phone); // the format with a phone also starts with the name

  const country = parts.pop() || "";
  const postalCode = parts.pop() || "";
  const stateProvince = parts.pop() || "";
  const city = parts.pop() || "";
  const fullName = hasName ? parts.shift() || "" : String(fallbackName || "");
  const addressLine1 = parts.shift() || "";
  const addressLine2 = parts.join(" ");

  return { fullName, addressLine1, addressLine2, city, stateProvince, postalCode, country, phone };
}

export function isUnitedStates(country) {
  return /^(united states|usa|us|u\.s\.a?\.?)$/i.test(String(country || "").trim());
}
