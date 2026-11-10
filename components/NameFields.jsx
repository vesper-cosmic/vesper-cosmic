"use client";

// First / Last name inputs. Forms keep the combined "First Last" in their
// existing fullName field, so orders, Notion and emails are unchanged.

const inputClass =
  "w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]";
const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]";

export function joinName(firstName, lastName) {
  return [firstName, lastName].map((part) => String(part || "").trim()).filter(Boolean).join(" ");
}

/** Best-effort split of an old single-field name: last word = last name. */
export function splitName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  const lastName = parts.pop();
  return { firstName: parts.join(" "), lastName };
}

/** Errors for missing first/last name, keyed `${prefix}FirstName` / `${prefix}LastName`. */
export function nameErrors(firstName, lastName, prefix = "") {
  const errors = {};
  const key = (name) => (prefix ? `${prefix}${name}` : name.charAt(0).toLowerCase() + name.slice(1));
  if (!String(firstName || "").trim()) errors[key("FirstName")] = "First name is required.";
  if (!String(lastName || "").trim()) errors[key("LastName")] = "Last name is required.";
  return errors;
}

export default function NameFields({
  firstName,
  lastName,
  onChange,
  firstError,
  lastError,
  firstLabel = "First Name",
  lastLabel = "Last Name",
  idPrefix = "name",
  className = inputClass,
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor={`${idPrefix}-first`} className={labelClass}>
          {firstLabel}
        </label>
        <input
          id={`${idPrefix}-first`}
          type="text"
          autoComplete={idPrefix.startsWith("ship") ? "shipping given-name" : "given-name"}
          value={firstName || ""}
          onChange={(event) => onChange(event.target.value, lastName || "")}
          className={className}
        />
        {firstError ? <p className="mt-1 text-xs text-red-500">{firstError}</p> : null}
      </div>
      <div>
        <label htmlFor={`${idPrefix}-last`} className={labelClass}>
          {lastLabel}
        </label>
        <input
          id={`${idPrefix}-last`}
          type="text"
          autoComplete={idPrefix.startsWith("ship") ? "shipping family-name" : "family-name"}
          value={lastName || ""}
          onChange={(event) => onChange(firstName || "", event.target.value)}
          className={className}
        />
        {lastError ? <p className="mt-1 text-xs text-red-500">{lastError}</p> : null}
      </div>
    </div>
  );
}
