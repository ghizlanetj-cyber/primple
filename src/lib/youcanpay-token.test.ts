import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const insert = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: () => ({ insert }) } }));
import { tokenizePayment } from "./youcanpay.server";
import { CARD_START_FAILED, CARD_UNAVAILABLE } from "./payment-initiation";
const input = { reference: "PRM-10000", amountCents: 8791, currency: "MAD", successUrl: "https://primple.ma/checkout", errorUrl: "https://primple.ma/payment/retry" };
beforeEach(() => {
  vi.stubEnv("YOUCANPAY_PUBLIC_KEY", "pub_fixture");
  vi.stubEnv("YOUCANPAY_PRIVATE_KEY", "pri_fixture");
  insert.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe("gateway token initiation (mock HTTP only)", () => {
  it.each([undefined, "pri_sandbox_fixture"])("missing/mixed keys never reach the gateway", async (key) => {
    vi.stubEnv("YOUCANPAY_PRIVATE_KEY", key);
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    await expect(tokenizePayment(input)).rejects.toThrow(CARD_UNAVAILABLE);
    expect(fetch).not.toHaveBeenCalled(); expect(insert).not.toHaveBeenCalled();
  });
  it.each([
    [503, { message: "private detail" }],
    [200, { token: {} }],
    [200, { token: "" }],
  ])("handles HTTP %s or invalid token safely", async (status, payload) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status })));
    await expect(tokenizePayment(input)).rejects.toThrow(CARD_START_FAILED);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ ok: false, event: "token_create" }));
    expect(JSON.stringify(insert.mock.calls)).not.toContain("private detail");
  });
  it("records network failures safely", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private detail")));
    await expect(tokenizePayment(input)).rejects.toThrow(CARD_START_FAILED);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ ok: false, detail: "network_or_timeout" }));
  });
  it.each([false, true])("uses matching endpoint and returns token in sandbox=%s", async (sandbox) => {
    if (sandbox) { vi.stubEnv("YOUCANPAY_PUBLIC_KEY", "pub_sandbox_fixture"); vi.stubEnv("YOUCANPAY_PRIVATE_KEY", "pri_sandbox_fixture"); }
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ token: { id: "fixture-token" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    expect(await tokenizePayment(input)).toEqual({ tokenId: "fixture-token", transactionId: null });
    expect(fetch.mock.calls[0]?.[0]).toBe(sandbox ? "https://youcanpay.com/sandbox/api/tokenize" : "https://youcanpay.com/api/tokenize");
    const body = fetch.mock.calls[0]?.[1].body as FormData;
    expect(body.get("amount")).toBe("8791"); expect(body.get("currency")).toBe("MAD");
  });
});