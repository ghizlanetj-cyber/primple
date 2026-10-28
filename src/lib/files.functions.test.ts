import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  sign: vi.fn(),
  list: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate: (input: unknown) => unknown;
    return {
      inputValidator(fn: typeof validate) {
        validate = fn;
        return this;
      },
      handler(fn: (input: { data: unknown }) => unknown) {
        return async ({ data }: { data: unknown }) => fn({ data: validate(data) });
      },
    };
  },
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    storage: { from: () => ({ createSignedUploadUrl: mocks.sign, list: mocks.list }) },
    from: () => ({ insert: mocks.insert }),
  },
}));
import { prepareGuestArtworkUpload, registerGuestArtwork } from "./files.functions";
const token = "11111111-1111-4111-8111-111111111111";
const contact = { name: "Guest Customer", email: "Guest@Example.com", phone: "06 12 34 56 78" };
const meta = { name: "cards.pdf", mimeType: "application/pdf", sizeBytes: 42 };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.sign.mockResolvedValue({ data: { token: "upload-token" }, error: null });
  mocks.list.mockResolvedValue({ data: [{ name: "cards.pdf" }], error: null });
  mocks.insert.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ single: mocks.single });
  mocks.single.mockResolvedValue({ data: { id: "file" }, error: null });
});
describe("guest upload contact persistence", () => {
  it("refuses an upload URL before contact is supplied", async () => {
    await expect(prepareGuestArtworkUpload({ data: meta as never })).rejects.toThrow();
    expect(mocks.sign).not.toHaveBeenCalled();
  });
  it("validates contact before signing an upload URL", async () => {
    await expect(
      prepareGuestArtworkUpload({ data: { ...meta, contact: { ...contact, email: "invalid" } } }),
    ).rejects.toThrow();
    expect(mocks.sign).not.toHaveBeenCalled();
    const result = await prepareGuestArtworkUpload({ data: { ...meta, contact } });
    expect(result.path.startsWith("guests/")).toBe(true);
    expect(mocks.sign).toHaveBeenCalledTimes(1);
  });
  it("cannot bypass contact validation through registration", async () => {
    await expect(
      registerGuestArtwork({
        data: { ...meta, path: "guests/" + token + "/cards.pdf", guestToken: token } as never,
      }),
    ).rejects.toThrow();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("persists normalized contact privately with the verified file", async () => {
    await registerGuestArtwork({
      data: { ...meta, contact, path: "guests/" + token + "/cards.pdf", guestToken: token },
    });
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        uploader_name: "Guest Customer",
        uploader_email: "guest@example.com",
        uploader_phone: "0612345678",
        contact_source: "guest_form",
        user_id: null,
      }),
    );
    expect(mocks.select.mock.calls[0]?.[0]).not.toContain("uploader_email");
  });
  it("does not save metadata for a missing storage object", async () => {
    mocks.list.mockResolvedValue({ data: [], error: null });
    await expect(
      registerGuestArtwork({
        data: { ...meta, contact, path: "guests/" + token + "/cards.pdf", guestToken: token },
      }),
    ).rejects.toThrow("verified");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});

