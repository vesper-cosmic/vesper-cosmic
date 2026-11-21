import { beforeEach, describe, expect, it, vi } from "vitest";
import { addressFromSaved, applyContactChoice, getSavedContact } from "@/lib/contactDataClient";

function stubStorage() {
  const data = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  });
  return data;
}

const address = { addressLine1: "1 Main St", addressLine2: "", city: "Austin", stateProvince: "TX", postalCode: "78701", country: "United States", phone: "+1 555 123 4567" };

describe("saved contact details", () => {
  let store;
  beforeEach(() => {
    store = stubStorage();
  });

  it("members: name, email and address come from the account", () => {
    const member = { email: "a@b.com", name: "Amy Lee", defaultAddress: { fullName: "Amy Lee", ...address } };
    const saved = getSavedContact(member, "a@b.com");
    expect(saved).toMatchObject({ firstName: "Amy", lastName: "Lee", email: "a@b.com" });
    expect(saved.address).toMatchObject({ stateProvince: "TX", country: "United States", phone: "+1 555 123 4567" });
  });

  it("a signed-in member with nothing saved still gets the account email", () => {
    expect(getSavedContact({ email: "a@b.com", name: "", defaultAddress: {} }, "a@b.com")).toMatchObject({ email: "a@b.com", address: null });
  });

  it("guests: nothing saved → null; saved in this browser → filled", async () => {
    expect(getSavedContact(null, "")).toBeNull();
    await applyContactChoice({ keep: true, contact: { firstName: "Bo", lastName: "Chen", email: "bo@x.com", address }, isSignedIn: false });
    expect(getSavedContact(null, "")).toMatchObject({ firstName: "Bo", email: "bo@x.com", address: { city: "Austin" } });
  });

  it("a later digital-only order keeps the guest's saved address", async () => {
    await applyContactChoice({ keep: true, contact: { firstName: "Bo", lastName: "Chen", email: "bo@x.com", address }, isSignedIn: false });
    await applyContactChoice({ keep: true, contact: { firstName: "Bo", lastName: "Chen", email: "bo@x.com", address: null }, isSignedIn: false });
    expect(getSavedContact(null, "").address).toMatchObject({ addressLine1: "1 Main St" });
  });

  it("unticking forgets the browser copy", async () => {
    await applyContactChoice({ keep: true, contact: { firstName: "Bo", lastName: "", email: "bo@x.com", address }, isSignedIn: false });
    await applyContactChoice({ keep: false, contact: {}, isSignedIn: false });
    expect(store.size).toBe(0);
  });

  it("members: saves through saveDefaultAddress, only when the order had an address", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true });
    await applyContactChoice({ keep: true, contact: { firstName: "Amy", lastName: "Lee", email: "a@b.com", address }, isSignedIn: true, saveDefaultAddress: save });
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ fullName: "Amy Lee", stateProvince: "TX", country: "United States" }));
    save.mockClear();
    await applyContactChoice({ keep: true, contact: { firstName: "Amy", lastName: "Lee", email: "a@b.com", address: null }, isSignedIn: true, saveDefaultAddress: save });
    expect(save).not.toHaveBeenCalled();
  });

  it("addressFromSaved keeps the form's default country when none was saved", () => {
    expect(addressFromSaved({ city: "Taipei" })).toMatchObject({ city: "Taipei", country: "United States", phone: "" });
    expect(addressFromSaved({ country: "Taiwan" }).country).toBe("Taiwan");
  });
});
