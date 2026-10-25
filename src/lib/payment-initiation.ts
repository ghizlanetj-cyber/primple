import {
  BANK_ADVANCE_METHOD, BANK_FULL_METHOD, CARD_METHOD, CASHPLUS_ADVANCE_METHOD,
  CASHPLUS_FULL_METHOD, DEPOSIT_METHOD, isManualMethod, isPrintMethod,
  type PrintPaymentMethod,
} from "./deposit";

export type PayChoice = "card" | "bank" | "cashplus" | "cod";
export type AdvanceChoice = "card" | "bank" | "cashplus";
export const CARD_UNAVAILABLE = "Card payment is not available right now.";
export const CARD_START_FAILED = "Card payment could not be opened. Please try again or contact Primple.";
export const MANUAL_START_FAILED = "We could not register your payment instructions. Your order remains unpaid. Please try again or contact Primple.";
export const ORDER_START_FAILED = "Your order could not be prepared. Please review your cart or contact Primple.";

export function resolveMethod(choice: PayChoice, advance: AdvanceChoice): PrintPaymentMethod {
  if (choice === "card") return CARD_METHOD;
  if (choice === "bank") return BANK_FULL_METHOD;
  if (choice === "cashplus") return CASHPLUS_FULL_METHOD;
  return advance === "card" ? DEPOSIT_METHOD : advance === "bank" ? BANK_ADVANCE_METHOD : CASHPLUS_ADVANCE_METHOD;
}

export function paymentRoute(method: string): "manual" | "card" {
  if (!isPrintMethod(method)) throw new Error("Unknown payment method.");
  return isManualMethod(method) ? "manual" : "card";
}

type GatewayConfig = { configured: boolean; publicKey: string; sandbox: boolean };
/** Must run before order creation. Manual methods never read gateway configuration. */
export async function preparePayment(method: string, loadConfig: () => Promise<GatewayConfig>) {
  if (paymentRoute(method) === "manual") return { route: "manual" as const };
  let config: GatewayConfig;
  try { config = await loadConfig(); } catch { throw new Error(CARD_UNAVAILABLE); }
  if (!config.configured || !config.publicKey) throw new Error(CARD_UNAVAILABLE);
  return { route: "card" as const, config };
}

/** Only known customer-facing messages cross an untyped/serialized error boundary. */
export function initiationError(caught: unknown, fallback: string): string {
  const message = caught instanceof Error ? caught.message
    : caught && typeof caught === "object" && "message" in caught && typeof caught.message === "string" ? caught.message : "";
  const safe = [CARD_UNAVAILABLE, CARD_START_FAILED, MANUAL_START_FAILED, ORDER_SIGNED_OUT,
    "Unknown order.", "This order is already paid.",
    "This order can no longer be priced. Please contact Primple.",
    "One of the items is temporarily unavailable. Please contact Primple.",
    "Prices are temporarily unavailable. Please try again in a moment.",
    "The price of this order has changed since it was placed. Please review your cart and place a new order. Nothing was charged.",
    "One of the items can no longer be ordered. Please review your cart.",
  ];
  return safe.includes(message) ? message : fallback;
}

/** A conditional update must return a row; no error or race may be reported as success. */
export async function persistManualRequest(
  update: () => PromiseLike<{ data: { id: string } | null; error: unknown }>,
  log: (entry: { event: string; ok: boolean; detail?: string }) => Promise<void>,
) {
  try {
    const result = await update();
    if (result.error || !result.data) throw new Error(MANUAL_START_FAILED);
  } catch {
    await log({ event: "bank_transfer_requested", ok: false, detail: "manual_update_failed" });
    return { ok: false as const, error: MANUAL_START_FAILED };
  }
  await log({ event: "bank_transfer_requested", ok: true });
  return { ok: true as const };
}
export type OrderInsertFailure = "duplicate_reference" | "catalog_unavailable" | "not_signed_in" | "permission" | "unknown";
export const ORDER_SIGNED_OUT = "Your session has expired. Please sign in again to place your order.";
export const ITEM_UNAVAILABLE = "One of the items is temporarily unavailable. Please contact Primple.";

/** Classifies a database insert error by code/category only; messages never reach logs or customers. */
export function classifyOrderInsertError(error: unknown): OrderInsertFailure {
  const e = (error ?? {}) as { code?: string; message?: string };
  const msg = typeof e.message === "string" ? e.message : "";
  if (e.code === "23505" && msg.includes("reference")) return "duplicate_reference";
  if (e.code === "P0001" && msg === "catalog_unavailable") return "catalog_unavailable";
  if (e.code === "PGRST301" || msg.includes("JWT")) return "not_signed_in";
  if (e.code === "42501") return "permission";
  return "unknown";
}

export function orderInsertMessage(kind: OrderInsertFailure): string {
  if (kind === "catalog_unavailable") return ITEM_UNAVAILABLE;
  if (kind === "not_signed_in") return ORDER_SIGNED_OUT;
  return ORDER_START_FAILED;
}
