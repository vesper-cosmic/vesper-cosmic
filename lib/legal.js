// Business details used across the legal pages, consent records and emails.
// Empty fields are hidden on the site. Taiwan's online-retail disclosure
// rules expect the business name, representative, address, phone and email;
// US CAN-SPAM requires a valid postal address in every marketing email.
export const LEGAL = {
  businessName: "VESPER COSMOS",
  operatorDescription: "VESPER COSMOS, a business operated from Taiwan",
  representative: "", // 負責人 / 代表人
  taiwanBusinessId: "", // 統一編號（若有）
  phone: "",
  contactEmail: "vesper.cosmic.blueprint@gmail.com",
  mailingAddress: "",
  effectiveDate: "November 9, 2026",
};

// Bump when the Terms, Privacy Policy or Member Agreement change in a way
// members must agree to again. Members with an older version are asked to
// accept the new terms after signing in.
export const CONSENT_VERSION = "2026-11-09";
