import { describe, expect, it } from "vitest";

import { canAccessGuestArtwork, guestArtworkFolder } from "./file-access";

describe("guest artwork access", () => {
  const guestToken = "11111111-1111-4111-8111-111111111111";
  const path = `${guestArtworkFolder(guestToken)}/artwork.pdf`;

  it("keeps a guest file accessible only with its exact token and path", () => {
    expect(canAccessGuestArtwork({ path, guestToken }, { path, guestToken })).toBe(true);
    expect(
      canAccessGuestArtwork(
        { path, guestToken },
        { path, guestToken: "22222222-2222-4222-8222-222222222222" },
      ),
    ).toBe(false);
    expect(canAccessGuestArtwork({ path, guestToken }, { path: `${path}.other`, guestToken })).toBe(false);
  });

  it("rejects a path outside the guest token folder", () => {
    expect(
      canAccessGuestArtwork(
        { path: "someone-else/drafts/artwork.pdf", guestToken },
        { path: "someone-else/drafts/artwork.pdf", guestToken },
      ),
    ).toBe(false);
  });
});