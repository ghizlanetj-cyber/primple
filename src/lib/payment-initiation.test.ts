import { describe, expect, it, vi } from "vitest";
import { preparePayment, resolveMethod, paymentRoute, persistManualRequest, initiationError, MANUAL_START_FAILED, CARD_UNAVAILABLE, CARD_START_FAILED } from "./payment-initiation";
import { splitAmounts } from "./deposit";

describe("checkout payment dispatch", () => {
  const routes = [
    ["card", "card", "card_youcanpay", "card", 175.81, 0],
    ["bank", "card", "bank_transfer", "manual", 175.81, 0],
    ["cashplus", "card", "cashplus", "manual", 175.81, 0],
    ["cod", "card", "deposit_50_cod", "card", 87.91, 87.9],
    ["cod", "bank", "cod_advance_bank", "manual", 87.91, 87.9],
    ["cod", "cashplus", "cod_advance_cashplus", "manual", 87.91, 87.9],
  ] as const;
  it.each(routes)("%s with %s dispatches correctly", async (choice, advance, method, route, dueNow, balance) => {
    expect(resolveMethod(choice, advance)).toBe(method);
    expect(paymentRoute(method)).toBe(route);
    // 145.81 MAD items plus 30 MAD delivery = 17581 cents.
    expect(splitAmounts(145.81 + 30, method)).toEqual({ dueNow, balance });
    const load = vi.fn().mockResolvedValue({ configured: true, publicKey: "fixture", sandbox: false });
    expect((await preparePayment(method, load)).route).toBe(route);
    expect(load).toHaveBeenCalledTimes(route === "card" ? 1 : 0);
  });
  it("refuses unknown methods", () => expect(() => paymentRoute("invalid")).toThrow());
  it("blocks order preparation on unavailable or failed card config", async () => {
    await expect(preparePayment("card_youcanpay", async () => ({ configured: false, publicKey: "", sandbox: true }))).rejects.toThrow(CARD_UNAVAILABLE);
    await expect(preparePayment("deposit_50_cod", async () => { throw new Error("private provider detail"); })).rejects.toThrow(CARD_UNAVAILABLE);
  });
  it("normalizes serialized failures without exposing internals", () => {
    expect(initiationError({ message: MANUAL_START_FAILED }, CARD_START_FAILED)).toBe(MANUAL_START_FAILED);
    expect(initiationError({ message: "private provider detail" }, CARD_START_FAILED)).toBe(CARD_START_FAILED);
  });
});

describe("manual persistence", () => {
  it.each([
    { data: null, error: { message: "private database detail" } },
    { data: null, error: null },
  ])("does not report success on update failure or no matching row", async (result) => {
    const log = vi.fn().mockResolvedValue(undefined);
    expect(await persistManualRequest(async () => result, log)).toEqual({ ok: false, error: MANUAL_START_FAILED });
    expect(log).toHaveBeenCalledWith({ event: "bank_transfer_requested", ok: false, detail: "manual_update_failed" });
  });
  it("handles a thrown update without raw diagnostics", async () => {
    const log = vi.fn().mockResolvedValue(undefined);
    expect(await persistManualRequest(async () => { throw new Error("private detail"); }, log)).toEqual({ ok: false, error: MANUAL_START_FAILED });
  });
  it("reports success only after a persisted row", async () => {
    const log = vi.fn().mockResolvedValue(undefined);
    expect(await persistManualRequest(async () => ({ data: { id: "fixture" }, error: null }), log)).toEqual({ ok: true });
    expect(log).toHaveBeenCalledWith({ event: "bank_transfer_requested", ok: true });
  });
});
import { classifyOrderInsertError, orderInsertMessage, ORDER_SIGNED_OUT as SIGNED_OUT, ITEM_UNAVAILABLE as UNAVAILABLE, ORDER_START_FAILED as START_FAILED } from "./payment-initiation";
describe("order insert failures", () => {
  it("retries only duplicate references", () => {
    expect(classifyOrderInsertError({ code: "23505", message: 'duplicate key value violates unique constraint "orders_reference_key"' })).toBe("duplicate_reference");
  });
  it("maps unavailable catalogue items", () => {
    expect(orderInsertMessage(classifyOrderInsertError({ code: "P0001", message: "catalog_unavailable" }))).toBe(UNAVAILABLE);
  });
  it("maps expired sessions", () => {
    expect(orderInsertMessage(classifyOrderInsertError({ code: "PGRST301", message: "JWT expired" }))).toBe(SIGNED_OUT);
  });
  it("keeps permission and unknown errors generic", () => {
    expect(orderInsertMessage(classifyOrderInsertError({ code: "42501", message: "permission denied for function catalog_unavailable" }))).toBe(START_FAILED);
    expect(orderInsertMessage(classifyOrderInsertError(null))).toBe(START_FAILED);
  });
});
