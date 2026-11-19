// Email addresses used by the site, in one place so moving to the new domain
// is an environment change, not a code change.
//
//   NEXT_PUBLIC_CONTACT_EMAIL — the public address: shown on the site, in email
//                               signatures, and used as Reply-To
//   OWNER_EMAIL               — where the shop's own notifications go
//                               (new orders, contact form, withdrawals)
//   EMAIL_FROM                — the From address on emails we send (must be
//                               allowed by the provider: a verified Gmail
//                               "send as" alias, a Workspace mailbox, or a
//                               Resend-verified domain). Defaults to the Gmail
//                               login, then RESEND_FROM_EMAIL.
//
// All default to the original Gmail inbox, so nothing changes until set.

const ORIGINAL = "vesper.cosmic.blueprint@gmail.com";

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || ORIGINAL;
export const OWNER_EMAIL = process.env.OWNER_EMAIL || ORIGINAL;

/** The From address (server only). */
export function fromEmail() {
  return process.env.EMAIL_FROM || process.env.GMAIL_USER || process.env.RESEND_FROM_EMAIL || ORIGINAL;
}
