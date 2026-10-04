import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export interface StartPaymentInput {
  lines: Array<{ variantId: string; quantity: number }>;
  customer: { name: string; email: string; phone: string; city: string; address: string };
}

function validateStartPayment(input: StartPaymentInput): StartPaymentInput {
  if (!Array.isArray(input?.lines) || input.lines.length === 0) throw new Error("Your cart is empty.");
  if (input.lines.length > 50) throw new Error("Too many items in the cart.");

  const lines = input.lines.map((line) => {
    const quantity = Number(line?.quantity);
    if (!line?.variantId || typeof line.variantId !== "string") throw new Error("Invalid cart item.");
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) throw new Error("Invalid quantity.");
    return { variantId: line.variantId, quantity };
  });

  const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);
  const email = text(input.customer?.email, 160);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");

  return {
    lines,
    customer: {
      name: text(input.customer?.name, 120),
      email,
      phone: text(input.customer?.phone, 40),
      city: text(input.customer?.city, 80),
      address: text(input.customer?.address, 240),
    },
  };
}

function siteOrigin(): string {
  const request = getRequest();
  const origin = request?.headers.get("origin");
  if (origin) return origin;
  const referer = request?.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      /* fall through */
    }
  }
  return "https://primple.ma";
}

/** Public key only — safe to expose, needed by yp.js in the browser. */
export const getYouCanPayConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { youCanPayPublicKey, isSandbox } = await import("./youcanpay.server");
  try {
    return { publicKey: youCanPayPublicKey(), sandbox: isSandbox(), configured: true };
  } catch {
    return { publicKey: "", sandbox: true, configured: false };
  }
});

/** Creates a pending order with a server-computed amount and returns a YouCan Pay token. */
export const startShopPayment = createServerFn({ method: "POST" })
  .inputValidator(validateStartPayment)
  .handler(async ({ data }) => {
    const { priceLines, shopReference, tokenizePayment, optionalUserId } = await import("./youcanpay.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const priced = await priceLines(data.lines);
    const amountCents = priced.reduce((sum, line) => sum + line.lineAmountCents, 0);
    if (amountCents <= 0) throw new Error("The cart total is invalid.");
    const currency = priced[0]?.currency ?? "MAD";

    const request = getRequest();
    const userId = await optionalUserId(request?.headers.get("authorization") ?? null);
    const reference = shopReference();
    const origin = siteOrigin();

    const { tokenId, transactionId } = await tokenizePayment({
      reference,
      amountCents,
      currency,
      successUrl: `${origin}/shop/confirmation?ref=${reference}`,
      errorUrl: `${origin}/shop/confirmation?ref=${reference}&failed=1`,
      customerEmail: data.customer.email,
    });

    const { error } = await supabaseAdmin.from("shop_orders").insert({
      user_id: userId,
      reference,
      items: JSON.parse(JSON.stringify(priced)),
      amount_cents: amountCents,
      currency,
      status: "pending",
      youcanpay_token_id: tokenId,
      youcanpay_transaction_id: transactionId,
      customer_name: data.customer.name,
      customer_email: data.customer.email,
      customer_phone: data.customer.phone,
      customer_city: data.customer.city,
      customer_address: data.customer.address,
    });
    if (error) {
      console.error("[YouCanPay] order insert failed", error.message);
      throw new Error("The payment could not be started. Please try again.");
    }

    return { reference, token: tokenId, amountCents, currency, items: priced };
  });

/** Order status is read from the database, never from the return URL. */
export const getShopOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { reference: string }) => {
    const reference = String(input?.reference ?? "").trim();
    if (!/^SHP-\d{4,8}$/.test(reference)) throw new Error("Unknown order.");
    return { reference };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("shop_orders")
      .select("reference, status, amount_cents, currency, items, paid_at")
      .eq("reference", data.reference)
      .maybeSingle();

    if (error) throw new Error("Unknown order.");
    if (!order) return null;
    return order;
  });

/**
 * Card payment for a print order. The amount is re-read from the saved order,
 * never taken from the browser, and the caller must own the order.
 */
type StoredOrderLine = { slug?: string; quantity?: number; selection?: Record<string, string> };

/**
 * Recomputes a print order from the shared pricing engine so the charged amount
 * can never diverge from what the catalog says. Orders that can no longer be
 * repriced are rejected; the stored total is never trusted.
 */
async function recomputeOrderCents(order: {
  items: unknown;
  delivery: unknown;
  total: unknown;
}): Promise<number> {
  const { orderTotals } = await import("@/data/pricing");
  const lines = Array.isArray(order.items) ? (order.items as StoredOrderLine[]) : [];

  const totals = orderTotals(
    lines.map((line) => ({
      slug: String(line.slug),
      quantity: Number(line.quantity),
      selection: line.selection ?? {},
    })),
  );
  if (!totals) throw new Error("This order can no longer be priced. Please contact Primple.");
  return totals.totalCents;
}

export const startPrintPayment = createServerFn({ method: "POST" })
  .inputValidator((input: { orderId: string; claimToken?: string }) => {
    const orderId = String(input?.orderId ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(orderId)) throw new Error("Unknown order.");
    const claimToken = String(input?.claimToken ?? "").trim();
    return claimToken ? { orderId, claimToken } : { orderId };
  })
  .handler(async ({ data }) => {
    const { tokenizePayment, optionalUserId } = await import("./youcanpay.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const request = getRequest();
    const userId = await optionalUserId(request?.headers.get("authorization") ?? null);

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, user_id, reference, items, subtotal, delivery, total, email, payment_status, claim_token, payment_method",
      )
      .eq("id", data.orderId)
      .maybeSingle();

    if (error || !order) throw new Error("Unknown order.");
    // Either the signed-in owner, or the guest holding this order's claim token.
    const { canPayOrder } = await import("./order-access");
    const allowed = canPayOrder(order, {
      userId,
      claimToken: "claimToken" in data ? data.claimToken : null,
    });
    if (!allowed) throw new Error("Unknown order.");
    if (order.payment_status === "paid") throw new Error("This order is already paid.");
    // Bank-transfer orders are confirmed by staff, never charged by card.
    const { isManualMethod } = await import("./deposit");
    if (isManualMethod(order.payment_method)) throw new Error("This order is paid manually (transfer or Cash Plus).");

    // Never trust the stored total: re-price every line from the catalog.
    const totalCents = await recomputeOrderCents(order);
    if (!Number.isFinite(totalCents) || totalCents <= 0) throw new Error("The order total is invalid.");
    // Deposit mode: 50% of the full total (delivery included) online, rest in cash at delivery.
    const { onlineAmountCents } = await import("./deposit");
    const amountCents = onlineAmountCents(totalCents, order.payment_method);

    const origin = siteOrigin();
    const { tokenId, transactionId } = await tokenizePayment({
      reference: order.reference,
      amountCents,
      currency: "MAD",
      successUrl: `${origin}/checkout?ref=${order.reference}`,
      errorUrl: `${origin}/payment/retry?ref=${order.reference}`,
      ...(order.email ? { customerEmail: order.email } : {}),
    });

    await supabaseAdmin
      .from("orders")
      .update({
        youcanpay_token_id: tokenId,
        youcanpay_transaction_id: transactionId,
        total: totalCents / 100,
        deposit_amount: amountCents / 100,
        balance_amount: (totalCents - amountCents) / 100,
      })
      .eq("id", order.id);

    return { reference: order.reference, token: tokenId, amountCents, currency: "MAD" };
  });
