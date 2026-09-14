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
  return "https://primple.lovable.app";
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
      items: priced.map((line) => ({ ...line })),
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
