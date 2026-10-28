import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/admin.functions", () => ({ adminFileUrl: vi.fn(), adminUnlinkedUploads: vi.fn() }));
vi.mock("@/lib/files-api", () => ({ formatBytes: (n: number) => n + " B" }));
vi.mock("./shared", () => ({
  Card: ({ children }: { children: unknown }) => children,
  Empty: ({ children }: { children: unknown }) => children,
  ErrorBox: () => null,
  Loading: () => null,
  Pager: () => null,
  errText: String,
  fmtDate: () => "27/10/2026",
}));
import { ArtworkFile, CustomerContact } from "./ArtworkFiles";
import { resolveContact } from "@/lib/uploader-contact";
describe("staff file and contact display", () => {
  it("shows explicit unknown contact for historical anonymous files", () => {
    const html = renderToStaticMarkup(
      createElement(CustomerContact, { contact: resolveContact({}) }),
    );
    expect(html).toContain("Coordonnées non recueillies");
    expect(html).not.toContain("mailto:");
  });
  it("shows saved order contact and usable follow-up actions", () => {
    const html = renderToStaticMarkup(
      createElement(CustomerContact, {
        contact: resolveContact({
          order: { name: "Buyer", email: "buyer@example.com", phone: "0612345678" },
        }),
      }),
    );
    for (const value of [
      "Buyer",
      "buyer@example.com",
      "tel:0612345678",
      "https://wa.me/212612345678",
    ])
      expect(html).toContain(value);
  });
  it("labels account fallback and guest form contact correctly", () => {
    expect(
      renderToStaticMarkup(
        createElement(CustomerContact, {
          contact: resolveContact({ account: { email: "account@example.com" } }),
        }),
      ),
    ).toContain("Coordonnées du compte");
    expect(
      renderToStaticMarkup(
        createElement(CustomerContact, {
          contact: resolveContact({ upload: { email: "guest@example.com", source: "guest_form" } }),
        }),
      ),
    ).toContain("non vérifiées");
  });
  it("offers preview/download with file metadata and no storage paths", () => {
    const html = renderToStaticMarkup(
      createElement(ArtworkFile, {
        file: { id: "file", file_name: "Artwork.pdf", size_bytes: 42, created_at: "2026-10-27" },
      }),
    );
    for (const value of ["Artwork.pdf", "42 B", "Ouvrir", "Télécharger"])
      expect(html).toContain(value);
    expect(html).not.toContain("client-artwork");
  });
});

