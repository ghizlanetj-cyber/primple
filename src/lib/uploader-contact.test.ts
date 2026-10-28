import { describe, expect, it } from "vitest";
import { parseUploaderContact, contactLinks, resolveContact } from "./uploader-contact";
const good = { name: "  Guest Customer ", email: " Person@Example.com ", phone: "06 12 34 56 78" };
describe("uploader contact", () => {
  it("normalizes a required guest contact before upload", () =>
    expect(parseUploaderContact(good)).toEqual({
      name: "Guest Customer",
      email: "person@example.com",
      phone: "0612345678",
    }));
  it.each([
    {},
    { ...good, name: "" },
    { ...good, email: "invalid" },
    { ...good, phone: "abc" },
    { ...good, phone: "123" },
    { ...good, phone: "12345678+90" },
    { ...good, email: "a@example.com\r\nBcc:bad@example.com" },
  ])("rejects missing or invalid contact", (input) =>
    expect(() => parseUploaderContact(input)).toThrow(),
  );
  it("builds Moroccan and international contact actions", () => {
    expect(contactLinks(good.email, good.phone)).toEqual({
      mailto: "mailto:person@example.com",
      tel: "tel:0612345678",
      whatsapp: "https://wa.me/212612345678",
    });
    expect(contactLinks(null, "0033 612345678").whatsapp).toBe("https://wa.me/33612345678");
    expect(contactLinks(null, "+212 612345678").tel).toBe("tel:+212612345678");
    expect(contactLinks("javascript:alert(1)", "abc")).toEqual({
      mailto: null,
      tel: null,
      whatsapp: null,
    });
  });
  it("reports historical anonymous contact as unknown", () =>
    expect(resolveContact({})).toEqual({ source: "none", name: null, email: null, phone: null }));
  it("prefers actual order contact to the unverified upload form", () =>
    expect(
      resolveContact({
        order: { name: "Buyer", email: "buyer@example.com", phone: "0612345678" },
        upload: { name: "Guest", email: "guest@example.com", source: "guest_form" },
      }),
    ).toMatchObject({ source: "order", name: "Buyer", email: "buyer@example.com" }));
  it("falls back to captured upload contact, then account", () => {
    expect(
      resolveContact({
        upload: { name: "Guest", email: "g@example.com", source: "guest_form" },
        account: { email: "account@example.com" },
      }).source,
    ).toBe("guest_form");
    expect(
      resolveContact({ account: { name: "Account", email: "account@example.com" } }),
    ).toMatchObject({ source: "account", name: "Account", email: "account@example.com" });
  });
});

