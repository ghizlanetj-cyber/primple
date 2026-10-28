import { afterEach, describe, expect, it, vi } from "vitest";
import { artworkRefs, validateArtworkRefs, attachArtwork, ATTACH_FAILED } from "./artwork-attach";
import { initiationError } from "./payment-initiation";
import { checkoutIdentity } from "./checkout-artwork";
const token = "11111111-1111-4111-8111-111111111111";
afterEach(() => vi.restoreAllMocks());
describe("transactional artwork attachment", () => {
  it("deduplicates shared files and preserves the guest proof", () => {
    expect(
      artworkRefs([
        { artworkPath: "guests/x/a.pdf", artworkGuestToken: token },
        { artworkPath: "guests/x/a.pdf", artworkGuestToken: token },
        {},
      ]),
    ).toEqual([{ path: "guests/x/a.pdf", guestToken: token }]);
  });
  it("rejects malformed or oversized file requests", () => {
    for (const input of [
      null,
      [{ path: "../private" }],
      [{ path: "a", guestToken: "wrong" }],
      Array(31).fill({ path: "a" }),
    ])
      expect(() => validateArtworkRefs(input)).toThrow();
  });
  it.each([0, 1, null, "2"])(
    "does not report a partial/zero update (%s) as success",
    async (count) => {
      const rpc = vi.fn().mockResolvedValue({ data: count, error: null });
      await expect(
        attachArtwork(rpc, {
          orderId: "order",
          userId: "user",
          claimToken: null,
          files: [{ path: "a" }, { path: "b" }],
        }),
      ).rejects.toThrow(ATTACH_FAILED);
    },
  );
  it.each(["file_missing", "file_forbidden", "file_already_attached"])(
    "keeps %s customer-safe and retryable",
    async (message) => {
      const log = vi.spyOn(console, "error").mockImplementation(() => {});
      const rpc = vi.fn().mockResolvedValue({ data: null, error: { message } });
      let caught: unknown;
      try {
        await attachArtwork(rpc, {
          orderId: "order",
          userId: null,
          claimToken: "claim",
          files: [{ path: "guest/a", guestToken: token }],
        });
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(Error);
      expect(initiationError(caught, ATTACH_FAILED)).not.toBe(ATTACH_FAILED);
      expect(log).toHaveBeenCalledWith("[artwork] attach failed");
    },
  );
  it("retries the same order after failure and verifies the complete result", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: { message: "private database detail" } })
      .mockResolvedValue({ data: 1, error: null });
    const request = {
      orderId: "saved-order",
      userId: "signed-in",
      claimToken: null,
      files: [{ path: "guests/a/file", guestToken: token }],
    };
    await expect(attachArtwork(rpc, request)).rejects.toThrow(ATTACH_FAILED);
    await expect(attachArtwork(rpc, request)).resolves.toEqual({ attached: 1 });
    expect(rpc.mock.calls[0]).toEqual(rpc.mock.calls[1]);
    expect(rpc.mock.calls[1]?.[1]).toMatchObject({
      _order: "saved-order",
      _user: "signed-in",
      _files: request.files,
    });
  });
  it("does not leak unknown database details to customers or logs", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      attachArtwork(
        vi.fn().mockResolvedValue({ error: { message: "SECRET email@example.com" }, data: null }),
        { orderId: "o", userId: null, claimToken: "c", files: [{ path: "a" }] },
      ),
    ).rejects.toThrow(ATTACH_FAILED);
    expect(JSON.stringify(log.mock.calls)).not.toContain("SECRET");
  });
  it("changes pending identity for artwork, catalog, or account changes", () => {
    const items = [{ slug: "cards", quantity: 100, selection: {}, artworkPath: "a" }];
    const id = checkoutIdentity("v1", null, items);
    expect(checkoutIdentity("v1", null, items)).toBe(id);
    expect(checkoutIdentity("v1", "user", items)).not.toBe(id);
    expect(checkoutIdentity("v2", null, items)).not.toBe(id);
    expect(checkoutIdentity("v1", null, [{ ...items[0]!, artworkPath: "b" }])).not.toBe(id);
  });
});

